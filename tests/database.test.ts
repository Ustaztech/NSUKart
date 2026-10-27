import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
let db: PGlite;
const buyer = "11111111-1111-4111-8111-111111111111",
  vendor = "22222222-2222-4222-8222-222222222222",
  other = "33333333-3333-4333-8333-333333333333";
const store = "44444444-4444-4444-8444-444444444444",
  product = "55555555-5555-4555-8555-555555555555";
async function asUser(id: string) {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`,
  );
}
async function root() {
  await db.exec("reset role");
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',coalesce(nullif(current_setting('request.jwt.claim.aal',true),''),'aal2'))$$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid,name text,bucket_id text);alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;
grant usage on schema auth,public to anon,authenticated,service_role;grant execute on all functions in schema auth to anon,authenticated,service_role;`);
  await db.exec(
    await readFile("supabase/migrations/202610270001_marketplace.sql", "utf8"),
  );
  await db.exec(
    await readFile("supabase/migrations/202610270002_operations.sql", "utf8"),
  );
  await db.exec(
    `insert into auth.users(id) values('${buyer}'),('${vendor}'),('${other}');update profiles set role='vendor' where id='${vendor}';insert into stores(id,owner_id,name,slug,description,pickup,status) values('${store}','${vendor}','Campus Essentials','campus-essentials','A campus store for tests','Main gate','approved');insert into products(id,store_id,title,description,category,price_kobo,stock) values('${product}','${store}','Campus backpack','A useful backpack for students','Fashion',1850000,1);`,
  );
});
afterAll(async () => {
  await db.close();
});
describe("database authorization and financial invariants", () => {
  it("does not let a buyer grant themselves administrator access", async () => {
    await asUser(buyer);
    await expect(
      db.exec(`update profiles set role='admin' where id='${buyer}'`),
    ).rejects.toThrow();
    await root();
  });
  it("creates one checkout, reserves stock and reuses a pending checkout", async () => {
    await asUser(buyer);
    await db.exec(
      `insert into cart_items(buyer_id,product_id,quantity) values('${buyer}','${product}',1)`,
    );
    const first = await db.query<{ id: string }>("select checkout_cart() id");
    const second = await db.query<{ id: string }>("select checkout_cart() id");
    expect(first.rows[0].id).toBe(second.rows[0].id);
    await root();
    expect(
      (
        await db.query<{ reserved: number }>(
          `select reserved from products where id='${product}'`,
        )
      ).rows[0].reserved,
    ).toBe(1);
  });
  it("prevents overselling the final reserved item", async () => {
    await asUser(other);
    await db.exec(
      `insert into cart_items(buyer_id,product_id,quantity) values('${other}','${product}',1)`,
    );
    await expect(db.query("select checkout_cart()")).rejects.toThrow(
      /insufficient stock/,
    );
    await root();
  });
  it("keeps another buyer’s order and items private", async () => {
    await asUser(other);
    expect((await db.query("select * from orders")).rows).toHaveLength(0);
    expect((await db.query("select * from order_items")).rows).toHaveLength(0);
    await root();
  });
  it("rejects client-side payment confirmation RPC calls", async () => {
    await asUser(buyer);
    await expect(
      db.query("select confirm_payment('fake',1,'NGN')"),
    ).rejects.toThrow(/permission denied/);
    await root();
  });
  it("rejects mismatched payment amounts and confirms duplicate events exactly once", async () => {
    const order = (
      await db.query<{ payment_reference: string }>(
        "select payment_reference from orders",
      )
    ).rows[0];
    await expect(
      db.query("select confirm_payment($1,$2,$3)", [
        order.payment_reference,
        1,
        "NGN",
      ]),
    ).rejects.toThrow(/mismatch/);
    await db.query("select confirm_payment($1,$2,$3)", [
      order.payment_reference,
      1850000,
      "NGN",
    ]);
    await db.query("select confirm_payment($1,$2,$3)", [
      order.payment_reference,
      1850000,
      "NGN",
    ]);
    expect((await db.query("select * from payment_events")).rows).toHaveLength(
      1,
    );
    expect(
      (
        await db.query<{ stock: number; reserved: number }>(
          "select stock,reserved from products",
        )
      ).rows[0],
    ).toEqual({ stock: 0, reserved: 0 });
  });
  it("requires buyer confirmation and credits net earnings once", async () => {
    const vo = (
      await db.query<{ id: string; pickup_code: string }>(
        "select id,pickup_code from vendor_orders",
      )
    ).rows[0];
    await asUser(vendor);
    await expect(
      db.query("select update_fulfilment($1,$2,$3)", [
        vo.id,
        "completed",
        vo.pickup_code,
      ]),
    ).rejects.toThrow();
    await db.query("select update_fulfilment($1,$2)", [vo.id, "accepted"]);
    await db.query("select update_fulfilment($1,$2)", [vo.id, "ready"]);
    await asUser(buyer);
    await expect(
      db.query("select update_fulfilment($1,$2,$3)", [
        vo.id,
        "completed",
        "wrong",
      ]),
    ).rejects.toThrow();
    await db.query("select update_fulfilment($1,$2,$3)", [
      vo.id,
      "completed",
      vo.pickup_code,
    ]);
    await expect(
      db.query("select update_fulfilment($1,$2,$3)", [
        vo.id,
        "completed",
        vo.pickup_code,
      ]),
    ).rejects.toThrow();
    await root();
    expect(
      (
        await db.query<{ amount_kobo: number }>(
          "select amount_kobo from ledger",
        )
      ).rows[0].amount_kobo,
    ).toBe(1757500);
  });
  it("reserves withdrawals and rejects spending the balance twice", async () => {
    await asUser(vendor);
    await db.query("select request_withdrawal($1,$2)", [
      1700000,
      "Test bank account 0123456789",
    ]);
    await expect(
      db.query("select request_withdrawal($1,$2)", [
        1700000,
        "Test bank account 0123456789",
      ]),
    ).rejects.toThrow(/insufficient/);
    await root();
  });
  it("rejects vendor access to administrator settlement functions", async () => {
    await asUser(vendor);
    const w = (await db.query<{ id: string }>("select id from withdrawals"))
      .rows[0];
    await expect(
      db.query("select review_withdrawal($1,'rejected',null)", [w.id]),
    ).rejects.toThrow(/Administrator/);
    await root();
  });
  it("enforces MFA before an administrator can reverse a withdrawal", async () => {
    await db.exec(`update profiles set role='admin' where id='${other}'`);
    const w = (await db.query<{ id: string }>("select id from withdrawals"))
      .rows[0];
    await asUser(other);
    await db.exec("select set_config('request.jwt.claim.aal','aal1',false)");
    await expect(
      db.query("select review_withdrawal($1,'rejected',null)", [w.id]),
    ).rejects.toThrow(/Administrator/);
    await db.exec("select set_config('request.jwt.claim.aal','aal2',false)");
    await db.query("select review_withdrawal($1,'rejected',null)", [w.id]);
    await expect(
      db.query("select review_withdrawal($1,'rejected',null)", [w.id]),
    ).rejects.toThrow(/finalized/);
    await root();
    expect(
      (
        await db.query<{ balance: string }>(
          "select sum(amount_kobo) balance from ledger",
        )
      ).rows[0].balance,
    ).toBe("1757500");
  });
  it("records a late payment without consuming released stock", async () => {
    await db.exec(
      `update products set stock=1,reserved=0 where id='${product}';delete from cart_items;update profiles set role='buyer' where id='${other}';`,
    );
    await asUser(buyer);
    await db.exec(
      `insert into cart_items(buyer_id,product_id,quantity) values('${buyer}','${product}',1)`,
    );
    const order = (await db.query<{ id: string }>("select checkout_cart() id"))
      .rows[0];
    await root();
    await db.query(
      "update orders set expires_at=now()-interval '1 minute' where id=$1",
      [order.id],
    );
    await db.query("select expire_reservations()");
    const ref = (
      await db.query<{ payment_reference: string }>(
        "select payment_reference from orders where id=$1",
        [order.id],
      )
    ).rows[0].payment_reference;
    expect(
      (
        await db.query<{ status: string }>(
          "select confirm_payment($1,1850000,'NGN') status",
          [ref],
        )
      ).rows[0].status,
    ).toBe("refund_required");
    expect(
      (
        await db.query<{ stock: number; reserved: number }>(
          "select stock,reserved from products",
        )
      ).rows[0],
    ).toEqual({ stock: 1, reserved: 0 });
  });
});

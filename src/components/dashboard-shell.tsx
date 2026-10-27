import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Heart,
  Store,
  Wallet,
  Settings,
  LogOut,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { Header } from "./header";
import { logout } from "@/app/actions";
const links = {
  buyer: [
    ["Overview", "/dashboard", LayoutDashboard],
    ["My orders", "/dashboard/orders", Package],
    ["Saved items", "/dashboard/wishlist", Heart],
    ["Notifications", "/dashboard/notifications", Bell],
    ["Account", "/dashboard/account", Settings],
    ["Start selling", "/vendor/apply", Store],
  ],
  vendor: [
    ["Overview", "/vendor", LayoutDashboard],
    ["Products", "/vendor/products", Store],
    ["Orders", "/vendor/orders", Package],
    ["Earnings", "/vendor/earnings", Wallet],
    ["Buyer account", "/dashboard", Settings],
  ],
  admin: [
    ["Overview", "/admin", LayoutDashboard],
    ["Vendor applications", "/admin/vendors", Store],
    ["Users", "/admin/users", Settings],
    ["Listings", "/admin/products", Package],
    ["Disputes", "/admin/disputes", ShieldCheck],
    ["Payments", "/admin/payments", Wallet],
    ["Withdrawals", "/admin/withdrawals", Wallet],
    ["Audit log", "/admin/audit", Settings],
    ["Buyer account", "/dashboard", LayoutDashboard],
  ],
} as const;
export function DashboardShell({
  role = "buyer",
  children,
}: {
  role?: "buyer" | "vendor" | "admin";
  children: React.ReactNode;
}) {
  const items = links[role];
  const nav = (
    <nav aria-label={`${role} navigation`}>
      {items.map(([name, url, Icon]) => (
        <Link key={url} href={url}>
          <Icon size={17} />
          {name}
        </Link>
      ))}
    </nav>
  );
  return (
    <>
      <Header />
      <details className="mobile-drawer">
        <summary>
          {role === "admin"
            ? "Admin"
            : role === "vendor"
              ? "Vendor"
              : "Account"}{" "}
          navigation
        </summary>
        {nav}
        <form action={logout}>
          <button className="btn btn-ghost">Sign out</button>
        </form>
      </details>
      <div className="dashboard-layout">
        <aside className="sidebar">
          {nav}
          <form action={logout}>
            <button>
              <LogOut size={17} />
              Sign out
            </button>
          </form>
        </aside>
        <main id="main" className="dashboard-main">
          {children}
        </main>
      </div>
    </>
  );
}

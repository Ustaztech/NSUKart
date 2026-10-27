import { NextRequest, NextResponse } from "next/server";
import { allowRequest } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth";
import { appUrl } from "@/lib/config";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== new URL(appUrl()).origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { client, user } = await requireUser("vendor");
  if (!(await allowRequest("upload", 10)))
    return NextResponse.json(
      { error: "Please wait a minute before trying again" },
      { status: 429 },
    );
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
    return NextResponse.json(
      { error: "Choose an image smaller than 5 MB" },
      { status: 400 },
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png =
    bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!jpeg && !png && !webp)
    return NextResponse.json(
      { error: "Only JPG, PNG, and WebP images are accepted" },
      { status: 400 },
    );
  const ext = jpeg ? "jpg" : png ? "png" : "webp";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage
    .from("product-images")
    .upload(path, bytes, { contentType: `image/${jpeg ? "jpeg" : ext}` });
  if (error)
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  const { data } = client.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}

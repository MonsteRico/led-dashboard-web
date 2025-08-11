import { db } from "@/server/db";
import { images } from "@/server/db/schema";
import { eq } from "drizzle-orm";
// force deploy
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  // get the key from the request
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) return new Response("No key provided", { status: 400 });
  const image = await db.query.images.findFirst({
    where: eq(images.key, key),
  });
  if (!image) return new Response("No image found", { status: 404 });
  return new Response(JSON.stringify(image));
}

export async function POST(request: Request) {
  if (!request.body) return new Response("No body", { status: 400 });

  const { rawBuffer, key } = await request.json();

  // Delete existing image with the same key
  await db.delete(images).where(eq(images.key, key));

  await db.insert(images).values({
    rawBuffer: JSON.stringify(rawBuffer),
    key: key,
  });

  return new Response("ok");
}

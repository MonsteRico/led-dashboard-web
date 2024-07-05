import { db } from "@/server/db";
import { images } from "@/server/db/schema";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
    const image = await db.query.images.findFirst();
    return new Response(JSON.stringify(image));
}

export async function POST(request: Request) {
    // request body has the raw buffer as Uint8Array
    if (!request.body) return;
    const rawBuffer = await request.json();    //
    console.log(rawBuffer) // save the raw buffer to the database
    await db.delete(images);
    await db.insert(images).values({
        rawBuffer: JSON.stringify(rawBuffer),
    });
    return new Response("ok");
}
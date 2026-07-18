export const dynamic = "force-dynamic";

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 6_200));
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="transparent"/></svg>`, {
    headers: { "content-type": "image/svg+xml", "cache-control": "no-store" }
  });
}

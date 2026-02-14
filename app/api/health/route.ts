export async function GET() {
  return Response.json({
    status: "ok",
    service: "mmart-web",
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  return Response.json({
    supabaseUrl: 'https://ybniybezkdpqkvhjrjdr.supabase.co',
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    nextPublicUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'MISSING',
    nodeEnv: process.env.NODE_ENV,
    buildTime: new Date().toISOString(),
  })
}

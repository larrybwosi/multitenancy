import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET (){
  // const session
  // const session =await auth.api.getSession()
try {
  
  const key = await auth.api.createApiKey({
    body: {
      name: 'Auto Check Out',
      prefix: 'checkout',
      // rateLimitEnabled: true,
      // rateLimitTimeWindow: 60,
      // rateLimitMax: 2,
      metadata: {
        tier: 'premium',
      },
    },
    headers: await headers(),
  });

  console.log(key);
  return NextResponse.json(key);
} catch (error) {
  console.error(error)
  return new NextResponse('Failed')
}
}
import { auth } from "../[...nextauth]/route";
import { NextResponse } from "next/server";

// This route is used by the client to get the session
export async function GET() {
  const session = await auth();
  
  // Always return a valid JSON response, even if session is null
  return NextResponse.json(session || { user: null });
} 
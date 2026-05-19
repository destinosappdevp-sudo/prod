import { NextResponse } from "next/server";
// import { getPendingHomes } from "@/app/actions/home";

export async function GET() {
  // const result = await getPendingHomes();
  return NextResponse.json({ success: false, homes: [] });
}




import { NextResponse } from "next/server";
// import { getApprovedHomes } from "@/app/actions/home";

export async function GET() {
// import { getApprovedHomes } from "@/app/actions/home";
// const result = await getApprovedHomes();
  return NextResponse.json({ success: false, homes: [] });
}




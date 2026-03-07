import { NextResponse } from "next/server";
// import { rejectHome } from "@/app/actions/home";

export async function POST(request: Request) {
  const { homeId, reason } = await request.json();
  // const result = await rejectHome(homeId, reason);
  return NextResponse.json({ success: false });
}

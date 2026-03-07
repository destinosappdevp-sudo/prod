import { NextResponse } from "next/server";
// import { approveHome } from "@/app/actions/home";

export async function POST(request: Request) {
  const { homeId } = await request.json();
  // const result = await approveHome(homeId);
  return NextResponse.json({ success: false });
}

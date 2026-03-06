import { NextResponse } from "next/server";
import { getApprovedHomes } from "@/app/actions/home";

export async function GET() {
  const result = await getApprovedHomes();
  return NextResponse.json(result);
}

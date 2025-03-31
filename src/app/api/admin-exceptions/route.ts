import { NextResponse } from "next/server";
import { ADMIN_USERS } from "@/lib/admin-users";

export async function GET() {
  return NextResponse.json({
    adminUsers: ADMIN_USERS
  });
} 
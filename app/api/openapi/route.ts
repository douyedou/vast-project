import { NextResponse } from "next/server"
import { getSwaggerSpec } from "@/lib/swagger"

export async function GET() {
  return NextResponse.json(getSwaggerSpec())
}

import { NextRequest, NextResponse } from "next/server"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import { transaction } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401), { status: 401 })

    const body = await request.json()
    const { caseId, imageId } = body || {}
    if (!caseId || !imageId) return NextResponse.json(error("缺少 caseId 或 imageId", 400), { status: 400 })

    await transaction(async (client) => {
      await client.query(
        "UPDATE document_images SET is_abstract_figure = FALSE WHERE case_id = $1",
        [caseId]
      )
      await client.query(
        "UPDATE document_images SET is_abstract_figure = TRUE WHERE id = $1 AND case_id = $2",
        [imageId, caseId]
      )
    })

    return NextResponse.json(success({ caseId, imageId }, "摘要附图已保存"))
  } catch (err: any) {
    console.error("保存摘要附图失败:", err)
    return NextResponse.json(error("保存摘要附图失败", 500), { status: 500 })
  }
}

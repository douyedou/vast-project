"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { mergeM06Content, M06Content, M06Stage, sanitizeM06Text } from "@/lib/m06"

interface M06Case {
  id: string
  case_id?: string
  title: string
  type?: string
  status?: string
  description?: string
  engineer_name?: string
  applicant_name?: string
  reviewer_name?: string
  updated_at?: string
}

interface M06Document {
  id: string
  case_id: string
  content_json: any
  ai_suggestions?: any
  status: string
  version: number
  created_at?: string
  updated_at?: string
}

interface M06Version {
  id: string
  version: number
  action: string
  content_json?: any
  ai_suggestions?: any
  created_at: string
  created_by_name?: string
  summary?: string
}

interface DisclosurePayload {
  case: M06Case
  document: M06Document
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("vast_token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function parseApi<T>(response: Response): Promise<T> {
  const payload = await response.json()
  if (payload.code !== 200) {
    throw new Error(sanitizeM06Text(payload.message) || "请求失败")
  }
  return payload.data as T
}

export function useM06Document(caseId?: string | null, stage?: M06Stage) {
  const [activeCaseId, setActiveCaseId] = useState<string | null>(caseId || null)
  const [caseData, setCaseData] = useState<M06Case | null>(null)
  const [document, setDocument] = useState<M06Document | null>(null)
  const [content, setContent] = useState<M06Content | null>(null)
  const [versions, setVersions] = useState<M06Version[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [runningAction, setRunningAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (caseId) setActiveCaseId(caseId)
  }, [caseId])

  const headers = useMemo(() => getAuthHeaders(), [])

  const resolveCaseId = useCallback(async () => {
    if (activeCaseId) return activeCaseId

    const response = await fetch("/api/cases?page=1&pageSize=20", { headers })
    const data = await parseApi<{ list: M06Case[] }>(response)
    const selected =
      data.list.find((item) => item.status === "disclosure_pending") ||
      data.list.find((item) => item.status !== "completed") ||
      data.list[0]

    if (!selected?.id) {
      throw new Error("没有可用于 M06 的案件，请先创建或分配案件。")
    }

    setActiveCaseId(selected.id)
    return selected.id
  }, [activeCaseId, headers])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resolvedCaseId = await resolveCaseId()
      const response = await fetch(`/api/cases/${resolvedCaseId}/disclosure?ensure=1`, { headers })
      const data = await parseApi<DisclosurePayload>(response)
      const merged = mergeM06Content(data.document.content_json, data.case)
      const staged = stage ? { ...merged, meta: { ...merged.meta, currentStage: stage } } : merged

      setCaseData(data.case)
      setDocument(data.document)
      setContent(staged)
    } catch (err: any) {
      setError(sanitizeM06Text(err.message) || "加载 M06 交底书失败")
    } finally {
      setLoading(false)
    }
  }, [headers, resolveCaseId, stage])

  useEffect(() => {
    load()
  }, [load])

  const saveContent = useCallback(
    async (nextContent: M06Content, status?: string, action = "save") => {
      const resolvedCaseId = await resolveCaseId()
      setSaving(true)
      setError(null)
      try {
        const response = await fetch(`/api/cases/${resolvedCaseId}/disclosure`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            contentJson: nextContent,
            status,
            action,
          }),
        })
        const data = await parseApi<DisclosurePayload>(response)
        const merged = mergeM06Content(data.document.content_json, data.case)
        setCaseData(data.case)
        setDocument(data.document)
        setContent(merged)
        return merged
      } catch (err: any) {
        setError(sanitizeM06Text(err.message) || "保存 M06 交底书失败")
        throw err
      } finally {
        setSaving(false)
      }
    },
    [headers, resolveCaseId]
  )

  const updateSection = useCallback((key: keyof M06Content["sections"], value: string) => {
    setContent((current) =>
      current
        ? {
            ...current,
            sections: {
              ...current.sections,
              [key]: value,
            },
          }
        : current
    )
  }, [])

  const updateList = useCallback((key: keyof M06Content["structure"], value: string[]) => {
    setContent((current) =>
      current
        ? {
            ...current,
            structure: {
              ...current.structure,
              [key]: value,
            },
          }
        : current
    )
  }, [])

  const runAction = useCallback(
    async (action: string, input: Record<string, any> = {}) => {
      const resolvedCaseId = await resolveCaseId()
      setRunningAction(action)
      setError(null)
      try {
        const response = await fetch("/api/m06/ai", {
          method: "POST",
          headers,
          body: JSON.stringify({
            caseId: resolvedCaseId,
            documentId: document?.id,
            action,
            input,
            content,
          }),
        })
        const data = await parseApi<DisclosurePayload & { result: any }>(response)
        const merged = mergeM06Content(data.document.content_json, data.case)
        setCaseData(data.case)
        setDocument(data.document)
        setContent(merged)
        return data.result
      } catch (err: any) {
        setError(sanitizeM06Text(err.message) || "AI 动作执行失败")
        throw err
      } finally {
        setRunningAction(null)
      }
    },
    [content, document?.id, headers, resolveCaseId]
  )

  const loadVersions = useCallback(async () => {
    if (!document?.id) return []
    const response = await fetch(`/api/m06/versions?documentId=${document.id}`, { headers })
    const data = await parseApi<{ list: M06Version[] }>(response)
    setVersions(data.list)
    return data.list
  }, [document?.id, headers])

  const restoreVersion = useCallback(
    async (versionId: string) => {
      if (!document?.id) throw new Error("交底书尚未加载")
      setSaving(true)
      try {
        const response = await fetch("/api/m06/versions", {
          method: "POST",
          headers,
          body: JSON.stringify({ documentId: document.id, versionId }),
        })
        const data = await parseApi<DisclosurePayload>(response)
        const merged = mergeM06Content(data.document.content_json, data.case)
        setCaseData(data.case)
        setDocument(data.document)
        setContent(merged)
        await loadVersions()
        return merged
      } finally {
        setSaving(false)
      }
    },
    [document?.id, headers, loadVersions]
  )

  const submitToM07 = useCallback(
    async (remarks?: string) => {
      const resolvedCaseId = await resolveCaseId()
      setSaving(true)
      setError(null)
      try {
        const response = await fetch("/api/m06/submit", {
          method: "POST",
          headers,
          body: JSON.stringify({
            caseId: resolvedCaseId,
            documentId: document?.id,
            remarks,
          }),
        })
        const data = await parseApi<DisclosurePayload>(response)
        const merged = mergeM06Content(data.document.content_json, data.case)
        setCaseData(data.case)
        setDocument(data.document)
        setContent(merged)
        return data
      } catch (err: any) {
        setError(sanitizeM06Text(err.message) || "提交 M07 失败")
        throw err
      } finally {
        setSaving(false)
      }
    },
    [document?.id, headers, resolveCaseId]
  )

  return {
    activeCaseId,
    caseData,
    document,
    content,
    versions,
    loading,
    saving,
    runningAction,
    error,
    reload: load,
    setContent,
    updateSection,
    updateList,
    saveContent,
    runAction,
    loadVersions,
    restoreVersion,
    submitToM07,
  }
}

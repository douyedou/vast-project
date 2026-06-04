"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface OnlyOfficeEditorProps {
  documentId: string
  caseId?: string
  onSave?: () => void
}

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (id: string, config: any) => any
    }
  }
}

export function OnlyOfficeEditor({
  documentId,
  onSave,
}: OnlyOfficeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scriptLoaded = useRef(false)

  useEffect(() => {
    let destroyed = false

    const init = async () => {
      try {
        if (!scriptLoaded.current) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "http://localhost:8080/web-apps/apps/api/documents/api.js"
            script.onload = () => { scriptLoaded.current = true; resolve() }
            script.onerror = () => reject(new Error("OnlyOffice SDK 加载失败"))
            document.head.appendChild(script)
          })
        }

        if (destroyed) return

        const token = localStorage.getItem("vast_token")
        const res = await fetch(`/api/onlyoffice?documentId=${encodeURIComponent(documentId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data?.code !== 200) throw new Error(data?.message || "获取配置失败")

        if (destroyed || !containerRef.current || !window.DocsAPI) return

        const config = data.data.config
        config.events = {
          onAppReady: () => setLoading(false),
          onDocumentStateChange: () => {},
          onSave: () => onSave?.(),
        }

        editorRef.current = new window.DocsAPI.DocEditor("onlyoffice-container", config)
      } catch (err: any) {
        if (!destroyed) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      destroyed = true
      editorRef.current?.destroyEditor?.()
    }
  }, [documentId])

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#2F80ED]" />
            <p className="text-sm text-[#6B7280]">加载编辑器中...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center text-red-500">
            <p className="text-sm">编辑器加载失败：{error}</p>
          </div>
        </div>
      )}
      <div id="onlyoffice-container" ref={containerRef} className="w-full h-full" />
    </div>
  )
}


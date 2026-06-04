"use client"

import { useEffect, useRef, useState } from "react"

interface OnlyOfficeWrapperProps {
  documentId: string
  onBack?: () => void
}

// OnlyOffice 编辑器配置类型
interface OnlyOfficeConfig {
  document: {
    fileType: string
    key: string
    title: string
    url: string
  }
  editorConfig: {
    callbackUrl: string
    lang: string
    mode: string
    user: { id: string; name: string }
    permissions: { edit: boolean; download: boolean }
  }
  documentType: string
  height: string
  width: string
}

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (id: string, config: any) => any
    }
  }
}

export function OnlyOfficeWrapper({ documentId, onBack }: OnlyOfficeWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("vast_token")
    if (!token) return

    // 1. 获取 OnlyOffice 配置
    fetch(`/api/onlyoffice?documentId=${documentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.code !== 200) {
          setError(data.message || "获取配置失败")
          setLoading(false)
          return
        }

        const { config, onlyofficeServer } = data.data

        // 2. 加载 OnlyOffice JS API
        if (!window.DocsAPI) {
          const script = document.createElement("script")
          script.src = `${onlyofficeServer}/web-apps/apps/api/documents/api.js`
          script.onload = () => initEditor(config)
          script.onerror = () => {
            setError("OnlyOffice 服务未启动，请运行: docker run -d -p 8080:80 onlyoffice/documentserver")
            setLoading(false)
          }
          document.head.appendChild(script)
        } else {
          initEditor(config)
        }
      })
      .catch((err) => {
        setError("网络错误: " + err.message)
        setLoading(false)
      })

    function initEditor(config: OnlyOfficeConfig) {
      if (!containerRef.current || !window.DocsAPI) return

      try {
        new window.DocsAPI.DocEditor("onlyoffice-container", config)
        setLoading(false)
      } catch (err: any) {
        setError("编辑器初始化失败: " + err.message)
        setLoading(false)
      }
    }
  }, [documentId])

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <div className="h-12 border-b bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-sm text-blue-600 hover:underline"
            >
              ← 返回
            </button>
          )}
          <span className="text-sm text-gray-500">OnlyOffice 在线编辑</span>
        </div>
        <div className="text-xs text-gray-400">
          自动保存已开启
        </div>
      </div>

      {/* 编辑器容器 */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">正在加载编辑器...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md p-6">
              <div className="text-red-500 text-lg mb-2">⚠️</div>
              <p className="text-sm text-gray-700 mb-4">{error}</p>
              <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded text-left">
                <p className="font-medium mb-1">部署 OnlyOffice:</p>
                <code className="text-blue-600">
                  docker run -d -p 8080:80 onlyoffice/documentserver
                </code>
              </div>
            </div>
          </div>
        )}

        <div
          id="onlyoffice-container"
          ref={containerRef}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

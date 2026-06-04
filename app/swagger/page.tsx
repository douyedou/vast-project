"use client"

import { useEffect, useRef } from "react"
import "swagger-ui-dist/swagger-ui.css"

export default function SwaggerPage() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    let mounted = true

    import("swagger-ui-dist/swagger-ui-bundle").then((module) => {
      if (!mounted || !containerRef.current) {
        return
      }

      const SwaggerUI = (module as any).default || module
      SwaggerUI({
        domNode: containerRef.current,
        url: "/api/openapi",
        presets: [(module as any).presets?.apis],
      })
    })

    return () => {
      mounted = false
    }
  }, [])

  return <div ref={containerRef} className="min-h-screen" />
}

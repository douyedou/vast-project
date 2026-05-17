/**
 * 全局 API 请求 Hook
 * 自动携带 Token，统一错误处理
 */

import { useState, useCallback } from 'react'

const API_BASE = ''

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('vast_token')
  }
  return null
}

export function setToken(token: string) {
  localStorage.setItem('vast_token', token)
}

export function removeToken() {
  localStorage.removeItem('vast_token')
}

interface ApiOptions {
  method?: string
  body?: any
  headers?: Record<string, string>
}

export async function apiRequest<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json()

  if (data.code === 401) {
    removeToken()
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  if (data.code !== 200) {
    throw new Error(data.message || '请求失败')
  }

  return data.data
}

export function useApi<T = any>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async (path: string, options?: ApiOptions) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiRequest<T>(path, options)
      setData(result)
      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, request }
}

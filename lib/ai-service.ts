/**
 * AI 服务统一封装层
 * 封装对本地 Ollama 的 HTTP 调用，供 C/D 的业务模块使用
 * 
 * 使用方式：
 * import { aiService } from '@/lib/ai-service'
 * const result = await aiService.generate('生成一段技术描述...')
 */

export interface GenerateOptions {
  temperature?: number      // 创造性，0-1，默认 0.7
  maxTokens?: number        // 最大输出长度，默认 2048
  model?: string            // 模型名称，默认从环境变量读取
}

export interface GenerateResult {
  text: string
  model: string
  totalDuration?: number
}

export interface EmbedResult {
  embedding: number[]
}

export interface DetectResult {
  aiRate: number            // 0-100，AI 生成概率
  flagged: string[]         // 被标记的可疑片段
  perplexity?: number       // 困惑度（越低越像 AI）
}

class AIService {
  private baseUrl: string
  private defaultModel: string

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    this.defaultModel = process.env.OLLAMA_MODEL || 'qwen2.5:3b'
  }

  /**
   * 统一 LLM 文本生成
   * @param prompt 提示词
   * @param options 可选参数
   * @returns 生成的文本
   * 
   * 示例：
   * const result = await aiService.generate(
   *   '根据以下交底书内容，生成说明书的技术领域部分：...'
   * )
   */
  async generate(prompt: string, options: GenerateOptions = {}): Promise<GenerateResult> {
    const { temperature = 0.7, maxTokens = 2048, model = this.defaultModel } = options

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama 请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        text: data.response?.trim() || '',
        model: data.model || model,
        totalDuration: data.total_duration,
      }
    } catch (err: any) {
      console.error('AI 生成失败:', err.message)
      throw new Error(`AI 服务不可用: ${err.message}`)
    }
  }

  /**
   * 文本向量化（用于 RAG 检索）
   * @param text 输入文本
   * @returns 向量数组
   * 
   * 注意：Ollama 的 embed 接口需要 nomic-embed-text 等嵌入模型
   * 如果未安装嵌入模型，会回退到简化实现
   */
  async embed(text: string): Promise<EmbedResult> {
    try {
      // 尝试使用 Ollama 的嵌入接口
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mxbai-embed-large:latest',  // 高质量嵌入模型（768维）
          prompt: text,
        }),
      })

      if (!response.ok) {
        // 如果嵌入模型不存在，返回简化向量（仅用于演示）
        console.warn('嵌入模型未安装，返回简化向量。建议运行: ollama pull mxbai-embed-large')
        return { embedding: this.simplifiedEmbedding(text) }
      }

      const data = await response.json()
      return { embedding: data.embedding || [] }
    } catch (err: any) {
      console.warn('向量化失败，使用简化版本:', err.message)
      return { embedding: this.simplifiedEmbedding(text) }
    }
  }

  /**
   * AI 率检测（简化版）
   * 基于 perplexity 和文本特征做粗略判断
   * 完整版需要部署专门的检测模型
   * 
   * @param text 待检测文本
   * @returns AI 率评估结果
   */
  async detectAI(text: string): Promise<DetectResult> {
    try {
      // 方法1：使用 LLM 自我评估（prompt engineering）
      const prompt = `请分析以下文本，判断它是否像 AI 生成的。只返回一个 0-100 的整数表示 AI 生成概率，以及 1-3 个最可疑的句子片段。

文本：
"""${text.substring(0, 2000)}"""

请严格按以下格式返回：
AI率: [数字]
可疑片段:
1. [片段1]
2. [片段2]
3. [片段3]`

      const result = await this.generate(prompt, { temperature: 0.1, maxTokens: 500 })
      
      // 解析 LLM 返回的结果
      const aiRateMatch = result.text.match(/AI率[:：]\s*(\d+)/i)
      const aiRate = aiRateMatch ? Math.min(100, Math.max(0, parseInt(aiRateMatch[1]))) : 50

      const flagged: string[] = []
      const fragmentMatches = result.text.matchAll(/\d+\.\s*(.+?)(?=\n|$)/g)
      for (const match of fragmentMatches) {
        const fragment = match[1].trim()
        if (fragment && fragment.length > 5 && text.includes(fragment)) {
          flagged.push(fragment)
        }
      }

      return { aiRate, flagged: flagged.slice(0, 5) }
    } catch (err: any) {
      console.error('AI 检测失败:', err.message)
      // 降级：返回粗略估计
      return { aiRate: this.roughEstimate(text), flagged: [] }
    }
  }

  /**
   * 流式生成（用于长文本实时展示）
   * @param prompt 提示词
   * @param onChunk 每次收到数据块时的回调
   * @param options 可选参数
   */
  async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options: GenerateOptions = {}
  ): Promise<void> {
    const { temperature = 0.7, maxTokens = 2048, model = this.defaultModel } = options

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: { temperature, num_predict: maxTokens },
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama 流式请求失败: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取响应流')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)
          if (data.response) {
            onChunk(data.response)
          }
        } catch {
          // 忽略解析失败的行
        }
      }
    }
  }

  // ─── 私有辅助方法 ───

  /**
   * 简化版文本向量化（仅用于演示）
   * 基于词频的稀疏向量，不推荐生产使用
   */
  private simplifiedEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/)
    const vector = new Array(768).fill(0)
    
    for (let i = 0; i < words.length; i++) {
      const hash = this.simpleHash(words[i])
      vector[hash % 768] += 1
    }
    
    // L2 归一化
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  /**
   * 粗略估计 AI 率（基于文本特征）
   * 仅作为降级方案
   */
  private roughEstimate(text: string): number {
    let score = 30  // 基础分
    
    // 特征1：过度使用过渡词
    const transitionWords = ['此外', '另外', '同时', '因此', '综上所述', '值得注意的是']
    const transitionCount = transitionWords.reduce((sum, word) => 
      sum + (text.split(word).length - 1), 0)
    score += transitionCount * 5

    // 特征2：句子长度过于均匀
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 5)
    if (sentences.length > 3) {
      const avgLen = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
      const variance = sentences.reduce((sum, s) => sum + Math.pow(s.length - avgLen, 2), 0) / sentences.length
      if (variance < 100) score += 15  // 长度过于均匀
    }

    // 特征3：重复句式
    const patterns = text.match(/\b\w{4,}\b/g) || []
    const uniquePatterns = new Set(patterns)
    if (patterns.length > 10 && uniquePatterns.size / patterns.length < 0.6) {
      score += 10
    }

    return Math.min(100, Math.max(0, score))
  }
}

// 单例导出
export const aiService = new AIService()

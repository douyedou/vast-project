export interface GenerateOptions {
  temperature?: number
  maxTokens?: number
  model?: string
  system?: string
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
  aiRate: number
  flagged: string[]
  perplexity?: number
}

class AIService {
  private baseUrl: string
  private defaultModel: string
  private embeddingModel: string

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434"
    this.defaultModel = process.env.OLLAMA_MODEL || "qwen2.5:3b"
    this.embeddingModel = process.env.OLLAMA_EMBED_MODEL || "mxbai-embed-large:latest"
  }

  async generate(prompt: string, options: GenerateOptions = {}): Promise<GenerateResult> {
    const {
      temperature = 0.7,
      maxTokens = 2048,
      model = this.defaultModel,
      system,
    } = options

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          ...(system ? { system } : {}),
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
        text: data.response?.trim() || "",
        model: data.model || model,
        totalDuration: data.total_duration,
      }
    } catch (err: any) {
      console.error("AI 生成失败:", err.message)
      throw new Error(`AI 服务不可用: ${err.message}`)
    }
  }

  async embed(text: string): Promise<EmbedResult> {
    const input = this.prepareEmbeddingText(text)
    const requests = [
      {
        url: `${this.baseUrl}/api/embed`,
        body: { model: this.embeddingModel, input },
      },
      {
        url: `${this.baseUrl}/api/embeddings`,
        body: { model: this.embeddingModel, prompt: input },
      },
    ]

    try {
      for (const request of requests) {
        const response = await fetch(request.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request.body),
        })

        if (!response.ok) continue

        const data = await response.json()
        const embedding = Array.isArray(data.embedding)
          ? data.embedding
          : Array.isArray(data.embeddings?.[0])
            ? data.embeddings[0]
            : []
        if (embedding.length) {
          return { embedding: embedding.length === 1024 ? embedding : this.normalizeEmbedding(embedding) }
        }
      }

      console.warn("嵌入模型不可用，使用 1024 维演示向量")
      return { embedding: this.simplifiedEmbedding(input) }
    } catch (err: any) {
      console.warn("向量化失败，使用 1024 维演示向量:", err.message)
      return { embedding: this.simplifiedEmbedding(input) }
    }
  }

  async detectAI(text: string): Promise<DetectResult> {
    try {
      const prompt = `请分析以下文本，判断它像 AI 生成内容的概率。只返回如下格式：
AI率: [0-100整数]
可疑片段:
1. [片段]
2. [片段]
3. [片段]

文本："""${text.substring(0, 2000)}"""`

      const result = await this.generate(prompt, {
        system: "你是文本质量分析助手，只做概率判断，不做事实扩写。",
        temperature: 0.1,
        maxTokens: 500,
      })

      const aiRateMatch = result.text.match(/AI率[:：]?\s*(\d+)/i) || result.text.match(/(\d+)/)
      const aiRate = aiRateMatch ? Math.min(100, Math.max(0, parseInt(aiRateMatch[1]))) : 50
      const flagged = Array.from(result.text.matchAll(/\d+[.、]\s*(.+?)(?=\n|$)/g))
        .map((match) => match[1].trim())
        .filter((fragment) => fragment.length > 5)
        .slice(0, 5)

      return { aiRate, flagged }
    } catch (err: any) {
      console.error("AI 检测失败:", err.message)
      return { aiRate: this.roughEstimate(text), flagged: [] }
    }
  }

  async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options: GenerateOptions = {}
  ): Promise<void> {
    const {
      temperature = 0.7,
      maxTokens = 2048,
      model = this.defaultModel,
      system,
    } = options

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        ...(system ? { system } : {}),
        stream: true,
        options: { temperature, num_predict: maxTokens },
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama 流式请求失败: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("无法读取响应流")

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)
          if (data.response) onChunk(data.response)
        } catch {
          // Ignore malformed streaming chunks.
        }
      }
    }
  }

  private normalizeEmbedding(embedding: number[]): number[] {
    const vector = new Array(1024).fill(0)
    for (let i = 0; i < Math.min(1024, embedding.length); i++) {
      vector[i] = Number.isFinite(embedding[i]) ? embedding[i] : 0
    }
    return vector
  }

  private prepareEmbeddingText(text: string): string {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1800)
  }

  private simplifiedEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean)
    const vector = new Array(1024).fill(0)

    for (const word of words.length ? words : [text]) {
      const hash = this.simpleHash(word)
      vector[hash % 1024] += 1
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
    return magnitude > 0 ? vector.map((value) => value / magnitude) : vector
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash &= hash
    }
    return Math.abs(hash)
  }

  private roughEstimate(text: string): number {
    let score = 30
    const transitionWords = ["此外", "另外", "同时", "因此", "综上所述", "值得注意的是"]
    const transitionCount = transitionWords.reduce(
      (sum, word) => sum + (text.split(word).length - 1),
      0
    )
    score += transitionCount * 5

    const sentences = text.split(/[。！？?]/).filter((sentence) => sentence.trim().length > 5)
    if (sentences.length > 3) {
      const avgLen = sentences.reduce((sum, sentence) => sum + sentence.length, 0) / sentences.length
      const variance =
        sentences.reduce((sum, sentence) => sum + Math.pow(sentence.length - avgLen, 2), 0) /
        sentences.length
      if (variance < 100) score += 15
    }

    return Math.min(100, Math.max(0, score))
  }
}

export const aiService = new AIService()

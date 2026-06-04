/**
 * M07 说明书 AI 生成 — 调用 AI 微服务生成专利说明书各章节
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000"

interface GenerateParams {
  disclosureContent: string      // 交底书内容
  specContent: string | null     // 已有的说明书内容（增量生成时用）
  imageCaptions: string[]        // 附图描述列表
  selectedChapters: string[]     // 要生成的章节 key 列表
  caseTitle: string              // 案件标题
}

interface GeneratedChapters {
  tech_field: string
  background: string
  summary: string
  drawings_desc: string
  embodiment: string
  effects: string
}

const CHAPTER_LABELS: Record<string, string> = {
  "tech-field": "技术领域",
  "background": "背景技术",
  "summary": "发明内容",
  "drawings": "附图说明",
  "embodiment": "具体实施方式",
  "effects": "有益效果",
}

/**
 * 构建生成说明书各章节的 prompt
 */
function buildPrompt(params: GenerateParams): string {
  const chaptersToGen = params.selectedChapters
    .map((k) => `- ${CHAPTER_LABELS[k] || k}`)
    .join("\n")

  const imagesSection = params.imageCaptions.length > 0
    ? `\n## 附图信息\n${params.imageCaptions.map((c, i) => `图${i + 1}：${c}`).join("\n")}`
    : ""

  const existingSection = params.specContent
    ? `\n## 现有说明书内容（在此基础上完善）\n${params.specContent}`
    : ""

  return `你是中国专利代理师，请根据以下交底书内容生成一份完整的中国专利说明书。

## 案件信息
- 发明名称：${params.caseTitle}

## 交底书内容
${params.disclosureContent}
${existingSection}
${imagesSection}

## 生成要求
请按以下章节格式输出，每章节以"## 章节名"开头：

需要生成的章节：
${chaptersToGen}

输出格式示例：
## 技术领域
本发明涉及...技术领域，尤其涉及一种...

## 背景技术
现有的...

## 发明内容
为解决上述技术问题，本发明提供...包括：...

## 附图说明
图1是...的结构示意图；
图2是...

## 具体实施方式
下面结合附图对本发明进行详细描述...
实施例一：...

## 有益效果
1、...

注意：
1. 每个章节独立完整，不要跨章节重复
2. 附图说明要引用实际存在的图片编号
3. 具体实施方式要详细描述至少一个实施例
4. 技术方案要明确写出结构、步骤、连接关系
5. 只用中文输出，不要输出 JSON 或代码块标记`
}

/**
 * 解析 AI 返回的章节文本
 */
function parseChapters(aiText: string): GeneratedChapters {
  const result: GeneratedChapters = {
    tech_field: "",
    background: "",
    summary: "",
    drawings_desc: "",
    embodiment: "",
    effects: "",
  }

  const chapterMap: Record<string, keyof GeneratedChapters> = {
    "技术领域": "tech_field",
    "背景技术": "background",
    "发明内容": "summary",
    "附图说明": "drawings_desc",
    "具体实施方式": "embodiment",
    "有益效果": "effects",
  }

  // 按 "## 章节名" 分割
  const parts = aiText.split(/^## /gm)
  let currentKey: keyof GeneratedChapters | null = null

  for (const part of parts) {
    if (!part.trim()) continue

    // 尝试匹配章节标题
    let matched = false
    for (const [label, key] of Object.entries(chapterMap)) {
      if (part.startsWith(label)) {
        const content = part.slice(label.length).trim()
        // 去掉可能的换行和空行开头
        result[key] = content.replace(/^\n+/, "").trim()
        currentKey = key
        matched = true
        break
      }
    }

    // 如果没匹配到新章节，追加到上一个章节
    if (!matched && currentKey) {
      result[currentKey] += "\n" + part.trim()
    }
  }

  return result
}

/**
 * 调用 AI 服务生成说明书
 */
export async function generateSpecification(params: GenerateParams): Promise<GeneratedChapters> {
  const prompt = buildPrompt(params)

  const response = await fetch(`${AI_SERVICE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`AI 服务调用失败 (${response.status}): ${errText}`)
  }

  const data = await response.json() as { text: string; model: string }
  const chapters = parseChapters(data.text)

  return chapters
}

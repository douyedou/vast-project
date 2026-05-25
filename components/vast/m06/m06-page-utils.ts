import type { M06Content, M06SectionKey } from "@/lib/m06"

export const SECTION_ID_TO_KEY: Record<string, M06SectionKey> = {
  "technical-problem": "technicalProblem",
  problem: "technicalProblem",
  "technical-background": "backgroundTechnology",
  background: "backgroundTechnology",
  "existing-defects": "backgroundTechnology",
  defects: "backgroundTechnology",
  "invention-purpose": "technicalProblem",
  purpose: "technicalProblem",
  "technical-solution": "technicalSolution",
  solution: "technicalSolution",
  "key-points": "technicalSolution",
  keypoints: "technicalSolution",
  "beneficial-effects": "beneficialEffects",
  effect: "beneficialEffects",
  drawings: "drawings",
  "actual-product": "embodiments",
  alternatives: "embodiments",
}

export function getSectionValue(content: M06Content | null | undefined, id: string, fallback = "") {
  const key = SECTION_ID_TO_KEY[id]
  if (!content || !key) return fallback
  return content.sections[key] || fallback
}

export function applySectionValue(content: M06Content, id: string, value: string): M06Content {
  const key = SECTION_ID_TO_KEY[id]
  if (!key) return content
  return {
    ...content,
    sections: {
      ...content.sections,
      [key]: value,
    },
  }
}

export function splitLines(value: string) {
  return value
    .split(/\n|；|;|、|,/)
    .map((item) => item.replace(/^\s*[-*•\d.、；)]+/, "").trim())
    .filter(Boolean)
}

export function joinLines(items: string[]) {
  return items.filter(Boolean).join("\n")
}

export function buildPatentTypeLabel(type?: string) {
  if (type === "utility") return "实用新型"
  if (type === "design") return "外观设计"
  return "发明"
}

export function downloadText(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

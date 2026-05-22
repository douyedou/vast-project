import fs from "fs/promises"
import path from "path"
import { pool, query } from "@/lib/db"
import { parseFile, detectMimeType } from "@/lib/file-parser"
import {
  createIngestRun,
  harvestCrossrefWorks,
  harvestOpenAlexWorks,
  harvestPatentsViewWorks,
  harvestSemanticScholarWorks,
  sanitizeKnowledgeText,
  updateIngestRun,
  upsertKnowledgeDocument,
} from "@/lib/knowledge"

const LOCAL_SOURCE_DIR =
  process.env.KNOWLEDGE_SOURCE_DIR || path.resolve(process.cwd(), "交底完整-授权专利")

const LOCAL_EXTENSIONS = new Set([".doc", ".docx", ".pdf", ".txt", ".md"])

const DEMO_TOPICS = [
  { field: "机械", title: "智能温控机械工装", query: "smart thermostat mechanical fixture patent prior art", slug: "smart-thermo-fixture" },
  { field: "机械", title: "ABS 传感器拉脱力测试台", query: "ABS sensor clamping pull-off force test bench", slug: "abs-sensor-test" },
  { field: "机械", title: "定位夹具安全联锁机构", query: "fixture positioning safety interlock mechanism patent", slug: "fixture-interlock" },
  { field: "生物化学", title: "血液灌流吸附树脂", query: "blood perfusion modified polystyrene adsorption resin", slug: "blood-adsorption-resin" },
  { field: "生物化学", title: "生物材料表面改性涂层", query: "biomedical polymer coating surface modification prior art", slug: "biomaterial-coating" },
  { field: "生物化学", title: "高分子吸附材料制备流程", query: "polymer adsorption material preparation method patent", slug: "polymer-adsorbent" },
  { field: "软件通信", title: "水面救援定位通信系统", query: "water rescue positioning communication system patent", slug: "water-rescue-positioning" },
  { field: "软件通信", title: "物联网应急救援通信", query: "IoT emergency rescue communication telemetry system", slug: "iot-rescue-telemetry" },
  { field: "AI", title: "AI 专利撰写知识图谱", query: "artificial intelligence patent drafting knowledge graph", slug: "ai-patent-kg" },
  { field: "AI", title: "技术特征自动抽取", query: "technical feature extraction patent artificial intelligence", slug: "feature-extraction-ai" },
  { field: "通信", title: "无线通信救援网络", query: "wireless emergency communication rescue system prior art", slug: "wireless-rescue-network" },
  { field: "通信", title: "低功耗遥测通信控制", query: "low power telemetry wireless communication control method", slug: "low-power-telemetry" },
  { field: "通用", title: "交底书质量控制流程", query: "invention disclosure quality control patent drafting workflow", slug: "disclosure-quality-control" },
]

const TEMPLATE_TYPES = [
  "检索提示",
  "交底模板",
  "权利要求支撑点",
  "风险检查清单",
  "图示建模提示",
  "现有技术对比模板",
  "补正答复线索",
  "实施例参数表",
  "术语映射表",
  "提交包核查",
]

interface IngestStats {
  documents: number
  chunks: number
  embeddings: number
  skipped: number
}

interface IngestArgs {
  preset?: string
  limit: number
  runLocal: boolean
  runPapers: boolean
  runPatents: boolean
  runTemplates: boolean
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) return walk(fullPath)
      return [fullPath]
    })
  )
  return files.flat()
}

function parseArgs(): IngestArgs {
  const args = process.argv.slice(2)
  const argSet = new Set(args)
  const presetIndex = args.indexOf("--preset")
  const limitIndex = args.indexOf("--limit")
  const preset = presetIndex >= 0 ? args[presetIndex + 1] : undefined
  const limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) || 8 : 8
  const enhanced = preset === "demo-enhanced"
  const hasMode = args.some((arg) => ["--local", "--online", "--papers", "--patents", "--templates"].includes(arg))

  return {
    preset,
    limit,
    runLocal: enhanced || !hasMode || argSet.has("--local"),
    runPapers: enhanced || !hasMode || argSet.has("--online") || argSet.has("--papers"),
    runPatents: enhanced || argSet.has("--online") || argSet.has("--patents"),
    runTemplates: enhanced || argSet.has("--templates"),
  }
}

function inferField(filePath: string) {
  const normalized = filePath.replace(/\\/g, "/")
  if (normalized.includes("机械")) return "机械"
  if (normalized.includes("生物") || normalized.includes("化学")) return "生物化学"
  if (normalized.includes("软件") || normalized.includes("软通")) return "软件通信"
  if (normalized.includes("通信")) return "通信"
  if (/AI|人工智能/i.test(normalized)) return "AI"
  return "通用"
}

function inferSourceType(filePath: string) {
  const name = path.basename(filePath)
  if (name.includes("交底")) return "template" as const
  return "patent" as const
}

function inferCategory(filePath: string) {
  const name = path.basename(filePath)
  if (name.includes("授权")) return "授权文件"
  if (name.includes("审查") || name.includes("补正") || name.includes("答复")) return "审查意见/答复"
  if (name.includes("对比")) return "对比文件"
  if (name.includes("定稿")) return "定稿"
  if (name.includes("交底")) return "交底书"
  return "资料文件"
}

function mimeFromFile(filePath: string, buffer: Buffer) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  if (ext === ".doc") return "application/msword"
  if (ext === ".pdf") return "application/pdf"
  if (ext === ".txt") return "text/plain"
  if (ext === ".md") return "text/markdown"
  return detectMimeType(buffer) || "text/plain"
}

function addResult(stats: IngestStats, item: any) {
  if (item?.skipped) {
    stats.skipped++
    return
  }
  stats.documents++
  stats.chunks += item?.chunks || 0
  stats.embeddings += item?.embeddings || 0
}

async function ingestLocalDirectory(sourceDir: string) {
  const runId = await createIngestRun("local", sourceDir)
  const stats: IngestStats = { documents: 0, chunks: 0, embeddings: 0, skipped: 0 }

  try {
    await fs.access(sourceDir)
  } catch {
    await updateIngestRun(runId, {
      status: "completed",
      metadata: { skipped: 1, reason: "本地知识目录不存在", sourceDir },
    })
    console.warn(`[local:skip] 本地知识目录不存在: ${sourceDir}`)
    return { ...stats, skipped: 1 }
  }

  try {
    const files = (await walk(sourceDir)).filter((file) => LOCAL_EXTENSIONS.has(path.extname(file).toLowerCase()))

    for (const filePath of files) {
      const relative = path.relative(sourceDir, filePath)
      try {
        const buffer = await fs.readFile(filePath)
        const mimeType = mimeFromFile(filePath, buffer)
        const parsed = await parseFile(buffer, mimeType, { maxLength: 120000 })
        const text = sanitizeKnowledgeText(parsed.text)
        const result = await upsertKnowledgeDocument({
          field: inferField(filePath),
          title: path.basename(filePath, path.extname(filePath)),
          content: text,
          source: relative,
          sourceType: inferSourceType(filePath),
          metadata: {
            category: inferCategory(filePath),
            absolutePath: filePath,
            mimeType,
            pages: parsed.pages,
            paragraphs: parsed.paragraphs,
            wordCount: parsed.wordCount,
          },
        })

        addResult(stats, result)
        console.log(`[local] ${relative} -> chunks=${result.chunks}`)
      } catch (err: any) {
        stats.skipped++
        console.warn(`[local:skip] ${relative}: ${err.message}`)
      }
    }

    await updateIngestRun(runId, {
      status: "completed",
      totalDocuments: stats.documents,
      totalChunks: stats.chunks,
      totalEmbeddings: stats.embeddings,
      metadata: { skipped: stats.skipped },
    })
    return stats
  } catch (err: any) {
    await updateIngestRun(runId, { status: "failed", errorMessage: err.message, metadata: stats })
    throw err
  }
}

async function harvestPublicKnowledge(args: IngestArgs) {
  const runId = await createIngestRun("online-public", "OpenAlex/Crossref/Semantic Scholar/PatentsView", {
    topics: DEMO_TOPICS,
    limit: args.limit,
    papers: args.runPapers,
    patents: args.runPatents,
  })
  const stats: IngestStats = { documents: 0, chunks: 0, embeddings: 0, skipped: 0 }

  try {
    for (const topic of DEMO_TOPICS) {
      const harvested: any[] = []

      if (args.runPapers) {
        try {
          harvested.push(...await harvestOpenAlexWorks(topic.query, topic.field, args.limit))
        } catch (err: any) {
          console.warn(`[OpenAlex] ${topic.query}: ${err.message}`)
        }

        if (harvested.filter((item) => !item.skipped).length < 3) {
          try {
            harvested.push(...await harvestCrossrefWorks(topic.query, topic.field, Math.max(4, Math.ceil(args.limit / 2))))
          } catch (err: any) {
            console.warn(`[Crossref] ${topic.query}: ${err.message}`)
          }
        }

        if (harvested.filter((item) => !item.skipped).length < 3) {
          try {
            harvested.push(...await harvestSemanticScholarWorks(topic.query, topic.field, Math.max(4, Math.ceil(args.limit / 2))))
          } catch (err: any) {
            console.warn(`[Semantic Scholar] ${topic.query}: ${err.message}`)
          }
        }
      }

      if (args.runPatents) {
        try {
          harvested.push(...await harvestPatentsViewWorks(topic.query, topic.field, args.limit))
        } catch (err: any) {
          console.warn(`[PatentsView] ${topic.query}: ${err.message}`)
        }
      }

      harvested.forEach((item) => addResult(stats, item))
      console.log(`[online] ${topic.field} / ${topic.query} -> ${harvested.length}`)
    }

    await updateIngestRun(runId, {
      status: "completed",
      totalDocuments: stats.documents,
      totalChunks: stats.chunks,
      totalEmbeddings: stats.embeddings,
      metadata: { skipped: stats.skipped },
    })
    return stats
  } catch (err: any) {
    await updateIngestRun(runId, { status: "failed", errorMessage: err.message, metadata: stats })
    throw err
  }
}

function buildTemplateContent(topic: (typeof DEMO_TOPICS)[number], templateType: string, index: number) {
  const subject = topic.title
  const paragraphs = [
    `主题：${subject}。本文档是 M06 交底书引擎的演示知识卡，用于支持工程师在交底解构、AI 初检、二次检索、现有技术对比和提交包生成时获得稳定参考。`,
    `技术问题：围绕${subject}，应优先确认现有系统在结构、流程、材料、通信链路或算法策略上的瓶颈，区分工程痛点、用户痛点和可验证的技术缺陷。`,
    `背景技术：检索时建议同时使用产品名称、核心部件、控制对象、关键材料、信号链路、应用场景和失效模式等关键词；如果属于跨领域方案，应分别检索主领域和辅助领域。`,
    `技术方案：交底书应写清楚核心模块、模块连接关系、数据或能量流向、动作顺序、控制条件、材料组成、参数范围、异常处理和可替代实施方式，避免只写功能目标。`,
    `实施方式：至少给出一个完整实施例，包含装置组成或步骤顺序、关键参数、输入输出、触发条件和验证指标。对于软件通信方案，要补充消息格式、状态机、重试策略和安全边界。`,
    `有益效果：效果应对应技术问题，优先使用可验证表达，例如降低响应时间、提高定位精度、提升吸附容量、减少装配误差、降低功耗或提高系统鲁棒性。`,
    `附图建议：可生成系统结构图、流程图和动作关系图。图中节点应与权利要求的技术特征保持一致，连线应表达真实依赖关系而不是装饰性连接。`,
    `风险检查：${templateType}场景下，需要检查是否缺少区别特征、实施例是否支撑保护范围、术语是否前后一致、效果是否有技术因果、以及现有技术是否已覆盖核心组合。`,
    `M06 操作建议：先保存来源材料，再执行 AI 解构；初检命中高相似来源时进入二次检索和对比；补全后执行完整性校验，阻断项未通过不得提交 M07。`,
    `输出格式：建议形成技术问题、背景技术、技术方案、实施方式、有益效果、附图说明、技术特征、作用关系、替代方案、术语映射和保护点十一类结构化内容。`,
    `检索扩展词：${topic.query}；${subject} 结构；${subject} 控制方法；${subject} 失效模式；${subject} 现有技术；${subject} 改进方案。`,
    `结构化抽取：在 M06 P02 中应把${subject}拆成对象、部件、步骤、参数、条件和效果六类事实。对象回答“处理什么”，部件回答“由什么组成”，步骤回答“按什么顺序执行”，参数回答“取值范围”，条件回答“何时触发”，效果回答“解决了什么技术问题”。`,
    `权利要求支撑：若${subject}涉及装置，应至少保留独立装置权利要求、方法权利要求和系统/介质权利要求的候选支撑；若涉及材料，应补充组成比例、制备条件、测试方法和性能区间。`,
    `二次检索策略：先用宽关键词确认领域，再用核心区别特征组合检索。命中结果应记录标题、来源、相似点、不同点和是否影响新创性。相似来源不足时，不应直接给出低风险结论，而应提示继续扩词检索。`,
    `对比分析：把现有技术拆为“相同技术特征、缺失技术特征、相反教导、可替代实现、需要实验验证的效果”五列。M06 P07 的区别特征确认应优先选择能带来技术效果的结构或步骤，而不是营销描述。`,
    `关系建模：动作关系可采用“触发条件 -> 执行动作 -> 中间状态 -> 输出结果”的链路。对于${subject}，应检查每个动作是否有执行主体、输入信息、输出信息和失败处理。`,
    `事实结构化：术语映射应统一同义词，例如控制器、控制模块、处理单元不应在同一文档中无规则混用。替代方案应标明替代对象、替代条件和是否影响核心效果。`,
    `完整性校验：阻断项包括没有技术方案、没有实施方式、保护点无法从实施例找到支撑、附图说明与正文不一致、AI 初检高相似来源未处理。警告项包括效果缺少数据、术语不统一、替代方案不足。`,
    `数据包映射：提交 M07 前，应把章节内容、技术特征、关系节点、对比结论、完整性问题和来源材料一起打包。写作成员需要看到每个保护点对应的事实来源，避免后续撰写时重新追问。`,
    `按钮闭环：刷新用于重新读取数据库，保存用于写入 content_json，AI 生成用于调用专用 prompt，导出用于下载当前结论，下一步用于进入后续 P 页，禁用按钮必须说明前置条件。`,
    `工程师判断：AI 结果只作为建议。若来源相似度较高但区别特征明确，应选择“继续补全/进入对比”；若核心方案无法落地或完全缺少材料，应反馈 M05 补充资料。`,
    `图示建议：主要图可用 Mermaid 表达。系统图展示模块和数据流，流程图展示步骤顺序，关系图展示部件或动作依赖。节点名称必须来自交底书事实，不要使用空泛词。`,
    `展示规范：长文本需要换行展示，来源列表为空时显示空态，AI 执行中应禁用重复点击。每次 AI 生成、保存、提交和恢复版本都应形成版本记录，方便 P13 回溯。`,
    `版本记录：本条模板编号 ${index + 1}，用于演示知识库增强，不代表某一真实授权专利或论文全文。`,
  ]

  return paragraphs.join("\n\n")
}

async function seedEnhancedTemplates() {
  const runId = await createIngestRun("demo-enhanced-template", "M06 demo enhanced templates", {
    topics: DEMO_TOPICS.length,
    templateTypes: TEMPLATE_TYPES.length,
  })
  const stats: IngestStats = { documents: 0, chunks: 0, embeddings: 0, skipped: 0 }

  try {
    let index = 0
    for (const topic of DEMO_TOPICS) {
      for (const templateType of TEMPLATE_TYPES) {
        const title = `${topic.title}-${templateType}`
        const result = await upsertKnowledgeDocument({
          field: topic.field,
          title,
          content: buildTemplateContent(topic, templateType, index),
          source: `demo-enhanced://${topic.slug}/${templateType}`,
          sourceType: "template",
          metadata: {
            provider: "demo-enhanced",
            topic: topic.title,
            query: topic.query,
            templateType,
          },
        })
        addResult(stats, result)
        index++
        console.log(`[template] ${title} -> chunks=${result.chunks}`)
      }
    }

    await updateIngestRun(runId, {
      status: "completed",
      totalDocuments: stats.documents,
      totalChunks: stats.chunks,
      totalEmbeddings: stats.embeddings,
      metadata: { skipped: stats.skipped },
    })
    return stats
  } catch (err: any) {
    await updateIngestRun(runId, { status: "failed", errorMessage: err.message, metadata: stats })
    throw err
  }
}

async function main() {
  const args = parseArgs()

  if (args.runLocal) {
    const localStats = await ingestLocalDirectory(LOCAL_SOURCE_DIR)
    console.log("本地知识导入完成", localStats)
  }

  if (args.runPapers || args.runPatents) {
    const onlineStats = await harvestPublicKnowledge(args)
    console.log("公开知识元数据采集完成", onlineStats)
  }

  if (args.runTemplates) {
    const templateStats = await seedEnhancedTemplates()
    console.log("演示增强模板导入完成", templateStats)
  }

  const summary = await query(`
    SELECT
      (SELECT COUNT(*) FROM knowledge_base) AS documents,
      (SELECT COUNT(*) FROM knowledge_chunks) AS chunks,
      (SELECT COUNT(*) FROM knowledge_base WHERE embedding IS NULL) AS documents_without_embedding,
      (SELECT COUNT(*) FROM knowledge_chunks WHERE embedding IS NULL) AS chunks_without_embedding
  `)
  console.log("知识库统计", summary.rows[0])
}

main()
  .catch((err) => {
    console.error("知识库导入失败", err)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })

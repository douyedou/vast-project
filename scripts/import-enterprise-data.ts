/**
 * 企业专利数据批量导入脚本
 * 
 * 用法：npx tsx scripts/import-enterprise-data.ts
 * 
 * 遍历 `交底完整-授权专利` 目录，自动：
 * 1. 解析交底书/定稿/授权文件的文本
 * 2. 创建案件 + 交底书 + 专利文档
 * 3. 存入知识库 + 术语库
 */

import { readdirSync, readFileSync, statSync } from 'fs'
import { join, basename } from 'path'
import mammoth from 'mammoth'

// 解析 PDF（使用 pdf-parse 包的正确 API）
async function parsePDF(filePath: string): Promise<string> {
  const pdf = require('pdf-parse')
  const buffer = readFileSync(filePath)
  const parser = new pdf.PDFParse({ data: buffer })
  const result = await parser.getText()
  await parser.destroy()
  return result.text
}

async function parseDOCX(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath })
  return result.value
}

// 解析 .doc（使用 word-extractor，对老格式支持更好）
async function parseDOC(filePath: string): Promise<string> {
  const WordExtractor = require('word-extractor')
  const extractor = new WordExtractor()
  const doc = await extractor.extract(filePath)
  return doc.getBody()
}

async function parseFile(filePath: string): Promise<string> {
  const ext = basename(filePath).toLowerCase()
  if (ext.endsWith('.pdf')) return parsePDF(filePath)
  if (ext.endsWith('.docx')) return parseDOCX(filePath)
  if (ext.endsWith('.doc')) return parseDOC(filePath)
  return `[未知格式: ${basename(filePath)}]`
}

// 从文件夹名提取信息
function parseFolderName(folderName: string): { field: string; title: string; type: string } {
  // 格式："领域：标题-类型"
  const match = folderName.match(/^(.+?)领域[：:]\s*(.+?)\s*[-–—]\s*(.+)$/)
  if (match) {
    return {
      field: match[1].trim(),
      title: match[2].trim(),
      type: match[3].trim() === '实用新型' ? 'utility' : 'invention',
    }
  }
  return { field: '其他', title: folderName, type: 'invention' }
}

// 主导入逻辑
async function main() {
  const BASE_DIR = 'C:/Users/21734/Downloads/专利/专利/交底完整-授权专利'

  // 连接数据库
  const { Pool } = await import('pg')
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://vast_user:dydyxy999@localhost:5432/vast_db',
  })

  const client = await pool.connect()

  try {
    const entries = readdirSync(BASE_DIR, { withFileTypes: true })
    const folders = entries.filter(e => e.isDirectory())

    console.log(`发现 ${folders.length} 个专利案件文件夹\n`)

    for (const folder of folders) {
      const folderPath = join(BASE_DIR, folder.name)
      const { field, title, type } = parseFolderName(folder.name)

      console.log(`📁 处理: ${folder.name}`)
      console.log(`   领域: ${field}, 类型: ${type}, 标题: ${title}`)

      // 列出文件夹内文件
      const files = readdirSync(folderPath, { withFileTypes: true })
        .filter(e => !e.isDirectory())
        .map(e => e.name)

      const disclosureFile = files.find(f => f.includes('交底书'))
      const finalFile = files.find(f => f.includes('定稿') || f.includes('提交'))
      const authFile = files.find(f => f.includes('授权'))

      console.log(`   交底书: ${disclosureFile || '无'}`)
      console.log(`   定稿: ${finalFile || '无'}`)
      console.log(`   授权: ${authFile || '无'}`)

      // 1. 创建案件
      const caseResult = await client.query(
        `INSERT INTO cases (case_id, title, type, status, description, priority)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          `PAT-ENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title,
          type,
          'completed',
          `企业提供的真实专利案例，领域：${field}`,
          'normal',
        ]
      )
      const caseId = caseResult.rows[0].id
      console.log(`   ✅ 案件创建: ${caseId}`)

      // 2. 解析交底书并存入
      if (disclosureFile) {
        const disclosurePath = join(folderPath, disclosureFile)
        try {
          const text = await parseFile(disclosurePath)
          await client.query(
            `INSERT INTO disclosure_documents (case_id, content_json, status)
             VALUES ($1, $2, $3)`,
            [caseId, JSON.stringify({ title, content: text.substring(0, 10000) }), 'approved']
          )
          console.log(`   ✅ 交底书导入 (${text.length} 字符)`)

          // 3. 存入知识库
          await client.query(
            `INSERT INTO knowledge_base (field, title, content, source, source_type)
             VALUES ($1, $2, $3, $4, $5)`,
            [field, `${title}-交底书`, text.substring(0, 5000), disclosureFile, 'patent']
          )
          console.log(`   ✅ 知识库-交底书`)
        } catch (err: any) {
          console.log(`   ⚠️ 交底书解析失败: ${err.message}`)
        }
      }

      // 4. 解析定稿并存入专利文档
      if (finalFile) {
        const finalPath = join(folderPath, finalFile)
        try {
          const text = await parseFile(finalPath)
          await client.query(
            `INSERT INTO patent_documents (case_id, type, content, status)
             VALUES ($1, $2, $3, $4)`,
            [caseId, 'spec', text.substring(0, 10000), 'approved']
          )
          console.log(`   ✅ 专利文档导入 (${text.length} 字符)`)

          // 5. 存入知识库
          await client.query(
            `INSERT INTO knowledge_base (field, title, content, source, source_type)
             VALUES ($1, $2, $3, $4, $5)`,
            [field, `${title}-定稿`, text.substring(0, 5000), finalFile, 'template']
          )
          console.log(`   ✅ 知识库-定稿`)
        } catch (err: any) {
          console.log(`   ⚠️ 定稿解析失败: ${err.message}`)
        }
      }

      // 6. 解析授权文件
      if (authFile) {
        const authPath = join(folderPath, authFile)
        try {
          const text = await parseFile(authPath)
          await client.query(
            `INSERT INTO knowledge_base (field, title, content, source, source_type)
             VALUES ($1, $2, $3, $4, $5)`,
            [field, `${title}-授权文件`, text.substring(0, 3000), authFile, 'patent']
          )
          console.log(`   ✅ 知识库-授权文件 (${text.length} 字符)`)
        } catch (err: any) {
          console.log(`   ⚠️ 授权文件解析失败: ${err.message}`)
        }
      }

      console.log('')
    }

    console.log('🎉 全部导入完成！')
  } catch (err: any) {
    console.error('导入失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

main()

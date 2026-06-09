import { query } from '../lib/db'

async function main() {
  const docId = 'b220d9e7-5bcd-405f-8183-303405381d76'

  // 最近版本
  const versions = await query(
    'SELECT id, change_summary, length(content) as chars FROM document_versions WHERE document_id = $1 ORDER BY created_at DESC LIMIT 5',
    [docId]
  )
  console.log('版本列表:', JSON.stringify(versions.rows, null, 2))

  // diff 查询
  const prev = await query(
    'SELECT content FROM document_versions WHERE document_id = $1 AND id != (SELECT MAX(id) FROM document_versions WHERE document_id = $1) ORDER BY created_at DESC LIMIT 1',
    [docId]
  )
  console.log('上一版本行数:', prev.rows.length)
  if (prev.rows.length > 0) {
    const prevContent = prev.rows[0].content || ''
    const latestContent = versions.rows[0]?.content
    
    // 模拟 diff
    if (prevContent !== versions.rows[1]?.content) {
      console.log('内容不同，会触发 diff')
    }
    console.log('上一版字符数:', prevContent.length)
    console.log('最新版字符数:', versions.rows[0]?.content?.length || 0)
    console.log('第二版字符数:', versions.rows[1]?.content?.length || 0)
  }

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })

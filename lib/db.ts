/**
 * 数据库连接池
 * 使用 pg (node-postgres) 连接 PostgreSQL
 * 支持连接池复用、SQL 参数化查询
 */

import { Pool, PoolClient, QueryResult } from 'pg'

// 从环境变量读取数据库连接字符串
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL 未设置。请检查 .env 文件，或复制 .env.example 为 .env 并填写配置。'
  )
}

// 创建连接池
export const pool = new Pool({
  connectionString,
  // 连接池配置
  max: 20,                    // 最大连接数
  idleTimeoutMillis: 30000,   // 连接空闲 30 秒后释放
  connectionTimeoutMillis: 5000, // 连接超时 5 秒
})

// 连接错误处理
pool.on('error', (err) => {
  console.error('数据库连接池错误:', err)
})

/**
 * 执行 SQL 查询（带参数化，防 SQL 注入）
 * @param text SQL 语句
 * @param params 参数数组
 * @returns 查询结果
 * 
 * 示例：
 * const result = await query('SELECT * FROM users WHERE role = $1', ['engineer'])
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  const result = await pool.query<T>(text, params)
  const duration = Date.now() - start

  // 开发环境打印 SQL 日志
  if (process.env.NODE_ENV === 'development') {
    console.log('[SQL]', { text: text.substring(0, 100), duration: `${duration}ms`, rows: result.rowCount })
  }

  return result
}

/**
 * 获取单个连接（用于事务）
 * @returns 数据库客户端
 * 
 * 示例：
 * const client = await getClient()
 * try {
 *   await client.query('BEGIN')
 *   await client.query('INSERT INTO ...')
 *   await client.query('COMMIT')
 * } catch (e) {
 *   await client.query('ROLLBACK')
 *   throw e
 * } finally {
 *   client.release()
 * }
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect()
}

/**
 * 执行事务
 * @param callback 事务回调函数
 * @returns 回调函数返回值
 * 
 * 示例：
 * const result = await transaction(async (client) => {
 *   await client.query('INSERT INTO cases ...')
 *   await client.query('INSERT INTO case_status_history ...')
 *   return { caseId: 'xxx' }
 * })
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

/**
 * 测试数据库连接
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as now')
    console.log('✅ 数据库连接成功:', result.rows[0].now)
    return true
  } catch (err) {
    console.error('❌ 数据库连接失败:', err)
    return false
  }
}

// 进程退出时关闭连接池
process.on('SIGINT', async () => {
  console.log('正在关闭数据库连接池...')
  await pool.end()
  process.exit(0)
})

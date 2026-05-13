/**
 * 统一 API 响应格式
 * 所有后端接口必须通过这个模块返回数据
 * 
 * 成功响应格式：
 * { code: 200, data: {...}, message: "success" }
 * 
 * 失败响应格式：
 * { code: 400, data: null, message: "错误信息" }
 * 
 * 分页响应格式：
 * { code: 200, data: { list: [...], total: 100, page: 1, pageSize: 20 }, message: "success" }
 */

export interface ApiResponse<T = any> {
  code: number
  data: T | null
  message: string
}

export interface PaginatedData<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 成功响应
 * @param data 响应数据
 * @param message 成功提示（可选）
 * @returns 标准成功响应对象
 * 
 * 示例：
 * return success({ id: 'xxx', title: '案件1' })
 * return success(userList, '获取用户列表成功')
 */
export function success<T>(data: T, message: string = 'success'): ApiResponse<T> {
  return {
    code: 200,
    data,
    message,
  }
}

/**
 * 失败响应
 * @param message 错误信息
 * @param code 业务错误码（默认 400）
 * @param statusCode HTTP 状态码（默认 200，让前端能拿到响应体）
 * @returns 标准失败响应对象
 * 
 * 示例：
 * return error('案件标题不能为空')
 * return error('用户未登录', 401, 401)
 * return error('服务器内部错误', 500, 500)
 */
export function error(
  message: string,
  code: number = 400,
  statusCode: number = 200
): ApiResponse<null> {
  // 注意：statusCode 用于 HTTP 响应，code 用于业务逻辑
  // 前端统一根据 response.code 判断，而不是 HTTP status
  return {
    code,
    data: null,
    message,
  }
}

/**
 * 分页响应
 * @param list 当前页数据列表
 * @param total 总记录数
 * @param page 当前页码
 * @param pageSize 每页条数
 * @param message 成功提示（可选）
 * @returns 标准分页响应对象
 * 
 * 示例：
 * const cases = await query('SELECT * FROM cases LIMIT $1 OFFSET $2', [20, 0])
 * const count = await query('SELECT COUNT(*) FROM cases')
 * return paginate(cases.rows, parseInt(count.rows[0].count), 1, 20)
 */
export function paginate<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number,
  message: string = 'success'
): ApiResponse<PaginatedData<T>> {
  return {
    code: 200,
    data: {
      list,
      total,
      page,
      pageSize,
    },
    message,
  }
}

/**
 * 常用错误码速查
 */
export const ErrorCodes = {
  SUCCESS: 200,
  BAD_REQUEST: 400,           // 参数错误
  UNAUTHORIZED: 401,          // 未登录
  FORBIDDEN: 403,             // 无权限
  NOT_FOUND: 404,             // 资源不存在
  CONFLICT: 409,              // 资源冲突（如重复创建）
  INTERNAL_ERROR: 500,        // 服务器内部错误
  SERVICE_UNAVAILABLE: 503,   // 服务暂时不可用（如 AI 服务未启动）
} as const

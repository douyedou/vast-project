import path from "path"
import swaggerJSDoc from "swagger-jsdoc"

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Vast Project API",
    version: "1.0.0",
    description: "自动生成的 API 文档，基于 swagger-jsdoc",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        properties: {
          username: { type: "string" },
          password: { type: "string" },
        },
        required: ["username", "password"],
      },
      LoginResponse: {
        type: "object",
        properties: {
          code: { type: "number" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              token: { type: "string" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  username: { type: "string" },
                  name: { type: "string" },
                  role: { type: "string" },
                  email: { type: "string" },
                },
              },
            },
          },
        },
      },
      DashboardStats: {
        type: "object",
        properties: {
          pending: { type: "number" },
          specWriting: { type: "number" },
          claimsWriting: { type: "number" },
          returned: { type: "number" },
          reviewPending: { type: "number" },
        },
      },
      DashboardTask: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          type: { type: "string" },
          status: { type: "string" },
          statusLabel: { type: "string" },
          priority: { type: "string" },
          deadline: { type: "string", nullable: true },
          duplicate_rate: { type: "number", nullable: true },
          disclosure_coverage: { type: "number", nullable: true },
          support_rate: { type: "number", nullable: true },
        },
      },
      RiskItem: {
        type: "object",
        properties: {
          type: { type: "string" },
          count: { type: "number" },
          severity: { type: "string" },
        },
      },
      RecentActivity: {
        type: "object",
        properties: {
          time: { type: "string" },
          action: { type: "string" },
          target: { type: "string" },
          user: { type: "string" },
        },
      },
      DashboardResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              stats: { $ref: "#/components/schemas/DashboardStats" },
              myTasks: {
                type: "array",
                items: { $ref: "#/components/schemas/DashboardTask" },
              },
              risks: {
                type: "array",
                items: { $ref: "#/components/schemas/RiskItem" },
              },
              recentActivities: {
                type: "array",
                items: { $ref: "#/components/schemas/RecentActivity" },
              },
            },
          },
        },
      },
      // M07 权利要求书
      ClaimItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          number: { type: "number", description: "权利要求编号" },
          type: { type: "string", enum: ["independent", "dependent"], description: "独立/从属" },
          text: { type: "string", description: "权利要求正文" },
          refClaim: { type: "number", nullable: true, description: "引用的权利要求编号（从属时必填）" },
          supportStatus: { type: "string", enum: ["supported", "weak", "unsupported", "unchecked"] },
          supportParagraphs: { type: "array", items: { type: "string" } },
        },
      },
      ClaimsListResponse: {
        type: "object",
        properties: {
          code: { type: "number" },
          data: {
            type: "object",
            properties: {
              claims: { type: "array", items: { $ref: "#/components/schemas/ClaimItem" } },
              caseId: { type: "string" },
            },
          },
        },
      },
      ClaimsSaveRequest: {
        type: "object",
        required: ["caseId", "claims"],
        properties: {
          caseId: { type: "string" },
          claims: { type: "array", items: { $ref: "#/components/schemas/ClaimItem" } },
        },
      },
      ClaimUpdateRequest: {
        type: "object",
        properties: {
          text: { type: "string", description: "权利要求正文" },
          number: { type: "number", description: "权利要求编号" },
          refClaim: { type: "number", nullable: true, description: "引用编号（null=改为独权）" },
          supportStatus: { type: "string", enum: ["supported", "weak", "unsupported", "unchecked"] },
          supportParagraphs: { type: "array", items: { type: "string" } },
        },
      },
      // M07 说明书文档
      SpecDocument: {
        type: "object",
        properties: {
          id: { type: "string" },
          case_id: { type: "string" },
          type: { type: "string" },
          content: { type: "string" },
          status: { type: "string" },
          ai_rate: { type: "number" },
          version: { type: "number" },
          created_at: { type: "string" },
          updated_at: { type: "string" },
        },
      },
      // M07 说明书附图
      SpecImage: {
        type: "object",
        properties: {
          id: { type: "string" },
          case_id: { type: "string" },
          document_id: { type: "string" },
          filename: { type: "string" },
          original_name: { type: "string" },
          url: { type: "string" },
          mime_type: { type: "string" },
          size: { type: "number" },
          caption: { type: "string" },
          position: { type: "number" },
          section: { type: "string", description: "所属章节：tech-field/background/summary/drawings/embodiment/effects" },
          created_at: { type: "string" },
        },
      },
      // M07 图片更新请求
      SpecImageUpdateRequest: {
        type: "object",
        properties: {
          caption: { type: "string", description: "图名描述" },
          position: { type: "number", description: "排序序号" },
          section: { type: "string", description: "所属章节" },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
}

const apiFiles = path.join(process.cwd(), "app/api/**/*.ts").replace(/\\/g, "/")

const options = {
  definition: swaggerDefinition,
  apis: [apiFiles],
}

const swaggerSpec = swaggerJSDoc(options)

export function getSwaggerSpec() {
  return swaggerSpec
}

import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api/_docs",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Money Talk API",
        version: "1.0.0",
        description:
          "Read-only access to your personal finance data. Manage API keys in the app at `/api-keys`.",
      },
      tags: [
        { name: "Data", description: "Read your financial data" },
        {
          name: "Key Management",
          description: "Manage API keys (requires browser session)",
        },
      ],
      paths: {
        "/api/v1/health": {
          get: {
            summary: "Health check",
            description: "Returns 200 if the server is running.",
            tags: ["Data"],
            responses: {
              200: {
                description: "Server is healthy",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "ok" },
                        timestamp: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "/api/v1/accounts": {
          get: {
            summary: "List accounts",
            description: "Returns all accounts with their current values.",
            tags: ["Data"],
            security: [{ ApiKey: [] }],
            responses: {
              200: {
                description: "Array of accounts",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Account" },
                    },
                  },
                },
              },
              401: {
                description: "Missing or invalid API key",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" },
                  },
                },
              },
            },
          },
        },
        "/api/v1/accounts/{id}/activity": {
          get: {
            summary: "Account activity history",
            description:
              "Returns the reconciliation history for one account — one value per calendar day.",
            tags: ["Data"],
            security: [{ ApiKey: [] }],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Account ID from GET /api/v1/accounts",
              },
            ],
            responses: {
              200: {
                description: "Array of daily account values",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { $ref: "#/components/schemas/DataPoint" },
                    },
                  },
                },
              },
              401: {
                description: "Missing or invalid API key",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" },
                  },
                },
              },
            },
          },
        },
        "/api/v1/net-worth": {
          get: {
            summary: "Net worth history",
            description:
              "Returns one data point per calendar day — total assets minus liabilities.",
            tags: ["Data"],
            security: [{ ApiKey: [] }],
            parameters: [
              {
                name: "from",
                in: "query",
                schema: { type: "string", format: "date" },
                description: "Filter results on or after this date (e.g. 2025-01-01)",
              },
              {
                name: "to",
                in: "query",
                schema: { type: "string", format: "date" },
                description: "Filter results on or before this date",
              },
            ],
            responses: {
              200: {
                description: "Array of daily net worth values",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { $ref: "#/components/schemas/DataPoint" },
                    },
                  },
                },
              },
              401: {
                description: "Missing or invalid API key",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" },
                  },
                },
              },
            },
          },
        },
        "/api/keys": {
          get: {
            summary: "List API keys",
            description:
              "Lists all API keys for the authenticated user. Requires a browser session.",
            tags: ["Key Management"],
            responses: {
              200: {
                description: "Array of API keys",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ApiKey" },
                    },
                  },
                },
              },
              401: {
                description: "Not logged in",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" },
                  },
                },
              },
            },
          },
          post: {
            summary: "Create API key",
            description:
              "Creates a new API key. The full key is returned **once only** — store it immediately.",
            tags: ["Key Management"],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["name"],
                    properties: {
                      name: {
                        type: "string",
                        example: "Home automation",
                        description: "A label to identify the key",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              201: {
                description: "Key created. The `key` field is returned once only.",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/ApiKeyCreated" },
                  },
                },
              },
              400: {
                description: "Missing name",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" },
                  },
                },
              },
              401: {
                description: "Not logged in",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" },
                  },
                },
              },
            },
          },
        },
        "/api/keys/{id}": {
          delete: {
            summary: "Revoke API key",
            description:
              "Permanently revokes an API key. Any app using it will lose access immediately.",
            tags: ["Key Management"],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Key ID from GET /api/keys",
              },
            ],
            responses: {
              204: { description: "Key revoked" },
              404: {
                description: "Key not found",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" },
                  },
                },
              },
              401: {
                description: "Not logged in",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          ApiKey: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
            description:
              "API key created from the app. Required for all `/api/v1/*` endpoints.",
          },
        },
        schemas: {
          DataPoint: {
            type: "object",
            properties: {
              date: { type: "string", format: "date", example: "2025-03-16" },
              value: { type: "number", example: 142500.0 },
            },
            required: ["date", "value"],
          },
          Holding: {
            type: "object",
            properties: {
              ticker: { type: "string", example: "VTI" },
              quantity: { type: "number", example: 100 },
              pricePerUnit: { type: "number", example: 240.0 },
            },
            required: ["ticker", "quantity", "pricePerUnit"],
          },
          Account: {
            type: "object",
            properties: {
              id: { type: "string", example: "abc123" },
              name: { type: "string", example: "Checking" },
              type: {
                type: "string",
                enum: ["cash", "investment", "liability"],
              },
              currentValue: { type: "number", example: 5200.0 },
              balance: {
                type: "number",
                example: 5200.0,
                description: "Present for cash and liability accounts.",
              },
              holdings: {
                type: "array",
                items: { $ref: "#/components/schemas/Holding" },
                description: "Present for investment accounts.",
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
            required: [
              "id",
              "name",
              "type",
              "currentValue",
              "createdAt",
              "updatedAt",
            ],
          },
          ApiKey: {
            type: "object",
            properties: {
              _id: { type: "string", example: "key123" },
              name: { type: "string", example: "Home automation" },
              prefix: { type: "string", example: "mt_a1b2c3d4" },
              createdAt: { type: "string", format: "date-time" },
              lastUsedAt: {
                type: "string",
                format: "date-time",
                nullable: true,
                example: null,
              },
            },
            required: ["_id", "name", "prefix", "createdAt", "lastUsedAt"],
          },
          ApiKeyCreated: {
            allOf: [
              { $ref: "#/components/schemas/ApiKey" },
              {
                type: "object",
                properties: {
                  key: {
                    type: "string",
                    description: "Full API key — returned once only.",
                    example: "mt_a1b2c3d4e5f6...",
                  },
                },
                required: ["key"],
              },
            ],
          },
          Error: {
            type: "object",
            properties: { error: { type: "string" } },
            required: ["error"],
          },
        },
      },
      security: [],
    },
  });
  return spec;
};

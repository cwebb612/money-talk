import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api",
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
                enum: ["cash", "stock", "crypto", "liability"],
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
                description: "Present for stock and crypto accounts.",
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

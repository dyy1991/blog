// Ported from novel-graph-agent src/planner/openai-compatible-client.ts
// PlannerEndpoint 类型原属 config 模块,此处内联
import type { LanguageModelClient, ModelJsonRequest } from './planner-types';

export type PlannerEndpoint = 'responses' | 'chat_completions';

export interface OpenAICompatibleLanguageModelClientOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  endpoint?: PlannerEndpoint;
  headers?: Record<string, string>;
  fetchFn?: typeof fetch;
}

interface JsonSchemaFormat {
  name: string;
  strict: false;
  schema: {
    type: 'object';
    additionalProperties: boolean;
    properties: Record<string, unknown>;
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function buildSchema(request: ModelJsonRequest): JsonSchemaFormat {
  return {
    name: `novel_${request.operation}_response`,
    strict: false,
    schema: {
      type: 'object',
      additionalProperties: true,
      properties: {}
    }
  };
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === 'string') {
    return record.output_text;
  }

  const output = Array.isArray(record.output) ? record.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const outputItem = item as Record<string, unknown>;
    if (typeof outputItem.text === 'string') {
      chunks.push(outputItem.text);
    }
    if (Array.isArray(outputItem.content)) {
      for (const content of outputItem.content as Array<Record<string, unknown>>) {
        if (content && typeof content.text === 'string') {
          chunks.push(content.text);
        }
      }
    }
  }

  return chunks.join('').trim();
}

function parseJsonText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Model returned an empty response.');
  }
  return JSON.parse(trimmed);
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

export class OpenAICompatibleLanguageModelClient implements LanguageModelClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpoint: PlannerEndpoint;
  private readonly headers: Record<string, string>;
  private readonly fetchFn: typeof fetch;

  constructor(options: OpenAICompatibleLanguageModelClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.endpoint = options.endpoint ?? 'responses';
    this.headers = options.headers ?? {};
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async completeJson(request: ModelJsonRequest): Promise<unknown> {
    const schema = buildSchema(request);
    const body =
      this.endpoint === 'responses'
        ? {
            model: this.model,
            input: [
              {
                role: 'system',
                content: [
                  {
                    type: 'input_text',
                    text: `${request.system}\n\n${request.response_shape}`
                  }
                ]
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'input_text',
                    text: request.user
                  }
                ]
              }
            ],
            text: {
              format: {
                type: 'json_schema',
                ...schema
              }
            }
          }
        : {
            model: this.model,
            messages: [
              {
                role: 'system',
                content: `${request.system}\n\n${request.response_shape}`
              },
              {
                role: 'user',
                content: request.user
              }
            ],
            response_format: {
              type: 'json_schema',
              json_schema: schema
            }
          };

    const response = await this.fetchFn(
      `${this.baseUrl}${this.endpoint === 'responses' ? '/responses' : '/chat/completions'}`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
          ...this.headers
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorBody = await readErrorBody(response);
      throw new Error(`Model request failed with ${response.status}: ${errorBody || response.statusText}`);
    }

    const payload = (await response.json()) as unknown;
    const text =
      this.endpoint === 'responses'
        ? extractResponseText(payload)
        : extractResponseText(payload) ||
          (() => {
            if (!payload || typeof payload !== 'object') {
              return '';
            }
            const record = payload as Record<string, unknown>;
            const choices = Array.isArray(record.choices) ? record.choices : [];
            const message = choices[0] && typeof choices[0] === 'object' ? (choices[0] as Record<string, unknown>).message : undefined;
            if (message && typeof message === 'object') {
              const messageRecord = message as Record<string, unknown>;
              if (typeof messageRecord.content === 'string') {
                return messageRecord.content;
              }
            }
            return '';
          })();

    return parseJsonText(text);
  }
}

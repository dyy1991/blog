// 博客侧工厂:按环境变量构建 NovelService 单例
//
// 基础模型(两类操作的默认):
//   NOVEL_LLM_BASE_URL   OpenAI 兼容端点(如 https://api.siliconflow.cn/v1)
//   NOVEL_LLM_API_KEY    密钥
//   NOVEL_LLM_MODEL      模型名
//   NOVEL_LLM_ENDPOINT   'responses' | 'chat_completions'(默认 chat_completions)
//
// 可选按操作覆盖(对应 MCP 的 routing: plan=框架规划, write=场景/对白草稿):
//   NOVEL_LLM_PLAN_MODEL / NOVEL_LLM_PLAN_BASE_URL / NOVEL_LLM_PLAN_API_KEY / NOVEL_LLM_PLAN_ENDPOINT
//   NOVEL_LLM_WRITE_MODEL / NOVEL_LLM_WRITE_BASE_URL / NOVEL_LLM_WRITE_API_KEY / NOVEL_LLM_WRITE_ENDPOINT
//   未设置的字段回退到基础配置;只设 *_MODEL 即可用同一端点跑不同模型
//
// 基础三项都缺失且没有任何覆盖时,回退到内置 heuristic planner(不调模型)。
//
//   NOVEL_DATA_DIR       数据目录(默认 ./data/novel,生产为 /data/novel)
import path from 'node:path';
import { ProjectRepository } from './project-repository';
import { NovelService } from './novel-service';
import { HeuristicPlannerAdapter } from './heuristic-planner-adapter';
import { RoutedModelPlannerAdapter } from './routed-model-planner-adapter';
import { OpenAICompatibleLanguageModelClient, type PlannerEndpoint } from './openai-compatible-client';
import type { LanguageModelClient, PlannerAdapter } from './planner-types';

interface ClientEnvConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

function readClientEnv(prefix: 'PLAN' | 'WRITE' | ''): ClientEnvConfig {
  const p = prefix ? `NOVEL_LLM_${prefix}_` : 'NOVEL_LLM_';
  return {
    baseUrl: process.env[`${p}BASE_URL`] || undefined,
    apiKey: process.env[`${p}API_KEY`] || undefined,
    model: process.env[`${p}MODEL`] || undefined,
    endpoint: process.env[`${p}ENDPOINT`] || undefined
  };
}

function toEndpoint(value: string | undefined): PlannerEndpoint {
  return value === 'responses' ? 'responses' : 'chat_completions';
}

function buildClient(config: ClientEnvConfig, base: ClientEnvConfig): LanguageModelClient | null {
  const baseUrl = config.baseUrl ?? base.baseUrl;
  const apiKey = config.apiKey ?? base.apiKey;
  const model = config.model ?? base.model;
  if (!baseUrl || !apiKey || !model) {
    return null;
  }
  return new OpenAICompatibleLanguageModelClient({
    baseUrl,
    apiKey,
    model,
    endpoint: toEndpoint(config.endpoint ?? base.endpoint)
  });
}

function buildPlanner(): PlannerAdapter {
  const base = readClientEnv('');
  const planOverride = readClientEnv('PLAN');
  const writeOverride = readClientEnv('WRITE');

  const clients: Record<string, LanguageModelClient> = {};
  const defaultClient = buildClient({}, base);
  if (defaultClient) {
    clients.default = defaultClient;
  }
  const planClient = buildClient(planOverride, base);
  if (planClient && (planOverride.baseUrl || planOverride.apiKey || planOverride.model || planOverride.endpoint)) {
    clients.plan = planClient;
  }
  const writeClient = buildClient(writeOverride, base);
  if (writeClient && (writeOverride.baseUrl || writeOverride.apiKey || writeOverride.model || writeOverride.endpoint)) {
    clients.write = writeClient;
  }

  const clientIds = Object.keys(clients);
  if (clientIds.length === 0) {
    return new HeuristicPlannerAdapter();
  }

  return new RoutedModelPlannerAdapter({
    clients,
    defaultClient: clients.default ? 'default' : clientIds[0],
    routing: {
      plan: clients.plan ? 'plan' : undefined,
      write: clients.write ? 'write' : undefined
    }
  });
}

interface NovelRuntime {
  repository: ProjectRepository;
  service: NovelService;
}

declare global {
  var __novelRuntime: NovelRuntime | undefined;
}

export function getNovelService(): NovelService {
  if (!globalThis.__novelRuntime) {
    const dataDir = path.resolve(process.env.NOVEL_DATA_DIR ?? path.join(process.cwd(), 'data', 'novel'));
    const repository = new ProjectRepository({ dataDir });
    globalThis.__novelRuntime = {
      repository,
      service: new NovelService({ repository, planner: buildPlanner() })
    };
  }
  return globalThis.__novelRuntime.service;
}

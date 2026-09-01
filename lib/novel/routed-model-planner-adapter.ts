// Ported from novel-graph-agent src/planner/routed-model-planner-adapter.ts
import { ModelPlannerAdapter } from './model-planner-adapter';
import type { LanguageModelClient, PlannerAdapter, PlannerDraftRequest, PlannerPlanRequest } from './planner-types';
import type { ToolResult } from './story-types';

export interface RoutedModelPlannerAdapterOptions {
  clients: Record<string, LanguageModelClient>;
  defaultClient: string;
  routing?: Partial<Record<'plan' | 'write', string>>;
  systemPrompt?: string;
}

export class RoutedModelPlannerAdapter implements PlannerAdapter {
  private readonly adapters: Record<string, ModelPlannerAdapter>;
  private readonly defaultClient: string;
  private readonly routing: Partial<Record<'plan' | 'write', string>>;

  constructor(options: RoutedModelPlannerAdapterOptions) {
    this.defaultClient = options.defaultClient;
    this.routing = options.routing ?? {};
    this.adapters = Object.fromEntries(
      Object.entries(options.clients).map(([clientId, client]) => [
        clientId,
        new ModelPlannerAdapter({
          client,
          systemPrompt: options.systemPrompt
        })
      ])
    );
  }

  private adapterFor(operation: 'plan' | 'write'): ModelPlannerAdapter {
    const routedClient = this.routing[operation] ?? this.defaultClient;
    const adapter = this.adapters[routedClient] ?? this.adapters[this.defaultClient];
    if (!adapter) {
      throw new Error(`Planner model client not found: ${routedClient}`);
    }
    return adapter;
  }

  planNext(request: PlannerPlanRequest): Promise<ToolResult> {
    return this.adapterFor('plan').planNext(request);
  }

  writeDraft(request: PlannerDraftRequest): Promise<ToolResult> {
    return this.adapterFor('write').writeDraft(request);
  }
}

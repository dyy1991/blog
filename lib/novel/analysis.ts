// Ported from novel-graph-agent src/core/analysis.ts
import crypto from 'node:crypto';
import { GraphDeltaSchema, ToolResultSchema, type ToolResult } from './story-types';

export interface AnalyzeIntakeInput {
  projectId: string;
  branchId: string;
  text: string;
}

interface IntakeSignals {
  headings: string[];
  bullets: string[];
  labels: string[];
  paragraphs: string[];
}

function createRevisionId(projectId: string, branchId: string, text: string): string {
  const digest = crypto
    .createHash('sha256')
    .update(projectId)
    .update('\n')
    .update(branchId)
    .update('\n')
    .update(text.trim())
    .digest('hex');
  return `intake_${digest.slice(0, 12)}`;
}

function emptyGraphDelta(summary: string) {
  return GraphDeltaSchema.parse({
    summary,
    nodes_added: [],
    nodes_updated: [],
    nodes_retired: [],
    edges_added: [],
    edges_updated: [],
    edges_retired: [],
    branches_added: [],
    revisions_created: []
  });
}

function splitIntake(text: string): IntakeSignals {
  const headings: string[] = [];
  const bullets: string[] = [];
  const labels: string[] = [];
  const paragraphs: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      headings.push(line.replace(/^#{1,6}\s+/, ''));
      continue;
    }

    if (/^(?:[-*+]\s+|\d+[.)]\s+)/.test(line)) {
      bullets.push(line.replace(/^(?:[-*+]\s+|\d+[.)]\s+)/, ''));
      continue;
    }

    const labelMatch = line.match(
      /^(世界观|设定|背景|角色|人物|主线|剧情|分支|章节|场景|冲突|目标|主题|世界|人物关系|关系网|worldview|setting|background|characters|plot|branch|chapter|scene|conflict|goal|theme)\s*[：:-]\s*(.+)$/i
    );
    if (labelMatch) {
      labels.push(labelMatch[1]);
      const remainder = labelMatch[2].trim();
      if (remainder) {
        paragraphs.push(remainder);
      }
      continue;
    }

    paragraphs.push(line);
  }

  return { headings, bullets, labels, paragraphs };
}

function containsChinese(text: string): boolean {
  return /[一-鿿]/.test(text);
}

function chooseNextQuestion(text: string, signals: IntakeSignals): string {
  const chinese = containsChinese(text);
  const hasCharacterSignal = /角色|人物|主角|protagonist|character|hero|mc/i.test(text);
  const hasConflictSignal = /冲突|危机|阻碍|目标|goal|conflict|obstacle|problem|want|need|must/i.test(text);
  const hasSettingSignal = /世界观|设定|背景|world|setting|city|kingdom|realm|town|harbor|planet|engine|ancient/i.test(text);

  if (chinese) {
    if (hasSettingSignal && !hasCharacterSignal) {
      return '这个世界里，谁会站在故事中心，TA想要什么？';
    }
    if (hasCharacterSignal && !hasConflictSignal) {
      return '主角最想要什么，最大的阻碍是什么？';
    }
    if (signals.labels.length > 0) {
      return '还缺哪一块最关键的信息：主角、冲突，还是结局走向？';
    }
    return '先补一个最关键的问题：主角是谁，TA面临什么冲突？';
  }

  if (hasSettingSignal && !hasCharacterSignal) {
    return 'Who is the story centered on, and what do they want?';
  }
  if (hasCharacterSignal && !hasConflictSignal) {
    return 'What is the protagonist trying to achieve, and what blocks them?';
  }
  if (signals.labels.length > 0) {
    return 'What is the one missing piece: protagonist, conflict, or ending?';
  }
  return 'Who is the protagonist, and what is the central conflict?';
}

function buildSummary(signals: IntakeSignals): string {
  const parts: string[] = [];
  if (signals.labels.length > 0) {
    parts.push(`labels: ${signals.labels.join(', ')}`);
  }
  if (signals.headings.length > 0) {
    parts.push(`${signals.headings.length} heading(s)`);
  }
  if (signals.bullets.length > 0) {
    parts.push(`${signals.bullets.length} bullet(s)`);
  }
  if (signals.paragraphs.length > 0 && parts.length === 0) {
    parts.push(`${signals.paragraphs.length} paragraph(s)`);
  }
  return parts.length > 0 ? `Parsed intake (${parts.join('; ')}).` : 'Parsed intake.';
}

function isUnderSpecified(text: string, signals: IntakeSignals): boolean {
  const trimmed = text.trim();
  const wordCount = trimmed
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean).length;
  const structureScore = signals.headings.length + signals.bullets.length + signals.labels.length;

  return wordCount < 12 || (structureScore === 0 && trimmed.length < 80);
}

export function analyzeIntake(input: AnalyzeIntakeInput): ToolResult {
  const text = input.text.trim();
  const signals = splitIntake(text);
  const revisionId = createRevisionId(input.projectId, input.branchId, text);
  const underSpecified = isUnderSpecified(text, signals);

  const result = {
    project_id: input.projectId,
    branch_id: input.branchId,
    revision_id: revisionId,
    status: underSpecified ? 'needs_question' : 'ok',
    summary: underSpecified
      ? 'Need one clarifying answer before expanding the framework.'
      : buildSummary(signals),
    graph_delta: emptyGraphDelta(
      underSpecified ? 'Awaiting one clarifying answer.' : 'Intake parsed without graph changes.'
    ),
    next_question: underSpecified ? chooseNextQuestion(text, signals) : null,
    draft: null,
    exports: {},
    warnings: underSpecified && signals.paragraphs.length > 0 ? ['Text is still too open-ended for synthesis.'] : []
  };

  return ToolResultSchema.parse(result);
}

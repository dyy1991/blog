// Ported from novel-graph-agent src/core/paths.ts
import path from 'node:path';

export function projectDir(dataDir: string, projectId: string): string {
  return path.join(dataDir, 'projects', projectId);
}

export function projectStatePath(dataDir: string, projectId: string): string {
  return path.join(projectDir(dataDir, projectId), 'state.json');
}

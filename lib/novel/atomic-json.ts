// Ported from novel-graph-agent src/core/atomic-json.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

export async function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return schema.parse(JSON.parse(raw));
}

export async function writeJsonFileAtomic(filePath: string, value: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const payload = `${JSON.stringify(value, null, 2)}\n`;
  await fs.writeFile(tempPath, payload, 'utf8');
  await fs.rename(tempPath, filePath);
}

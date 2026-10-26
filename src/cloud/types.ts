import { z } from 'zod';

// Avoid eval probes/code generation under the app's strict script policy.
z.config({ jitless: true });

const count = z.number().int().min(0).max(1_000_000_000);
const progressKey = z.string().min(1).max(2000).refine(key => !['__proto__', 'constructor', 'prototype'].includes(key));
const record = <T extends z.ZodType>(value: T) => z.record(progressKey, value).refine(rows => Object.keys(rows).length <= 2048);
export const progressSchema = z.object({
  conVat: z.string().min(1).max(20),
  muc: record(z.object({ b: count.min(1).max(5), d: count, s: count, h: count, pb: count.min(1).max(5).optional() })),
  am: record(count.max(9)),
  loi: record(count),
  loiCT: z.array(z.object({d:z.string().max(2000),c:z.string().max(2000),l:z.string().max(2000),n:z.string().max(2000)})).max(40),
  phut: record(z.number().finite().min(0).max(1440)),
  daDoc: record(count),
  docTheo: count,
  lanGui: z.string().max(32).optional(),
}).refine(progress => new TextEncoder().encode(JSON.stringify(progress)).byteLength <= 262144);
export type StudentProgress = z.infer<typeof progressSchema>;
export interface LegacyStore {
  caiDat: { baiToi?: number; hsCuoi?: string; [key: string]: unknown };
  hs: Record<string, StudentProgress>;
}
export interface LearningEvent {
  localCode: string;
  lesson: number;
  activity: string;
  item: string;
  correct: boolean | null;
  occurredAt: string;
}
export interface QueuedEvent extends LearningEvent {
  id: string;
  ownerId: string | null;
  synced: number;
}
export interface StudentBinding {
  localCode: string;
  ownerId: string;
  studentId: string;
  revision: number;
  lastSnapshot?: string;
}
export interface GameBridge {
  snapshot(): LegacyStore;
  selectedCode(): string;
  restoreStudent(code: string, progress: StudentProgress, lesson: number): void;
  selectStudent(code: string, lesson: number, displayCode?: string): void;
  setLesson(code: string, lesson: number): void;
  setEntryMode(mode: 'guest' | 'student'): void;
  exportProgress(): void;
  importGuestProgress(): void;
  openTeacherTool(tool: 'co' | 'tivi'): void;
  closeDialogs(): void;
  currentLesson(code: string): number;
}

export const deviceResponseSchema = z.object({
  student_id: z.uuid(), local_code: z.string(), avatar: z.string(), class_name: z.string(),
  lesson: z.number().int().min(1).max(50), status: z.enum(['pending', 'approved']),
  check_code: z.string(), device_token: z.string().optional(),
  revision: z.number().int().nonnegative().optional(), progress: progressSchema.optional(),
});
export interface StudentDevice {
  localCode: string;
  studentId: string;
  remoteCode: string;
  token: string;
  avatar: string;
  className: string;
  lesson: number;
  status: 'pending' | 'approved';
  checkCode: string;
  revision: number;
  lastSnapshot: string;
  lastSync?: string;
  lastLesson?: number;
  codeHash?: string;
}

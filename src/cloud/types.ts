import { z } from 'zod';

const count = z.number().finite().nonnegative();
export const progressSchema = z.looseObject({
  conVat: z.string().max(20),
  muc: z.record(z.string(), z.looseObject({ b: count.max(5), d: count, s: count, h: count })),
  am: z.record(z.string(), count),
  loi: z.record(z.string(), count),
  loiCT: z.array(z.unknown()),
  phut: z.record(z.string(), count),
  daDoc: z.record(z.string(), count),
  docTheo: count,
});
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
}

export const classLookupSchema = z.object({
  name: z.string(), lesson: z.number().int().min(1).max(50),
  students: z.array(z.object({ id: z.uuid(), local_code: z.string(), avatar: z.string() })),
});
export type ClassLookup = z.infer<typeof classLookupSchema>;
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
}

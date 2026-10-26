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
}

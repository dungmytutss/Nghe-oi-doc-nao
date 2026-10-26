import type { GameBridge, LearningEvent, LegacyStore } from '../cloud/types';
export function initializeGame(callbacks?: {
  onSave?: (store: LegacyStore) => void;
  onLearningEvent?: (event: LearningEvent) => void;
  onStudentChange?: (code: string) => void;
  onTeacherOpen?: () => void;
}): GameBridge;

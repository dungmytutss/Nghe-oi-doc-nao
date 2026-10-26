import { backupBeforeRestore, emptyProgress, localDb } from './local';
import type { GameBridge } from './types';

export const GUEST_PROFILE = 'KHACH';

export async function prepareGuest(game: GameBridge, stillActive: () => boolean = () => true) {
  const store = game.snapshot();
  if (!store.hs[GUEST_PROFILE]) {
    const remembered = await localDb.devices.toArray();
    const oldCode = store.caiDat.hsCuoi;
    const legacy = oldCode && !remembered.some(device => device.localCode === oldCode) ? store.hs[oldCode] : undefined;
    await backupBeforeRestore(store);
    if (!stillActive()) return;
    game.restoreStudent(GUEST_PROFILE, legacy || emptyProgress('🐰'), legacy ? store.caiDat.baiToi || 1 : 1);
  }
  if (!stillActive()) return;
  if (game.selectedCode() !== GUEST_PROFILE || game.snapshot().caiDat.entryMode !== 'guest') {
    game.setEntryMode('guest');
    game.selectStudent(GUEST_PROFILE, game.currentLesson(GUEST_PROFILE), 'Khách');
  }
}

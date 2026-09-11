import { create } from 'zustand';

export type ArchivePane = 'log' | 'inbox';

type State = {
  pane: ArchivePane;
  albumReplay: number;
  shoot: (() => void) | null;
  shooting: boolean;
  setPane: (pane: ArchivePane) => void;
  bumpAlbumReplay: () => void;
  registerShoot: (fn: (() => void) | null) => void;
  setShooting: (shooting: boolean) => void;
};

export const useDock = create<State>((set) => ({
  pane: 'log',
  albumReplay: 0,
  shoot: null,
  shooting: false,
  setPane: (pane) => set({ pane }),
  bumpAlbumReplay: () => set((s) => ({ albumReplay: s.albumReplay + 1 })),
  registerShoot: (fn) => set({ shoot: fn }),
  setShooting: (shooting) => set({ shooting }),
}));

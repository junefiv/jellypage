import { create } from 'zustand';

export type ArchivePane = 'log' | 'inbox';

type State = {
  pane: ArchivePane;
  shoot: (() => void) | null;
  shooting: boolean;
  setPane: (pane: ArchivePane) => void;
  registerShoot: (fn: (() => void) | null) => void;
  setShooting: (shooting: boolean) => void;
};

export const useDock = create<State>((set) => ({
  pane: 'log',
  shoot: null,
  shooting: false,
  setPane: (pane) => set({ pane }),
  registerShoot: (fn) => set({ shoot: fn }),
  setShooting: (shooting) => set({ shooting }),
}));

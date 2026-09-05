import { create } from 'zustand';

import type { TakeSource } from '@/src/lib/database.types';
import type { PaletteColor } from '@/src/palette/types';

export type DraftTake = {
  localUri: string | null;
  palette: PaletteColor[];
  city: string | null;
  capturedAt: string;
  source: TakeSource;
  fail: boolean;
};

type State = {
  draft: DraftTake | null;
  setDraft: (draft: DraftTake | null) => void;
};

export const useDraft = create<State>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
}));

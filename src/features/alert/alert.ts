import { create } from 'zustand';

import type { AlertKind } from '@/src/theme/tokens';

type State = {
  message: string | null;
  tone: AlertKind;
  token: number;
  show: (message: string, tone?: AlertKind) => void;
  hide: () => void;
};

export const useAlert = create<State>((set, get) => ({
  message: null,
  tone: 'info',
  token: 0,
  show: (message, tone = 'info') => set({ message, tone, token: get().token + 1 }),
  hide: () => set({ message: null }),
}));

export function showAlert(message: string, tone: AlertKind = 'info') {
  useAlert.getState().show(message, tone);
}

import type { DOMProps } from 'expo/dom';

export const jellyDom = (extra?: Partial<DOMProps>): { dom: DOMProps } => ({
  dom: {
    matchContents: true,
    scrollEnabled: false,
    style: { backgroundColor: 'transparent' },
    ...extra,
  },
});

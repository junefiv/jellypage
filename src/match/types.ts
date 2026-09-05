import type { PaletteColor } from '@/src/palette/types';

export type MatchBand = 'open' | 'close';

export type MatchRow = {
  rank: number;
  band: MatchBand;
  score: number;
  delta: number;
  target: {
    id: string;
    owner_id: string;
    handle: string;
    city: string | null;
    captured_at: string;
    palette: PaletteColor[];
    blur_path: string | null;
  } | null;
};

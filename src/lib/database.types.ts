import type { PaletteColor } from '@/src/palette/types';

export type TakeStatus = 'ready' | 'processing' | 'failed' | 'deleted';
export type MatchStatus = 'idle' | 'pending' | 'ready' | 'empty' | 'failed';
export type TakeSource = 'capture' | 'library' | 'palette_copy' | 'raw';

export type Profile = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  default_match_public: boolean;
  created_at: string;
};

export type Take = {
  id: string;
  owner_id: string;
  seq: number;
  captured_at: string;
  city: string | null;
  palette: PaletteColor[];
  palette_vec: number[] | null;
  original_path: string | null;
  blur_path: string | null;
  match_public: boolean;
  face_hold: boolean;
  source: TakeSource;
  status: TakeStatus;
  match_status: MatchStatus;
  created_at: string;
};

export type TakePublic = {
  id: string;
  owner_id: string;
  seq: number;
  captured_at: string;
  city: string | null;
  palette: PaletteColor[];
  blur_path: string | null;
  match_public: boolean;
  status: TakeStatus;
  created_at: string;
  handle: string;
};

export type TakeMatch = {
  id: string;
  source_take_id: string;
  target_take_id: string;
  band: 'open' | 'close';
  rank: number;
  score: number;
  delta: number;
};

export type Follow = {
  follower_id: string;
  followee_id: string;
  created_at: string;
};

export type DmThread = {
  id: string;
  user_a: string;
  user_b: string;
  opened_by: string;
  opened_at: string;
};

export type DmMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  attached_take_id: string | null;
  created_at: string;
};

export type DmUnlock = {
  id: string;
  payer_id: string;
  peer_id: string;
  amount_krw: number;
  store: 'apple' | 'google';
  product_id: string;
  store_tx_id: string | null;
  status: 'pending' | 'paid' | 'refunded' | 'failed';
  created_at: string;
};

export type CanSend = {
  ok: boolean;
  reason: 'ok' | 'needs_unlock' | 'no_follow' | 'blocked' | 'refunded' | 'AUTH' | 'SELF';
  thread_id?: string | null;
};

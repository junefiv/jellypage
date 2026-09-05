import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { Profile } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';

type State = {
  session: Session | null;
  profile: Profile | null;
  ready: boolean;
  hydrate: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSession = create<State>((set, get) => ({
  session: null,
  profile: null,
  ready: false,
  hydrate: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, ready: true });
    if (data.session) await get().refreshProfile();
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session) await get().refreshProfile();
      else set({ profile: null });
    });
  },
  refreshProfile: async () => {
    const uid = get().session?.user.id;
    if (!uid) {
      set({ profile: null });
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (!data) {
      await supabase.functions.invoke('handle_new_user', { body: { user_id: uid } });
      const again = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      set({ profile: (again.data as Profile | null) ?? null });
      return;
    }
    set({ profile: data as Profile });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));

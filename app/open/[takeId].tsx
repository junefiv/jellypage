import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { ChipStrip } from '@/src/components/ui/ChipStrip';
import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { Tap } from '@/src/components/ui/Tap';
import { useSession } from '@/src/features/auth/session';
import { openThread } from '@/src/features/dm/api';
import { follow, isFollowing, unfollow } from '@/src/features/follow/api';
import { copyPalette } from '@/src/features/take/api';
import { supabase } from '@/src/lib/supabase';
import { formatDelta } from '@/src/lib/format';
import { publicBlur } from '@/src/features/take/api';
import { colors, copy } from '@/src/theme/tokens';

export default function OpenDetail() {
  const { takeId } = useLocalSearchParams<{ takeId: string }>();
  const session = useSession((s) => s.session);
  const [busy, setBusy] = useState(false);

  function requireAuth() {
    if (session) return true;
    router.push('/(auth)');
    return false;
  }

  const takeQ = useQuery({
    queryKey: ['public-take', takeId],
    queryFn: async () => {
      const { data } = await supabase.from('takes_public').select('*').eq('id', takeId).maybeSingle();
      return data;
    },
    enabled: Boolean(takeId),
  });

  const followQ = useQuery({
    queryKey: ['following', takeQ.data?.owner_id],
    queryFn: () => isFollowing(takeQ.data!.owner_id),
    enabled: Boolean(takeQ.data?.owner_id),
  });

  const take = takeQ.data;
  if (!take) {
    return (
      <Screen>
        <View style={{ padding: 16 }}>
          <MonoText dim>…</MonoText>
        </View>
      </Screen>
    );
  }

  const blur = publicBlur(take.blur_path);

  return (
    <Screen>
      <View style={{ padding: 16, gap: 12 }}>
        <View
          style={{
            backgroundColor: colors.paper,
            padding: 10,
            paddingBottom: 16,
            shadowColor: '#000',
            shadowOpacity: 0.45,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          {blur ? (
            <Image source={{ uri: blur }} style={{ width: '100%', height: 260 }} contentFit="cover" />
          ) : (
            <View style={{ height: 120, backgroundColor: colors.line }} />
          )}
        </View>
        <ChipStrip colors={take.palette ?? []} />
        <MonoText dim>{formatDelta(0)}</MonoText>
        <MonoText>@{take.handle}</MonoText>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tap
            label={followQ.data ? copy.following : copy.follow}
            onPress={async () => {
              if (!requireAuth()) return;
              if (followQ.data) await unfollow(take.owner_id);
              else await follow(take.owner_id);
              await followQ.refetch();
            }}
          />
          {followQ.data ? (
            <Tap
              label={copy.dm}
              onPress={async () => {
                const tid = await openThread(take.owner_id);
                router.push(`/dm/${tid}?peer=${take.owner_id}`);
              }}
            />
          ) : null}
        </View>
        <Tap
          label={busy ? '…' : copy.copyPalette}
          onPress={async () => {
            if (!requireAuth()) return;
            setBusy(true);
            try {
              const created = await copyPalette(take.id);
              router.push(`/take/${created.id}`);
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
    </Screen>
  );
}

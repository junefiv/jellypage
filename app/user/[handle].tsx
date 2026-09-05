import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { ChipStrip } from '@/src/components/ui/ChipStrip';
import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { Tap } from '@/src/components/ui/Tap';
import { openThread } from '@/src/features/dm/api';
import { follow, isFollowing, unfollow } from '@/src/features/follow/api';
import { getProfileByHandle, listPublicTakes } from '@/src/features/profile/api';
import { publicBlur } from '@/src/features/take/api';
import { colors, copy } from '@/src/theme/tokens';

export default function UserProfile() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const profileQ = useQuery({
    queryKey: ['profile', handle],
    queryFn: () => getProfileByHandle(handle),
    enabled: Boolean(handle),
  });
  const takesQ = useQuery({
    queryKey: ['public-takes', profileQ.data?.id],
    queryFn: () => listPublicTakes(profileQ.data!.id),
    enabled: Boolean(profileQ.data?.id),
  });
  const followQ = useQuery({
    queryKey: ['following', profileQ.data?.id],
    queryFn: () => isFollowing(profileQ.data!.id),
    enabled: Boolean(profileQ.data?.id),
  });

  const profile = profileQ.data;
  const latest = takesQ.data?.[0];

  if (!profile) {
    return (
      <Screen>
        <View style={{ padding: 16 }}>
          <MonoText dim>…</MonoText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <MonoText size={18}>@{profile.handle}</MonoText>
        {latest ? <ChipStrip colors={latest.palette} /> : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tap
            label={followQ.data ? copy.following : copy.follow}
            onPress={async () => {
              if (followQ.data) await unfollow(profile.id);
              else await follow(profile.id);
              await followQ.refetch();
            }}
          />
          {followQ.data ? (
            <Tap
              label={copy.dm}
              onPress={async () => {
                const tid = await openThread(profile.id);
                router.push(`/dm/${tid}?peer=${profile.id}`);
              }}
            />
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(takesQ.data ?? []).map((t) => {
            const blur = publicBlur(t.blur_path);
            return (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/open/${t.id}`)}
                style={{ width: '31%' }}
              >
                <View
                  style={{
                    backgroundColor: colors.paper,
                    padding: 4,
                    paddingBottom: 8,
                    shadowColor: '#000',
                    shadowOpacity: 0.35,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 3,
                  }}
                >
                  {blur ? (
                    <Image source={{ uri: blur }} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" />
                  ) : (
                    <View style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.line }} />
                  )}
                </View>
                <ChipStrip colors={t.palette} height={8} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

import { router } from 'expo-router';
import { Switch, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { ChipStrip } from '@/src/components/ui/ChipStrip';
import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { Tap } from '@/src/components/ui/Tap';
import { Well } from '@/src/components/ui/Well';
import { useSession } from '@/src/features/auth/session';
import { listBlocks, listFollowing } from '@/src/features/follow/api';
import { updateDefaultMatchPublic } from '@/src/features/profile/api';
import { listMyTakes } from '@/src/features/take/api';
import { restorePurchaseCheck } from '@/src/lib/iap';
import { msg } from '@/src/lib/messages';
import { colors, copy } from '@/src/theme/tokens';

export default function MeScreen() {
  const session = useSession((s) => s.session);
  const profile = useSession((s) => s.profile);
  const refreshProfile = useSession((s) => s.refreshProfile);
  const signOut = useSession((s) => s.signOut);

  const takesQ = useQuery({
    queryKey: ['takes'],
    queryFn: () => listMyTakes(),
    enabled: Boolean(session),
  });
  const followQ = useQuery({
    queryKey: ['following-list'],
    queryFn: listFollowing,
    enabled: Boolean(session),
  });
  const blockQ = useQuery({
    queryKey: ['blocks'],
    queryFn: listBlocks,
    enabled: Boolean(session),
  });
  const iapQ = useQuery({
    queryKey: ['iap-paid'],
    queryFn: restorePurchaseCheck,
    enabled: Boolean(session),
  });

  const latest = takesQ.data?.[0];

  if (!session) {
    return (
      <Screen>
        <View style={{ padding: 16 }}>
          <Tap label={copy.back} role="back" onPress={() => router.back()} />
        </View>
        <View style={{ padding: 24 }}>
          <Tap label="AUTH" onPress={() => router.push('/(auth)')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ padding: 16, gap: 14 }}>
        <Tap label={copy.back} role="back" onPress={() => router.back()} />
        <Well>
          <MonoText size={18}>@{profile?.handle ?? '—'}</MonoText>
          {latest ? <ChipStrip colors={latest.palette} /> : null}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <MonoText>{msg.matchPublic}</MonoText>
            <Switch
              value={profile?.default_match_public ?? true}
              onValueChange={async (v) => {
                await updateDefaultMatchPublic(v);
                await refreshProfile();
              }}
              trackColor={{ false: colors.line, true: colors.fg }}
            />
          </View>
          <MonoText dim style={{ marginTop: 10 }}>
            {msg.following(followQ.data?.length ?? 0)}
          </MonoText>
          <MonoText dim>{msg.block(blockQ.data?.length ?? 0)}</MonoText>
        </Well>
        <Tap label={`IAP  ${iapQ.data?.paid ?? 0}`} onPress={() => void iapQ.refetch()} />
        <Tap label="OUT" dim onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { TakeFrame } from '@/src/components/ui/TakeFrame';
import { Tap } from '@/src/components/ui/Tap';
import { showAlert } from '@/src/features/alert/alert';
import { useSession } from '@/src/features/auth/session';
import { deleteLocalTake, getLocalTake } from '@/src/features/take/local-album';
import { formatClock, formatTake } from '@/src/lib/format';
import { msg } from '@/src/lib/messages';
import { queryClient } from '@/src/lib/query';

export default function LocalTakeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession((state) => state.session);
  const takeQ = useQuery({
    queryKey: ['local-take', id],
    queryFn: () => getLocalTake(id),
    enabled: Boolean(id),
  });
  const take = takeQ.data;

  useEffect(() => {
    if (!take) return;
    showAlert(session ? msg.syncingAccount : msg.signInColorMatch);
  }, [session, take]);

  if (!take) {
    return (
      <Screen>
        <View style={{ padding: 24 }}>
          <MonoText dim>…</MonoText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: 16, gap: 12 }}>
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
          <MonoText>{formatTake(take.seq)}</MonoText>
          <MonoText dim>{msg.local}</MonoText>
        </View>
        <TakeFrame
          photoUri={take.photoUri}
          capturedAt={take.capturedAt}
          geo={take.city}
          palette={take.palette}
          clock={formatClock(take.capturedAt)}
        />
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {!session ? (
            <Tap
              label="SIGN IN"
              onPress={() => router.push({ pathname: '/(auth)', params: { next: 'log' } })}
            />
          ) : null}
          <Tap label="BACK" role="back" onPress={() => router.replace('/(tabs)/log')} />
          <Tap
            label="DELETE TAKE"
            danger
            onPress={async () => {
              await deleteLocalTake(take.id);
              await queryClient.invalidateQueries({ queryKey: ['local-takes'] });
              router.replace('/(tabs)/log');
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}


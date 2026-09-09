import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { TakeFrame } from '@/src/components/ui/TakeFrame';
import { Tap } from '@/src/components/ui/Tap';
import { useSession } from '@/src/features/auth/session';
import { deleteLocalTake, getLocalTake } from '@/src/features/take/local-album';
import { formatClock, formatTake } from '@/src/lib/format';
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
          <MonoText dim>LOCAL</MonoText>
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
            <>
              <MonoText dim>SIGN IN TO FIND PHOTOS WITH SIMILAR COLORS</MonoText>
              <Tap
                label="SIGN IN"
                onPress={() => router.push({ pathname: '/(auth)', params: { next: 'log' } })}
              />
            </>
          ) : (
            <MonoText dim>SYNCING TO YOUR ACCOUNT</MonoText>
          )}
          <Tap label="BACK" onPress={() => router.replace('/(tabs)/log')} />
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


import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { ChipStrip } from '@/src/components/ui/ChipStrip';
import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { Well } from '@/src/components/ui/Well';
import { supabase } from '@/src/lib/supabase';
import { formatDelta } from '@/src/lib/format';
import { copy } from '@/src/theme/tokens';

export default function CloseDetail() {
  const { takeId, delta } = useLocalSearchParams<{ takeId: string; delta?: string }>();
  const takeQ = useQuery({
    queryKey: ['public-take', takeId],
    queryFn: async () => {
      const { data } = await supabase.from('takes_public').select('palette').eq('id', takeId).maybeSingle();
      return data;
    },
    enabled: Boolean(takeId),
  });

  return (
    <Screen>
      <View style={{ padding: 16, gap: 16 }}>
        <Well>
          <ChipStrip colors={takeQ.data?.palette ?? []} height={72} />
          <MonoText style={{ marginTop: 12 }}>{copy.closeMatch}</MonoText>
          <MonoText dim>{formatDelta(Number(delta ?? 0))}</MonoText>
          <MonoText dim>{copy.unlockSoon}</MonoText>
        </Well>
      </View>
    </Screen>
  );
}

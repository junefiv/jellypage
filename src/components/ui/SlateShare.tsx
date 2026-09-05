import { View } from 'react-native';

import { MonoText } from './MonoText';
import { TakeFrame } from './TakeFrame';
import { formatTake } from '@/src/lib/format';
import type { PaletteColor } from '@/src/palette/types';
import { colors } from '@/src/theme/tokens';

type Props = {
  seq: number;
  capturedAt: string;
  city: string | null;
  palette: PaletteColor[];
  photoUri: string | null;
};

export function SlateShare({ seq, capturedAt, city, palette, photoUri }: Props) {
  return (
    <View style={{ width: 360, backgroundColor: colors.bg, padding: 16 }}>
      <MonoText size={18}>{formatTake(seq)}</MonoText>
      <View style={{ marginTop: 12 }}>
        <TakeFrame photoUri={photoUri} capturedAt={capturedAt} geo={city} palette={palette} />
      </View>
    </View>
  );
}

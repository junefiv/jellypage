import { View } from 'react-native';

import type { PaletteColor } from '@/src/palette/types';
import { colors } from '@/src/theme/tokens';

type Props = {
  colors: PaletteColor[];
  height?: number;
};

export function PaletteBar({ colors: chips, height = 10 }: Props) {
  const ranked = [...chips].sort((a, b) => b.ratio - a.ratio).slice(0, 6);
  while (ranked.length < 6) {
    ranked.push({
      hex: colors.line,
      r: 28,
      g: 28,
      b: 28,
      l: 0,
      a: 0,
      lab_b: 0,
      ratio: 0,
    });
  }

  const pill = height / 2;

  return (
    <View style={{ flexDirection: 'row', gap: 3, height }}>
      {ranked.map((c, i) => (
        <View
          key={`${c.hex}-${i}`}
          style={{
            flex: 1,
            backgroundColor: c.hex,
            borderRadius: pill,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
          }}
        />
      ))}
    </View>
  );
}

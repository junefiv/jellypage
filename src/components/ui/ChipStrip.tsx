import { View } from 'react-native';

import type { PaletteColor } from '@/src/palette/types';
import { colors } from '@/src/theme/tokens';

type Props = {
  colors: PaletteColor[];
  height?: number;
};

export function ChipStrip({ colors: chips, height = 12 }: Props) {
  if (!chips.length) {
    return <View style={{ height, backgroundColor: colors.line }} />;
  }
  return (
    <View
      style={{
        flexDirection: 'row',
        height,
        overflow: 'hidden',
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.35)',
      }}
    >
      {chips.map((c, i) => (
        <View key={`${c.hex}-${i}`} style={{ flex: Math.max(c.ratio, 0.04) }}>
          <View style={{ flex: 1, backgroundColor: c.hex }} />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 2,
              backgroundColor: 'rgba(255,255,255,0.28)',
            }}
          />
        </View>
      ))}
    </View>
  );
}

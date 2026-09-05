import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { MonoText } from '@/src/components/ui/MonoText';
import { liftHex, luma, paintMark } from '@/src/components/ui/paintBlob';
import type { PaletteColor } from '@/src/palette/types';
import { colors } from '@/src/theme/tokens';

type Props = {
  colors: PaletteColor[];
  height?: number;
  ink?: string;
};

const VW = 80;
const VH = 92;

function rankPalette(chips: PaletteColor[]): PaletteColor[] {
  return [...chips].sort((a, b) => b.ratio - a.ratio).slice(0, 6);
}

export function PaletteRow({ colors: chips, height = 36, ink }: Props) {
  const ranked = rankPalette(chips);
  if (!ranked.length) {
    return <View style={{ height, backgroundColor: colors.line }} />;
  }

  const rows = [ranked.slice(0, 2), ranked.slice(2, 4), ranked.slice(4, 6)];

  return (
    <View style={{ gap: 8 }}>
      {rows.map((row, r) => (
        <View key={`row-${r}`} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {row.map((c, i) => (
            <View
              key={`${c.hex}-${r}-${i}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}
            >
              <View style={{ width: height, height }}>
                <PaintChip hex={c.hex} index={r * 2 + i} height={height} />
              </View>
              <MonoText
                size={16}
                numberOfLines={1}
                style={{ color: ink ?? colors.muted, flexShrink: 0 }}
              >
                {c.hex}
              </MonoText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function PaintChip({ hex, index, height }: { hex: string; index: number; height: number }) {
  const mark = paintMark(hex, index, VW, VH);
  const dark = luma(hex) < 30;

  return (
    <View style={{ width: '100%', height, overflow: 'hidden' }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${VW} ${VH}`}>
        <Path d={mark.smear} fill={hex} opacity={0.38} />
        <Path d={mark.body} fill={hex} />
        {dark ? (
          <Path
            d={mark.body}
            fill="none"
            stroke={colors.fg}
            strokeWidth={0.6}
            opacity={0.16}
          />
        ) : null}
        <Path d={mark.ridge} fill={liftHex(hex, 28)} opacity={0.24} />
      </Svg>
    </View>
  );
}

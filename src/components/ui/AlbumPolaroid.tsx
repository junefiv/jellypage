import { Image } from 'expo-image';
import { View } from 'react-native';

import { PaletteBar } from '@/src/components/ui/PaletteBar';
import type { PaletteColor } from '@/src/palette/types';
import { colors } from '@/src/theme/tokens';

export const POLAROID_W = 128;
const PAD = 8;
const PHOTO_W = POLAROID_W - PAD * 2;
const PHOTO_H = PHOTO_W * (86 / 62);
export const POLAROID_H = PAD + PHOTO_H + 6 + 10 + PAD;

type Props = {
  photoUri: string | null;
  palette: PaletteColor[];
  width?: number;
};

export function AlbumPolaroid({ photoUri, palette, width = POLAROID_W }: Props) {
  const scale = width / POLAROID_W;
  const pad = PAD * scale;
  const photoW = PHOTO_W * scale;
  const photoH = PHOTO_H * scale;
  const barH = Math.max(8, 10 * scale);

  return (
    <View style={{ width }}>
      <View
        style={{
          backgroundColor: colors.paper,
          padding: pad,
          borderWidth: 1,
          borderColor: colors.paperEdge,
        }}
      >
        <View
          style={{
            width: photoW,
            height: photoH,
            backgroundColor: colors.line,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : null}
        </View>
        <View style={{ marginTop: 6 * scale }}>
          <PaletteBar colors={palette} height={barH} />
        </View>
      </View>
    </View>
  );
}

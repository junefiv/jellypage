import { useEffect } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AlbumPolaroid, POLAROID_H, POLAROID_W } from '@/src/components/ui/AlbumPolaroid';
import { TakeFrame } from '@/src/components/ui/TakeFrame';
import { Tap } from '@/src/components/ui/Tap';
import { formatClock } from '@/src/lib/format';
import type { PaletteColor } from '@/src/palette/types';
import { copy } from '@/src/theme/tokens';

export type LiftSource = {
  x: number;
  y: number;
  width: number;
  height: number;
  rot: number;
};

type Props = {
  source: LiftSource;
  photoUri: string | null;
  palette: PaletteColor[];
  capturedAt: string;
  geo: string | null;
  onClose: () => void;
  onOpen: () => void;
};

const UP = 700;
const DOWN = 360;

export function AlbumLiftOverlay({
  source,
  photoUri,
  palette,
  capturedAt,
  geo,
  onClose,
  onOpen,
}: Props) {
  const { width: vw, height: vh } = Dimensions.get('window');
  const progress = useSharedValue(0);

  const dstW = vw - 56;
  const dstH = dstW * (86 / 62);
  const frameTop = vh * 0.12;
  const srcW = source.width || POLAROID_W;
  const srcCx = source.x + srcW / 2;
  const srcCy = source.y + (source.height || POLAROID_H) / 2;
  const dstCx = vw / 2;
  const dstCy = frameTop + dstH / 2;
  const startScale = srcW / dstW;
  const pivotX = srcCx - dstCx;
  const pivotY = srcCy - dstCy;

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: UP, easing: Easing.bezier(0.22, 0.8, 0.24, 1) });
  }, [progress]);

  const dimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.64]),
  }));

  const cardStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const scale = interpolate(p, [0, 1], [startScale, 1]);
    return {
      position: 'absolute' as const,
      left: dstCx - dstW / 2,
      top: dstCy - dstH / 2,
      width: dstW,
      height: dstH,
      transform: [
        { translateX: pivotX * (1 - scale) },
        { translateY: pivotY * (1 - scale) },
        { scale },
        { rotateZ: `${interpolate(p, [0, 1], [source.rot, 0])}deg` },
      ],
    };
  });

  const flipStyle = useAnimatedStyle(() => ({
    width: dstW,
    height: dstH,
    transform: [{ perspective: 900 }, { rotateY: `${interpolate(progress.value, [0, 1], [0, -180])}deg` }],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 0.5 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 0.5 ? 0 : 1,
  }));

  const paperVis = useAnimatedStyle(() => ({
    opacity: progress.value < 0.96 ? 1 : 0,
  }));

  const chromeStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 0.96 ? 0 : 1,
  }));

  const close = () => {
    progress.value = withTiming(0, { duration: DOWN, easing: Easing.bezier(0.55, 0.1, 0.68, 0.2) }, (done) => {
      if (done) runOnJS(onClose)();
    });
  };

  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100 }}>
      <Pressable style={{ flex: 1 }} onPress={close}>
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#000' }, dimStyle]}
        />
      </Pressable>

      <Animated.View pointerEvents="none" style={[cardStyle, paperVis]}>
        <Animated.View style={flipStyle} renderToHardwareTextureAndroid>
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                width: dstW,
                height: dstH,
                overflow: 'hidden',
              },
              frontStyle,
            ]}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center', width: dstW, height: dstH }}>
              <AlbumPolaroid photoUri={photoUri} palette={palette} width={dstW} />
            </View>
          </Animated.View>
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                width: dstW,
                height: dstH,
                overflow: 'hidden',
                transform: [{ rotateY: '180deg' }],
              },
              backStyle,
            ]}
          >
            <View style={{ width: vw, marginLeft: -28 }}>
              <TakeFrame
                photoUri={photoUri}
                capturedAt={capturedAt}
                geo={geo}
                palette={palette}
                clock={formatClock(capturedAt)}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[{ position: 'absolute', left: 0, right: 0, top: frameTop - 8 }, chromeStyle]}
        pointerEvents="box-none"
      >
        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <Tap label={copy.back} role="back" onPress={close} />
        </View>
        <TakeFrame
          photoUri={photoUri}
          capturedAt={capturedAt}
          geo={geo}
          palette={palette}
          clock={formatClock(capturedAt)}
        />
        <View style={{ paddingHorizontal: 28, marginTop: 14 }}>
          <Tap
            label="OPEN"
            onPress={() => {
              onOpen();
              onClose();
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

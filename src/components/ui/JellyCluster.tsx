import { LinearGradient } from 'expo-linear-gradient';
import Animated, { interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { View } from 'react-native';

type Props = {
  goo: SharedValue<number>;
  blob: SharedValue<number>;
  width: number;
  height: number;
};

const BODY = ['#FFFFFF', '#EEEEF2', '#D6D6DE'] as const;

export function JellyCluster({ goo, blob, width, height }: Props) {
  const s = width / 292;

  const centerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(goo.value, [0, 1], [0, 150 * s]) },
      { scaleX: 1 + interpolate(goo.value, [0, 0.5, 1], [0, 0.12, 0]) },
      { scaleY: 1 - interpolate(goo.value, [0, 0.5, 1], [0, 0.09, 0]) },
    ],
  }));

  const leftStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(blob.value, [0, 1], [1, 0.001]) },
      { scaleX: 1 + interpolate(blob.value, [0, 0.5, 1], [0, 0.06, 0]) },
    ],
  }));

  const rightStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(blob.value, [0, 1], [0.001, 1]) },
      { scaleX: 1 + interpolate(blob.value, [0, 0.5, 1], [0, 0.06, 0]) },
    ],
  }));

  const piece = (style: object, left: number, top: number, w: number, h: number, r: number) => (
    <Animated.View
      renderToHardwareTextureAndroid
      style={[{ position: 'absolute', left, top, width: w, height: h }, style]}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: w * 0.1,
          right: w * 0.1,
          bottom: -3,
          height: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(0,0,0,0.35)',
          opacity: 0.5,
        }}
      />
      <View style={{ flex: 1, borderRadius: r, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' }}>
        <LinearGradient colors={BODY} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ flex: 1 }}>
          <View
            style={{
              position: 'absolute',
              top: h * 0.12,
              left: w * 0.14,
              width: w * 0.38,
              height: h * 0.28,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.65)',
            }}
          />
        </LinearGradient>
      </View>
    </Animated.View>
  );

  return (
    <View pointerEvents="none" style={{ width, height }}>
      {piece(centerStyle, 13 * s, 42 * s, 116 * s, 58 * s, 29 * s)}
      {piece(leftStyle, 14 * s, 14 * s, 114 * s, 114 * s, 58 * s)}
      {piece(rightStyle, 164 * s, 14 * s, 114 * s, 114 * s, 58 * s)}
    </View>
  );
}

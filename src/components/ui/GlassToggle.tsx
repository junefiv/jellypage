import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { JellyCluster } from '@/src/components/ui/JellyCluster';
import { JELLY_SPRING, JELLY_WOBBLE } from '@/src/components/ui/jelly';
import { colors } from '@/src/theme/tokens';

export type DockSide = 'cam' | 'log';

export const TOGGLE_ROW_H = 42;

const W = 86;
const H = 42;
const VB_W = 292;
const VB_H = 142;
const S = W / VB_W;

const ICON_FILL = colors.ink;
const AnimatedPath = Animated.createAnimatedComponent(Path);
const ICON = 20;

const PEANUT =
  'M71 142C31.7878 142 0 110.212 0 71C0 31.7878 31.7878 0 71 0C110.212 0 119 30 146 30C173 30 182 0 221 0C260 0 292 31.7878 292 71C292 110.212 260.212 142 221 142C181.788 142 173 112 146 112C119 112 110.212 142 71 142Z';

const CAM_LENS =
  'M12 15.2C13.7674 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7674 8.79999 12 8.79999C10.2327 8.79999 8.80005 10.2327 8.80005 12C8.80005 13.7673 10.2327 15.2 12 15.2Z';
const CAM_BODY =
  'M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z';
const LOG_ROLL =
  'M14 5C14 3.9 13.1 3 12 3H11V2C11 1.45 10.55 1 10 1H6C5.45 1 5 1.45 5 2V3H4C2.9 3 2 3.9 2 5V20C2 21.1 2.9 22 4 22H12C13.1 22 14 21.1 14 20H22V5H14ZM12 18H10V16H12V18ZM12 9H10V7H12V9ZM16 18H14V16H16V18ZM16 9H14V7H16V9ZM20 18H18V16H20V18ZM20 9H18V7H20V9Z';

const BLOB_SPRING = { ...JELLY_WOBBLE, stiffness: 88 };
const TINT_SPRING = { damping: 12, stiffness: 175, mass: 0.65 };

type Props = {
  side: DockSide;
  tone: string;
  glow?: string;
  onChange: (side: DockSide) => void;
};

export function GlassToggle({ side, tone, onChange }: Props) {
  const [reduce, setReduce] = useState(false);
  const goo = useSharedValue(side === 'cam' ? 0 : 1);
  const blob = useSharedValue(side === 'cam' ? 0 : 1);
  const tint = useSharedValue(side === 'cam' ? 0 : 1);
  const fromTone = useSharedValue(tone);
  const toTone = useSharedValue(tone);
  const wash = useSharedValue(1);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    run(side === 'cam' ? 0 : 1, reduce);
  }, [side, reduce]);

  useEffect(() => {
    fromTone.value = toTone.value;
    toTone.value = tone;
    if (reduce) {
      wash.value = 1;
      return;
    }
    wash.value = 0;
    wash.value = withTiming(1, { duration: 400 });
  }, [tone, reduce, fromTone, toTone, wash]);

  const camStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tint.value, [0, 1], [1, 0.38]),
    transform: [{ scale: interpolate(tint.value, [0, 1], [1.04, 0.96]) }],
  }));

  const logStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tint.value, [0, 1], [0.38, 1]),
    transform: [{ scale: interpolate(tint.value, [0, 1], [0.96, 1.04]) }],
  }));

  const trackProps = useAnimatedProps(() => ({
    fill: interpolateColor(wash.value, [0, 1], [fromTone.value, toTone.value]),
  }));

  const wobbleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + interpolate(blob.value, [0, 0.45, 0.75, 1], [0, 0.06, -0.02, 0]) },
      { scaleX: 1 + interpolate(goo.value, [0, 0.5, 1], [0, 0.05, 0]) },
      { scaleY: 1 - interpolate(goo.value, [0, 0.5, 1], [0, 0.04, 0]) },
    ],
  }));

  function run(to: number, reduced: boolean) {
    if (reduced) {
      goo.value = to;
      blob.value = to;
      tint.value = to;
      return;
    }
    goo.value = withSpring(to, JELLY_SPRING);
    blob.value = withSpring(to, BLOB_SPRING);
    tint.value = withSpring(to, TINT_SPRING);
  }

  function pick(next: DockSide) {
    if (next === side) return;
    run(next === 'cam' ? 0 : 1, reduce);
    void tick(next === 'cam');
    onChange(next);
  }

  return (
    <View style={{ width: W, height: H }}>
      <Svg width={W} height={H} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <AnimatedPath animatedProps={trackProps} d={PEANUT} />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H }, wobbleStyle]}
      >
        <JellyCluster goo={goo} blob={blob} width={W} height={H} />
      </Animated.View>

      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 71 * S - ICON / 2,
              top: H / 2 - ICON / 2,
              width: ICON,
              height: ICON,
            },
            camStyle,
          ]}
        >
          <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
            <Path d={CAM_LENS} fill={ICON_FILL} />
            <Path d={CAM_BODY} fill={ICON_FILL} />
          </Svg>
        </Animated.View>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 221 * S - ICON / 2,
              top: H / 2 - ICON / 2,
              width: ICON,
              height: ICON,
            },
            logStyle,
          ]}
        >
          <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
            <Path d={LOG_ROLL} fill={ICON_FILL} />
          </Svg>
        </Animated.View>
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: side === 'log' }}
        accessibilityLabel="카메라 · 로그"
        onPress={() => pick(side === 'cam' ? 'log' : 'cam')}
        style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
      />
    </View>
  );
}

async function tick(toCam: boolean) {
  if (Platform.OS === 'android') {
    await Haptics.performAndroidHapticsAsync(
      toCam ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off,
    );
    return;
  }
  await Haptics.selectionAsync();
}

import { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassToggle } from '@/src/components/ui/GlassToggle';
import { ShutterDisc } from '@/src/components/ui/ShutterDisc';
import { JELLY_OUT, JELLY_WOBBLE } from '@/src/components/ui/jelly';
import { SHUTTER_FRAME } from '@/src/components/ui/shutterConstants';
import { useDock } from '@/src/features/nav/dock';
import { nextChip } from '@/src/theme/tokens';

const ROW_H = 76;
const LIFT = 60;
const SIDE_PAD = 30;
const HIDE_MS = 520;
const SHUTTER_LIFT = Math.max(0, (SHUTTER_FRAME - ROW_H) / 2);

type Props = {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: string) => void };
};

export function Dock({ state, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12) + LIFT;
  const side = Math.max(insets.right, 16) + SIDE_PAD;
  const shoot = useDock((s) => s.shoot);
  const shooting = useDock((s) => s.shooting);
  const route = state.routes[state.index]?.name;
  const onCam = route === 'cam';
  const [tone, setTone] = useState(() => nextChip());
  const [reduce, setReduce] = useState(false);
  const [live, setLive] = useState(onCam);
  const enter = useSharedValue(onCam ? 1 : 0);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (onCam) {
      setLive(true);
      if (reduce) {
        enter.value = 1;
        return;
      }
      enter.value = 0;
      enter.value = withSpring(1, JELLY_WOBBLE);
      return;
    }
    if (reduce) {
      enter.value = 0;
    } else {
      enter.value = withSpring(0, JELLY_OUT);
    }
    const t = setTimeout(() => setLive(false), HIDE_MS);
    return () => clearTimeout(t);
  }, [onCam, reduce, enter]);

  return (
    <View pointerEvents="box-none" style={{ height: 0, backgroundColor: 'transparent' }}>
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: bottom,
          backgroundColor: 'transparent',
        }}
      >
        <View pointerEvents="box-none" style={{ height: ROW_H }}>
          {live ? (
            <View
              pointerEvents={onCam ? 'auto' : 'none'}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: -SHUTTER_LIFT,
                height: SHUTTER_FRAME,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible',
              }}
            >
              <ShutterDisc
                busy={shooting}
                tone={tone}
                enter={enter}
                onPress={() => onCam && shoot?.()}
              />
            </View>
          ) : null}
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              right: side,
              top: 0,
              height: ROW_H,
              justifyContent: 'center',
            }}
          >
            <GlassToggle
              side={onCam ? 'cam' : 'log'}
              tone={tone}
              onChange={(next) => {
                setTone((cur) => nextChip(cur));
                if (next === 'cam') navigation.navigate('cam');
                else navigation.navigate('log');
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

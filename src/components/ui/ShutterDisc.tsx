import { useCallback } from 'react';
import Animated, { interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import JellyShutterDom from '@/src/components/jelly/JellyShutter.dom';
import { jellyDom } from '@/src/components/jelly/domProps';
import { SHUTTER_FRAME } from '@/src/components/ui/shutterConstants';
import { colors } from '@/src/theme/tokens';

type Props = {
  busy?: boolean;
  tone?: string;
  enter: SharedValue<number>;
  onPress?: () => void;
};

export function ShutterDisc({ busy, tone = colors.fg, enter, onPress }: Props) {
  const handlePress = useCallback(async () => {
    onPress?.();
  }, [onPress]);

  const shellStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 0.1, 1], [0, 1, 1]),
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [SHUTTER_FRAME * 0.35, 0]) },
      { scale: interpolate(enter.value, [0, 0.75, 1], [0.6, 1.06, 1]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          width: SHUTTER_FRAME,
          height: SHUTTER_FRAME,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        shellStyle,
      ]}
    >
      <JellyShutterDom
        {...jellyDom({
          matchContents: false,
          style: {
            width: SHUTTER_FRAME,
            height: SHUTTER_FRAME,
            minWidth: SHUTTER_FRAME,
            minHeight: SHUTTER_FRAME,
            overflow: 'visible',
            backgroundColor: 'transparent',
          },
        })}
        tone={tone}
        busy={busy}
        onPress={onPress ? handlePress : undefined}
      />
    </Animated.View>
  );
}

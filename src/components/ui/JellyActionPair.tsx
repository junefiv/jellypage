import { View } from 'react-native';

import JellyActionPairDom from '@/src/components/jelly/JellyActionPair.dom';
import { jellyDom } from '@/src/components/jelly/domProps';

const BUTTON_BLEED = 800;

type Props = {
  width: number;
  height: number;
  gap: number;
  leftLabel: string;
  rightLabel: string;
  leftTone: string;
  rightTone: string;
  busy?: boolean;
  onLeft: () => void;
  onRight: () => void;
};

export function JellyActionPair({
  width,
  height,
  gap,
  leftLabel,
  rightLabel,
  leftTone,
  rightTone,
  busy,
  onLeft,
  onRight,
}: Props) {
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'relative', width, height, overflow: 'visible' }}
    >
      <JellyActionPairDom
        {...jellyDom({
          matchContents: false,
          scrollEnabled: false,
          style: {
            position: 'absolute',
            left: -BUTTON_BLEED / 2,
            top: -BUTTON_BLEED / 2,
            width: width + BUTTON_BLEED,
            height: height + BUTTON_BLEED,
            minWidth: width + BUTTON_BLEED,
            minHeight: height + BUTTON_BLEED,
            overflow: 'visible',
            backgroundColor: 'transparent',
          },
        })}
        width={width}
        height={height}
        gap={gap}
        bleed={BUTTON_BLEED}
        leftLabel={leftLabel}
        rightLabel={rightLabel}
        leftTone={leftTone}
        rightTone={rightTone}
        busy={busy}
        onLeft={async () => onLeft()}
        onRight={async () => onRight()}
      />
    </View>
  );
}

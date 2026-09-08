import { type PressableProps, type ViewStyle } from 'react-native';

import JellyButtonDom from '@/src/components/jelly/JellyButton.dom';
import { jellyDom } from '@/src/components/jelly/domProps';

type Props = PressableProps & {
  label: string;
  danger?: boolean;
  dim?: boolean;
  style?: ViewStyle;
  fill?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Native box. Layout == paint == hit. */
  box?: { w: number; h: number };
};

export function Tap({ label, danger, dim, disabled, fill, size, box, onPress }: Props) {
  const fixed = Boolean(box);
  return (
    <JellyButtonDom
      {...(box
        ? jellyDom({
            matchContents: false,
            scrollEnabled: false,
            style: {
              width: box.w,
              height: box.h,
              minWidth: box.w,
              minHeight: box.h,
              overflow: 'visible',
              backgroundColor: 'transparent',
            },
          })
        : jellyDom())}
      label={label}
      variant={danger ? 'rose' : 'platinum'}
      active={fill ? false : !dim && !danger}
      fill={fill}
      size={size}
      minWidth={box ? Math.max(88, box.w - 64) : undefined}
      height={box ? Math.max(48, box.h - 72) : undefined}
      disabled={disabled ?? undefined}
      fillHost={fixed}
      onPress={onPress ? async () => onPress({} as never) : undefined}
    />
  );
}

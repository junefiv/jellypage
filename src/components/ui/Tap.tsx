import { type PressableProps, type ViewStyle } from 'react-native';

import JellyButtonDom from '@/src/components/jelly/JellyButton.dom';
import { jellyDom } from '@/src/components/jelly/domProps';
import { buttonFill, type ButtonRole } from '@/src/theme/tokens';

type Props = PressableProps & {
  label: string;
  role?: ButtonRole;
  danger?: boolean;
  dim?: boolean;
  style?: ViewStyle;
  fill?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Native box. Layout == paint == hit. */
  box?: { w: number; h: number };
};

function resolveFill(role?: ButtonRole, danger?: boolean, dim?: boolean, fill?: string) {
  if (fill) return fill;
  if (danger || role === 'danger') return buttonFill('danger');
  if (role === 'back') return buttonFill('back');
  if (role === 'secondary' || dim) return buttonFill('secondary');
  if (role === 'save') return buttonFill('save');
  if (role === 'match') return buttonFill('match');
  return buttonFill('primary');
}

export function Tap({ label, role, danger, dim, disabled, fill, size, box, onPress }: Props) {
  const fixed = Boolean(box);
  const tone = resolveFill(role, danger, dim, fill);
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
      active={false}
      fill={tone}
      size={size}
      minWidth={box ? Math.max(88, box.w - 64) : undefined}
      height={box ? Math.max(48, box.h - 72) : undefined}
      disabled={disabled ?? undefined}
      fillHost={fixed}
      onPress={onPress ? async () => onPress({} as never) : undefined}
    />
  );
}

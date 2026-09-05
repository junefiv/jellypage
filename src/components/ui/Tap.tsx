import { type PressableProps, type ViewStyle } from 'react-native';

import JellyButtonDom from '@/src/components/jelly/JellyButton.dom';
import { jellyDom } from '@/src/components/jelly/domProps';

type Props = PressableProps & {
  label: string;
  danger?: boolean;
  dim?: boolean;
  style?: ViewStyle;
};

export function Tap({ label, danger, dim, disabled, style, onPress }: Props) {
  return (
    <JellyButtonDom
      {...jellyDom()}
      label={label}
      variant={danger ? 'rose' : 'platinum'}
      active={!dim && !danger}
      disabled={disabled ?? undefined}
      onPress={onPress ? async () => onPress({} as never) : undefined}
    />
  );
}

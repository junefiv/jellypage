import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, font } from '@/src/theme/tokens';

type Props = TextProps & {
  dim?: boolean;
  danger?: boolean;
  size?: number;
  style?: TextStyle | TextStyle[];
};

export function MonoText({ dim, danger, size = 13, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: font.mono,
          fontSize: size,
          color: danger ? colors.danger : dim ? colors.muted : colors.fg,
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
    />
  );
}

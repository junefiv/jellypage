import { type TextInputProps, View, type ViewStyle } from 'react-native';

import JellyInputDom from '@/src/components/jelly/JellyInput.dom';
import { jellyDom } from '@/src/components/jelly/domProps';

export function Field({
  wrapStyle,
  value,
  onChangeText,
  ...props
}: TextInputProps & { wrapStyle?: ViewStyle }) {
  const text = typeof value === 'string' ? value : '';
  return (
    <View style={wrapStyle}>
      <JellyInputDom
        {...jellyDom({ style: { backgroundColor: 'transparent', width: '100%' } })}
        value={text}
        placeholder={props.placeholder}
        label={props.placeholder}
        disabled={props.editable === false}
        onValueChange={
          onChangeText
            ? async (next) => {
                onChangeText(next);
              }
            : undefined
        }
      />
    </View>
  );
}

import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import JellyButtonDom from '@/src/components/jelly/JellyButton.dom';
import { jellyDom } from '@/src/components/jelly/domProps';
import { colors } from '@/src/theme/tokens';

export function MeMark({ inset }: { inset?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={
        inset
          ? { position: 'absolute', top: insets.top + 10, right: 16, zIndex: 4 }
          : undefined
      }
    >
      <JellyButtonDom
        {...jellyDom()}
        label="ME"
        active={false}
        fill={colors.btnOn}
        size="sm"
        onPress={async () => router.push('/me')}
      />
    </View>
  );
}

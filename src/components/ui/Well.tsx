import { type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import JellyCardDom from '@/src/components/jelly/JellyCard.dom';
import { jellyDom } from '@/src/components/jelly/domProps';

export function Well({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
        <JellyCardDom {...jellyDom({ style: { flex: 1, backgroundColor: 'transparent' } })} />
      </View>
      <View style={{ padding: 12, zIndex: 1 }}>{children}</View>
    </View>
  );
}

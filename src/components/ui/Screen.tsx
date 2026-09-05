import { type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '@/src/theme/tokens';

export function Screen({
  children,
  edges = ['top', 'left', 'right'],
}: {
  children: ReactNode;
  edges?: Edge[];
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={edges}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>{children}</View>
    </SafeAreaView>
  );
}

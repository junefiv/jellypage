import { Tabs } from 'expo-router';

import { Dock } from '@/src/components/ui/Dock';
import { colors } from '@/src/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <Dock {...props} />}
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg, flex: 1 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 0,
        },
        tabBarBackground: () => null,
      }}
    >
      <Tabs.Screen name="cam" />
      <Tabs.Screen name="log" />
    </Tabs>
  );
}

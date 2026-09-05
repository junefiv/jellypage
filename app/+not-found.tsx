import { Link } from 'expo-router';
import { View } from 'react-native';

import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';

export default function NotFound() {
  return (
    <Screen>
      <View style={{ padding: 24 }}>
        <Link href="/(tabs)/cam">
          <MonoText>CAM</MonoText>
        </Link>
      </View>
    </Screen>
  );
}

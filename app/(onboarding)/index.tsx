import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { Tap } from '@/src/components/ui/Tap';
import { msg } from '@/src/lib/messages';

export default function OnboardingScreen() {
  const [cam, requestCam] = useCameraPermissions();

  useEffect(() => {
    if (cam?.granted) {
      router.replace('/(tabs)/cam');
    }
  }, [cam?.granted]);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
        <MonoText size={22}>HEXy</MonoText>
        <MonoText dim>{msg.onboardingTag}</MonoText>
        <Tap
          label="CAM"
          onPress={async () => {
            const res = await requestCam();
            if (res.granted) router.replace('/(tabs)/cam');
          }}
        />
        <Tap
          label="CITY ?"
          dim
          onPress={async () => {
            await Location.requestForegroundPermissionsAsync();
          }}
        />
      </View>
    </Screen>
  );
}

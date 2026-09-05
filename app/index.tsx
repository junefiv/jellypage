import { useCameraPermissions } from 'expo-camera';
import { Redirect } from 'expo-router';

export default function Index() {
  const [cam] = useCameraPermissions();
  if (cam == null) return null;
  if (cam.granted) return <Redirect href="/(tabs)/cam" />;
  return <Redirect href="/(onboarding)" />;
}

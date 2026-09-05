import * as ImageManipulator from 'expo-image-manipulator';

export async function makeBlurThumb(uri: string): Promise<string> {
  const tiny = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 48 } }],
    { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG },
  );
  const up = await ImageManipulator.manipulateAsync(
    tiny.uri,
    [{ resize: { width: 240 } }],
    { compress: 0.55, format: ImageManipulator.SaveFormat.JPEG },
  );
  return up.uri;
}

export async function makeUploadOriginal(uri: string): Promise<string> {
  const out = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 2048 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
  );
  return out.uri;
}

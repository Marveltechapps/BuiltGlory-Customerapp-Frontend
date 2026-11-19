import { PermissionsAndroid, Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

const toFile = (asset: Asset, index: number): PickedFile | null => {
  if (!asset.uri) return null;
  const type = asset.type ?? 'image/jpeg';
  const ext = type.split('/')[1] ?? 'jpg';
  return {
    uri: asset.uri,
    name: asset.fileName ?? `photo-${Date.now()}-${index}.${ext}`,
    type,
    size: asset.fileSize,
  };
};

/** Pick images from the gallery (the backend accepts jpeg/png/webp up to 25 MB). */
export async function pickImages(limit = 1): Promise<PickedFile[]> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: limit,
    quality: 0.8,
    maxWidth: 2400,
    maxHeight: 2400,
  });
  if (result.didCancel) return [];
  if (result.errorCode)
    throw new Error(result.errorMessage || 'Could not open your photos.');
  return (result.assets ?? [])
    .map(toFile)
    .filter((f): f is PickedFile => Boolean(f));
}

export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  return status === PermissionsAndroid.RESULTS.GRANTED;
}

export async function takePhoto(): Promise<PickedFile | null> {
  if (!(await requestCameraPermission()))
    throw new Error('Camera permission is required to take a photo.');
  const result = await launchCamera({
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 2400,
    maxHeight: 2400,
    saveToPhotos: false,
  });
  if (result.didCancel) return null;
  if (result.errorCode)
    throw new Error(result.errorMessage || 'Could not open the camera.');
  const first = result.assets?.[0];
  return first ? toFile(first, 0) : null;
}

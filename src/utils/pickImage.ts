import { ActionSheetIOS, Alert, Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
  fileSize?: number;
  width?: number;
  height?: number;
};

const MAX_BYTES = 25 * 1024 * 1024; // matches backend 25 MB multer limit
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

function toPicked(asset: Asset | undefined): PickedImage | null {
  if (!asset?.uri) return null;
  const type = (asset.type || 'image/jpeg').toLowerCase();
  if (type && !ALLOWED_TYPES.has(type) && !type.startsWith('image/')) {
    throw new Error('Only image files are allowed (JPEG, PNG, WEBP, HEIC).');
  }
  if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_BYTES) {
    throw new Error('Image must be 25 MB or smaller.');
  }
  return {
    uri: asset.uri,
    name: asset.fileName || `photo-${Date.now()}.jpg`,
    type: asset.type || 'image/jpeg',
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
  };
}

function fromResponse(result: ImagePickerResponse): PickedImage | null {
  if (result.didCancel) return null;
  if (result.errorCode === 'permission') {
    throw new Error('Photo permission was denied. Enable it in Settings to continue.');
  }
  if (result.errorCode === 'camera_unavailable') {
    throw new Error('Camera is not available on this device.');
  }
  if (result.errorMessage) {
    throw new Error(result.errorMessage);
  }
  return toPicked(result.assets?.[0]);
}

const libraryOptions = {
  mediaType: 'photo' as const,
  selectionLimit: 1,
  quality: 0.8 as const,
  includeBase64: false,
};

const cameraOptions = {
  mediaType: 'photo' as const,
  quality: 0.8 as const,
  saveToPhotos: false,
  cameraType: 'back' as const,
  includeBase64: false,
};

/** Open the device photo library and return one image, or null if cancelled. */
export async function pickFromGallery(): Promise<PickedImage | null> {
  return fromResponse(await launchImageLibrary(libraryOptions));
}

/** Open the camera and return one image, or null if cancelled. */
export async function pickFromCamera(): Promise<PickedImage | null> {
  return fromResponse(await launchCamera(cameraOptions));
}

function chooseSource(): Promise<'camera' | 'gallery' | null> {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) resolve('camera');
          else if (index === 2) resolve('gallery');
          else resolve(null);
        },
      );
    });
  }
  return new Promise((resolve) => {
    Alert.alert('Add photo', 'Choose a source', [
      { text: 'Camera', onPress: () => resolve('camera') },
      { text: 'Gallery', onPress: () => resolve('gallery') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

/**
 * Prompt for camera or gallery, then return a validated image.
 * Returns null when the user cancels.
 */
export async function pickSingleImage(): Promise<PickedImage | null> {
  const source = await chooseSource();
  if (!source) return null;
  return source === 'camera' ? pickFromCamera() : pickFromGallery();
}

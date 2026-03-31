
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImagePickerResult {
  canceled: boolean;
  assets: Array<{
    uri: string;
    width: number;
    height: number;
    mimeType?: string;
    base64?: string; // We'll use this for the Gemini API
    fileName?: string;
  }> | null;
}

export const launchImageLibraryAsync = async (options: {
  mediaTypes: 'Images';
  allowsEditing?: boolean;
  quality?: number;
  base64?: boolean;
}): Promise<ImagePickerResult> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve({ canceled: true, assets: null });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const uri = event.target?.result as string;
        
        // Create an image to get dimensions
        const img = new Image();
        img.onload = () => {
          resolve({
            canceled: false,
            assets: [{
              uri: uri, // Data URL serves as URI in web
              width: img.width,
              height: img.height,
              mimeType: file.type,
              fileName: file.name,
              base64: uri, // Helper for our specific app usage
            }]
          });
        };
        img.src = uri;
      };
      reader.readAsDataURL(file);
    };

    input.click();
  });
};

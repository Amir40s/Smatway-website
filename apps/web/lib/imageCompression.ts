import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file iteratively to ensure it stays below the target size limit.
 * Uses browser-image-compression under the hood to preserve EXIF orientation and
 * efficiently resize/compress using a Web Worker.
 * 
 * @param file The original File object selected by the user.
 * @param maxSizeMB The maximum allowed size in Megabytes (default 4.5 to be safe under 5MB).
 * @returns A Promise that resolves to the compressed File object.
 */
export async function compressImage(file: File, maxSizeMB: number = 4.5): Promise<File> {
  // If the file is not an image, or is an SVG/GIF, skip compression.
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  // If the file is already small enough, we can optionally just return it, 
  // but browser-image-compression will handle EXIF and potentially optimize it further anyway.
  
  const options = {
    maxSizeMB: maxSizeMB,
    // Max dimension. Cloudinary can handle huge, but limiting to 4000x4000 is safe and speeds up compression.
    maxWidthOrHeight: 4000, 
    useWebWorker: true,
    initialQuality: 0.85, // Start with high quality
    alwaysKeepResolution: false, // Allow dimension resizing if quality reduction isn't enough
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // browser-image-compression returns a Blob, we need to convert it back to a File
    // to maintain the original file name and lastModified properties.
    const finalFile = new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
    
    return finalFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails, throw an error to be handled gracefully by the UI.
    throw new Error('Failed to compress image. Please try another image or a smaller file.');
  }
}

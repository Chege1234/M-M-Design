/**
 * Image upload utilities for Supabase Storage.
 * Bucket: project-images (public read, auth-only write).
 */
import { supabase, supabaseUrl } from '@/lib/supabase';

const BUCKET = 'project-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validate a file before uploading.
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type "${file.type}". Only JPEG, PNG, WebP, and GIF are allowed.`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is ${sizeMB} MB. Maximum allowed is 5 MB.`,
    };
  }
  return { valid: true };
}

/**
 * Upload a single image file to the project-images bucket.
 * @param {File} file — the image file
 * @param {string} projectSlug — used as a folder prefix
 * @returns {Promise<string>} — the public URL of the uploaded image
 */
export async function uploadProjectImage(file, projectSlug = 'unsorted') {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate a unique filename: slug/timestamp-randomhex.ext
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const randomHex = Math.random().toString(16).slice(2, 10);
  const filePath = `${projectSlug}/${timestamp}-${randomHex}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '31536000', // 1 year — images are immutable
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Construct the public URL
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${filePath}`;
  return publicUrl;
}

/**
 * Delete an image from the project-images bucket.
 * Accepts either a full public URL or a storage path.
 * @param {string} urlOrPath
 */
export async function deleteProjectImage(urlOrPath) {
  // Extract the storage path from a full URL
  const prefix = `/storage/v1/object/public/${BUCKET}/`;
  let filePath = urlOrPath;

  if (urlOrPath.includes(prefix)) {
    filePath = urlOrPath.split(prefix).pop();
  }

  if (!filePath) return;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('Failed to delete image from storage:', error.message);
  }
}

/**
 * Delete multiple images from storage.
 * @param {string[]} urls — array of public URLs
 */
export async function deleteProjectImages(urls) {
  if (!urls || urls.length === 0) return;

  const prefix = `/storage/v1/object/public/${BUCKET}/`;
  const paths = urls
    .map((url) => {
      if (url.includes(prefix)) {
        return url.split(prefix).pop();
      }
      return null;
    })
    .filter(Boolean);

  if (paths.length === 0) return;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove(paths);

  if (error) {
    console.error('Failed to delete images from storage:', error.message);
  }
}

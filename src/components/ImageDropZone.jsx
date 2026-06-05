import { useState, useRef, useCallback } from 'react';
import { Upload, X, ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { uploadProjectImage, validateImageFile } from '@/lib/imageUpload';

/**
 * ImageDropZone — drag & drop / click-to-upload image component.
 *
 * @param {{ value: string[], onChange: (urls: string[]) => void, projectSlug: string, multiple?: boolean, label?: string }} props
 */
export default function ImageDropZone({
  value = [],
  onChange,
  projectSlug = 'unsorted',
  multiple = false,
  label = 'Drop images here',
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      // Validate all files first
      for (const file of files) {
        const check = validateImageFile(file);
        if (!check.valid) {
          setError(check.error);
          return;
        }
      }

      setError('');
      setUploading(true);

      const newUrls = [...value];
      let uploaded = 0;

      try {
        for (const file of files) {
          setUploadProgress(`Uploading ${uploaded + 1} of ${files.length}...`);
          const url = await uploadProjectImage(file, projectSlug);

          if (multiple) {
            newUrls.push(url);
          } else {
            // Single mode — replace existing
            newUrls.length = 0;
            newUrls.push(url);
          }
          uploaded++;
        }

        onChange(newUrls);
      } catch (err) {
        setError(err.message || 'Upload failed');
      } finally {
        setUploading(false);
        setUploadProgress('');
      }
    },
    [value, onChange, projectSlug, multiple],
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleRemove = (index) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const hasImages = value.length > 0;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed cursor-pointer
          transition-all duration-200 ease-out
          flex flex-col items-center justify-center gap-2 py-8 px-4
          ${isDragOver
            ? 'border-bronze bg-bronze/10 scale-[1.01]'
            : 'border-linen/20 hover:border-linen/40 bg-ink/50'
          }
          ${uploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <>
            <Loader2 size={28} className="text-bronze animate-spin" />
            <p className="text-linen/70 text-xs font-body tracking-wider">
              {uploadProgress}
            </p>
          </>
        ) : (
          <>
            <Upload
              size={28}
              className={`transition-colors ${isDragOver ? 'text-bronze' : 'text-linen/40'}`}
            />
            <p className="text-linen/60 text-xs font-body tracking-wider text-center">
              {label}
            </p>
            <p className="text-linen/30 text-[0.6rem] font-body tracking-wider">
              JPEG, PNG, WebP, GIF · Max 5 MB
            </p>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 text-red-300 text-xs bg-red-900/20 border border-red-400/20 px-3 py-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span className="font-body">{error}</span>
        </div>
      )}

      {/* Image previews */}
      {hasImages && (
        <div className={`grid gap-2 ${multiple ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5' : 'grid-cols-1 max-w-[200px]'}`}>
          {value.map((url, i) => (
            <div
              key={url + i}
              className="group relative aspect-[4/3] bg-panel border border-linen/10 overflow-hidden"
            >
              <img
                src={url}
                alt={`Upload ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Show placeholder icon if URL is broken
                  e.target.style.display = 'none';
                  e.target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full flex items-center justify-center">
                <ImageIcon size={24} className="text-linen/30" />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(i);
                }}
                className="
                  absolute top-1 right-1
                  w-6 h-6 flex items-center justify-center
                  bg-ink/80 border border-linen/20
                  text-linen/70 hover:text-red-300 hover:border-red-300/50
                  opacity-0 group-hover:opacity-100
                  transition-all duration-150 cursor-pointer
                "
                title="Remove image"
              >
                <X size={12} />
              </button>

              {/* Index badge for gallery */}
              {multiple && (
                <span className="absolute bottom-1 left-1 bg-ink/80 text-linen/60 text-[0.55rem] font-body px-1.5 py-0.5 tracking-wider">
                  {i + 1}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

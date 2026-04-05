'use client';

import { useState, useRef } from 'react';
import { ImagePlus, X, GripVertical, Crop, AlertCircle } from 'lucide-react';
import type { UploadedImage, ProductDraft } from './types';
import Image from 'next/image';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';
const MAX_IMAGES = 8;
const MAX_MB = 5;
const ACCEPT_MIME = ['image/jpeg', 'image/png', 'image/webp'];

// ── Cloudinary Upload ──────────────────────────────────────────────────────────

async function uploadToCloudinary(
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', preset);
    fd.append('folder', 'aurafumeng/products');

    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 99));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        let data: { secure_url?: string; public_id?: string };
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          reject(new Error('Invalid JSON response from Cloudinary'));
          return;
        }
        if (!data.secure_url) {
          reject(new Error('Cloudinary response missing secure_url'));
          return;
        }
        resolve({ url: data.secure_url, publicId: data.public_id ?? '' });
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(fd);
  });
}

// ── Section Card ───────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '3px',
      }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <h2
          className="text-[0.60rem] tracking-[0.18em] uppercase font-semibold"
          style={{ color: 'rgba(255,255,255,0.70)' }}
        >
          {title}
        </h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────────

function UploadProgressBar({ progress }: { progress: number }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 h-[3px]"
      style={{ background: 'rgba(0,0,0,0.4)' }}
    >
      <div
        className="h-full transition-all duration-200"
        style={{ width: `${progress}%`, background: GOLD }}
      />
    </div>
  );
}

// ── Image Thumbnail ────────────────────────────────────────────────────────────

function ImageThumb({
  img,
  isMain,
  isDragging,
  isOver,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  img: UploadedImage;
  isMain: boolean;
  isDragging: boolean;
  isOver: boolean;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="relative group aspect-square"
      style={{
        opacity: isDragging ? 0.4 : 1,
        outline: isOver ? `2px solid ${GOLD}` : '2px solid transparent',
        borderRadius: '3px',
        cursor: 'grab',
        transition: 'opacity 0.15s, outline 0.10s',
      }}
    >
      <Image
        src={img.url}
        alt=""
        fill
        className="object-cover"
        style={{ borderRadius: '3px' }}
      />

      {img.progress !== undefined && img.progress < 100 && (
        <>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', borderRadius: '3px' }}
          >
            <span
              className="text-[0.50rem] tracking-[0.10em] font-semibold"
              style={{ color: GOLD }}
            >
              {img.progress}%
            </span>
          </div>
          <UploadProgressBar progress={img.progress} />
        </>
      )}

      {isMain && img.progress === undefined && (
        <span
          className="absolute top-1.5 left-1.5 text-[0.40rem] tracking-[0.12em] uppercase font-semibold px-1.5 py-0.5"
          style={{
            background: GOLD,
            color: 'oklch(0.10 0 0)',
            borderRadius: '2px',
          }}
        >
          Main
        </span>
      )}

      <div
        className="absolute inset-0 flex items-start justify-end gap-1 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ background: 'rgba(0,0,0,0.40)', borderRadius: '3px' }}
      >
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center w-6 h-6 transition-colors"
          style={{
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '2px',
            color: 'rgba(255,255,255,0.70)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
        >
          <Crop size={11} strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex items-center justify-center w-6 h-6 transition-colors"
          style={{
            background: 'rgba(239,68,68,0.18)',
            borderRadius: '2px',
            color: 'rgba(239,68,68,0.85)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.32)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
        >
          <X size={11} strokeWidth={2} />
        </button>
      </div>

      <div
        className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        <GripVertical size={11} strokeWidth={1.8} />
      </div>
    </div>
  );
}

// ── Drop Zone ──────────────────────────────────────────────────────────────────

function DropZone({
  disabled,
  onFiles,
}: {
  disabled: boolean;
  onFiles: (files: File[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      ACCEPT_MIME.includes(f.type),
    );
    if (files.length) onFiles(files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = '';
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center gap-3 py-8 transition-all duration-150"
      style={{
        border: `1px dashed ${dragOver ? GOLD : 'rgba(255,255,255,0.10)'}`,
        background: dragOver ? 'rgba(180,130,60,0.04)' : 'rgba(255,255,255,0.01)',
        borderRadius: '3px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full"
        style={{ background: 'rgba(180,130,60,0.10)' }}
      >
        <ImagePlus size={18} strokeWidth={1.5} style={{ color: GOLD }} />
      </div>
      <div className="text-center space-y-1">
        <p
          className="text-[0.56rem] tracking-[0.10em] font-medium"
          style={{ color: 'rgba(255,255,255,0.50)' }}
        >
          Drag images here or{' '}
          <span style={{ color: GOLD }}>click to upload</span>
        </p>
        <p
          className="text-[0.46rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          JPG, PNG, WEBP — max {MAX_MB}MB per image
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ── ProductImagesSection ───────────────────────────────────────────────────────

interface ProductImagesProps {
  value: Pick<ProductDraft, 'images'>;
  onChange: (patch: Partial<ProductDraft>) => void;
}

export default function ProductImagesSection({
  value,
  onChange,
}: ProductImagesProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [errors,  setErrors]  = useState<string[]>([]);

  const images = value.images;
  const canAdd = images.length < MAX_IMAGES;

  const imagesRef    = useRef(images);
  imagesRef.current  = images;

  function setImages(imgs: UploadedImage[]) {
    onChange({ images: imgs });
  }

  function updateImage(id: string, patch: Partial<UploadedImage>) {
    setImages(imagesRef.current.map((img) => img.id === id ? { ...img, ...patch } : img));
  }

  function handleFiles(files: File[]) {
    const errs: string[] = [];
    const snapshot = imagesRef.current;
    const valid = files
      .filter((f) => {
        if (!ACCEPT_MIME.includes(f.type)) { errs.push(`${f.name}: unsupported format`); return false; }
        if (f.size > MAX_MB * 1024 * 1024) { errs.push(`${f.name}: exceeds ${MAX_MB}MB limit`); return false; }
        return true;
      })
      .slice(0, MAX_IMAGES - snapshot.length);

    setErrors(errs);
    if (!valid.length) return;

    const placeholders: UploadedImage[] = valid.map((f) => ({
      id:       crypto.randomUUID(),
      url:      URL.createObjectURL(f),
      publicId: '',
      progress: 0,
    }));

    setImages([...snapshot, ...placeholders]);

    valid.forEach((file, i) => {
      const imgId = placeholders[i].id;
      uploadToCloudinary(file, (pct) => updateImage(imgId, { progress: pct }))
        .then(({ url, publicId }) => updateImage(imgId, { url, publicId, progress: undefined }))
        .catch(() => {
          setImages(imagesRef.current.filter((img) => img.id !== imgId));
          setErrors((prev) => [...prev, `${file.name}: upload failed`]);
        });
    });
  }

  function handleDrop(dropIdx: number) {
    if (dragIdx === null || dragIdx === dropIdx) return;
    const next = [...imagesRef.current];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(dropIdx, 0, moved);
    setImages(next);
    setDragIdx(null);
    setOverIdx(null);
  }

  return (
    <SectionCard title="Product Images">
      <DropZone disabled={!canAdd} onFiles={handleFiles} />

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2">
              <AlertCircle size={11} strokeWidth={1.8} style={{ color: 'rgba(239,68,68,0.80)', flexShrink: 0 }} />
              <span className="text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(239,68,68,0.75)' }}>
                {err}
              </span>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <ImageThumb
              key={img.id}
              img={img}
              isMain={idx === 0}
              isDragging={dragIdx === idx}
              isOver={overIdx === idx}
              onDelete={() => setImages(imagesRef.current.filter((i) => i.id !== img.id))}
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
              onDrop={() => handleDrop(idx)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
          Recommended: 1000×1000px, white background
        </p>
        <span className="text-[0.44rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
          {images.length}/{MAX_IMAGES} images
        </span>
      </div>
    </SectionCard>
  );
}

// lib/useAdoptionForm.ts
// Үрчлүүлэх загварын wizard custom hook-ууд — UI-ээс салгагдсан:
//   useAdoptionPhoto  — зураг шахалт (content moderationгүй)
//   useAdoptionSubmit — submit pipeline (createAdoption + reset)
'use client';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { compressImage } from './imageCompress';
import { createAdoption } from './adoptionService';
import { useToast } from '../components/Toast';
import { useLanguage } from './i18n';
import type { District } from './districts';
import type { AdoptionGender, PetType } from './types';
import { getErrorMessage } from './utils';

// Дотоод утга (DB-д хадгалагдах) үргэлж Монгол хэвээр
export const TYPE_VALUES: PetType[] = ['Нохой', 'Муур', 'Бусад'];
export const GENDER_VALUES: AdoptionGender[] = ['Эрэгтэй', 'Эмэгтэй', 'Тодорхойгүй'];

export interface AdoptionFormData {
  name: string;
  type: PetType;
  age: string;
  gender: AdoptionGender;
  breed: string;
  description: string;
  place: string;
  district: District;
  phone: string;
}

// ---------- Зураг: шахалт (content moderationгүй) ----------
export function useAdoptionPhoto() {
  const showToast = useToast();
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    const available = Math.max(0, 4 - photoFiles.length);
    const files = selected.slice(0, available);
    if (!files.length) {
      showToast('Дээд тал нь 4 зураг оруулах боломжтой.', 'info');
      e.target.value = '';
      return;
    }
    setCompressing(true);
    try {
      const compressed = await Promise.all(files.map(async (file) => {
        try { return await compressImage(file); } catch { return file; }
      }));
      setPhotoFiles((current) => [...current, ...compressed].slice(0, 4));
      setPreviews((current) => [...current, ...compressed.map((file) => URL.createObjectURL(file))].slice(0, 4));
      showToast(`${compressed.length} зураг нэмэгдлээ.`, 'success');
    } catch {
      showToast('Зураг боловсруулахад алдаа гарлаа.', 'error');
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  }

  function removePhoto(index: number) {
    setPreviews((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
    setPhotoFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function openFilePicker() {
    if (!compressing) document.getElementById('adoption-photo-input')?.click();
  }

  function reset() {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPhotoFiles([]);
    setPreviews([]);
    setCompressing(false);
  }

  return { photoFiles, previews, compressing, handlePhoto, openFilePicker, removePhoto, reset };
}

// ---------- Submit: createAdoption + төлөв ----------
export function useAdoptionSubmit({
  form, photoFiles, onSuccess,
}: {
  form: AdoptionFormData;
  photoFiles: File[];
  onSuccess: (id: string) => void;
}) {
  const showToast = useToast();
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [done, setDone] = useState(false);
  const [newAdoptionId, setNewAdoptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMsg(t('submitting'));
    try {
      const id = await createAdoption({
        ...form,
        gender: form.gender || 'Тодорхойгүй',
        photoFiles,
      });
      setNewAdoptionId(id);
      setDone(true);
      onSuccess(id);
    } catch (err) {
      console.error(err);
      const msg = getErrorMessage(err);
      setError(msg && msg.includes('олон удаа')
        ? msg
        : 'Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
      setStatusMsg('');
    }
  }

  function reset() {
    setSubmitting(false);
    setStatusMsg('');
    setDone(false);
    setNewAdoptionId(null);
    setError(null);
  }

  return { submitting, statusMsg, done, newAdoptionId, error, handleSubmit, reset };
}

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const originalKB = Math.round(file.size / 1024);
      const compressed = await compressImage(file);
      const newKB = Math.round(compressed.size / 1024);

      setPhotoFile(compressed);
      setPreview(URL.createObjectURL(compressed));
      if (originalKB > newKB + 20) {
        showToast(`Зураг оновчлогдлоо: ${originalKB}KB → ${newKB}KB`, 'success');
      }
    } catch {
      setPhotoFile(file);
      setPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  }

  function openFilePicker() {
    if (!compressing) document.getElementById('adoption-photo-input')?.click();
  }

  function reset() {
    setPhotoFile(null);
    setPreview(null);
    setCompressing(false);
  }

  return { photoFile, preview, compressing, handlePhoto, openFilePicker, reset };
}

// ---------- Submit: createAdoption + төлөв ----------
export function useAdoptionSubmit({
  form, photoFile, onSuccess,
}: {
  form: AdoptionFormData;
  photoFile: File | null;
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
        photoFile,
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

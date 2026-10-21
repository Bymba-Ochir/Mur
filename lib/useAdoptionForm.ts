// lib/useAdoptionForm.ts
// Үрчлүүлэх загварын wizard custom hook-ууд — UI-ээс салгагдсан:
//   useAdoptionPhoto  — зураг шахалт (content moderationгүй)
//   useAdoptionSubmit — submit pipeline (createAdoption + reset)
'use client';
import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { compressImage } from './imageCompress';
import { createAdoption } from './adoptionService';
import { useToast } from '../components/Toast';
import { useLanguage } from './i18n';
import type { District } from './districts';
import type { AdoptionGender, PetType } from './types';
import { getErrorMessage } from './utils';
import { cleanText, isInputValidationError, requireMongolianPhone } from './inputValidation';
import { fingerprintSubmission, resolveIdempotencyAttempt, type IdempotencyAttempt } from './idempotency';

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
  const { t } = useLanguage();
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    const available = Math.max(0, 4 - photoFiles.length);
    const files = selected.slice(0, available);
    if (!files.length) {
      showToast(t('adoption_photo_limit'), 'info');
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
      showToast(`${compressed.length} ${t('adoption_photo_added')}`, 'success');
    } catch {
      showToast(t('adoption_photo_error'), 'error');
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
  const attemptRef = useRef<IdempotencyAttempt | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMsg(t('submitting'));
    const fingerprint = fingerprintSubmission(form, photoFiles);
    const attempt = resolveIdempotencyAttempt(attemptRef.current, fingerprint);
    attemptRef.current = attempt;
    try {
      const id = await createAdoption({
        ...form,
        name: cleanText(form.name, 100, 'Нэр'),
        age: cleanText(form.age, 100, 'Нас'),
        breed: cleanText(form.breed, 100, 'Үүлдэр'),
        description: cleanText(form.description, 2000, 'Тайлбар', true),
        place: cleanText(form.place, 300, 'Байршил', true),
        phone: requireMongolianPhone(form.phone),
        gender: form.gender || 'Тодорхойгүй',
        photoFiles,
      }, attempt.key);
      attemptRef.current = null;
      setNewAdoptionId(id);
      setDone(true);
      onSuccess(id);
    } catch (err) {
      console.error(err);
      const msg = getErrorMessage(err);
      setError(isInputValidationError(err) || (msg && msg.includes('олон удаа'))
        ? msg
        : t('form_generic_error'));
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
    attemptRef.current = null;
  }

  return { submitting, statusMsg, done, newAdoptionId, error, handleSubmit, reset };
}

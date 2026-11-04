// lib/usePetForm.ts
// Мэдэгдэх (PetForm) wizards-ийн логик custom hook-ууд — UI-ээс салгагдсан:
//   usePhotoUpload — зураг шахалт + content moderation
//   usePetLocation — geolocation + дүүрэг таамаглал
//   usePetSubmit   — submit pipeline (createPetReport + reset)
'use client';
import { reportError } from './errorTracking';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { compressImage } from './imageCompress';
import { checkImageContent } from './contentModeration';
import { nearestDistrict } from './districtCoords';
import { createPetReport } from './petService';
import { useToast } from '../components/Toast';
import { useLanguage } from './i18n';
import type { District } from './districts';
import type { PetStatus, PetType } from './types';
import { getErrorMessage } from './utils';
import { cleanText, isInputValidationError, optionalInteger, requireMongolianPhone } from './inputValidation';
import { fingerprintSubmission, resolveIdempotencyAttempt, type IdempotencyAttempt } from './idempotency';

// Дотоод утга (DB-д хадгалагдах) үргэлж Монгол хэвээр — зөвхөн харагдац орчуулагдана
export const TYPE_VALUES: PetType[] = ['Нохой', 'Муур', 'Бусад'];

export interface PetFormData {
  name: string;
  type: PetType;
  breed: string;
  color: string;
  place: string;
  district: District;
  phone: string;
  /** "Шагналтай" гэж тэмдэглэх эсэх */
  hasReward: boolean;
  /** Шагналын дүн (raw текст инпут) — НУУЦ, хоосон бол null-ээр хадгална */
  reward: string;
}

// ---------- Зураг: шахалт + content moderation ----------
export function usePhotoUpload() {
  const showToast = useToast();
  const { t } = useLanguage();
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [compressStatus, setCompressStatus] = useState('');

  const urls = useRef<string[]>([]);
  const generation = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current += 1; urls.current.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  function replacePhotos(files: File[]) {
    urls.current.forEach(url => URL.revokeObjectURL(url));
    urls.current = files.map(file => URL.createObjectURL(file));
    setPhotoFiles(files);
    setPreviews(urls.current);
  }

  function restore(files: File[]) {
    generation.current += 1;
    replacePhotos(files);
    setCompressing(false);
    setCompressStatus('');
  }

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, 4);
    if (!selected.length) return;
    const currentGeneration = ++generation.current;
    setCompressing(true);
    try {
      const accepted: File[] = [];
      for (let index = 0; index < selected.length; index += 1) {
        setCompressStatus(`${index + 1}/${selected.length} ${t('photo_optimizing')}`);
        const compressed = await compressImage(selected[index]);
        const check = await checkImageContent(compressed, setCompressStatus);
        if (!mounted.current || currentGeneration !== generation.current) return;
        if (!check.ok) {
          showToast(`${index + 1}-р зураг: ${check.reason}`, 'error');
          continue;
        }
        if (check.warning) showToast(`${index + 1}-р зураг: ${check.warning}`, 'info');
        accepted.push(compressed);
      }
      if (accepted.length) {
        replacePhotos(accepted);
        showToast(`${accepted.length} ${t('photo_ready')}`, 'success');
      }
    } catch {
      if (mounted.current && currentGeneration === generation.current) replacePhotos(selected);
    } finally {
      if (mounted.current && currentGeneration === generation.current) { setCompressing(false); setCompressStatus(''); }
      e.target.value = '';
    }
  }

  function openFilePicker() {
    if (!compressing) document.getElementById('photo-input')?.click();
  }

  function reset() { restore([]); }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index]);
    urls.current = urls.current.filter((_, itemIndex) => itemIndex !== index);
    setPhotoFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return { photoFiles, previews, photoFile: photoFiles[0] ?? null, preview: previews[0] ?? null, compressing, compressStatus, handlePhoto, openFilePicker, removePhoto, restore, reset };
}

// ---------- Байршил: geolocation + ойролцоо дүүрэг ----------
export function usePetLocation(onDistrictGuess: (d: District) => void) {
  const showToast = useToast();
  const { t } = useLanguage();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  function handleUseLocation() {
    if (!navigator.geolocation) {
      showToast(t('location_not_supported'), 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const guessed = nearestDistrict(latitude, longitude);
        onDistrictGuess(guessed);
        setLocating(false);
        showToast(`${t('location_success')} ${guessed}`, 'success');
      },
      () => {
        setLocating(false);
        showToast(t('location_failed'), 'error');
      }
    );
  }

  function reset() {
    setCoords(null);
    setLocating(false);
  }

  return { coords, locating, handleUseLocation, setCoords, reset };
}

// ---------- Submit: createPetReport + төлөв ----------
export function usePetSubmit({
  status, form, photoFiles, coords, onSuccess, onAttempt,
}: {
  status: PetStatus;
  form: PetFormData;
  photoFiles: File[];
  coords: { lat: number; lng: number } | null;
  onSuccess: (id: string) => void | Promise<void>;
  onAttempt?: (attempt: IdempotencyAttempt) => Promise<unknown>;
}) {
  const showToast = useToast();
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [done, setDone] = useState(false);
  const [newPetId, setNewPetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attemptRef = useRef<IdempotencyAttempt | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMsg(t('submitting'));
    const fingerprint = fingerprintSubmission({ status, form, coords }, photoFiles);
    const attempt = resolveIdempotencyAttempt(attemptRef.current, fingerprint);
    attemptRef.current = attempt;
    try {
      await onAttempt?.(attempt);
      const id = await createPetReport(
        {
          ...form,
          name: cleanText(form.name, 100, 'Нэр'),
          breed: cleanText(form.breed, 100, 'Үүлдэр'),
          color: cleanText(form.color, 100, 'Өнгө', true),
          place: cleanText(form.place, 300, 'Байршил', true),
          phone: requireMongolianPhone(form.phone),
          status,
          hasReward: form.hasReward,
          reward: form.hasReward ? optionalInteger(form.reward, { min: 0, max: 100_000_000, label: 'Шагналын дүн' }) : null,
          photoFile: photoFiles[0] ?? null,
          photoFiles,
          lat: coords?.lat,
          lng: coords?.lng,
        },
        setStatusMsg,
        attempt.key,
      );
      attemptRef.current = null;
      await onSuccess(id);
      setNewPetId(id);
      setDone(true);
    } catch (err) {
      reportError(err, { area: 'frontend', operation: 'create-pet-report' });
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
    setNewPetId(null);
    setError(null);
    attemptRef.current = null;
  }

  return { submitting, statusMsg, done, newPetId, error, handleSubmit, reset, restoreAttempt: (value: IdempotencyAttempt | null) => { attemptRef.current = value; } };
}

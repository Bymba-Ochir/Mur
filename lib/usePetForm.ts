// lib/usePetForm.ts
// Мэдэгдэх (PetForm) wizards-ийн логик custom hook-ууд — UI-ээс салгагдсан:
//   usePhotoUpload — зураг шахалт + content moderation
//   usePetLocation — geolocation + дүүрэг таамаглал
//   usePetSubmit   — submit pipeline (createPetReport + reset)
'use client';
import { useRef, useState } from 'react';
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

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, 4);
    if (!selected.length) return;
    previews.forEach((url) => URL.revokeObjectURL(url));
    setCompressing(true);
    try {
      const accepted: File[] = [];
      for (let index = 0; index < selected.length; index += 1) {
        setCompressStatus(`${index + 1}/${selected.length} ${t('photo_optimizing')}`);
        const compressed = await compressImage(selected[index]);
        const check = await checkImageContent(compressed, setCompressStatus);
        if (!check.ok) {
          showToast(`${index + 1}-р зураг: ${check.reason}`, 'error');
          continue;
        }
        if (check.warning) showToast(`${index + 1}-р зураг: ${check.warning}`, 'info');
        accepted.push(compressed);
      }
      if (accepted.length) {
        setPhotoFiles(accepted);
        setPreviews(accepted.map((file) => URL.createObjectURL(file)));
        showToast(`${accepted.length} ${t('photo_ready')}`, 'success');
      }
    } catch {
      setPhotoFiles(selected);
      setPreviews(selected.map((file) => URL.createObjectURL(file)));
    } finally {
      setCompressing(false);
      setCompressStatus('');
      e.target.value = '';
    }
  }

  function openFilePicker() {
    if (!compressing) document.getElementById('photo-input')?.click();
  }

  function reset() {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPhotoFiles([]);
    setPreviews([]);
    setCompressing(false);
    setCompressStatus('');
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index]);
    setPhotoFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return { photoFiles, previews, photoFile: photoFiles[0] ?? null, preview: previews[0] ?? null, compressing, compressStatus, handlePhoto, openFilePicker, removePhoto, reset };
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
  status, form, photoFiles, coords, onSuccess,
}: {
  status: PetStatus;
  form: PetFormData;
  photoFiles: File[];
  coords: { lat: number; lng: number } | null;
  onSuccess: (id: string) => void;
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
      setNewPetId(id);
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
    setNewPetId(null);
    setError(null);
    attemptRef.current = null;
  }

  return { submitting, statusMsg, done, newPetId, error, handleSubmit, reset };
}

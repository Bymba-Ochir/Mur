// lib/usePetForm.ts
// Мэдэгдэх (PetForm) wizards-ийн логик custom hook-ууд — UI-ээс салгагдсан:
//   usePhotoUpload — зураг шахалт + content moderation
//   usePetLocation — geolocation + дүүрэг таамаглал
//   usePetSubmit   — submit pipeline (createPetReport + reset)
'use client';
import { useState } from 'react';
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
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [compressStatus, setCompressStatus] = useState('');

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, 4);
    if (!selected.length) return;
    setCompressing(true);
    try {
      const accepted: File[] = [];
      for (let index = 0; index < selected.length; index += 1) {
        setCompressStatus(`${index + 1}/${selected.length} зураг оновчлож байна...`);
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
        showToast(`${accepted.length} зураг бэлэн боллоо`, 'success');
      }
    } catch {
      setPhotoFiles(selected);
      setPreviews(selected.map((file) => URL.createObjectURL(file)));
    } finally {
      setCompressing(false);
      setCompressStatus('');
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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  function handleUseLocation() {
    if (!navigator.geolocation) {
      showToast('Энэ browser байршил тодорхойлохыг дэмждэггүй', 'error');
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
        showToast(`Байршлыг тодорхойлов: ${guessed} дүүрэг`, 'success');
      },
      () => {
        setLocating(false);
        showToast('Байршил тодорхойлж чадсангүй. Зөвшөөрөл шалгана уу.', 'error');
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMsg(t('submitting'));
    try {
      const id = await createPetReport(
        {
          ...form,
          status,
          hasReward: form.hasReward,
          reward: form.reward ? Number(form.reward) : null,
          photoFile: photoFiles[0] ?? null,
          photoFiles,
          lat: coords?.lat,
          lng: coords?.lng,
        },
        setStatusMsg
      );
      setNewPetId(id);
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
    setNewPetId(null);
    setError(null);
  }

  return { submitting, statusMsg, done, newPetId, error, handleSubmit, reset };
}

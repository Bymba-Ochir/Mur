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
  color: string;
  place: string;
  district: District;
  phone: string;
}

// ---------- Зураг: шахалт + content moderation ----------
export function usePhotoUpload() {
  const showToast = useToast();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressStatus, setCompressStatus] = useState('');

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const originalKB = Math.round(file.size / 1024);
      const compressed = await compressImage(file);
      const newKB = Math.round(compressed.size / 1024);

      const check = await checkImageContent(compressed, setCompressStatus);
      if (!check.ok) {
        showToast(check.reason, 'error');
        e.target.value = '';
        return;
      }
      if (check.warning) {
        showToast(check.warning, 'info');
      }

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
      setCompressStatus('');
    }
  }

  function openFilePicker() {
    if (!compressing) document.getElementById('photo-input')?.click();
  }

  function reset() {
    setPhotoFile(null);
    setPreview(null);
    setCompressing(false);
    setCompressStatus('');
  }

  return { photoFile, preview, compressing, compressStatus, handlePhoto, openFilePicker, reset };
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
  status, form, photoFile, coords, onSuccess,
}: {
  status: PetStatus;
  form: PetFormData;
  photoFile: File | null;
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
        { ...form, status, photoFile, lat: coords?.lat, lng: coords?.lng },
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

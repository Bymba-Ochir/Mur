'use client';
import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { DISTRICTS } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import Icon from './ui/icons';
import ShareButtons from './ShareButtons';
import LocationMap from './LocationMap';
import PetPreviewCard from './PetPreviewCard';
import PawTrail from './PawTrail';
import { usePhotoUpload, usePetLocation, usePetSubmit, TYPE_VALUES } from '../lib/usePetForm';
import type { PetFormData } from '../lib/usePetForm';
import type { PetStatus, PetType } from '../lib/types';
import BreedSelect from './BreedSelect';
import FieldHint from './ui/FieldHint';
import AuthRequired from './AuthRequired';
import PhonePrivacyField from './PhonePrivacyField';
import { useAuth } from '../lib/useAuth';
import { usePetDraft } from '../lib/usePetDraft';

type FieldErrors = Partial<Record<'color' | 'place' | 'phone', string>>;

export default function PetForm({ status }: { status: PetStatus }) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const lost = status === 'lost';
  return (
    <div className="page-shell">
      <header className="report-header">
        <p className="report-type">{t(lost ? 'report_lost_eyebrow' : 'report_found_eyebrow')}</p>
        <h1>{t(lost ? 'report_lost_title' : 'report_found_title')}</h1>
        <p className="report-intro">{t(lost ? 'report_lost_desc' : 'report_found_desc')}</p>
      </header>
      <AuthRequired
        title={lang === 'mn' ? 'Зар оруулахын тулд нэвтэрнэ үү' : 'Sign in to create a report'}
        description={lang === 'mn' ? 'Нэвтэрсний дараа энэ хуудаснаас зургаа оруулж, мэдээллээ бөглөнө.' : 'After signing in, continue on this page to add photos and details.'}
        icon={<Icon name="lock" size={28} />}
      >
        <AuthenticatedPetForm key={`${user?.id}:${status}`} status={status} userId={user?.id ?? ''} />
      </AuthRequired>
      <style jsx>{`
        .report-header { padding-bottom:16px; margin-bottom:20px; border-bottom:1px solid var(--border-subtle); }
        .report-type { color:var(--text-secondary); font-size:var(--text-xs); font-weight:600; }
        .report-header h1 { margin:4px 0 8px; font-size:clamp(1.625rem, 4vw, 2.375rem); line-height:1.2; font-weight:700; }
        .report-intro { max-width:60ch; color:var(--text-secondary); font-size:var(--text-sm); }
      `}</style>
    </div>
  );
}

function AuthenticatedPetForm({ status, userId }: { status: PetStatus; userId: string }) {
  const { t } = useLanguage();
  const steps = [t('form_step_photo'), t('form_step_info'), t('form_step_location'), t('form_step_contact')];
  const typeLabels: Record<PetType, string> = { 'Нохой': t('type_dog'), 'Муур': t('type_cat'), 'Бусад': t('type_other') };
  const [step, setStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<PetFormData>({
    name: '', type: 'Нохой', breed: '', color: '', place: '', district: DISTRICTS[0], phone: '', phoneHidden: false, hasReward: false, reward: '',
  });

  const photo = usePhotoUpload();
  const location = usePetLocation((district) => setForm((current) => ({ ...current, district })));

  function resetAll() {
    setForm({ name: '', type: 'Нохой', breed: '', color: '', place: '', district: DISTRICTS[0], phone: '', phoneHidden: false, hasReward: false, reward: '' });
    setStep(0);
    setFieldErrors({});
    photo.reset();
    location.reset();
  }

  const snapshot = useMemo(() => ({ form, step, photos: photo.photoFiles, coords: location.coords }), [form, step, photo.photoFiles, location.coords]);
  const draft = usePetDraft(userId, status, snapshot);
  const submit = usePetSubmit({
    status, form, photoFiles: photo.photoFiles, coords: location.coords,
    onAttempt: draft.saveAttempt,
    onSuccess: async () => { await draft.clear(); resetAll(); },
  });

  function resumeDraft() {
    const saved = draft.resume();
    if (!saved) return;
    setForm(saved.form);
    setStep(saved.step);
    location.setCoords(saved.coords);
    photo.restore(saved.photos);
    submit.restoreAttempt(saved.attempt);
  }

  function clearError(name: keyof FieldErrors) {
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }) as PetFormData);
    if (name === 'color' || name === 'place') clearError(name);
  }

  function validateStep(targetStep: number) {
    const errors: FieldErrors = {};
    if (targetStep === 1 && !form.color.trim()) errors.color = t('form_color_required');
    if (targetStep === 2 && !form.place.trim()) errors.place = t('form_place_required');
    if (targetStep === 3 && !form.phoneHidden && !/^\d{8}$/.test(form.phone)) errors.phone = t('form_phone_invalid');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goNext() {
    if (validateStep(step)) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!form.color.trim()) { event.preventDefault(); setStep(1); validateStep(1); return; }
    if (!form.place.trim()) { event.preventDefault(); setStep(2); validateStep(2); return; }
    if (!validateStep(3)) {
      event.preventDefault();
      return;
    }
    void submit.handleSubmit(event);
  }

  function handleUploadKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      photo.openFilePicker();
    }
  }

  function addAnother() {
    submit.reset();
    resetAll();
    draft.restart();
  }

  if (submit.done && submit.newPetId) {
    const petPath = `/pets/${submit.newPetId}`;
    const petUrl = typeof window !== 'undefined' ? new URL(petPath, window.location.origin).href : '';
    return (
      <section className="success-box" role="status" aria-labelledby="report-success-title">
        <span className="success-icon" aria-hidden="true"><Icon name="check" size={28} /></span>
        <h2 id="report-success-title">{t('report_published')}</h2>
        <p>{t('success_msg')}</p>
        <Button as="link" href={petPath} variant="primary" className="view-post">{t('report_view_post')}<Icon name="arrowRight" size={16} /></Button>
        <ShareButtons url={petUrl} title={status === 'lost' ? t('report_lost_eyebrow') : t('report_found_eyebrow')} />
        <Button variant="secondary" onClick={addAnother} className="add-another">{t('add_another')}</Button>
        <style jsx>{`
          .success-box { max-width: 38rem; margin-inline: auto; padding: var(--sp-7); color: var(--ink); background: var(--success-bg); border: 1px solid color-mix(in srgb, var(--success) 30%, transparent); border-radius: var(--r-xl); text-align: center; box-shadow: var(--shadow-sm); }
          .success-icon { display: grid; place-items: center; width: 3rem; height: 3rem; margin: 0 auto var(--sp-3); color: var(--success); background: var(--card); border-radius: 50%; }
          h2 { margin: 0 0 var(--sp-2); font-family: var(--font-heading); font-size: var(--text-xl); }
          p { margin: 0 0 var(--sp-5); color: var(--muted); }
          .success-box :global(.view-post) { margin-bottom: var(--sp-4); }
          .success-box :global(.add-another) { margin-top: var(--sp-4); }
          @media (max-width: 640px) { .success-box { padding: var(--sp-5); border-radius: var(--r-lg); } }
        `}</style>
      </section>
    );
  }

  if (draft.phase === 'loading') return <div className="state-panel" role="status">{t('form_draft_loading')}</div>;
  if (draft.pending) return (
    <section className="state-panel" aria-labelledby="draft-heading">
      <span className="state-panel__icon"><Icon name="pencil" size={28} /></span>
      <h2 id="draft-heading">{t('form_draft_title')}</h2>
      <p>{t('form_draft_hint')}</p>
      {draft.error && <p role="alert">{t(draft.error)}</p>}
      <div className="quick-actions">
        <Button onClick={resumeDraft}>{t('form_draft_resume')}</Button>
        <Button variant="ghost" onClick={() => void draft.discard()}>{t('form_draft_discard')}</Button>
      </div>
    </section>
  );

  return (
    <div className="form-layout">
      <form onSubmit={handleSubmit} className="pet-form" aria-label={status === 'lost' ? t('form_lost_aria') : t('form_found_aria')}>
        <p className="draft-status" role={draft.error ? 'alert' : 'status'}>
          {t(draft.error || (draft.saving ? 'form_draft_saving' : draft.saved ? 'form_draft_saved' : 'form_draft_hint'))}
        </p>
        <PawTrail labels={steps} current={step} ariaLabel={t('form_steps_aria')} />
        <p className="progress-text" aria-live="polite">{step + 1}/{steps.length}: {steps[step]}</p>

        {step === 0 && (
          <fieldset className="form-step">
            <legend className="sr-only">{steps[0]}</legend>
            <label id="photo-label">{t('photo_label')}</label>
            <div
              className="upload-zone"
              onClick={photo.openFilePicker}
              onKeyDown={handleUploadKeyDown}
              role="button"
              tabIndex={0}
              aria-labelledby="photo-label"
              aria-describedby={photo.previews.length || photo.compressing ? undefined : 'photo-hint'}
              aria-busy={photo.compressing}
            >
              {photo.compressing ? (
                <span className="upload-message" role="status"><Icon name="sparkles" />{photo.compressStatus || t('photo_optimizing')}</span>
              ) : photo.previews.length ? (
                <div className="selected-photos">
                  {photo.previews.map((preview, index) => (
                    <div key={preview} className="selected-photo">
                      {/* Blob preview-г next/image оновчлох шаардлагагүй. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt={`${t('photo_preview_alt')} ${index + 1}`} />
                      <span className="photo-number">{index + 1}</span>
                      <button type="button" className="photo-remove" onClick={(event) => { event.stopPropagation(); photo.removePhoto(index); }} aria-label={`${index + 1}: ${t('photo_remove')}`}>
                        <Icon name="close" size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <span id="photo-hint" className="upload-message"><Icon name="camera" size={24} />{t('photo_upload_action')}<small>{t('photo_hint')}</small></span>
              )}
            </div>
            <details className="photo-quality">
              <summary className="pq-title">{t('photo_requirements_title')}</summary>
              <ul><li>{t('photo_quality_bright')}</li><li>{t('photo_quality_close')}</li></ul>
              <p className="pq-match">{t('photo_quality_match')}</p>
            </details>
            <input id="photo-input" className="sr-only" type="file" accept="image/*" multiple onChange={photo.handlePhoto} disabled={photo.compressing} aria-label={t('photo_label')} />
            <FieldHint mn="1–4 зураг сонгоно. Нүүр, бүтэн бие, онцлог шинж болон сүүлд харагдсан орчны зургийг оруулбал танихад хялбар." en="Choose 1–4 photos: face, full body, distinctive markings, and the last-seen area." />
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="form-step">
            <legend className="sr-only">{steps[1]}</legend>
            <label htmlFor="pet-name">{t('name_label')}</label>
            <FieldHint mn="Хүзүүвч дээр нэр байсан эсвэл нэрийг нь мэддэг бол бичнэ. Заавал биш." en="Enter the name only when known or shown on a tag. Optional." />
            <input id="pet-name" name="name" value={form.name} onChange={handleChange} placeholder={t('name_placeholder')} maxLength={100} />

            <label htmlFor="pet-type">{t('type_label')}</label>
            <select id="pet-type" name="type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as PetType, breed: '' }))}>
              {TYPE_VALUES.map((value) => <option key={value} value={value}>{typeLabels[value]}</option>)}
            </select>

            <label htmlFor="pet-breed">{t('breed_label')}</label>
            <FieldHint mn="Эргэлзэж байвал “Тодорхойгүй” эсвэл “Холимог үүлдэр” сонгоно." en="Choose Unknown or Mixed breed when unsure." />
            <BreedSelect id="pet-breed" type={form.type} value={form.breed} onChange={(breed) => setForm((current) => ({ ...current, breed }))} />

            <label htmlFor="pet-color">{t('color_label')}</label>
            <FieldHint mn="Үндсэн өнгө болон ялгарах шинжийг бичнэ. Жишээ: хар, цээж цагаан." en="Describe the main color and distinctive markings, e.g. black with a white chest." />
            <input id="pet-color" name="color" value={form.color} onChange={handleChange} placeholder={t('color_placeholder')} required maxLength={100} aria-invalid={Boolean(fieldErrors.color)} aria-describedby={fieldErrors.color ? 'pet-color-error' : undefined} />
            {fieldErrors.color && <p id="pet-color-error" className="field-error" role="alert"><Icon name="alert" size={16} />{fieldErrors.color}</p>}
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="form-step">
            <legend className="sr-only">{steps[2]}</legend>
            <button type="button" onClick={location.handleUseLocation} disabled={location.locating} className="locate-btn"><Icon name="pin" size={18} />{location.locating ? t('locate_loading') : t('locate_btn')}</button>

            <label htmlFor="pet-district">{t('district_label')}</label>
            <select id="pet-district" name="district" value={form.district} onChange={handleChange}>{DISTRICTS.map((district) => <option key={district}>{district}</option>)}</select>

            <label htmlFor="pet-place">{status === 'lost' ? t('place_label_lost') : t('place_label_found')}</label>
            <FieldHint mn="Хороо, гудамж, дэлгүүр зэрэг хүн танихуйц ойролцоо газрыг бичнэ." en="Enter a recognizable nearby khoroo, street or landmark." />
            <input id="pet-place" name="place" value={form.place} onChange={handleChange} placeholder={t('place_placeholder')} required maxLength={300} aria-invalid={Boolean(fieldErrors.place)} aria-describedby={fieldErrors.place ? 'pet-place-error' : undefined} />
            {fieldErrors.place && <p id="pet-place-error" className="field-error" role="alert"><Icon name="alert" size={16} />{fieldErrors.place}</p>}

            <label id="map-label">{t('map_label')} <span className="optional-label">{t('map_optional')}</span></label>
            <div className="map-wrap" aria-labelledby="map-label"><LocationMap lat={location.coords?.lat} lng={location.coords?.lng} editable onPick={location.setCoords} label={t('map_label')} /></div>
            {location.coords && <p className="coordinates" aria-live="polite"><Icon name="pin" size={15} />{t('location_coords')}: {location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}</p>}
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="form-step">
            <legend className="sr-only">{steps[3]}</legend>
            {status === 'lost' && (
              <>
                <label className="reward-check" htmlFor="pet-has-reward">
                  <input id="pet-has-reward" type="checkbox" checked={form.hasReward} onChange={(event) => setForm((current) => ({ ...current, hasReward: event.target.checked }))} />
                  <Icon name="sparkles" size={19} /><span>{t('reward_label')}</span>
                </label>
                {form.hasReward && <><label htmlFor="pet-reward">{t('reward_amount_label')}</label><input id="pet-reward" name="reward" type="number" inputMode="numeric" min={0} max={100000000} step={1} value={form.reward} onChange={handleChange} placeholder={t('reward_placeholder')} /></>}
              </>
            )}

            <PhonePrivacyField id="pet-phone" phone={form.phone} hidden={Boolean(form.phoneHidden)} onPhoneChange={phone => { setForm(current => ({ ...current, phone })); clearError('phone'); }} onHiddenChange={phoneHidden => { setForm(current => ({ ...current, phoneHidden })); clearError('phone'); }} error={fieldErrors.phone} />
            {submit.error && <p className="submit-error" role="alert"><Icon name="alert" size={17} />{submit.error}</p>}

            <Button type="submit" disabled={submit.submitting} variant="primary" fullWidth className="form-submit" aria-busy={submit.submitting}>
              {submit.submitting ? submit.statusMsg || t('submitting') : status === 'lost' ? t('submit_lost') : t('submit_found')}
            </Button>
            {submit.submitting && submit.statusMsg.includes('AI') && <p className="ai-wait" aria-live="polite">{t('form_ai_wait')}</p>}
          </fieldset>
        )}

        <div className="nav-row">
          {step > 0 && <Button type="button" onClick={() => { setFieldErrors({}); setStep((current) => current - 1); }} variant="ghost"><Icon name="arrowLeft" size={18} />{t('form_back_plain')}</Button>}
          {step < steps.length - 1 && <Button type="button" onClick={goNext} disabled={photo.compressing} variant="primary">{t('form_next_plain')}<Icon name="arrowRight" size={18} /></Button>}
        </div>
      </form>

      <aside className="preview-col" aria-label={t('preview_label')}>
        <PetPreviewCard status={status} name={form.name} type={form.type} breed={form.breed} color={form.color} district={form.district} place={form.place} phone={form.phoneHidden ? '' : form.phone} photoPreview={photo.preview} hasReward={form.hasReward} />
      </aside>

      <style jsx>{`
        .form-layout { display: grid; grid-template-columns: minmax(0, 35rem) minmax(17rem, 20rem); justify-content: center; align-items: start; gap: var(--sp-6); width: 100%; }
        .pet-form { display: flex; flex-direction: column; min-width: 0; padding: 24px; background: var(--card); border: 1px solid var(--line); border-radius: 16px; }
        .draft-status { margin: 0 0 var(--sp-4); color: var(--muted); font-size: var(--text-xs); line-height: 1.5; }
        .draft-status[role="alert"] { color: var(--alert); }
        .form-step { display: flex; flex-direction: column; min-width: 0; margin: 0; padding: 0; border: 0; }
        .preview-col { position: sticky; top: 6.5rem; width: 100%; min-width: 0; }
        .progress-text { margin: 12px 0 20px; color: var(--text-secondary); font-size: var(--text-sm); font-weight: 600; }
        .pet-form :global(.paw.active), .pet-form :global(.paw.done) {
          background: var(--primary-dark); color: #fff; border-color: var(--primary-dark); box-shadow: none;
        }
        .pet-form :global(.trail-line.filled) { background: var(--primary-dark); }
        .pet-form :global(.trail-label) { font-size: var(--text-xs); }
        label { display: block; margin-top: var(--sp-5); color: var(--text-primary); font-size: var(--text-sm); font-weight: 600; }
        .form-step > label:first-of-type { margin-top: 0; }
        input, select { width: 100%; min-height: var(--touch-target); padding: var(--sp-3) var(--sp-4); color: var(--ink); background: var(--card); border: 1.5px solid var(--line); border-radius: var(--r-sm); font: inherit; transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out); }
        input:hover, select:hover { border-color: var(--muted); }
        input:focus-visible, select:focus-visible { outline: none; border-color: var(--border-focus); box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 18%, transparent); }
        input[aria-invalid='true'] { border-color: var(--alert); }
        .upload-zone { display: flex; align-items: center; justify-content: center; min-height: 8rem; padding: 16px; color: var(--muted); background: var(--overcast); border: 1.5px dashed var(--line); border-radius: var(--r-md); text-align: center; cursor: pointer; transition: border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out); }
        .upload-zone:hover { border-color: var(--border-strong); background: var(--surface-3); }
        .upload-zone:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 3px; }
        .upload-message { display: flex; flex-direction: column; align-items: center; gap: var(--sp-2); font-weight: 700; }
        .upload-message small { color: var(--muted); font-size: var(--text-xs); font-weight: 500; }
        .selected-photos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-2); width: 100%; }
        .selected-photo { position: relative; min-height: 7.5rem; overflow: hidden; background: var(--surface-3); border-radius: var(--r-sm); }
        .selected-photo img { display: block; width: 100%; height: 100%; min-height: 7.5rem; object-fit: cover; }
        .photo-number { position: absolute; left: var(--sp-2); bottom: var(--sp-2); min-width: 1.6rem; padding: var(--sp-1) var(--sp-2); color: var(--text-on-accent); background: color-mix(in srgb, var(--ink) 76%, transparent); border-radius: var(--r-pill); font-size: var(--text-xs); font-weight: 800; }
        .photo-remove { position: absolute; top: var(--sp-2); right: var(--sp-2); display: grid; place-items: center; width: var(--touch-target); height: var(--touch-target); padding: 0; color: var(--text-on-accent); background: color-mix(in srgb, var(--ink) 78%, transparent); border: 0; border-radius: 50%; cursor: pointer; }
        .photo-remove:hover { background: var(--alert); }
        .photo-remove:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .photo-quality { margin: 8px 0 4px; color: var(--text-secondary); font-size: var(--text-xs); }
        .pq-title { padding: 8px 0; min-height: 36px; color: var(--text-primary); font-weight: 600; cursor: pointer; }
        .pq-title:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }
        .photo-quality ul { display: grid; gap: var(--sp-1); margin: 0; padding-left: var(--sp-5); }
        .photo-quality li { margin: 0; line-height: 1.5; }
        .pq-match { margin: var(--sp-2) 0 0; }
        .optional-label { color: var(--muted); font-weight: 500; }
        .map-wrap { margin-top: var(--sp-2); overflow: hidden; border-radius: var(--r-md); }
        .coordinates, .ai-wait { display: flex; align-items: center; gap: var(--sp-1); margin: var(--sp-2) 0 0; color: var(--muted); font-size: var(--text-xs); }
        .field-error, .submit-error { display: flex; align-items: flex-start; gap: var(--sp-2); margin: var(--sp-2) 0 0; color: var(--alert); font-size: var(--text-sm); font-weight: 600; }
        .field-error :global(svg), .submit-error :global(svg) { flex: 0 0 auto; margin-top: 0.1rem; }
        .reward-check { display: flex; align-items: center; gap: var(--sp-2); min-height: var(--touch-target); margin-top: 0; cursor: pointer; }
        .reward-check input { width: 1.25rem; min-height: 1.25rem; margin: 0; accent-color: var(--primary-dark); }
        .locate-btn { display: inline-flex; align-items: center; justify-content: center; align-self: flex-start; gap: var(--sp-2); min-height: var(--touch-target); padding: var(--sp-2) var(--sp-4); color: var(--primary); background: transparent; border: 1px solid var(--border-subtle); border-radius: 10px; font: inherit; font-weight: 600; cursor: pointer; }
        .locate-btn:hover { background: var(--eyebrow-bg); }
        .locate-btn:disabled { opacity: 0.6; cursor: wait; }
        .locate-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .form-submit { margin-top: 20px; }
        .pet-form :global(.btn-base[data-variant="primary"]) { background: var(--primary-dark); border-radius: 10px; box-shadow: none; }
        .nav-row { display: flex; gap: var(--sp-3); margin-top: 20px; }
        .nav-row :global(.btn-base) { flex: 1; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
        @media (max-width: 900px) { .form-layout { grid-template-columns: minmax(0, 38rem); gap: 0; } .preview-col { display: none; } }
        @media (max-width: 640px) { .pet-form { padding: var(--sp-5); border-radius: var(--r-lg); } input, select { font-size: 1rem; } .locate-btn { width: 100%; } }
        @media (max-width: 420px) { .pet-form { padding: var(--sp-4); border-radius: var(--r-md); } .nav-row { gap: var(--sp-2); } .selected-photo, .selected-photo img { min-height: 6.5rem; } }
        @media (prefers-reduced-motion: reduce) { input, select, .upload-zone { transition: none; } }
      `}</style>
    </div>
  );
}

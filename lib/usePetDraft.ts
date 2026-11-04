'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createIdempotencyKey, fingerprintSubmission, type IdempotencyAttempt } from './idempotency';
import { readPetDraft, writePetDraft, type PetDraft, type PetDraftSnapshot } from './petDraftStorage';
import type { PetStatus } from './types';

type Phase = 'loading' | 'prompt' | 'editing' | 'complete';

export function usePetDraft(userId: string, status: PetStatus, snapshot: PetDraftSnapshot) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [pending, setPending] = useState<PetDraft | null>(null);
  const [error, setError] = useState<'' | 'form_draft_conflict' | 'form_draft_error'>('');
  const [savedSignature, setSavedSignature] = useState('');
  const mounted = useRef(false);
  const editable = useRef(false);
  const revision = useRef<string | null>(null);
  const attempt = useRef<IdempotencyAttempt | null>(null);
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const signature = fingerprintSubmission({ form: snapshot.form, coords: snapshot.coords, step: snapshot.step }, snapshot.photos);
  const hasProgress = snapshot.step > 0 || snapshot.photos.length > 0 || snapshot.coords !== null
    || Boolean(snapshot.form.name || snapshot.form.breed || snapshot.form.color || snapshot.form.place
      || snapshot.form.phone || snapshot.form.reward || snapshot.form.hasReward);

  const failure = useCallback((reason: unknown) => {
    const conflict = reason instanceof Error && reason.message === 'DRAFT_CONFLICT';
    if (conflict) editable.current = false;
    if (mounted.current) setError(conflict ? 'form_draft_conflict' : 'form_draft_error');
  }, []);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    readPetDraft(userId, status).then(draft => {
      if (!active) return;
      revision.current = draft?.revision ?? null;
      setPending(draft);
      editable.current = !draft;
      setPhase(draft ? 'prompt' : 'editing');
    }).catch(reason => {
      if (!active) return;
      editable.current = true;
      failure(reason);
      setPhase('editing');
    });
    return () => { active = false; mounted.current = false; };
  }, [userId, status, failure]);

  const save = useCallback((value: PetDraftSnapshot, currentAttempt: IdempotencyAttempt | null) => {
    const operation = writes.current.then(async () => {
      if (!editable.current) return;
      const fingerprint = fingerprintSubmission({ status, form: value.form, coords: value.coords }, value.photos);
      const next: PetDraft = {
        ...value, version: 1, userId, status, revision: createIdempotencyKey(), updatedAt: Date.now(),
        attempt: currentAttempt?.fingerprint === fingerprint ? currentAttempt : null,
      };
      await writePetDraft(userId, status, revision.current, next);
      revision.current = next.revision;
      if (mounted.current) {
        setError('');
        setSavedSignature(fingerprintSubmission({ form: value.form, coords: value.coords, step: value.step }, value.photos));
      }
    });
    writes.current = operation.catch(failure);
    return writes.current;
  }, [userId, status, failure]);

  useEffect(() => {
    if (phase !== 'editing' || !hasProgress || signature === savedSignature) return;
    const timeout = setTimeout(() => { void save(snapshot, attempt.current); }, 250);
    return () => clearTimeout(timeout);
  }, [phase, hasProgress, signature, savedSignature, snapshot, save]);

  function resume(): PetDraft | null {
    if (!pending) return null;
    attempt.current = pending.attempt;
    editable.current = true;
    setPending(null);
    setPhase('editing');
    return pending;
  }

  async function discard() {
    editable.current = false;
    try {
      await writes.current;
      await writePetDraft(userId, status, revision.current, null);
      revision.current = null;
      attempt.current = null;
      if (mounted.current) {
        setPending(null);
        setError('');
        setSavedSignature('');
        setPhase('editing');
        editable.current = true;
      }
    } catch (reason) { failure(reason); }
  }

  async function saveAttempt(value: IdempotencyAttempt) {
    attempt.current = value;
    await save(snapshot, value);
  }

  async function clear() {
    editable.current = false;
    setPhase('complete');
    await writes.current;
    try {
      await writePetDraft(userId, status, revision.current, null);
      revision.current = null;
    } catch (reason) { failure(reason); }
    attempt.current = null;
  }

  function restart() {
    editable.current = true;
    setSavedSignature('');
    setError('');
    setPhase('editing');
  }

  return {
    phase, pending, error, resume, discard, saveAttempt, clear, restart,
    saving: phase === 'editing' && hasProgress && signature !== savedSignature && !error,
    saved: phase === 'editing' && hasProgress && signature === savedSignature && !error,
  };
}

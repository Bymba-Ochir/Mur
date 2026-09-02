import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('page detail safeguards', () => {
  it('highlights nested navigation routes', () => {
    const navbar = source('components/Navbar.tsx');
    expect(navbar).toContain('pathname.startsWith(`${href}/`)');
    expect(navbar).toContain('aria-current');
  });

  it('keeps primary navigation available at medium desktop widths', () => {
    const navbar = source('components/Navbar.tsx');
    expect(navbar).toContain('@media (min-width: 1041px) and (max-width: 1180px)');
    expect(navbar).not.toContain('@media (max-width: 1180px) {\n          .nav-links { display: none; }');
    expect(navbar).not.toContain('<header className="navbar">');
  });

  it('mobile navigation has modal close and focus containment', () => {
    const navbar = source('components/Navbar.tsx');
    expect(navbar).toContain('mobileCloseButtonRef');
    expect(navbar).toContain('keepFocusInside');
    expect(navbar).toContain('className="mobile-backdrop"');
    expect(navbar).toContain('aria-modal="true"');
  });

  it('home and footer define stable mobile grids', () => {
    const home = source('app/page.tsx');
    const footer = source('components/Footer.tsx');
    expect(home).toContain('@media (max-width: 720px)');
    expect(home).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(footer).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
  });

  it('listings keeps explicit filter labels and stable responsive grids', () => {
    const listings = source('app/listings/page.tsx');
    expect(listings).toContain('listings_search_label');
    expect(listings).toContain('aria-labelledby="listings-filters-heading"');
    expect(listings).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(listings).toContain('@media (max-width: 900px)');
    expect(listings).toContain('@media (max-width: 600px)');
    expect(listings).not.toContain('style={{ flex:');
  });

  it('listing cards expose separate phone and detail controls', () => {
    const card = source('components/PetCardView.tsx');
    const listingCard = source('components/PetCard.tsx');
    expect(card).toContain('className="card-actions"');
    expect(card).toContain('className="detail-link"');
    expect(listingCard).not.toContain('role="link"');
    expect(listingCard).not.toContain('tabIndex={0}');
  });

  it('lost and found detail uses semantic sections and a stable mobile breakpoint', () => {
    const detail = source('app/pets/[id]/PetDetailClient.tsx');
    expect(detail).toContain('className="pet-facts"');
    expect(detail).toContain('className="contact-block"');
    expect(detail).toContain('className="owner-panel"');
    expect(detail).toContain('@media (max-width: 900px)');
    expect(detail).not.toContain('style={{');
  });

  it('pet detail shared controls are accessible and avoid inline layout styles', () => {
    const gallery = source('components/PetImageGallery.tsx');
    const editForm = source('components/PetEditForm.tsx');
    const sightings = source('components/SightingsList.tsx');
    expect(gallery).toContain('role="group"');
    expect(gallery).toContain('detail_gallery_previous');
    expect(gallery).not.toContain('>‹</button>');
    expect(editForm).toContain('<form className="edit-form"');
    expect(editForm).toContain('aria-invalid');
    expect(sightings).toContain('aria-controls="sighting-form"');
    expect(sightings).not.toContain('style={{');
  });

  it('detail pages provide retry and back actions', () => {
    for (const path of [
      'app/pets/[id]/PetDetailClient.tsx',
      'app/adoptions/[id]/AdoptionDetailClient.tsx',
      'app/sitting/[id]/SittingDetailClient.tsx',
      'app/profiles/adoption/[id]/AdoptionProfileClient.tsx',
      'app/profiles/mypet/[id]/MyPetProfileClient.tsx',
    ]) {
      const detail = source(path);
      expect(detail).toContain('state-panel--error');
      expect(detail).toMatch(/Дахин оролдох|err_retry/);
      expect(detail).toMatch(/буцах|Буцах|detail_back_listings|adoptions_back_to_list/);
    }
  });

  it('message detail does not redirect while rendering', () => {
    const message = source('app/messages/[id]/MessageThreadClient.tsx');
    expect(message).not.toContain("router.push('/');");
    expect(message).toContain('Icon name="lock"');
  });

  it('lost and found report forms use semantic steps and inline validation', () => {
    const form = source('components/PetForm.tsx');
    const lost = source('app/report-lost/page.tsx');
    const found = source('app/report-found/page.tsx');
    expect(form).toContain('<fieldset className="form-step">');
    expect(form).toContain('aria-invalid={Boolean(fieldErrors.color)}');
    expect(form).toContain('aria-invalid={Boolean(fieldErrors.place)}');
    expect(form).toContain('aria-invalid={Boolean(fieldErrors.phone)}');
    expect(form).toContain('@media (max-width: 900px)');
    expect(form).not.toContain('style={{');
    expect(form).not.toMatch(/⏳|📍|🎁/);
    expect(lost).toContain('<p className="eyebrow">');
    expect(found).toContain('<p className="eyebrow">');
  });

  it('report form status messages are localized and reusable', () => {
    const hook = source('lib/usePetForm.ts');
    expect(hook).toContain("t('photo_optimizing')");
    expect(hook).toContain("t('location_failed')");
    expect(hook).toContain("t('form_generic_error')");
    expect(hook).not.toContain("'Алдаа гарлаа. Дахин оролдоно уу.'");
  });

  it('adoption listing has labeled filters and stable responsive grids', () => {
    const listing = source('app/adoptions/page.tsx');
    const card = source('components/AdoptionCard.tsx');
    expect(listing).toContain('aria-labelledby="adoption-filters-title"');
    expect(listing).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(listing).toContain('@media (max-width: 1000px)');
    expect(listing).toContain('@media (max-width: 560px)');
    expect(card).not.toContain('role="link"');
    expect(card).toContain('detailHref=');
  });

  it('adoption detail and forms use semantic structure without inline layout styles', () => {
    const detail = source('app/adoptions/[id]/AdoptionDetailClient.tsx');
    const form = source('components/AdoptionForm.tsx');
    const edit = source('components/AdoptionEditForm.tsx');
    expect(detail).toContain('className="adoption-facts"');
    expect(detail).toContain('className="description-block"');
    expect(detail).not.toContain('style={{');
    expect(form).toContain('<fieldset className="form-step">');
    expect(form).toContain('aria-invalid={Boolean(fieldErrors.description)}');
    expect(form).toContain('@media(max-width:900px)');
    expect(form).not.toContain('style={{');
    expect(form).not.toMatch(/⏳|>×</);
    expect(edit).toContain('<form className="edit-form"');
    expect(edit).toContain('aria-invalid');
    expect(edit).not.toContain('style={{');
  });

  it('sitting listing has labeled filters, separate actions and stable responsive grids', () => {
    const listing = source('app/sitting/page.tsx');
    const card = source('components/SittingCard.tsx');
    const cardView = source('components/SittingCardView.tsx');
    expect(listing).toContain('aria-labelledby="sitting-filters-title"');
    expect(listing).toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
    expect(listing).toContain('@media(max-width:1000px)');
    expect(listing).toContain('@media(max-width:560px)');
    expect(card).not.toContain('role="link"');
    expect(card).toContain('detailHref=');
    expect(cardView).toContain('className="card-actions"');
  });

  it('sitting detail, forms and bookings expose semantic error and validation states', () => {
    const detail = source('app/sitting/[id]/SittingDetailClient.tsx');
    const form = source('components/SittingForm.tsx');
    const edit = source('components/SittingEditForm.tsx');
    const booking = source('components/SittingBookingPanel.tsx');
    expect(detail).toContain('className="facts"');
    expect(detail).toContain('className="description-block"');
    expect(detail).not.toContain('style={{');
    expect(form).toContain('aria-invalid={Boolean(fieldErrors.description)}');
    expect(form).toContain('aria-invalid={Boolean(fieldErrors.phone)}');
    expect(form).not.toContain('style={{');
    expect(form).not.toMatch(/⏳|📍/);
    expect(edit).toContain('<form className="edit-form"');
    expect(edit).toContain('aria-invalid');
    expect(edit).not.toContain('style={{');
    expect(booking).toContain('sitting_booking_load_error');
    expect(booking).toContain('aria-labelledby="booking-title"');
    expect(booking).not.toMatch(/★|☆/);
  });

  it('clinic explorer uses labeled filters, separate card actions and responsive map layout', () => {
    const list = source('components/VetClinicList.tsx');
    const card = source('components/ClinicCard.tsx');
    const map = source('components/ClinicMap.tsx');
    expect(list).toContain('aria-labelledby="clinic-filters-title"');
    expect(list).toContain('className="clinic-explorer"');
    expect(list).toContain('@media(max-width:1100px)');
    expect(list).toContain('clinics_data_notice_title');
    expect(list).not.toContain('style={{');
    expect(card).toContain('<article className={`clinic-card');
    expect(card).toContain('aria-pressed={selected}');
    expect(card).not.toContain('role={onSelect ? \'button\'');
    expect(card).not.toContain('style={{');
    expect(map).toContain('aria-label={label');
    expect(map).not.toContain('style={{');
  });

  it('clinic appointments and AI assistant expose complete form and conversation states', () => {
    const modal = source('components/AppointmentModal.tsx');
    const appointments = source('components/AppointmentsSection.tsx');
    const assistant = source('app/assistant/AssistantClient.tsx');
    expect(modal).toContain('<form className="appointment-form"');
    expect(modal).toContain('type="submit"');
    expect(modal).not.toContain('style={{');
    expect(appointments).toContain('className="appointment-skeleton"');
    expect(appointments).toContain("t('err_retry')");
    expect(appointments).not.toContain('style={{');
    expect(assistant).toContain('role="log"');
    expect(assistant).toContain('<textarea');
    expect(assistant).toContain('assistant_input_hint');
    expect(assistant).toContain('assistant_error_title');
    expect(assistant).toContain('aria-pressed=');
    expect(assistant).not.toContain('style={{');
    expect(assistant).not.toMatch(/⚠️|✓/);
  });

  it('messages list exposes semantic tabs, local retry and responsive conversation states', () => {
    const messages = source('app/messages/page.tsx');
    expect(messages).toContain('role="tabpanel"');
    expect(messages).toContain('aria-controls="messages-panel"');
    expect(messages).toContain('className="conversation-skeleton"');
    expect(messages).toContain('onClick={retryLoad}');
    expect(messages).toContain('messages_private_desc');
    expect(messages).toContain('relativeTime(conv.lastMessage.createdAt, lang)');
    expect(messages).toContain('@media(max-width:600px)');
    expect(messages).not.toContain('window.location.reload()');
    expect(messages).not.toContain('style={{');
  });

  it('message detail uses a live log, multiline composer and recoverable send state', () => {
    const thread = source('app/messages/[id]/MessageThreadClient.tsx');
    expect(thread).toContain('role="log"');
    expect(thread).toContain('className="day-divider"');
    expect(thread).toContain('<form className="chat-composer"');
    expect(thread).toContain('<textarea');
    expect(thread).toContain('thread_input_hint');
    expect(thread).toContain('thread_retry_send');
    expect(thread).toContain('aria-busy={sending}');
    expect(thread).toContain('className="thread-skeleton');
    expect(thread).toContain('@media(max-width:700px)');
    expect(thread).not.toContain('style={{');
  });

  it('profile pages expose recoverable, accessible edit and report states', () => {
    const profile = source('components/UserProfileView.tsx');
    const edit = source('app/profile/edit/page.tsx');
    expect(profile).toContain('<Modal');
    expect(profile).toContain('<form className="report-form"');
    expect(profile).toContain('profile_retry');
    expect(profile).not.toContain('window.location.reload');
    expect(profile).not.toContain('window.prompt');
    expect(profile).not.toContain('style={{');
    expect(edit).toContain('<form className="edit-card"');
    expect(edit).toContain('aria-invalid={Boolean(nameError)}');
    expect(edit).toContain('profile_edit_load_error');
    expect(edit).not.toContain('style={{');
  });

  it('my pets uses semantic cards and persisted health details', () => {
    const page = source('app/my-pets/page.tsx');
    const card = source('components/MyPetCard.tsx');
    const panel = source('components/PetHealthPanel.tsx');
    expect(page).toContain('updateVaccineDate');
    expect(page).toContain('<Modal');
    expect(card).toContain('<article className={`pet-card');
    expect(card).toContain('const panelId = `health-panel-${pet.id}`');
    expect(card).toContain('aria-controls={panelId}');
    expect(card).not.toContain('role="button"');
    expect(panel).toContain('id={`health-panel-${pet.id}`}');
    expect(panel).toContain('health_load_error');
    expect(panel).toContain('<form className="profile-form"');
    for (const path of ['app/my-pets/page.tsx', 'components/MyPetCard.tsx', 'components/PetHealthPanel.tsx', 'components/VaccinationsSection.tsx', 'components/ConditionsSection.tsx', 'components/MedicationsSection.tsx']) {
      expect(source(path)).not.toContain('style={{');
    }
  });

  it('saved page localizes complete states and keeps explicit responsive grids', () => {
    const saved = source('app/saved/SavedClient.tsx');
    expect(saved).toContain('saved_favorites_empty');
    expect(saved).toContain('saved_load_error');
    expect(saved).toContain('className="saved-skeleton"');
    expect(saved).toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
    expect(saved).toContain('@media(max-width:960px)');
    expect(saved).toContain('<LoginModal');
    expect(saved).not.toContain('style={{');
  });

  it('notifications expose localized filters, live refresh and recoverable states', () => {
    const notifications = source('app/notifications/NotificationsClient.tsx');
    expect(notifications).toContain('subscribeToNotifications');
    expect(notifications).toContain('className="notification-skeleton"');
    expect(notifications).toContain('aria-pressed={filter ===');
    expect(notifications).toContain('notifications_load_error');
    expect(notifications).toContain('aria-busy={markingAll}');
    expect(notifications).toContain('<LoginModal');
    expect(notifications).not.toContain('style={{');
  });

  it('activity shows localized workflow detail and responsive summaries', () => {
    const activity = source('app/activity/ActivityClient.tsx');
    expect(activity).toContain('STATUS_KEY');
    expect(activity).toContain('activity_summary');
    expect(activity).toContain('dateFormatter.format');
    expect(activity).toContain('priceFormatter.format');
    expect(activity).toContain('className="activity-skeleton"');
    expect(activity).toContain('@media(max-width:980px)');
    expect(activity).not.toContain('style={{');
  });

  it('settings separates action states and confirms deletion in a modal', () => {
    const settings = source('app/settings/page.tsx');
    expect(settings).toContain('<Modal open={showDelete}');
    expect(settings).toContain('<form className="delete-form"');
    expect(settings).toContain('aria-invalid={Boolean(deleteError)}');
    expect(settings).toContain('settings_load_error');
    expect(settings).toContain('const [saving, setSaving]');
    expect(settings).toContain('const [exporting, setExporting]');
    expect(settings).toContain('const [deleting, setDeleting]');
    expect(settings).not.toContain('window.prompt');
    expect(settings).not.toContain('style={{');
  });

  it('admin exposes accessible moderation tabs, recoverable data and safe deletion', () => {
    const admin = source('app/admin/page.tsx');
    const service = source('lib/adminService.ts');
    expect(admin).toContain('role="tablist"');
    expect(admin).toContain('role="tabpanel"');
    expect(admin).toContain('handleTabKeyDown');
    expect(admin).toContain('admin_load_error');
    expect(admin).toContain('<Modal open={Boolean(deleteTarget)}');
    expect(admin).toContain('admin-panel-health');
    expect(admin).toContain('relativeTime(report.createdAt, lang)');
    expect(admin).not.toContain('window.confirm');
    expect(admin).not.toContain('confirm(');
    expect(admin).not.toContain('style={{');
    expect(service).toContain('fetchAdminSystemHealth');
  });

  it('legal and not-found pages provide structured responsive recovery navigation', () => {
    const legal = source('components/LegalContent.tsx');
    const privacy = source('app/privacy/page.tsx');
    const terms = source('app/terms/page.tsx');
    const notFound = source('app/not-found.tsx');
    expect(legal).toContain('className="legal-sidebar"');
    expect(legal).toContain('className="mobile-toc"');
    expect(legal).toContain('aria-label={t(\'legal_toc\')}');
    expect(legal).toContain('scroll-margin-top');
    expect(legal).toContain('mailto:hello@mur.mn');
    expect(legal).not.toContain('⚖️');
    expect(legal).not.toContain('style={{');
    expect(privacy).toContain('kind="privacy"');
    expect(terms).toContain('kind="terms"');
    expect(notFound).toContain('aria-label={t(\'nf_actions_label\')}');
    expect(notFound).toContain("href: '/report-lost'");
    expect(notFound).toContain("href: '/report-found'");
    expect(notFound).toContain('@media(max-width:520px)');
    expect(notFound).not.toContain('style={{');
  });
});

// lib/i18n.js
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export const DICT = {
  mn: {
    nav_lost: 'Алдсан', nav_found: 'Олдсон', nav_listings: 'Жагсаалт',
    nav_mypets: 'Миний амьтад', nav_admin: '🛡️ Админ', nav_login: 'Нэвтрэх',
    nav_logout_prefix: 'Гарах',
    login_title: 'Нэвтрэх', login_email_label: 'Имэйл хаяг',
    login_button: 'Нэвтрэх холбоос авах', login_sent: '✅ Нэвтрэх холбоос имэйл рүү тань илгээгдлээ. Имэйлээ шалгаарай.',
    login_error: 'Алдаа гарлаа. Имэйлээ шалгаад дахин оролдоно уу.', close: 'Хаах',
    hero_eyebrow: '🐾 Улаанбаатараас эхэлж байна',
    hero_title_1: 'Алдсан амьтан', hero_title_accent: 'гэрээ', hero_title_2: 'олж чадна',
    hero_desc: 'Зураг оруулаад, ойр орчмынхонтой шууд холбогдоорой. Нэг платформ дээр мэдэгдэж, хайж, тохируулна.',
    hero_btn_lost: '🐾 Алдсан мэдэгдэх', hero_btn_found: '👀 Олсон зурагтай',
    how_it_works: 'Яаж ажилладаг вэ',
    step1_title: '1. Бүртгэх', step1_desc: 'Зураг, өнгө, газраа оруулна.',
    step2_title: '2. Харах', step2_desc: 'Дүүргээр шүүж, жагсаалт үзнэ.',
    step3_title: '3. Холбогдох', step3_desc: 'Утсаар шууд холбогдоно.',
    report_lost_eyebrow: '🚨 Алдсан амьтан', report_lost_title: 'Мэдээллээ оруулна уу',
    report_lost_desc: 'Зураг оруулах тусам ижил төстэй олдсон бичлэгийг олох магадлал өснө.',
    report_found_eyebrow: '👀 Олсон амьтан', report_found_title: 'Олдсон мэдээллээ оруулна уу',
    report_found_desc: 'Таны оруулсан мэдээлэл эзнийг нь олоход шууд тусална.',
    form_step_photo: 'Зураг', form_step_info: 'Мэдээлэл', form_step_location: 'Байршил', form_step_contact: 'Холбоо барих',
    photo_label: 'Зураг', photo_hint: '📷 Зураг оруулах (заавал биш)', photo_preview_alt: 'Сонгосон зургийн урьдчилсан харагдац',
    name_label: 'Нэр (мэдэх бол)', name_placeholder: 'жишээ: Богино',
    type_label: 'Төрөл', type_dog: 'Нохой', type_cat: 'Муур', type_other: 'Бусад',
    color_label: 'Өнгө *', color_placeholder: 'жишээ: хар халзан',
    locate_btn: '📍 Миний байршлыг ашиглах', locate_loading: '📍 Тодорхойлж байна...',
    district_label: 'Дүүрэг',
    place_label_lost: 'Сүүлд харагдсан газар *', place_label_found: 'Олдсон газар *',
    place_placeholder: 'жишээ: 3-р хороо, дэлгүүрийн ойролцоо',
    map_label: 'Газрын зураг дээр байршил тэмдэглэх', map_optional: '(заавал биш)',
    phone_label: 'Утасны дугаар *', phone_placeholder: '99112233',
    submit_lost: 'Алдсан мэдэгдэл нийтлэх', submit_found: 'Олдсон мэдэгдэл нийтлэх', submitting: 'Илгээж байна...',
    form_back: '← Буцах', form_next: 'Дараах →',
    success_msg: '✅ Амжилттай нийтлэгдлээ! Илүү олон хүн харахын тулд хуваалцаарай:', add_another: 'Дахин нэмэх',
    search_placeholder: '🔍 Нэр, өнгө, байршлаар хайх...',
    filter_all: 'Бүгд', filter_lost: 'Алдсан', filter_found: 'Олдсон', filter_all_districts: 'Бүх дүүрэг',
    listings_title: 'Алдсан ба олдсон амьтад', listings_eyebrow: '🔍 Жагсаалт',
    match_label: 'Өөрийн зурагтай төстэйгээр эрэмбэлэх (туршилт):',
    empty_no_results_title: 'Хайлтад тохирох бичлэг олдсонгүй', empty_no_results_desc: 'Шүүлтүүрээ өөрчилж эсвэл цэвэрлээд дахин үзнэ үү.',
    empty_no_posts_title: 'Одоогоор бичлэг алга', empty_no_posts_desc: 'Хамгийн эхний мэдэгдлийг та нийтэлж болно.',
    detail_type: 'Төрөл:', detail_district: 'Дүүрэг:', detail_place: 'Байршил:',
    detail_show_phone: 'Дугаар харах', detail_resolved_badge: '✅ Энэ амьтан олдсон гэж тэмдэглэгдсэн байна',
    detail_resolve_btn: '✅ Амьтан олдлоо', detail_resolve_confirm: 'Амьтан олдсон гэж тэмдэглэх үү? Энэ бичлэг жагсаалтаас далд болно.',
    detail_edit_btn: '✏️ Засах', detail_delete_btn: '🗑 Устгах', detail_delete_confirm: 'Энэ бичлэгийг бүрмөсөн устгах уу? Энэ үйлдлийг буцаах боломжгүй.',
    detail_save: 'Хадгалах', detail_cancel: 'Цуцлах', detail_saving: 'Хадгалж байна...', detail_deleting: 'Устгаж байна...', detail_resolving: 'Тэмдэглэж байна...',
    detail_share_hint: '📱 Messenger, Viber зэрэгт шууд хуваалцахын тулд "Хуваалцах" товчийг ашиглана уу (гар утсан дээр систем өөрөө боломжит апп-уудыг жагсаана).',
    detail_last_seen_loc: '📍 Сүүлд харагдсан байршил', detail_loading: 'Ачааллаж байна...', detail_not_found: 'Бичлэг олдсонгүй эсвэл устсан байна.',
    share_native: '📤 Хуваалцах', share_fb: 'Facebook-т нийтлэх', share_copy: '🔗 Холбоос хуулах', share_copied: '✅ Хуулагдлаа',
    sightings_title: '👀 Би харсан', sightings_add: '+ Би харсан', sightings_close: 'Хаах',
    sightings_placeholder: 'жишээ: Өчигдөр орой 8 цагийн үед 3-р хорооллын ойролцоо харсан...',
    sightings_place_placeholder: 'Байршил (заавал биш)', sightings_submit: 'Нийтлэх', sightings_submitting: 'Илгээж байна...',
    sightings_none: 'Одоогоор сэтгэгдэл алга.', sightings_thanks: 'Баярлалаа! Сэтгэгдэл нэмэгдлээ.',
    report_btn: '🚩 Энэ бичлэгийг мэдээлэх', report_reason_label: 'Шалтгаан:',
    report_reason_fake: 'Хуурамч мэдээлэл', report_reason_spam: 'Спам', report_reason_inappropriate: 'Зохисгүй агуулга',
    report_reason_duplicate: 'Дахин нийтэлсэн', report_reason_other: 'Бусад', report_thanks: '✅ Мэдээлэл хүлээн авлаа, баярлалаа.',
    mypets_title: 'Вакцины сануулга', mypets_eyebrow: '💉 Миний амьтад',
    mypets_desc: 'Амьтныхаа дараагийн вакцины огноог тэмдэглэ — хугацаа дөхөхөд push мэдэгдэл авна.',
    mypets_login_required: 'Энэ функцийг ашиглахын тулд эхлээд навигац дээрх "Нэвтрэх" товчоор нэвтэрнэ үү.',
    mypets_subscribe: '🔔 Сануулгын мэдэгдэл идэвхжүүлэх', mypets_subscribed: '🔔 Сануулгын мэдэгдэл идэвхтэй',
    mypets_name_ph: 'Амьтны нэр', mypets_add: '+ Нэмэх', mypets_none: 'Одоогоор амьтан бүртгээгүй байна.',
    mypets_delete: 'Устгах',
    status_overdue: '⚠️ Хугацаа хэтэрсэн', status_soon: '🔔 Удахгүй болно', status_ok: '✅ Хэвийн', status_none: 'Огноо тохируулаагүй',
    admin_restricted_eyebrow: '🔒 Хязгаарлагдмал хуудас', admin_no_access: 'Танд энэ хуудсанд орох эрх байхгүй',
    admin_login_required: 'Энэ хуудсанд орохын тулд нэвтэрнэ үү.',
    admin_eyebrow: '🛡️ Модератор', admin_title: 'Мэдээлэгдсэн бичлэгүүд', admin_none: 'Одоогоор мэдээлэл алга. 👍',
    admin_pet_deleted: 'Анхны бичлэг устсан байна', admin_dismiss: 'Үл хэрэгсэх', admin_delete_pet: 'Бичлэг устгах',

    donate_title: '💛 МӨР-ийг дэмжих', donate_close: 'Хаах',
    donate_intro: 'Таны хандив сервер, домэйн зэрэг зардлыг санхүүжүүлэхэд зарцуулагдана. Баярлалаа! 🙏',
    donate_min_error: 'Хамгийн багадаа 1,000₮',
    donate_custom_label: 'Өөр дүн', donate_custom_ph: 'Дурын дүн (₮)',
    donate_name_label: 'Нэр (заавал биш)', donate_name_ph: 'Нэрээ бичих',
    donate_message_label: 'Мессеж (заавал биш)', donate_message_ph: 'Урам зориг өгөх үг...',
    donate_anonymous: 'Нэргүйгээр хандивлах', donate_pay_btn: 'QPay-ээр төлөх',
    donate_generating: '⏳ Нэхэмжлэл үүсгэж байна...',
    donate_invoice_created: 'дүнтэй нэхэмжлэл үүслээ', donate_qr_alt: 'QPay QR код',
    donate_scan_hint: 'Банкны апп-аараа QR кодыг уншуулж төлнө үү',
    donate_checking: 'Төлбөрийг автоматаар шалгаж байна...',
    donate_thanks: 'Баярлалаа!', donate_paid_hint: 'хандив амжилттай хийгдлээ.',
    donate_retry: 'Дахин оролдох', donate_generic_error: 'Алдаа гарлаа', donate_btn: '💛 Дэмжих',
  },
  en: {
    nav_lost: 'Lost', nav_found: 'Found', nav_listings: 'Listings',
    nav_mypets: 'My Pets', nav_admin: '🛡️ Admin', nav_login: 'Log in',
    nav_logout_prefix: 'Log out',
    login_title: 'Log in', login_email_label: 'Email address',
    login_button: 'Send login link', login_sent: '✅ A login link has been sent to your email. Please check your inbox.',
    login_error: 'Something went wrong. Please check your email and try again.', close: 'Close',
    hero_eyebrow: '🐾 Starting in Ulaanbaatar',
    hero_title_1: 'A lost pet', hero_title_accent: 'can find', hero_title_2: 'its way home',
    hero_desc: 'Upload a photo and connect directly with people nearby. Post, search, and coordinate all in one place.',
    hero_btn_lost: '🐾 Report lost pet', hero_btn_found: '👀 Report found pet',
    how_it_works: 'How it works',
    step1_title: '1. Post', step1_desc: 'Add a photo, color, and location.',
    step2_title: '2. Browse', step2_desc: 'Filter by district, view listings.',
    step3_title: '3. Connect', step3_desc: 'Reach out directly by phone.',
    report_lost_eyebrow: '🚨 Lost pet', report_lost_title: 'Enter the details',
    report_lost_desc: 'The more photos you add, the better the chance of finding a match.',
    report_found_eyebrow: '👀 Found pet', report_found_title: 'Enter the details of the found pet',
    report_found_desc: 'Your information will directly help find the owner.',
    form_step_photo: 'Photo', form_step_info: 'Details', form_step_location: 'Location', form_step_contact: 'Contact',
    photo_label: 'Photo', photo_hint: '📷 Upload a photo (optional)', photo_preview_alt: 'Preview of selected photo',
    name_label: 'Name (if known)', name_placeholder: 'e.g. Buddy',
    type_label: 'Type', type_dog: 'Dog', type_cat: 'Cat', type_other: 'Other',
    color_label: 'Color *', color_placeholder: 'e.g. black and white',
    locate_btn: '📍 Use my location', locate_loading: '📍 Locating...',
    district_label: 'District',
    place_label_lost: 'Last seen location *', place_label_found: 'Found location *',
    place_placeholder: 'e.g. near the shop, khoroo 3',
    map_label: 'Mark the location on the map', map_optional: '(optional)',
    phone_label: 'Phone number *', phone_placeholder: '99112233',
    submit_lost: 'Post lost pet', submit_found: 'Post found pet', submitting: 'Submitting...',
    form_back: '← Back', form_next: 'Next →',
    success_msg: '✅ Posted successfully! Share it to reach more people:', add_another: 'Add another',
    search_placeholder: '🔍 Search by name, color, location...',
    filter_all: 'All', filter_lost: 'Lost', filter_found: 'Found', filter_all_districts: 'All districts',
    listings_title: 'Lost and found pets', listings_eyebrow: '🔍 Listings',
    match_label: 'Rank by similarity to your photo (beta):',
    empty_no_results_title: 'No matching results', empty_no_results_desc: 'Try changing or clearing your filters.',
    empty_no_posts_title: 'No posts yet', empty_no_posts_desc: 'You could be the first to post.',
    detail_type: 'Type:', detail_district: 'District:', detail_place: 'Location:',
    detail_show_phone: 'Show number', detail_resolved_badge: '✅ This pet has been marked as found',
    detail_resolve_btn: '✅ Pet found', detail_resolve_confirm: 'Mark this pet as found? This post will be hidden from listings.',
    detail_edit_btn: '✏️ Edit', detail_delete_btn: '🗑 Delete', detail_delete_confirm: 'Permanently delete this post? This cannot be undone.',
    detail_save: 'Save', detail_cancel: 'Cancel', detail_saving: 'Saving...', detail_deleting: 'Deleting...', detail_resolving: 'Updating...',
    detail_share_hint: '📱 Use the "Share" button to send directly via Messenger, Viber, etc. (your device will show available apps).',
    detail_last_seen_loc: '📍 Last seen location', detail_loading: 'Loading...', detail_not_found: 'Post not found or has been removed.',
    share_native: '📤 Share', share_fb: 'Post to Facebook', share_copy: '🔗 Copy link', share_copied: '✅ Copied',
    sightings_title: '👀 I saw this', sightings_add: '+ I saw this', sightings_close: 'Close',
    sightings_placeholder: 'e.g. Saw it near khoroo 3 yesterday around 8pm...',
    sightings_place_placeholder: 'Location (optional)', sightings_submit: 'Post', sightings_submitting: 'Submitting...',
    sightings_none: 'No sightings yet.', sightings_thanks: 'Thank you! Your sighting has been added.',
    report_btn: '🚩 Report this post', report_reason_label: 'Reason:',
    report_reason_fake: 'False information', report_reason_spam: 'Spam', report_reason_inappropriate: 'Inappropriate content',
    report_reason_duplicate: 'Duplicate post', report_reason_other: 'Other', report_thanks: '✅ Thanks, we received your report.',
    mypets_title: 'Vaccine reminders', mypets_eyebrow: '💉 My Pets',
    mypets_desc: "Set your pet's next vaccine date -- you'll get a push notification as it approaches.",
    mypets_login_required: 'Please log in using the "Log in" button in the navigation to use this feature.',
    mypets_subscribe: '🔔 Enable reminder notifications', mypets_subscribed: '🔔 Reminder notifications enabled',
    mypets_name_ph: 'Pet name', mypets_add: '+ Add', mypets_none: 'No pets registered yet.',
    mypets_delete: 'Delete',
    status_overdue: '⚠️ Overdue', status_soon: '🔔 Coming up', status_ok: '✅ On track', status_none: 'No date set',
    admin_restricted_eyebrow: '🔒 Restricted page', admin_no_access: 'You do not have access to this page',
    admin_login_required: 'Please log in to access this page.',
    admin_eyebrow: '🛡️ Moderator', admin_title: 'Reported posts', admin_none: 'No reports right now. 👍',
    admin_pet_deleted: 'The original post has been removed', admin_dismiss: 'Dismiss', admin_delete_pet: 'Delete post',
    admin_pet_deleted: 'The original post has been removed', admin_dismiss: 'Dismiss', admin_delete_pet: 'Delete post',

    donate_title: '💛 Support МӨР', donate_close: 'Close',
    donate_intro: 'Your donation helps cover server, domain, and development costs. Thank you! 🙏',
    donate_min_error: 'Minimum amount is 1,000₮',
    donate_custom_label: 'Custom amount', donate_custom_ph: 'Any amount (₮)',
    donate_name_label: 'Name (optional)', donate_name_ph: 'Your name',
    donate_message_label: 'Message (optional)', donate_message_ph: 'A few words of encouragement...',
    donate_anonymous: 'Donate anonymously', donate_pay_btn: 'Pay with QPay',
    donate_generating: '⏳ Creating invoice...',
    donate_invoice_created: 'invoice created', donate_qr_alt: 'QPay QR code',
    donate_scan_hint: 'Scan the QR code with your banking app to pay',
    donate_checking: 'Automatically checking payment status...',
    donate_thanks: 'Thank you!', donate_paid_hint: 'donation was successful.',
    donate_retry: 'Try again', donate_generic_error: 'Something went wrong', donate_btn: '💛 Support',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('mn');

  useEffect(() => {
    const saved = localStorage.getItem('mur-lang');
    if (saved === 'en' || saved === 'mn') setLang(saved);
  }, []);

  function toggle() {
    const next = lang === 'mn' ? 'en' : 'mn';
    setLang(next);
    localStorage.setItem('mur-lang', next);
  }

  function t(key) {
    return DICT[lang][key] || DICT.mn[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage нь LanguageProvider дотор ашиглагдах ёстой');
  return ctx;
}

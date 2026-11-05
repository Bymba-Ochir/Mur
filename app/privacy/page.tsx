import type { Metadata } from 'next';
import LegalContent from '../../components/LegalContent';
import type { LegalDoc } from '../../components/LegalContent';

export const metadata: Metadata = {
  title: 'Нууцлалын бодлого | МӨР',
  description: 'МӨР платформ хувийн мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалдаг талаарх нууцлалын бодлого.',
};

const PRIVACY_MN: LegalDoc = {
  title: 'Нууцлалын бодлого',
  updated: '2026 оны 11-р сарын 5',
  sections: [
    {
      heading: '1. Танилцуулга',
      paragraphs: [
        'МӨР платформ ("бид", "МӨР") нь Улаанбаатар хотод алдсан, олдсон гэрийн тэжээвэр амьтныг олоход туслах үйлчилгээ юм. Энэхүү бодлого нь таны хувийн мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалж байгааг тайлбарлана.',
        'Үйлчилгээг ашигласнаар та энэхүү бодлогыг хүлээн зөвшөөрч байгаа болно. Бодлогод өөрчлөлт орвол энэ хуудсанд шинэчилсэн огноотой нийтлэгдэнэ.',
      ],
    },
    {
      heading: '2. Бидний цуглуулдаг мэдээлэл',
      paragraphs: [
        'Таны нийтэлсэн мэдээлэл: Зар үүсгэхдээ амьтны тухай мэдээлэл, зураг, байршил болон холбоо барих сонголтоо оруулна. Зарын мэдээлэл олон нийтэд харагдана. Алдсан/олдсон, үрчлүүлэх, асрах бүх төрлийн зарт «Утсаа нуух — зөвхөн чатаар холбогдох» сонголт бий. Утсаа нуусан бол дугаар оруулах шаардлагагүй; өмнө оруулсан дугаарыг нийтэд харуулахгүй, хамгаалагдсан хэсэгт хадгална.',
        'Нэвтрэлтийн мэдээлэл: Нэвтрэхдээ имэйл хаягаа оруулна. Нууц үг бидэнд хадгалагдахгүй — зөвхөн нэг удаагийн нэвтрэх холбоос имэйлээр илгээгдэнэ.',
        'Байршлын мэдээлэл: Таны зөвшөөрлөөр төхөөрөмжийн байршлыг авч дүүрэг болон газрын зургийн цэгийг бөглөж болно. Зар нийтлэхэд сонгосон газрын тайлбар, дүүрэг, координат зартай хамт хадгалагдаж, олон нийтэд харагдана. Нийтлэхийн өмнө цэгээ шалгаж, гэрийнхээ нарийн байршлыг хуваалцах эсэхээ шийднэ үү.',
        'Төхөөрөмжийн мэдээлэл: Хэрэв та мэдэгдэл хүлээн авахаар бүртгүүлбэл push subscription мэдээлэл (төхөөрөмжийн түлхүүр) хадгалагдана.',
        'Үйл ажиллагааны мэдээлэл: Үрчлүүлэх хүсэлт, асрах захиалга, үйлчилгээний үнэлгээ болон тэдгээрийн төлөвийг үйлчилгээ үзүүлэх, маргаан шалгах зорилгоор хадгална.',
        'Хадгалсан мэдээлэл: Таны хадгалсан зар, хайлтын шүүлтүүр болон тохирох шинэ зарын мэдэгдлийг зөвхөн таны бүртгэлтэй холбож хадгална.',
        'Хөтчийн хадгалалт: Хэл, харагдах байдал, хэмжилтийн зөвшөөрөл зэрэг сонголтыг энэ хөтөч дотор хадгална. Зар оруулах ноорог, сонгосон зураг, талбар болон байршил төхөөрөмжийн хөтөч дотор хадгалагдаж, ноорог 7 хоногийн хугацаатай байна. Хөтчийн сайтын хадгалалтыг цэвэрлэвэл эдгээр локал мэдээлэл устна.',
        'Зурвас: Харилцан холбогдохын тулд илгээсэн зурвас, харилцагч болон уншсан төлөвийг хадгална. Чатыг тухайн харилцан ярианы оролцогчид үзнэ.',
        'Санал хүсэлт: МӨР-ийг сайжруулахад ашиглахын тулд таны бичсэн санал, сонгосон төрөл, хуудасны ерөнхий хэсэг болон илгээсэн хугацааг хадгална. Саналыг бүртгэлтэй тань холбохгүй. Саналуудыг МӨР-ийн админууд уншина.',
      ],
    },
    {
      heading: '3. Мэдээллийг хэрхэн ашигладаг вэ',
      paragraphs: [
        'Оруулсан бичлэгийн мэдээллийг алдсан/олдсон амьтныг олоход туслах, ижил төстэй бичлэгүүдийг санал болгох (зургийн дүн шинжилгээ), тухайн дүүргийн хэрэглэгчдэд мэдэгдэл илгээхэд ашиглана.',
        'Таны имэйл хаягийг зөвхөн нэвтрэх холбоос илгээхэд ашиглана. Имэйл хаягийг сурталчилгаанд ашиглахгүй.',
      ],
    },
    {
      heading: '4. Мэдээллийг хэн хардаг вэ',
      paragraphs: [
        'Нийтэлсэн зарын зураг, тайлбар, байршил олон нийтэд харагдана. Утасны дугаар зөвхөн та нуух сонголтыг унтрааж нийтэлсэн үед ил харагдана. Нуусан дугаараа зар засах хэсэгт өөрөө харах боломжтой. Чатаар утас болон бусад хувийн мэдээллээ өөрөө илгээвэл харилцагч тань харна.',
        'Платформын модератор/админ нь буруу мэдээлэл, спам, зохисгүй агуулгыг шалгах зорилгоор бичлэгүүдийг үзэх боломжтой.',
        'Таны имэйл болон мэдэгдлийн бүртгэл зөвхөн танд болон техникийн операторуудад харагдана.',
      ],
    },
    {
      heading: '5. Гуравдагч талын үйлчилгээ',
      paragraphs: [
        'Бид Supabase (бүртгэл, мэдээлэл, зураг, чат), Vercel (хостинг), QPay (хандивын төлбөр), Hugging Face (зургийн шинжилгээний загвар татах), OpenStreetMap (газрын зураг) үйлчилгээг ашиглана. AI зөвлөхийн Groq холболт идэвхтэй үед таны асуулт болон сонгосон амьтны тухай мэдээллийг хариулт боловсруулахын тулд Groq руу дамжуулна. Асуултдаа нууц үг, төлбөрийн мэдээлэл болон бусдын хувийн мэдээллийг оруулахгүй байна уу.',
        'Алдааг оношлоход Sentry ашиглана. Алдааны техникийн мэдээллийг илгээхээс өмнө имэйл, утас, token зэрэг мэдээллийг шүүх тохиргоо ашигладаг. Хэрэглээний хэмжилтийг зөвшөөрсөн үед Vercel Analytics болон Speed Insights-д хуудасны хэрэглээ, гүйцэтгэлийн мэдээлэл дамжуулна. Зөвшөөрлийн сонголтыг энэ хөтчийн хадгалалтад бүртгэнэ.',
        'Эдгээр үйлчилгээ тус бүр өөрийн нууцлалын бодлоготой бөгөөд та тэдгээрийг танилцахыг уриалж байна.',
      ],
    },
    {
      heading: '6. Хадгалалт, аюулгүй байдал',
      paragraphs: [
        'Мэдээллийг SSL шифрлэлт болон хандалтын хяналттай сервер дээр хадгална. Гэхдээ интернетээр дамжих ямар ч дамжуулалт 100% аюулгүй гэдэг баталгаа байхгүй тул мэдээллээ болгоомжтой оруулна уу.',
        'Бид таны мэдээллийг худалдаж, зарж, гуравдагч этгээдэд түрээслэхгүй.',
      ],
    },
    {
      heading: '7. Таны эрх ба сонголтууд',
      paragraphs: [
        'Та өөрийн зарыг засах, устгах, утсаа нуух эсвэл ил болгох боломжтой. Зарыг устгасны дараа холбогдох зургийг тусдаа цэвэрлэгээний ажил устгана; техникийн алдаа гарвал дахин оролдож болох тул зураг цэвэрлэхэд хугацаа шаардагдаж болно.',
        'Та Тохиргоо хэсгээс танилцуулга болон үйл ажиллагааны мэдээллээ JSON файлаар татах, бүртгэл болон нийтэлсэн мэдээллээ бүрмөсөн устгах боломжтой.',
        'Байршил, push мэдэгдэл зэрэг зөвшөөрлөө хөтчийн тохиргооноос хүссэн үедээ цуцлах боломжтой.',
      ],
    },
    {
      heading: '8. Холбоо барих',
      paragraphs: [
        'Нууцлалын талаарх асуулт, хүсэлтээ «Санал хүсэлт» товчоор МӨР-ийн админд илгээнэ үү. Энэ суваг бүртгэлтэй тань автоматаар холбогдохгүй тул өөрийн мэдээллээ татах, бүртгэлээ устгах бол нэвтэрсний дараа Тохиргоо хэсгийг ашиглана уу. Нууц үг, нэвтрэх холбоос, төлбөрийн мэдээлэл бүү илгээгээрэй.',
      ],
    },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: 'Privacy Policy',
  updated: 'November 5, 2026',
  sections: [
    {
      heading: '1. Introduction',
      paragraphs: [
        'The МӨР platform ("we", "МӨР") is a service that helps reunite lost and found pets in Ulaanbaatar. This policy explains how we collect, use, and protect your personal information.',
        'By using the service, you agree to this policy. If we change this policy, it will be posted here with an updated date.',
      ],
    },
    {
      heading: '2. Information we collect',
      paragraphs: [
        'Information you post: When creating a listing, you provide pet details, photos, location, and contact preferences. Listing details are public. Lost/found, adoption, and sitting listings all offer Hide phone — contact by chat only. With this option enabled, a phone number is optional; any previously supplied number is kept in protected storage and hidden from the public.',
        'Account information: When logging in, you provide your email address. We do not store passwords — a one-time login link is sent to your email.',
        'Location information: With your permission, device location can fill the district and map marker. Publishing a listing stores the selected location description, district, and coordinates with the public listing. Check the marker before posting and decide whether to disclose your exact home location.',
        'Device information: If you subscribe to notifications, we store your push subscription data (device key).',
        'Activity information: We store adoption applications, sitting bookings, service reviews, and their statuses to provide the service and investigate disputes.',
        'Saved information: Saved listings, search filters, and matching-listing notifications are stored only in connection with your account.',
        'Browser storage: Preferences such as language, appearance, and analytics consent are saved in this browser. Listing drafts, selected photos, fields, and locations are saved locally in the browser with a seven-day draft expiry. Clearing site storage removes this local information.',
        'Messages: We store chat messages, participants, and read status to support communication. A conversation is visible to its participants.',
        'Feedback: To improve Mur, we store your message, selected category, general page area, and submission time. Feedback is stored without a link to your account. Mur administrators can read submissions.',
      ],
    },
    {
      heading: '3. How we use your information',
      paragraphs: [
        'Listing information is used to help find lost/found pets, suggest similar listings (photo analysis), and send notifications to users in the relevant district.',
        'Your email address is used only to send login links. We do not use your email for promotional marketing.',
      ],
    },
    {
      heading: '4. Who can see your information',
      paragraphs: [
        'Published listing photos, descriptions, and locations are public. Your phone number is public only when you publish it with the hide-phone option turned off. You can view your hidden number when editing your own listing. If you share your phone number or other personal information in a chat, the recipient can see it.',
        'Platform moderators/admins may view listings to check for false information, spam, or inappropriate content.',
        'Your email and notification subscriptions are visible only to you and our technical operators.',
      ],
    },
    {
      heading: '5. Third-party services',
      paragraphs: [
        'We use Supabase (accounts, data, photos, and chat), Vercel (hosting), QPay (donation payments), Hugging Face (downloading photo-analysis models), and OpenStreetMap (maps). When the Groq integration for the AI assistant is enabled, your question and selected pet context are sent to Groq to generate a response. Do not include passwords, payment details, or other people’s personal information in your question.',
        'We use Sentry to diagnose errors and apply filters for information such as email addresses, phone numbers, and tokens before sending technical error reports. With your analytics consent, Vercel Analytics and Speed Insights receive page usage and performance information. Your consent choice is saved in this browser.',
        'Each of these services has its own privacy policy, which we encourage you to review.',
      ],
    },
    {
      heading: '6. Storage and security',
      paragraphs: [
        'Data is stored on servers with SSL encryption and access controls. However, no transmission over the internet can be guaranteed 100% secure, so please share information carefully.',
        'We never sell, rent, or share your information with third parties for their own purposes.',
      ],
    },
    {
      heading: '7. Your rights and choices',
      paragraphs: [
        'You can edit or delete your own listings and hide or publish your phone number. After a listing is deleted, a separate cleanup job removes its associated photos. Technical failures may require retries, so photo cleanup can take time.',
        'From Settings, you can download your profile and activity data as JSON or permanently delete your account and associated content.',
        'You can revoke permissions such as location and push notifications at any time in your browser settings.',
      ],
    },
    {
      heading: '8. Contact us',
      paragraphs: [
        'Send privacy questions or requests to Mur administrators using the Feedback button. Feedback is not automatically linked to your account. To export your data or delete your account, sign in and use Settings. Do not send passwords, sign-in links, or payment details.',
      ],
    },
  ],
};

export default function PrivacyPage() {
  return <LegalContent mn={PRIVACY_MN} en={PRIVACY_EN} kind="privacy" />;
}

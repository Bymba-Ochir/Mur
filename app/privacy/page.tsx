import type { Metadata } from 'next';
import LegalContent from '../../components/LegalContent';
import type { LegalDoc } from '../../components/LegalContent';

export const metadata: Metadata = {
  title: 'Нууцлалын бодлого | МӨР',
};

const PRIVACY_MN: LegalDoc = {
  title: 'Нууцлалын бодлого',
  updated: 'Сүүлд шинэчилсэн: 2026 оны 8-р сар',
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
        'Таны нийтэлсэн мэдээлэл: Бичлэг бүртгэхдээ та амьтны нэр, төрөл, өнгө, алдагдсан/олдсон газар, дүүрэг, зураг болон холбоо барих утасны дугаараа оруулна. Эдгээр нь олон нийтэд харагдах болно.',
        'Нэвтрэлтийн мэдээлэл: Нэвтрэхдээ имэйл хаягаа оруулна. Нууц үг бидэнд хадгалагдахгүй — зөвхөн нэг удаагийн нэвтрэх холбоос имэйлээр илгээгдэнэ.',
        'Байршлын мэдээлэл: Хэрэв та зөвшөөрвөл байршлаа тодорхойлж, дүүргээ автоматаар бөглөх боломжтой. Байршил нь зөвхөн тэр мөчид ашиглагдаж, хадгалагдахгүй.',
        'Төхөөрөмжийн мэдээлэл: Хэрэв та мэдэгдэл хүлээн авахаар бүртгүүлбэл push subscription мэдээлэл (төхөөрөмжийн түлхүүр) хадгалагдана.',
      ],
    },
    {
      heading: '3. Мэдээллийг хэрхэн ашигладаг вэ',
      paragraphs: [
        'Оруулсан бичлэгийн мэдээллийг алдсан/олдсон амьтныг олоход туслах, ижил төстэй бичлэгүүдийг санал болгох (зургийн дүн шинжилгээ), тухайн дүүргийн хэрэглэгчдэд мэдэгдэл илгээхэд ашиглана.',
        'Таны имэйл хаягийг зөвхөн нэвтрэх холбоос илгээхэд ашиглана. Имэйлээ санал болгох маркетинг-д ашиглахгүй.',
      ],
    },
    {
      heading: '4. Мэдээллийг хэн хардаг вэ',
      paragraphs: [
        'Нийтэлсэн бичлэг (зураг, байршил, утасны дугаар зэрэг) олон нийтэд нээлттэй байна. Та олон нийтэд харагдахад зөвшөөрөх мэдээллийг л оруулна уу.',
        'Платформын модератор/админ нь буруу мэдээлэл, спам, зохисгүй агуулгыг шалгах зорилгоор бичлэгүүдийг үзэх боломжтой.',
        'Таны имэйл болон мэдэгдлийн бүртгэл зөвхөн танд болон техникийн операторуудад харагдана.',
      ],
    },
    {
      heading: '5. Гуравдагч талын үйлчилгээ',
      paragraphs: [
        'Бид өгөгдөл хадгалалт, хостинг, төлбөр, зургийн дүн шинжилгээ, газрын зураг зэрэгт дараах гуравдагч талын үйлчилгээг ашиглана: Supabase (мэдээлэл хадгалалт), Vercel (хостинг), QPay (хандивын төлбөр), Hugging Face (зургийн AI шинжилгээ), OpenStreetMap (газрын зураг).',
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
        'Та өөрийн бичлэгийг засах, устгах боломжтой. Бичлэг устгаснаар холбогдох зураг, мэдээлэл устгагдана.',
        'Байршил, push мэдэгдэл зэрэг зөвшөөрлөө browser-ийн тохиргооноос хүссэн үедээ цуцлах боломжтой.',
      ],
    },
    {
      heading: '8. Холбоо барих',
      paragraphs: [
        'Нууцлалын талаарх асуулт, хүсэлтээ дараах имэйл хаягаар илгээнэ үү: hello@mur.mn',
      ],
    },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: 'Privacy Policy',
  updated: 'Last updated: August 2026',
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
        'Information you post: When creating a listing, you provide the pet\'s name, type, color, location where it was lost/found, district, a photo, and a contact phone number. This information is visible to the public.',
        'Account information: When logging in, you provide your email address. We do not store passwords — a one-time login link is sent to your email.',
        'Location information: If you allow it, we can determine your location to auto-fill your district. The location is used only at that moment and is not stored.',
        'Device information: If you subscribe to notifications, we store your push subscription data (device key).',
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
        'Published listings (including photos, location, and phone number) are publicly visible. Please only share information you are comfortable making public.',
        'Platform moderators/admins may view listings to check for false information, spam, or inappropriate content.',
        'Your email and notification subscriptions are visible only to you and our technical operators.',
      ],
    },
    {
      heading: '5. Third-party services',
      paragraphs: [
        'We use the following third-party services for data storage, hosting, payments, photo analysis, and maps: Supabase (data storage), Vercel (hosting), QPay (donation payments), Hugging Face (photo AI analysis), OpenStreetMap (maps).',
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
        'You can edit or delete your own listings. Deleting a listing removes its associated photo and information.',
        'You can revoke permissions such as location and push notifications at any time in your browser settings.',
      ],
    },
    {
      heading: '8. Contact us',
      paragraphs: [
        'For any questions or requests regarding privacy, please contact us at: hello@mur.mn',
      ],
    },
  ],
};

export default function PrivacyPage() {
  return <LegalContent mn={PRIVACY_MN} en={PRIVACY_EN} />;
}

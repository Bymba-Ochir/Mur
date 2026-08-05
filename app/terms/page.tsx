import type { Metadata } from 'next';
import LegalContent from '../../components/LegalContent';
import type { LegalDoc } from '../../components/LegalContent';

export const metadata: Metadata = {
  title: 'Үйлчилгээний нөхцөл | МӨР',
};

const TERMS_MN: LegalDoc = {
  title: 'Үйлчилгээний нөхцөл',
  updated: 'Сүүлд шинэчилсэн: 2026 оны 8-р сар',
  sections: [
    {
      heading: '1. Хүлээн зөвшөөрөх',
      paragraphs: [
        'МӨР платформ ("МӨР", "бид")-ийг ашигласнаар та эдгээр нөхцөлийг хүлээн зөвшөөрч байна. Хэрэв та 18 насанд хүрээгүй бол эцэг эх эсвэл асран хамгаалагчийн зөвшөөрөлтэйгээр ашиглана уу.',
      ],
    },
    {
      heading: '2. Үйлчилгээний тайлбар',
      paragraphs: [
        'МӨР нь Улаанбаатар хотод алдсан, олдсон гэрийн тэжээвэр амьтны тухай мэдээллийг нийтэлж, хайж, холбогдох боломжийг олгодог платформ юм. Үйлчилгээ нь "байгаагаар нь" (as-is) үзүүлэгдэнэ.',
      ],
    },
    {
      heading: '3. Хэрэглэгчийн үүрэг',
      paragraphs: [
        'Та зөвхөн үнэн зөв мэдээлэл оруулах үүрэгтэй. Таны оруулсан зураг, мэдээлэл таны өмч эсвэл танд ашиглах эрх байх ёстой.',
        'Оруулсан утасны дугаар, байршил бодит байх ёстой. Бусдын хувийн мэдээллийг зөвшөөрөлгүйгээр нийтлэхийг хориглоно.',
      ],
    },
    {
      heading: '4. Хориглосон үйлдэл',
      paragraphs: [
        'Дараах үйлдлийг хориглоно: хуурамч мэдэгдэл гаргах, спам, дарамтлах, зохисгүй эсвэл хууль бус агуулга нийтлэх, системийг эвдэх, автомат скриптээр ашиглах, бусдын бичлэгийг дур зоргоор устгах.',
        'Зөрчсөн тохиолдолд бид бичлэгийг устгах, бүртгэлийг хаах эрхтэй.',
      ],
    },
    {
      heading: '5. Контентын эрх',
      paragraphs: [
        'Та нийтэлсэн бичлэгийнхээ эрхийг хадгална. Гэхдээ үйлчилгээг ажиллуулах, сайжруулах зорилгоор бичлэгээ платформ дээр хадгалах, харуулах, боловсруулах (зургийн дүн шинжилгээ гэх мэт) зөвшөөрлийг бидэнд олгоно.',
      ],
    },
    {
      heading: '6. Модераци ба устгах',
      paragraphs: [
        'Бид буруу мэдээлэл, зохисгүй агуулгыг хэрэглэгчийн мэдээллээр дамжуулан шалгаж, устгах боломжтой. Модераторын шийдвэр эцсийнх.',
      ],
    },
    {
      heading: '7. Гуравдагч талын үйлчилгээ',
      paragraphs: [
        'Хандив (QPay), газрын зураг (OpenStreetMap), AI шинжилгээ (Hugging Face) зэрэг гуравдагч талын үйлчилгээг ашиглахдаа тэдгээрийн тусгай нөхцөл үйлчилнэ. Бид тэдгээрийн үйл ажиллагаанд хариуцлага хүлээхгүй.',
      ],
    },
    {
      heading: '8. Холбогдох хууль',
      paragraphs: [
        'Эдгээр нөхцөл Монгол Улсын хуулийн дагуу тайлбарлагдаж, зохицуулагдана.',
      ],
    },
    {
      heading: '9. Хариуцлагын хязгаар',
      paragraphs: [
        'Платформ нь алдсан амьтныг олох баталгаа өгөхгүй. Бид хэрэглэгчдийн хоорондын гэрээ, холбоо барилт, маргаанд хариуцлага хүлээхгүй. Хуулиар зөвшөөрөгдөх дээд хэмжээгээр шууд болон шууд бус хохирлыг хариуцахгүй.',
      ],
    },
    {
      heading: '10. Нөхцөл өөрчлөгдөх',
      paragraphs: [
        'Бид эдгээр нөхцөлийг хүссэн үедээ өөрчлөх эрхтэй. Өөрчлөлт энэ хуудсанд нийтлэгдэх үеэс хүчинтэй болно. Үйлчилгээг үргэлжлүүлэн ашигласнаар шинэчилсэн нөхцөлийг хүлээн зөвшөөрч байгаа болно.',
      ],
    },
    {
      heading: '11. Холбоо барих',
      paragraphs: [
        'Нөхцөл, үйлчилгээний талаарх асуултаа дараах имэйл хаягаар илгээнэ үү: hello@mur.mn',
      ],
    },
  ],
};

const TERMS_EN: LegalDoc = {
  title: 'Terms of Service',
  updated: 'Last updated: August 2026',
  sections: [
    {
      heading: '1. Acceptance of terms',
      paragraphs: [
        'By using the МӨР platform ("МӨР", "we"), you agree to these terms. If you are under 18, you must use the service with the consent of a parent or guardian.',
      ],
    },
    {
      heading: '2. Description of service',
      paragraphs: [
        'МӨР is a platform that lets people in Ulaanbaatar post, search, and coordinate around lost and found pets. The service is provided on an "as-is" basis.',
      ],
    },
    {
      heading: '3. User responsibilities',
      paragraphs: [
        'You are responsible for posting accurate information. Any photo or information you upload must be yours or used with permission.',
        'Phone numbers and locations must be genuine. Posting other people\'s personal information without consent is prohibited.',
      ],
    },
    {
      heading: '4. Prohibited conduct',
      paragraphs: [
        'The following are prohibited: posting false reports, spamming, harassment, posting inappropriate or illegal content, tampering with the system, using automated scripts, and arbitrarily deleting others\' listings.',
        'If you violate these rules, we may remove your listings and revoke your account.',
      ],
    },
    {
      heading: '5. Content rights',
      paragraphs: [
        'You retain ownership of the content you post. By posting, you grant us permission to store, display, and process your listings (including photo analysis) in order to operate and improve the service.',
      ],
    },
    {
      heading: '6. Moderation and removal',
      paragraphs: [
        'We may review and remove listings reported for false or inappropriate content. Moderator decisions are final.',
      ],
    },
    {
      heading: '7. Third-party services',
      paragraphs: [
        'When using third-party services such as QPay (donations), OpenStreetMap (maps), and Hugging Face (AI analysis), their respective terms apply. We are not responsible for their operation.',
      ],
    },
    {
      heading: '8. Governing law',
      paragraphs: [
        'These terms are governed by and interpreted in accordance with the laws of Mongolia.',
      ],
    },
    {
      heading: '9. Limitation of liability',
      paragraphs: [
        'The platform does not guarantee that a lost pet will be found. We are not responsible for agreements, communications, or disputes between users. To the maximum extent permitted by law, we are not liable for direct or indirect damages.',
      ],
    },
    {
      heading: '10. Changes to these terms',
      paragraphs: [
        'We may update these terms at any time. Changes take effect once posted on this page. Continued use of the service constitutes acceptance of the updated terms.',
      ],
    },
    {
      heading: '11. Contact us',
      paragraphs: [
        'For questions about these terms or the service, please contact us at: hello@mur.mn',
      ],
    },
  ],
};

export default function TermsPage() {
  return <LegalContent mn={TERMS_MN} en={TERMS_EN} />;
}

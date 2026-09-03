import type { VetClinic } from './types';

/**
 * Google Maps болон тухайн эмнэлгийн нийтэлсэн мэдээллийг тулгаж
 * 2026-09-03-нд шинэчилсэн жагсаалт. Нотлогдоогүй үйлчилгээг таамгаар нэмэхгүй.
 */
export const VET_CLINICS: VetClinic[] = [
  {
    id: 'enerekh-vet', name: 'Энэрэх мал эмнэлэг сургалтын төв', district: 'Хан-Уул',
    address: 'Хан-Уул дүүрэг, 20-р хороо, Чингисийн өргөн чөлөө 145/5',
    phone: '95909987', phones: ['95909987', '70114723'],
    hours: 'Даваа–Баасан 09:00–16:30; Пүрэв 10:30–16:30; Бямба 09:00–17:30; Ням амарна',
    note: 'Дижитал рентген, ЭХО болон шинжилгээний боломжийг очихын өмнө утсаар баталгаажуулна уу.',
    lat: 47.8956959, lng: 106.8935487,
    services: ['Үзлэг', 'Вакцин', 'Мэс засал', 'Рентген', 'ЭХО', 'Цусны шинжилгээ', 'Туулгалт', 'Арчилгаа'],
    websiteUrl: 'https://www.vetnetmn.org/work/6',
    mapUrl: 'https://www.google.com/maps/place/%D0%AD%D0%BD%D1%8D%D1%80%D1%8D%D1%85+%D0%BC%D0%B0%D0%BB+%D1%8D%D0%BC%D0%BD%D1%8D%D0%BB%D1%8D%D0%B3/data=!4m7!3m6!1s0x5d9693f05f4dc583:0x85491348162cf756!8m2!3d47.8956959!4d106.8935487!16s%2Fg%2F11q9rrdmgg',
    verifiedAt: '2026-09-03', serviceDetailsVerified: true,
  },
  {
    id: 'ub-vet', name: 'UB Vet animal hospital', district: 'Хан-Уул',
    address: 'Хан-Уул дүүрэг, 19-р хороолол, Шаравын гудамж 22',
    phone: '75073555', phones: ['75073555', '70073555'],
    hours: 'Даваа–Баасан 09:00–18:00; Бямба 09:00–17:00; Ням амарна',
    note: 'Үзлэг, вакцин, туулгалтад шууд очиж болно; гоо сайхан болон мэс заслын цагийг урьдчилан авна.',
    lat: 47.8959769, lng: 106.8958668,
    services: ['Үзлэг', 'Вакцин', 'Мэс засал', 'Микрочип', 'Туулгалт', 'Арчилгаа'],
    websiteUrl: 'https://www.facebook.com/UBVet/',
    mapUrl: 'https://www.google.com/maps/place/UB+Vet+animal+hospital/data=!4m7!3m6!1s0x5d9693a524422495:0x1a850c0e8df42d05!8m2!3d47.8959769!4d106.8958668!16s%2Fg%2F1pv0_xks_',
    verifiedAt: '2026-09-03', serviceDetailsVerified: true,
  },
  {
    id: 'sos-pet-care', name: 'SOS Pet Care and Salon', district: 'Баянзүрх',
    address: 'Баянзүрх дүүрэг, Их Монгол хороолол, 904-р байр',
    phone: '76001950', phones: ['76001950'], hours: 'Цагийн хуваарийг утсаар лавлана уу',
    note: 'Жижиг амьтны эмнэлэг болон арчилгааны үйлчилгээтэй. Нарийн оношилгооны төрлийг утсаар лавлана уу.',
    lat: 47.9059693, lng: 106.9424961, services: ['Үзлэг', 'Арчилгаа'],
    websiteUrl: 'https://www.facebook.com/S.O.S.emneleg',
    mapUrl: 'https://www.google.com/maps/place/SOS+Pet+Care+and+Salon/data=!4m7!3m6!1s0x5d96922bd6a97ac1:0x4e030a6809702c2e!8m2!3d47.9059693!4d106.9424961!16s%2Fg%2F11g6njhqlv',
    verifiedAt: '2026-09-03', serviceDetailsVerified: false,
  },
  {
    id: 'animals-healthy', name: 'Animals Healthy мал эмнэлэг', district: 'Баянзүрх',
    address: 'Баянзүрх дүүрэг, 7-р хороо, 115-р байр, 4-р орц',
    phone: '88044664', phones: ['88044664'], hours: 'Цагийн хуваарийг утсаар лавлана уу',
    note: 'Google Maps дээрх нэр, хаяг, утсыг баталгаажуулсан. Үйлчилгээний дэлгэрэнгүйг эмнэлгээс лавлана уу.',
    lat: 47.9215856, lng: 106.9445997, services: ['Үзлэг'],
    mapUrl: 'https://www.google.com/maps/place/Animals+Healthy+%D0%BC%D0%B0%D0%BB+%D1%8D%D0%BC%D0%BD%D1%8D%D0%BB%D1%8D%D0%B3/data=!4m7!3m6!1s0x5d96934cd6b0c149:0x795a42cad5fcb46b!8m2!3d47.9215856!4d106.9445997!16s%2Fg%2F11h0mb86q0',
    verifiedAt: '2026-09-03', serviceDetailsVerified: false,
  },
  {
    id: 'jargal-vet', name: 'Жаргал мал эмнэлэг', district: 'Баянгол',
    address: 'Баянгол дүүрэг, 18-р хороо, 43-р байр орчим',
    phone: '99852575', phones: ['99852575'], hours: 'Цагийн хуваарийг утсаар лавлана уу',
    note: 'Google Maps дээрх байршил, утсыг баталгаажуулсан. Үйлчилгээний дэлгэрэнгүйг эмнэлгээс лавлана уу.',
    lat: 47.9154714, lng: 106.8895891, services: ['Үзлэг'],
    mapUrl: 'https://www.google.com/maps/place/%D0%96%D0%B0%D1%80%D0%B3%D0%B0%D0%BB+%D0%BC%D0%B0%D0%BB+%D1%8D%D0%BC%D0%BD%D1%8D%D0%BB%D1%8D%D0%B3/data=!4m7!3m6!1s0x5d969371aaf912a9:0x382e0395ca17a786!8m2!3d47.9154714!4d106.8895891!16s%2Fg%2F11h_3t32g0',
    verifiedAt: '2026-09-03', serviceDetailsVerified: false,
  },
  {
    id: 'ochir-vet', name: 'ОЧИР мал эмнэлэг', district: 'Баянгол',
    address: 'Баянгол дүүрэг, Саппорогийн ард, Одод карготой байр',
    phone: '88624999', phones: ['88624999'], hours: 'Цагийн хуваарийг утсаар лавлана уу',
    note: 'Google Maps дээрх байршил, утсыг баталгаажуулсан. Үйлчилгээний дэлгэрэнгүйг эмнэлгээс лавлана уу.',
    lat: 47.9149154, lng: 106.8511918, services: ['Үзлэг'],
    mapUrl: 'https://www.google.com/maps/place/%D0%9E%D0%A7%D0%98%D0%A0+%D0%BC%D0%B0%D0%BB+%D1%8D%D0%BC%D0%BD%D1%8D%D0%BB%D1%8D%D0%B3/data=!4m7!3m6!1s0xac516e3c00610821:0x204c7634be8fb67e!8m2!3d47.9149154!4d106.8511918!16s%2Fg%2F11y3zfwnw3',
    verifiedAt: '2026-09-03', serviceDetailsVerified: false,
  },
];

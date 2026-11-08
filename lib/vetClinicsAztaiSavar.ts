import type { ListedVetClinic } from './types';

const source = {
  publisher: 'Азтай Савар — Амьтанд хайртай залуус ТББ',
  publishedAt: '2026-08-17',
  url: 'https://aztaisavar.mn/mn',
};

// ТББ-ын Улаанбаатар болон орон нутгийн хоёр лавлахаас. МӨР-д бүртгэлтэй
// таван эмнэлэг, нэргүй дуудлагын утасны жагсаалтыг давхар оруулаагүй.
const entries: (Omit<ListedVetClinic, 'source' | 'serviceDetailsVerified' | 'phone'> & { phones: [string, ...string[]] })[] = [
  {
    id: 'city-paws', name: 'City Paws', district: 'Чингэлтэй',
    address: '5-р сургуулийн зүүн хойно, Чингэлтэй дүүргийн нийгмийн даатгалын хэлтсийн зүүн талд',
    // Cybo дахь 9907 8300 дугаартай бүртгэлийн WWG6+FMW Plus Code.
    location: { lat: 47.9262375, lng: 106.9117031, mapUrl: 'https://plus.codes/8PV8WWG6+FMW' },
    phones: ['99078300'], services: [],
    hours: 'Өдөр бүр 10:00–19:00', hoursEn: 'Daily 10:00–19:00',
  },
  {
    id: 'aya-vet', name: 'Аяа вет', district: 'Хан-Уул',
    address: '8-р хороо, Active Garden, 502-р байр, В9 тоот',
    phones: ['86842323'], services: [],
    hours: 'Даваа–Баасан 09:00–18:00, Бямба 10:00–18:00, Ням амарна',
    hoursEn: 'Mon–Fri 09:00–18:00, Sat 10:00–18:00, Sun closed',
  },
  {
    id: 'jonon-vet', name: 'Жонон', district: 'Чингэлтэй',
    address: 'Баянбүрдийн тойрог, авто баазын байр, Чикаго клубийн зүүн талд',
    location: { lat: 47.9279117, lng: 106.907311, mapUrl: 'https://loca.mn/business/jonon-mal-emneleg-41pkf9' },
    phones: ['77776680'], services: ['Цусны шинжилгээ', 'Рентген'],
    hours: 'Ажлын өдрүүдэд 09:00–19:00, амралтын өдрүүдэд 10:00–18:00',
    hoursEn: 'Weekdays 09:00–19:00, weekends 10:00–18:00',
    note: 'Рентген шинжилгээг 25 кг-аас бага жинтэй амьтанд хийдэг гэж лавлахад тэмдэглэсэн.',
    noteEn: 'The directory lists X-rays for animals weighing under 25 kg.',
  },
  {
    id: 'amar-vet', name: 'Амар', district: 'Улаанбаатар',
    address: 'Баруун 4 зам, Өгөөж ХХК-ийн урд, 39-р байр, 1-р орц',
    location: { lat: 47.912716, lng: 106.8978847, mapUrl: 'https://www.openstreetmap.org/node/3907862259' },
    phones: ['91151471', '96651195'], services: ['Цусны шинжилгээ'],
    hours: 'Өдөр бүр 09:00–18:00', hoursEn: 'Daily 09:00–18:00',
  },
  {
    id: 'and-clinic', name: 'Анд клиник', district: 'Хан-Уул',
    address: 'Вива Сити, N12–S2',
    phones: ['94199027'], services: ['Цусны шинжилгээ'],
    hours: 'Өдөр бүр 09:00–19:00', hoursEn: 'Daily 09:00–19:00',
  },
  {
    id: 'sonor-vet', name: 'Сонор', district: 'Баянзүрх',
    address: '14-р хороо, Нам Ян Жүгийн гудамж 192, Баясах трейд төвийн урд',
    location: { lat: 47.9165001, lng: 106.9456405, mapUrl: 'https://loca.mn/business/sonor-amtny-emneleg-vg0wmv' },
    phones: ['89070547', '91170547'], services: ['Цусны шинжилгээ'],
    hours: 'Даваа, Лхагва–Баасан 09:00–18:00, Бямба–Ням 09:00–17:00, Мягмар амарна',
    hoursEn: 'Mon, Wed–Fri 09:00–18:00, Sat–Sun 09:00–17:00, Tue closed',
  },
  {
    id: 'bayandemberel-vet', name: 'Баяндэмбэрэл жижиг амьтны эмнэлэг', district: 'Баянзүрх',
    address: '13-р хороо, Амгалан амаржих газрын хойно',
    location: { lat: 47.9155065, lng: 106.9673637, mapUrl: 'https://loca.mn/business/bayandemberel-3mqogp' },
    phones: ['72005656'], services: [],
    hours: 'Даваа–Баасан 09:00–18:00, Бямба 10:00–16:00, Ням амарна',
    hoursEn: 'Mon–Fri 09:00–18:00, Sat 10:00–16:00, Sun closed',
  },
  {
    id: 'sos-animal-health', name: 'SOS Animal Health', district: 'Баянгол',
    address: '11-р хороо, Зурагтын зам 150',
    location: { lat: 47.9312696, lng: 106.8866582, mapUrl: 'https://loca.mn/business/sos-mal-emneleg-bzqzi2' },
    phones: ['70111950', '70171950', '89001950', '80001950'], services: ['Рентген'],
    hours: 'Өдөр бүр 09:00–19:00', hoursEn: 'Daily 09:00–19:00',
  },
  {
    id: 'mes-vet', name: 'МЭС-ийн мал амьтны эмнэлэг', district: 'Хан-Уул',
    address: '22-р хороо, Зайсан, Golden Buddha төвийн эсрэг талд, Мал эмнэлгийн сургуулийн хойно',
    phones: ['99832221'], services: ['Цусны шинжилгээ', 'Рентген'],
    hours: 'Даваа–Баасан 09:00–17:00', hoursEn: 'Mon–Fri 09:00–17:00',
  },
  {
    id: 'cava-vet', name: 'Cava Vet', district: 'Улаанбаатар',
    address: 'Баруун 4 зам, Голомт хотхон, 39E байр, Өгөөж Чихэр Боов ХХК-ийн баруун талд',
    phones: ['99521308', '89521308'], services: [],
    hours: 'Даваа–Бямба 09:00–18:00', hoursEn: 'Mon–Sat 09:00–18:00',
    note: 'Дуудлагаар үздэг гэж лавлахад тэмдэглэсэн.', noteEn: 'The directory lists house calls.',
  },
  {
    id: 'pets-clinic', name: "Pet's Clinic", district: 'Сонгинохайрхан',
    address: '16-р хороо, 1-р хороолол, Барилгачдын гудамж 41Б',
    phones: ['89064993'], services: [],
    hours: 'Өдөр бүр 10:00–19:00', hoursEn: 'Daily 10:00–19:00',
  },
  {
    id: 'dolgoon-vet', name: 'Дөлгөөн', district: 'Сонгинохайрхан',
    address: '16-р хороо, 26-р байр, хөндлөн цагаан 9 давхар байрны зүүн талд',
    location: { lat: 47.9127461, lng: 106.8386608, mapUrl: 'https://mn.near-place.com/dlgn-mal-emneleg-ulaanbaatar' },
    phones: ['88681575', '99217946'], services: ['Цусны шинжилгээ'],
    hours: 'Өдөр бүр 09:00–18:00', hoursEn: 'Daily 09:00–18:00',
  },
  {
    id: 'munjuulei-vet', name: 'Мөнжөөлэй мал эмнэлэг', district: 'Дархан-Уул',
    address: 'Дархан сум, 5-р баг, 18-ын дэлгүүр, Тосгон явах буудлын хажууд',
    phones: ['70372747', '99262747'], services: [],
    hours: 'Өдөр бүр 10:00–19:00', hoursEn: 'Daily 10:00–19:00',
  },
  {
    id: 'vetmon', name: 'Ветмон мал эмнэлэг', district: 'Дархан-Уул',
    address: 'Хуучин Дархан, 18-р буудлын чанх ард',
    phones: ['99829008'], services: ['Цусны шинжилгээ'],
    hours: 'Даваа–Баасан 10:00–18:00', hoursEn: 'Mon–Fri 10:00–18:00',
  },
  {
    id: 'dornod-vet', name: 'Дорнод ВЕТ мал амьтны эмнэлэг', district: 'Дорнод',
    address: 'Хэрлэн сум, Мянгатын 40-р байрны урд',
    phones: ['80497090'], services: ['Цусны шинжилгээ'],
    hours: 'Даваа–Баасан 10:00–18:00, Бямба–Ням 10:00–16:00',
    hoursEn: 'Mon–Fri 10:00–18:00, Sat–Sun 10:00–16:00',
  },
  {
    id: 'dornyn-byatshan-savar', name: 'Дорнын Бяцхан Савар', district: 'Дорноговь',
    address: 'Сайншанд сум, хуучин спорт заалны урд, Pearl рестораны ард',
    phones: ['96232314', '95782351'], services: [],
    hours: 'Мягмар, Бямба 09:00–14:00, бусад өдөр 09:00–18:30',
    hoursEn: 'Tue, Sat 09:00–14:00, other days 09:00–18:30',
  },
  {
    id: 'khatan-sevrei-vet', name: 'Хатан Сэврэй вет', district: 'Өмнөговь',
    address: 'Даланзадгад сум, Нисэх 15-1',
    phones: ['88756766', '77688194'], services: ['Цусны шинжилгээ', 'Рентген'],
    hours: 'Даваа–Баасан 09:30–18:00, Бямба–Ням амарна',
    hoursEn: 'Mon–Fri 09:30–18:00, Sat–Sun closed',
  },
  {
    id: 'itz-vet', name: 'Itz мал эмнэлэг', district: 'Сэлэнгэ',
    address: 'Сэлэнгэ аймаг, 8-р баг',
    phones: ['80851903', '90113771'], services: ['Цусны шинжилгээ'],
    hours: 'Дуудлагаар', hoursEn: 'On call',
  },
  {
    id: 'khuvsgul-vet', name: 'Хөвсгөл төрөлжсөн мал эмнэлэг', district: 'Хөвсгөл',
    address: 'Мөрөн сум, хот руу гардаг зам дагуу',
    phones: ['95820806'], services: ['Цусны шинжилгээ'],
    hours: 'Өдөр бүр 10:00–19:00', hoursEn: 'Daily 10:00–19:00',
  },
  {
    id: 'bayankhongor-vet', name: 'Баянхонгор төрөлжсөн мал эмнэлэг', district: 'Баянхонгор',
    address: 'Аз хүүхдийн их дэлгүүрийн замын эсрэг талд, Майхан Цахир худалдааны төвийн урд, 2 давхар ногоон 100-р байр',
    phones: ['90861188'], services: ['Цусны шинжилгээ', 'Рентген'],
    hours: 'Даваа–Бямба 10:00–18:00, Ням амарна', hoursEn: 'Mon–Sat 10:00–18:00, Sun closed',
  },
  {
    id: 'khovd-pet-clinic', name: 'Ховд Pet Clinic', district: 'Ховд',
    address: 'Жаргалант сум, Цамбагарав баг, малчны хороолол, 3-р гудамж 303А тоот',
    phones: ['88181231', '99539357'], services: ['Цусны шинжилгээ', 'Рентген'],
    hours: 'Даваа–Баасан, Ням 10:00–18:00, Бямба амарна',
    hoursEn: 'Mon–Fri, Sun 10:00–18:00, Sat closed',
  },
  {
    id: 'undur-bilgekh-vet', name: 'Өндөрбилгэх мал эмнэлэг', district: 'Хэнтий',
    address: 'Хэрлэн сум, Эрдэнэ төв, Б1 давхар',
    phones: ['89995113', '99079439'], services: ['Цусны шинжилгээ'],
    hours: 'Өдөр бүр 10:00–18:00', hoursEn: 'Daily 10:00–18:00',
  },
];

export const AZTAI_SAVAR_CLINICS: ListedVetClinic[] = entries.map((entry) => ({
  ...entry,
  phone: entry.phones[0],
  source,
  serviceDetailsVerified: false,
}));

import type { Locale, PetType } from './types';

export interface PetBreed {
  value: string;
  mn: string;
  en: string;
}

const COMMON: PetBreed[] = [
  { value: 'Тодорхойгүй', mn: 'Тодорхойгүй', en: 'Unknown' },
  { value: 'Холимог үүлдэр', mn: 'Холимог үүлдэр', en: 'Mixed breed' },
];

const DOG_BREEDS: PetBreed[] = [
  { value: 'Монгол банхар', mn: 'Монгол банхар', en: 'Mongolian Bankhar' },
  { value: 'Герман хоньч', mn: 'Герман хоньч', en: 'German Shepherd' },
  { value: 'Сибирийн хаски', mn: 'Сибирийн хаски', en: 'Siberian Husky' },
  { value: 'Голден ретривер', mn: 'Голден ретривер', en: 'Golden Retriever' },
  { value: 'Лабрадор ретривер', mn: 'Лабрадор ретривер', en: 'Labrador Retriever' },
  { value: 'Аляскийн маламут', mn: 'Аляскийн маламут', en: 'Alaskan Malamute' },
  { value: 'Пудель', mn: 'Пудель', en: 'Poodle' },
  { value: 'Померан', mn: 'Померан', en: 'Pomeranian' },
  { value: 'Чихуахуа', mn: 'Чихуахуа', en: 'Chihuahua' },
  { value: 'Ши-тцу', mn: 'Ши-тцу', en: 'Shih Tzu' },
  { value: 'Йоркшир терьер', mn: 'Йоркшир терьер', en: 'Yorkshire Terrier' },
  { value: 'Франц бульдог', mn: 'Франц бульдог', en: 'French Bulldog' },
  { value: 'Англи бульдог', mn: 'Англи бульдог', en: 'English Bulldog' },
  { value: 'Бигль', mn: 'Бигль', en: 'Beagle' },
  { value: 'Ротвейлер', mn: 'Ротвейлер', en: 'Rottweiler' },
  { value: 'Доберман', mn: 'Доберман', en: 'Dobermann' },
  { value: 'Самоед', mn: 'Самоед', en: 'Samoyed' },
  { value: 'Корги', mn: 'Корги', en: 'Corgi' },
  { value: 'Кокер спаниель', mn: 'Кокер спаниель', en: 'Cocker Spaniel' },
];

const CAT_BREEDS: PetBreed[] = [
  { value: 'Монгол гэрийн муур', mn: 'Монгол гэрийн муур', en: 'Mongolian Domestic Cat' },
  { value: 'Британи богино үст', mn: 'Британи богино үст', en: 'British Shorthair' },
  { value: 'Шотланд нугалаа чихт', mn: 'Шотланд нугалаа чихт', en: 'Scottish Fold' },
  { value: 'Перс', mn: 'Перс', en: 'Persian' },
  { value: 'Сиам', mn: 'Сиам', en: 'Siamese' },
  { value: 'Мэйн Кун', mn: 'Мэйн Кун', en: 'Maine Coon' },
  { value: 'Рагдолл', mn: 'Рагдолл', en: 'Ragdoll' },
  { value: 'Бенгал', mn: 'Бенгал', en: 'Bengal' },
  { value: 'Сфинкс', mn: 'Сфинкс', en: 'Sphynx' },
  { value: 'Оросын хөх', mn: 'Оросын хөх', en: 'Russian Blue' },
  { value: 'Америк богино үст', mn: 'Америк богино үст', en: 'American Shorthair' },
  { value: 'Турк ангора', mn: 'Турк ангора', en: 'Turkish Angora' },
  { value: 'Экзотик богино үст', mn: 'Экзотик богино үст', en: 'Exotic Shorthair' },
];

const OTHER: PetBreed[] = [
  { value: 'Бусад', mn: 'Бусад', en: 'Other' },
];

export function getPetBreeds(type: PetType): PetBreed[] {
  if (type === 'Нохой') return [...COMMON, ...DOG_BREEDS, ...OTHER];
  if (type === 'Муур') return [...COMMON, ...CAT_BREEDS, ...OTHER];
  return [...COMMON, ...OTHER];
}

export function getBreedLabel(value: string, locale: Locale): string {
  const breed = [...COMMON, ...DOG_BREEDS, ...CAT_BREEDS, ...OTHER].find((item) => item.value === value);
  return breed ? breed[locale] : value;
}

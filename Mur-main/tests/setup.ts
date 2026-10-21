import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Тест бүрийн дараа render хийсэн DOM-ыг цэвэрлэнэ (үгүй бол дараагийн
// тестэд өмнөх render давхцаж, "олон элемент олдлоо" гэсэн алдаа өгдөг)
afterEach(() => {
  cleanup();
});

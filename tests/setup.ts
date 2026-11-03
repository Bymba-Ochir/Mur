import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Tests never inherit developer/CI production database configuration.
process.env.NEXT_PUBLIC_DATABASE_MODE = 'local';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'local-test-key';
process.env.MUR_FORCE_LOCAL_DB = '1';

// Тест бүрийн дараа render хийсэн DOM-ыг цэвэрлэнэ (үгүй бол дараагийн
// тестэд өмнөх render давхцаж, "олон элемент олдлоо" гэсэн алдаа өгдөг)
afterEach(() => {
  cleanup();
});

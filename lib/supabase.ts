// lib/supabase.ts
// Firebase-ийн оронд Supabase — карт шаарддаггүй, 100% үнэгүй tier
// (Postgres DB + Auth + Storage бүгд нэг дор)
import { createClient } from '@supabase/supabase-js';

// Env хувьсагчууд Next-д тохиргоо хийгдсэн үед л зөв байдаг тул non-null
// assertion хэрэглэнэ — орчуулга/хөгжүүлэлтийн үед өгөгдлийн сан байхгүй бол
// createClient ажиллахгүй ч апп бусад үйлдлийг хэвийн үргэлжлүүлдэг.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

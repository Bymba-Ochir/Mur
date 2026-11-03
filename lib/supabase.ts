// lib/supabase.ts
// Firebase-ийн оронд Supabase — карт шаарддаггүй, 100% үнэгүй tier
// (Postgres DB + Auth + Storage бүгд нэг дор)
import { createPublicClient } from './supabaseClient';

// Env хувьсагчууд Next-д тохиргоо хийгдсэн үед л зөв байдаг тул non-null
// assertion хэрэглэнэ — орчуулга/хөгжүүлэлтийн үед өгөгдлийн сан байхгүй бол
// createClient ажиллахгүй ч апп бусад үйлдлийг хэвийн үргэлжлүүлдэг.
export const supabase = createPublicClient();

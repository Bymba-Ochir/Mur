import { test, expect } from '@playwright/test';

test.describe('Алдсан мэдэгдэх форм (4 алхам, submit хийхгүй)', () => {
  test('заавал талбар бөглөөгүй үед "Дараах" товч идэвхгүй', async ({ page }) => {
    await page.goto('/report-lost');
    // Алхам 1 (Зураг) -> Алхам 2 (Мэдээлэл)
    await page.getByRole('button', { name: /Дараах/ }).click();
    // Алхам 2-т Өнгө бөглөөгүй тул Дараах идэвхгүй байх ёстой
    await expect(page.getByRole('button', { name: /Дараах/ })).toBeDisabled();
  });

  test('өнгө бөглөсний дараа "Дараах" идэвхжинэ', async ({ page }) => {
    await page.goto('/report-lost');
    await page.getByRole('button', { name: /Дараах/ }).click();
    await page.getByPlaceholder('жишээ: хар халзан').fill('хар халзан');
    await expect(page.getByRole('button', { name: /Дараах/ })).toBeEnabled();
  });

  test('явцын заагч (PawTrail) 4 алхмыг харуулна', async ({ page }) => {
    await page.goto('/report-lost');
    await expect(page.getByText('1/4')).toBeVisible();
    await page.getByRole('button', { name: /Дараах/ }).click();
    await expect(page.getByText('2/4')).toBeVisible();
  });

  test('"Буцах" товч өмнөх алхам руу буцаана', async ({ page }) => {
    await page.goto('/report-lost');
    await page.getByRole('button', { name: /Дараах/ }).click();
    await expect(page.getByText('2/4')).toBeVisible();
    await page.getByRole('button', { name: /Буцах/ }).click();
    await expect(page.getByText('1/4')).toBeVisible();
  });

  test('desktop дэлгэцэнд preview карт харагдана', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Preview зөвхөн ≥860px дэлгэцэнд харагддаг');
    await page.goto('/report-lost');
    await expect(page.getByText('Ийм харагдана')).toBeVisible();
  });
});

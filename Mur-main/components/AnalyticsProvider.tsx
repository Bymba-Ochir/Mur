'use client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import AnalyticsNotice from './AnalyticsNotice';
import { analyticsBeforeSend, speedInsightsBeforeSend } from '../lib/analyticsConsent';

// Analytics/SpeedInsights-ийг зөвшөөрөлд холбосон wrapper. beforeSend нь
// хэрэглэгчийн зөвшөөрөлгүй үед event-үүдийг хаядаг; мэдэгдэл баннер нь
// эхний визитэд л гарч, сонголтыг localStorage-т хадгалдаг.
export default function AnalyticsProvider() {
  return (
    <>
      <Analytics beforeSend={analyticsBeforeSend} />
      <SpeedInsights beforeSend={speedInsightsBeforeSend} />
      <AnalyticsNotice />
    </>
  );
}

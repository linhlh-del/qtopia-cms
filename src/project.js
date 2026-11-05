/** Cấu hình dự án QTOPIA — mọi chỗ khác trong CMS đọc từ đây */
export const PROJECT = {
  id: 'qtopia',
  name: 'QTOPIA',
  siteUrl: (import.meta.env.VITE_SITE_URL || 'https://qtopia.rever.io.vn').replace(/\/+$/, ''),
  get schemaUrl() { return import.meta.env.VITE_SCHEMA_URL || (import.meta.env.DEV && import.meta.env.VITE_CMS_DEMO === '1' ? '/cms-schema.json' : `${this.siteUrl}/cms-schema.json`); },
  get statusUrl() { return import.meta.env.VITE_STATUS_URL || `${this.siteUrl}/cms-status.json`; },
  /* màu thương hiệu QTOPIA: xanh chanh trên nền navy */
  accent: '#aaec0e',
  navy: '#050a2e',
};

/** Biến CSS dùng chung: --accent (nền nút, viền focus), --accent-ink (chữ/link đọc được trên nền trắng & chữ trên nút) */
export const THEME_VARS = { '--accent': PROJECT.accent, '--accent-ink': PROJECT.navy };

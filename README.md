# QTOPIA CMS

CMS cho landing page `qtopia-landing` (Vite + React, prerender HTML tĩnh, chạy trên VPS Ubuntu + nginx). CMS là SPA Vite + React deploy trên Vercel, dùng backend Supabase chung trong `../cms-supabase` với project id **`qtopia`**.

- Đăng nhập Google (Supabase Auth); quyền theo bảng `cms_members` (owner / editor / sales / viewer).
- Trình sửa nội dung sinh tự động từ `cms-schema.json` do website xuất ra lúc build — định dạng xem [`SCHEMA-FORMAT.md`](./SCHEMA-FORMAT.md).
- Đăng → Edge Function `cms-admin` lưu bản chính thức + phiên bản, gọi VPS deploy hook (`npm run build:release`, đổi symlink `current` không gián đoạn). Trang **Đăng & lịch sử** hỏi trạng thái build và đọc `cms-status.json` của website để biết website đã chạy đúng bản đã đăng chưa.

## Chạy tại máy

```bash
npm ci
npm run dev        # http://localhost:5182
```

Tạo `.env.local` từ `.env.example`. Muốn xem thử giao diện không cần Supabase: đặt `VITE_CMS_DEMO=1` và chép `dist/cms-schema.json` của website vào `public/cms-schema.json` (file này đã nằm trong `.gitignore`). Chế độ demo chỉ hoạt động với `npm run dev`; bản nháp lưu ở localStorage.

## Biến môi trường (Vercel → Settings → Environment Variables)

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `VITE_SUPABASE_URL` | có | URL Supabase dùng chung |
| `VITE_SUPABASE_ANON_KEY` | có | anon public key — **không** dùng service role key |
| `VITE_SITE_URL` | nên đặt | Domain website QTOPIA (mặc định `https://qtopia.rever.io.vn`), không slash cuối |
| `VITE_SCHEMA_URL` | không | Mặc định `${VITE_SITE_URL}/cms-schema.json` |
| `VITE_STATUS_URL` | không | Mặc định `${VITE_SITE_URL}/cms-status.json` |

Không đặt `VITE_CMS_DEMO` trên production. Đổi biến xong phải redeploy CMS.

## Deploy lên Vercel

Tạo project Vercel trỏ vào thư mục `qtopia-cms` (framework Vite, build `npm run build`, output `dist`). `vercel.json` đã có rewrite SPA và header bảo mật (`noindex`, chống iframe, HSTS…).

## Việc cần làm ở backend / VPS

1. `cms-supabase`: chạy migration `20261106000000_qtopia_project.sql` và `20261106000100_qtopia_owner.sql`, deploy lại `cms-admin` và `collect`.
2. Supabase Auth → Redirect URLs và secret `CMS_ORIGINS`: thêm origin CMS này (vd. `https://qtopia-cms.vercel.app`). CMS gửi `redirectTo` = origin hiện tại.
3. Secrets Supabase: `DEPLOY_HOOK_QTOPIA`, `DEPLOY_HOOK_TOKEN_QTOPIA` — xem `../cms-supabase/README.md` và `../cms-supabase/vps-deploy-hook/README.md`.
4. Website (nginx) phải phục vụ `/cms-schema.json` và `/cms-status.json` với `Access-Control-Allow-Origin: *` và `Cache-Control: no-store`.

# QTOPIA CMS — contract between `qtopia-landing` and `qtopia-cms`

This is the exact format the CMS code in `src/` reads. It is derived from the code (`src/lib/content.jsx`, `src/pages/Content.jsx`, `Layout.jsx`, `Seo.jsx`, `Settings.jsx`, `Head.jsx`, `LeadSettings.jsx`, `src/components/ImagePicker.jsx`, `SiteStatus.jsx`) and from the reference landings (`palm-river-mkt/scripts/fetch-cms.mjs`, `palm-river-mkt/src/cms/schema.js`, `norton-park/src/cms/{content,schema}.js`, `norton-park/scripts/prerender-seo.mjs`).

There are three pieces:

1. **`/cms-schema.json`** — written by the landing at build time; tells the CMS which fields exist and their defaults.
2. **Published content** — JSON the CMS stores in Supabase; the landing fetches it at build time via RPC.
3. **`/cms-status.json`** — written by the landing at build time; tells the CMS which content version is live.

Project id everywhere: **`qtopia`**.

---

## 1. `cms-schema.json`

Served at `${VITE_SITE_URL}/cms-schema.json` (default `https://qtopia-tau.vercel.app/cms-schema.json`). The CMS fetches it from a different origin with `cache: 'no-store'`, so nginx must send:

```nginx
location = /cms-schema.json { add_header Access-Control-Allow-Origin "*" always; add_header Cache-Control "no-store" always; }
location = /cms-status.json { add_header Access-Control-Allow-Origin "*" always; add_header Cache-Control "no-store" always; }
```

It must return JSON (not the SPA `index.html` fallback).

### Top level

| Key | Type | Required | Used for |
|---|---|---|---|
| `version` | number | no (use `1`) | informational |
| `project` | string | yes (`"qtopia"`) | shown on Lead settings page (`PROJECT_ID` hint) |
| `langs` | string[] | no, default `["vi"]` | Languages. `langs[0]` is the primary language. With more than one, the Content/SEO pages show a language tab (`"vi"` is labelled Tiếng Việt, anything else English) and text values are stored per language. |
| `sections` | Section[] | **yes** (must be an array; the Content and Layout pages call `.map`/`.find` on it) | Content editor and Layout page |
| `seo` | SeoPage[] | **yes** (array, may be `[]`) | SEO page |
| `settings` | Setting[] | **yes** (array, may be `[]`) | "Thông tin chung" page |
| `lead` | `{ defaultEndpoint?: string }` | no | placeholder and fallback for "Gửi lead thử" |

### Section

| Key | Type | Required | Meaning |
|---|---|---|---|
| `id` | string | yes | Unique. Used as the layout id (`layout.order`, `layout.hidden`, `layout.variants`). Should match the section's DOM/anchor id on the landing. |
| `label` | string | yes | Shown in the section list |
| `description` | string | no | Help text above the editors |
| `fields` | Field[] | no | Text inputs (rendered in a "Chữ" card) |
| `images` | Image[] | no | Image pickers (rendered in an "Ảnh" card) |
| `inLayout` | boolean | no, default `true` | `false` = editable on the Content page but not listed on the Layout page (footer, popup, other pages) |
| `locked` | boolean | no | Always visible and cannot be moved (hero, lead form) |
| `hideable` | boolean | no, default `true` | `false` = can be moved but not hidden |
| `variants` | `{ id, label }[]` | no | Display variants the landing implements. `variants[0]` is the default. A select box is shown only when there are 2 or more. |

### Field (text)

| Key | Type | Required | Meaning |
|---|---|---|---|
| `key` | string | yes | Content key. Values are stored in `texts[key]`. Any string is allowed, dots included (`"hero.title"`, `"site.faq.0.q"`); the CMS treats it as an opaque flat key. |
| `label` | string | yes | Input label |
| `type` | `"text"` \| `"textarea"` | no, default `"text"` | `"textarea"` = multi-line. **Any other value renders a single-line input**; there is no rich text, number, select, boolean, url, color or date type. |
| `rows` | number | no, default 3 | textarea height |
| `hint` | string | no | small help text |
| `maxLength` / `minLength` | number | no | Shows a character counter (red when out of range). It is advisory only: the value is not truncated or blocked. |
| `default` | string \| `{ [lang]: string }` | recommended | Shown as the placeholder (greyed) = what the site renders when the field is empty. With several languages, use `{ "vi": "...", "en": "..." }`. |
| `langs` | string[] | no | Show this field only for these languages (for example `["vi"]`) |

### Image

| Key | Type | Required | Meaning |
|---|---|---|---|
| `key` | string | yes | Stored in `images[key]` |
| `label` | string | yes | |
| `default` | string | recommended | The landing's default image. A path relative to the site (`"/images/hero.webp"`) is previewed as `VITE_SITE_URL + path`; an absolute `https://` URL is used as is. |
| `ratio` | string | no | Free text shown as "recommended ratio", for example `"16/9"` or `"1200×630"`. It is not enforced. |
| `hint` | string | no | |
| `altKey` | string | no | If set, the alt text is stored as a **text** value `texts[altKey]` (per language). If omitted, alt is stored inside the image value (`images[key].alt`, one language only). |
| `altDefault` | string | no | Placeholder for the alt input |

Uploads are compressed in the browser to WebP (longest side 2400px, quality 0.82; SVG is kept as is) and stored in the public Supabase bucket `cms-media/qtopia/<yyyy-mm>/<name>.webp`.

### Lists, repeaters, and other limits

**The CMS has no list, repeater or array field type.** It cannot add, remove or reorder items. The reference landings expose lists by flattening every existing item into indexed keys, generated from the landing's data at build time:

```js
// one field per item property, plus an optional image per item
{ key: "site.amenities.0.title", label: "Tiện ích 1 — title", default: "..." }
{ key: "site.amenities.1.title", label: "Tiện ích 2 — title", default: "..." }
{ key: "site.amenities.0.image", label: "Tiện ích 1 — ảnh", default: "/images/a1.webp", ratio: "4/3" }  // in images[]
```

The number of items is fixed by the code. If the landing needs a variable-length list, it needs CMS code changes.

Also not supported: nested sections, per-field validation beyond the character counter, conditional fields, and multiple pages of sections. Everything is a flat list of sections; use `inLayout: false` for content that is not on the home page.

### SeoPage

| Key | Type | Required | Meaning |
|---|---|---|---|
| `path` | string | yes | Route, for example `"/"` or `"/tin-tuc"`. It is the storage key `seo[path]`. |
| `label` | string | yes | |
| `default` | `{ title, description }`, or with several languages `{ vi: { title, description }, en: {...} }` | recommended | Placeholders and the Google preview |
| `defaultOgImage` | string | no | Default share image (relative or absolute) |
| `ogImage` | `false` | no | Hide the og:image picker for this page |

The UI counts title (at most 60) and description (150 to 160). This is advisory.

### Setting

`{ key, label, hint?, type?: "text"|"textarea", default?: string }`. Settings have **one language**: the value is a plain string in `settings[key]`, and the placeholder is `default` (or `default.vi`). Use them for the hotline, Zalo, email, address and similar values.

### Minimal QTOPIA example

```json
{
  "version": 1,
  "project": "qtopia",
  "langs": ["vi"],
  "sections": [
    {
      "id": "hero", "label": "Hero", "locked": true, "inLayout": true,
      "fields": [
        { "key": "hero.title", "label": "Tiêu đề", "type": "text", "maxLength": 70, "default": "QTOPIA — ..." },
        { "key": "hero.subtitle", "label": "Mô tả", "type": "textarea", "rows": 3, "default": "..." }
      ],
      "images": [
        { "key": "hero.image", "label": "Ảnh nền", "default": "/images/hero.webp", "ratio": "16/9", "altKey": "hero.imageAlt", "altDefault": "Phối cảnh QTOPIA" }
      ],
      "variants": [{ "id": "center", "label": "Chữ giữa" }, { "id": "left", "label": "Chữ trái" }]
    },
    {
      "id": "tien-ich", "label": "Tiện ích",
      "fields": [
        { "key": "amenities.title", "label": "Tiêu đề", "default": "Tiện ích" },
        { "key": "site.amenities.0.title", "label": "Tiện ích 1 — tên", "default": "Hồ bơi" }
      ],
      "images": [{ "key": "site.amenities.0.image", "label": "Tiện ích 1 — ảnh", "default": "/images/pool.webp", "ratio": "4/3" }]
    },
    { "id": "lien-he", "label": "Form đăng ký", "locked": true, "fields": [{ "key": "lead.title", "label": "Tiêu đề form", "default": "Nhận thông tin" }] },
    { "id": "footer", "label": "Chân trang", "inLayout": false, "fields": [{ "key": "footer.note", "label": "Ghi chú", "type": "textarea", "default": "..." }] }
  ],
  "seo": [
    { "path": "/", "label": "Trang chủ", "default": { "title": "QTOPIA | ...", "description": "..." }, "defaultOgImage": "/og.jpg" }
  ],
  "settings": [
    { "key": "site.contact.hotline", "label": "Hotline", "default": "0900 000 000" },
    { "key": "site.contact.zaloUrl", "label": "Link Zalo", "default": "https://zalo.me/..." }
  ],
  "lead": { "defaultEndpoint": "" }
}
```

---

## 2. Published content (what the landing reads at build time)

### RPC call

```http
POST ${CMS_SUPABASE_URL}/rest/v1/rpc/cms_get_published_content
apikey: ${CMS_SUPABASE_ANON_KEY}
Authorization: Bearer ${CMS_SUPABASE_ANON_KEY}
Content-Type: application/json

{ "p": "qtopia" }
```

- Function: `public.cms_get_published_content(p text) returns jsonb`. It is `security definer` and anon may execute it. It returns `cms_content.published` for that project only (never the draft).
- Response body: the published JSON object below. It is `{}` before the first publish, or `null` if the project row does not exist. Treat `null` as `{}`.
- Reference implementation: `palm-river-mkt/scripts/fetch-cms.mjs`, which uses a 20 s timeout. It reads env from `CMS_SUPABASE_URL` / `CMS_SUPABASE_ANON_KEY` (falling back to `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`), loaded from `.env.production` through `scripts/load-cms-env.mjs`, which calls Vite `loadEnv('production', root, '')` and does not override existing env. The project id is hard-coded in the script.
  - Env missing: write `{}` content and `configured:false` status, and continue the build with code defaults.
  - Env present but the RPC or an image download fails: **exit 1**, so the live site stays unchanged. With `build:release`, the `current` symlink must not be swapped.
  - It downloads every image hosted on the Supabase host (`images[*].src`, `seo[*].ogImage.src`) into `public/assets/cms/<sha1-16>.<ext>` and rewrites `src` to `/assets/cms/...`, then writes `src/generated/cms-content.json`.

### Content shape

Every key is optional. A missing key means "use the default in code".

```jsonc
{
  "texts":    { "<field key or altKey>": "string" /* 1 language */ | { "vi": "…", "en": "…" } /* several languages; a language may be missing */ },
  "images":   { "<image key>": { "src": "https://<ref>.supabase.co/storage/v1/object/public/cms-media/qtopia/…webp", "alt"?: "…", "width"?: 1600, "height"?: 900 } },
  "layout":   { "order"?: ["sectionId", …], "hidden"?: ["sectionId", …], "variants"?: { "sectionId": "variantId" } },
  "seo":      { "<path>": { "title"?: "…", "description"?: "…", "ogImage"?: { "src": "…", "alt"?: "…", "width"?: n, "height"?: n } } },
              // with several languages: { "<path>": { "vi": { "title", "description" }, "en": {…}, "ogImage"?: {…} } }  (ogImage is not per language)
  "settings": { "<setting key>": "string" },
  "head":     { "gtmId", "ga4Id", "googleAdsId", "fbPixelId", "tiktokPixelId",
                "googleVerification", "facebookVerification", "zaloVerification", "bingVerification",
                "customHead" /* raw HTML for the end of <head> */, "customBodyStart" /* raw HTML right after <body> */ },
  "lead":     { "endpoint": "https://…" }
}
```

How the landing must read it:

- **Text with several languages:** the value may be a string (meaning the primary language only) or an object keyed by language. Use `typeof v === 'string' ? (lang === langs[0] ? v : undefined) : v[lang]` and fall back to the default when the result is empty or undefined. This matches `pick()` in `norton-park/src/cms/content.js`. With one language, the CMS stores plain strings.
- Empty inputs are deleted, never stored as `""`.
- **layout.order** lists only `inLayout` sections, and only when it differs from the default order. Sections it does not mention (new sections) are appended in default order, and unknown ids are ignored. Locked sections should stay where they are. `hidden` holds ids that should not render (keep the content). `variants[id]` is absent when the default `variants[0]` is chosen.
- **head**: `head` and `lead` can be changed only by owners. That is enforced in `cms-admin`. `customHead` / `customBodyStart` are trusted raw HTML that the landing injects as is into every prerendered page.

---

## 3. `cms-status.json` (written by the landing at build time)

The CMS fetches `${VITE_STATUS_URL || VITE_SITE_URL + '/cms-status.json'}?t=<now>` and polls every 20 s until it matches.

```json
{
  "project": "qtopia",
  "built_at": "2026-11-06T10:00:00.000Z",
  "commit": "abc1234",
  "configured": true,
  "content_hash": "0123456789abcdef",
  "texts": 12,
  "images": 3,
  "empty": false,
  "prerender": { "ok": true, "pages": 3, "total": 3, "error": "" }
}
```

| Key | Meaning |
|---|---|
| `project` | Must equal `"qtopia"`. Any other value makes the CMS show a "wrong project" error. |
| `built_at` | ISO time of the build, compared with `published_at` |
| `commit` | optional short SHA (`git rev-parse --short HEAD` on the VPS) |
| `configured` | `false` when the build had no CMS env; the CMS shows an error. When `false`, add `"message"`. |
| `content_hash` | `sha256(JSON.stringify(publishedObject)).hex.slice(0, 16)`. Compute it on the object **exactly as parsed from the RPC response, before rewriting image URLs** (Node: `createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0,16)`). The CMS computes the same over `cms_content.published`, and both come from the same jsonb, so key order matches. Do not sort or re-serialise the object differently. |
| `texts`, `images` | counts shown in the CMS |
| `prerender` | optional. `{ ok, pages, total, error? }` from the prerender step; shown as "HTML tĩnh (SEO)". |

If the file is missing (404), the CMS reports that the site runs an old build.

---

## 4. Publish flow (for reference)

CMS **Đăng** → `cms-admin` (`publish`) copies the draft into published and inserts a row into `cms_versions`. It then sends `POST DEPLOY_HOOK_QTOPIA` with `Authorization: Bearer DEPLOY_HOOK_TOKEN_QTOPIA` and body `{"project":"qtopia"}`. The VPS hook runs `npm run build:release` in `QTOPIA_DIR`.

That script must:

1. fetch the content (section 2);
2. write `cms-schema.json` and `cms-status.json` into the build output;
3. build and prerender into a new release directory;
4. atomically swap the `current` symlink only on success.

The CMS polls `GET <hook>?action=status&project=qtopia` through `cms-admin` (`deploy_status`) and receives `{ state: IDLE|QUEUED|BUILDING|READY|ERROR, started_at, finished_at, error, log }`.

# Source: api/biz-og.ts

``typescript
   1: import type { VercelRequest, VercelResponse } from '@vercel/node';
   2: import { Resvg } from '@resvg/resvg-js';
   3: 
   4: import { findPublicBusiness, loadPublicDirectory, publicBusinessSlug } from '../src/server/directoryData.js';
   5: 
   6: function escapeXml(unsafe: string): string {
   7:   return (unsafe || '').replace(/[<>&'"]/g, (c) => {
   8:     switch (c) {
   9:       case '<': return '&lt;';
  10:       case '>': return '&gt;';
  11:       case '&': return '&amp;';
  12:       case '\'': return '&apos;';
  13:       case '"': return '&quot;';
  14:       default: return c;
  15:     }
  16:   });
  17: }
  18: 
  19: function generateFallbackCardSvg(biz: any): string {
  20:   const name = escapeXml(biz.name_ar || biz.name_en || 'Ù†Ø´Ø§Ø· Ù…Ø¹ØªÙ…Ø¯');
  21:   const category = escapeXml(biz.category || 'Ø¯Ù„ÙŠÙ„ Ø§Ù„Ø£Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª');
  22:   const location = escapeXml(`${biz.city || ''} - ${biz.governorate || 'Ù…ØµØ±'}`.trim());
  23:   const phone = escapeXml(biz.phone || '');
  24: 
  25:   return `
  26: <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  27:   <defs>
  28:     <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
  29:       <stop offset="0%" stop-color="#050811"/>
  30:       <stop offset="50%" stop-color="#0f172a"/>
  31:       <stop offset="100%" stop-color="#1e1b4b"/>
  32:     </linearGradient>
  33:     <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
  34:       <stop offset="0%" stop-color="#fef08a"/>
  35:       <stop offset="50%" stop-color="#f59e0b"/>
  36:       <stop offset="100%" stop-color="#b45309"/>
  37:     </linearGradient>
  38:   </defs>
  39: 
  40:   <rect width="1200" height="630" fill="url(#bg)"/>
  41: 
  42:   <!-- Decorative Rings -->
  43:   <circle cx="600" cy="315" r="280" fill="none" stroke="url(#gold)" stroke-width="1.5" stroke-dasharray="10,8" opacity="0.25"/>
  44:   <circle cx="600" cy="315" r="240" fill="none" stroke="url(#gold)" stroke-width="1" opacity="0.15"/>
  45: 
  46:   <!-- Borders -->
  47:   <rect x="25" y="25" width="1150" height="580" rx="28" fill="none" stroke="url(#gold)" stroke-width="2.5" opacity="0.6"/>
  48:   <rect x="35" y="35" width="1130" height="560" rx="20" fill="none" stroke="#f59e0b" stroke-width="1" opacity="0.2"/>
  49: 
  50:   <!-- Header -->
  51:   <g transform="translate(450, 65)">
  52:     <rect x="0" y="0" width="300" height="46" rx="23" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1.5"/>
  53:     <text x="150" y="30" font-family="sans-serif" font-size="20" font-weight="bold" fill="#fbbf24" text-anchor="middle">Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©</text>
  54:   </g>
  55: 
  56:   <!-- Business Name -->
  57:   <text x="600" y="220" font-family="sans-serif" font-size="64" font-weight="900" fill="url(#gold)" text-anchor="middle">${name}</text>
  58: 
  59:   <!-- Category -->
  60:   <g transform="translate(350, 260)">
  61:     <rect x="0" y="0" width="500" height="52" rx="26" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  62:     <text x="250" y="34" font-family="sans-serif" font-size="24" font-weight="bold" fill="#f1f5f9" text-anchor="middle">${category}</text>
  63:   </g>
  64: 
  65:   <!-- Location -->
  66:   <g transform="translate(400, 335)">
  67:     <rect x="0" y="0" width="400" height="46" rx="23" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
  68:     <text x="200" y="30" font-family="sans-serif" font-size="20" font-weight="bold" fill="#cbd5e1" text-anchor="middle">${location}</text>
  69:   </g>
  70: 
  71:   <!-- Phone & Verified -->
  72:   ${phone ? `
  73:   <g transform="translate(380, 405)">
  74:     <rect x="0" y="0" width="260" height="48" rx="24" fill="#064e3b" fill-opacity="0.6" stroke="#10b981" stroke-width="1.5"/>
  75:     <text x="130" y="31" font-family="sans-serif" font-size="22" font-weight="bold" fill="#34d399" text-anchor="middle">Ù‡Ø§ØªÙ: ${phone}</text>
  76:   </g>
  77:   <g transform="translate(660, 405)">
  78:     <rect x="0" y="0" width="160" height="48" rx="24" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
  79:     <text x="80" y="31" font-family="sans-serif" font-size="20" font-weight="bold" fill="#fbbf24" text-anchor="middle">Ù†Ø´Ø§Ø· Ù…ÙˆØ«Ù‚</text>
  80:   </g>
  81:   ` : `
  82:   <g transform="translate(510, 405)">
  83:     <rect x="0" y="0" width="180" height="48" rx="24" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
  84:     <text x="90" y="31" font-family="sans-serif" font-size="20" font-weight="bold" fill="#fbbf24" text-anchor="middle">Ù†Ø´Ø§Ø· Ù…ÙˆØ«Ù‚</text>
  85:   </g>
  86:   `}
  87: 
  88:   <!-- Footer -->
  89:   <g transform="translate(600, 525)">
  90:     <text x="0" y="0" font-family="sans-serif" font-size="20" font-weight="bold" fill="#94a3b8" text-anchor="middle">Ø´Ø§Ù‡Ø¯ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø© ÙˆØ§Ù„ØªÙØ§ØµÙŠÙ„ Ø§Ù„ÙƒØ§Ù…Ù„Ø©</text>
  91:     <text x="0" y="30" font-family="sans-serif" font-size="16" fill="#64748b" text-anchor="middle">www.dalilaak.com</text>
  92:   </g>
  93: </svg>
  94:   `.trim();
  95: }
  96: 
  97: export default async function handler(req: VercelRequest, res: VercelResponse) {
  98:   try {
  99:     const rawBiz = req.query.biz || req.query.id;
 100:     if (!rawBiz || typeof rawBiz !== 'string') {
 101:       return res.redirect(302, '/og-image.jpg');
 102:     }
 103: 
 104:     const bizId = decodeURIComponent(rawBiz).trim();
 105: 
 106:     const biz = await findPublicBusiness(bizId);
 107:     if (!biz) { res.setHeader('Cache-Control','no-store'); return res.status(404).send('Ø§Ù„Ù†Ø´Ø§Ø· ØºÙŠØ± Ù…ØªØ§Ø­'); }
 108:     let coverPhoto: string | null = null;
 109:     if (typeof biz.notes === 'string' && biz.notes.trim().startsWith('{')) {
 110:       try {
 111:         const parsed = JSON.parse(biz.notes.trim());
 112:         if (parsed && typeof parsed === 'object' && parsed.coverPhoto) {
 113:           coverPhoto = parsed.coverPhoto;
 114:         }
 115:       } catch {}
 116:     }
 117: 
 118:     let rawPhotos: string[] = [];
 119:     if (Array.isArray(biz.photos)) {
 120:       rawPhotos = biz.photos;
 121:     } else if (typeof biz.photos === 'string' && biz.photos.trim().length > 0) {
 122:       try {
 123:         const p = JSON.parse(biz.photos.trim());
 124:         if (Array.isArray(p)) rawPhotos = p;
 125:         else if (typeof p === 'string') rawPhotos = [p];
 126:       } catch {
 127:         if (biz.photos.startsWith('http') || biz.photos.startsWith('data:')) rawPhotos = [biz.photos];
 128:       }
 129:     }
 130:     const photo = coverPhoto || (rawPhotos.length > 0 ? rawPhotos[0] : null);
 131: 
 132:     // 2. Process Business Photo
 133:     if (typeof photo === 'string' && photo.length > 0) {
 134:       // Case A: SVG vector graphic (e.g. data:image/svg+xml;base64,... or raw <svg>)
 135:       if (photo.startsWith('data:image/svg+xml;base64,')) {
 136:         try {
 137:           const b64 = photo.replace('data:image/svg+xml;base64,', '');
 138:           const svgContent = Buffer.from(b64, 'base64').toString('utf8');
 139:           const resvg = new Resvg(svgContent, {
 140:             fitTo: { mode: 'width', value: 1200 },
 141:           });
 142:           const pngBuffer = resvg.render().asPng();
 143: 
 144:           res.setHeader('Content-Type', 'image/png');
 145:           res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
 146:           return res.status(200).send(pngBuffer);
 147:         } catch (svgErr) {
 148:           console.warn('Failed rendering SVG photo:', svgErr);
 149:         }
 150:       }
 151: 
 152:       // Case B: JPEG base64 (e.g. data:image/jpeg;base64,...)
 153:       if (photo.startsWith('data:image/jpeg;base64,') || photo.startsWith('data:image/jpg;base64,')) {
 154:         const b64 = photo.replace(/^data:image\/jpe?g;base64,/, '');
 155:         const imgBuffer = Buffer.from(b64, 'base64');
 156:         res.setHeader('Content-Type', 'image/jpeg');
 157:         res.setHeader('Content-Length', imgBuffer.length);
 158:         res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
 159:         return res.status(200).send(imgBuffer);
 160:       }
 161: 
 162:       // Case C: PNG base64 (e.g. data:image/png;base64,...)
 163:       if (photo.startsWith('data:image/png;base64,')) {
 164:         const b64 = photo.replace('data:image/png;base64,', '');
 165:         const imgBuffer = Buffer.from(b64, 'base64');
 166:         res.setHeader('Content-Type', 'image/png');
 167:         res.setHeader('Content-Length', imgBuffer.length);
 168:         res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
 169:         return res.status(200).send(imgBuffer);
 170:       }
 171: 
 172:       // Case D: External HTTP/HTTPS URL (e.g. Supabase Storage or CDN)
 173:       // ðŸ›¡ï¸ WhatsApp & Social scrapers strictly drop images returning 302. We stream image bytes directly with 200 OK!
 174:       if (photo.startsWith('http://') || photo.startsWith('https://')) {
 175:         try {
 176:           const parsedPhotoUrl = new URL(photo);
 177:           const host = parsedPhotoUrl.hostname.toLowerCase();
 178:           // SSRF Protection: strictly allow only trusted CDN & storage domains
 179:           const isAllowedHost =
 180:             host.endsWith('.supabase.co') ||
 181:             host.endsWith('.googleusercontent.com') ||
 182:             host.endsWith('.ggpht.com') ||
 183:             host === 'images.unsplash.com' ||
 184:             host === 'www.dalilaak.com' ||
 185:             host === 'dalilaak.com';
 186: 
 187:           if (!isAllowedHost) {
 188:             console.warn('[biz-og] Blocked untrusted photo host for SSRF prevention:', host);
 189:           } else {
 190:             const controller = new AbortController();
 191:             let reader: any = null;
 192:             const timeout = setTimeout(() => {
 193:               controller.abort();
 194:               if (reader) {
 195:                 try {
 196:                   reader.cancel().catch(() => {});
 197:                 } catch {}
 198:               }
 199:             }, 5000);
 200:             try {
 201:               const imgRes = await fetch(photo, { signal: controller.signal });
 202:               if (imgRes.ok && imgRes.body) {
 203:                 const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
 204:                 const contentLength = Number(imgRes.headers.get('content-length') || 0);
 205:                 const MAX_SIZE = 5 * 1024 * 1024;
 206:                 if (contentLength > MAX_SIZE) {
 207:                   throw new Error('Image too large');
 208:                 }
 209:                 reader = (imgRes.body as any).getReader();
 210:                 const chunks: Uint8Array[] = [];
 211:                 let received = 0;
 212:                 while (true) {
 213:                   const { done, value } = await reader.read();
 214:                   if (done) break;
 215:                   if (value) {
 216:                     received += value.length;
 217:                     if (received > MAX_SIZE) {
 218:                       await reader.cancel();
 219:                       throw new Error('Image stream exceeded 5MB ceiling');
 220:                     }
 221:                     chunks.push(value);
 222:                   }
 223:                 }
 224:                 if (controller.signal.aborted) {
 225:                   throw new Error('Image fetch timeout');
 226:                 }
 227:                 const buffer = Buffer.concat(chunks);
 228:                 res.setHeader('Content-Type', contentType);
 229:                 res.setHeader('Content-Length', buffer.length);
 230:                 res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
 231:                 return res.status(200).send(buffer);
 232:               }
 233:             } finally {
 234:               clearTimeout(timeout);
 235:             }
 236:           }
 237:         } catch (fetchErr) {
 238:           console.warn('Failed streaming external photo in biz-og, falling back to card generator:', fetchErr);
 239:         }
 240:       }
 241:     }
 242: 
 243:     // 3. Fallback: Generate custom luxury gold card for this business
 244:     const cardSvg = generateFallbackCardSvg(biz);
 245:     const resvg = new Resvg(cardSvg, {
 246:       fitTo: { mode: 'width', value: 1200 },
 247:     });
 248:     const pngBuffer = resvg.render().asPng();
 249: 
 250:     res.setHeader('Content-Type', 'image/png');
 251:     res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
 252:     return res.status(200).send(pngBuffer);
 253: 
 254:   } catch (err) {
 255:     console.error('Error generating biz-og:', err);
 256:     res.setHeader('Cache-Control','no-store');
 257:     return res.status(503).send('ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙˆØ±Ø©');
 258:   }
 259: }
``

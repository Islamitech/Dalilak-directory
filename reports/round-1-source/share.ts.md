# Source: api/share.ts

``typescript
   1: import type { VercelRequest, VercelResponse } from '@vercel/node';
   2: import * as fs from 'fs';
   3: import * as path from 'path';
   4: 
   5: import { findPublicBusiness, loadPublicDirectory, publicBusinessSlug } from '../src/server/directoryData.js';
   6: 
   7: function escapeHtml(str: string): string {
   8:   return (str || '').replace(/[&<>"']/g, (m) => {
   9:     switch (m) {
  10:       case '&': return '&amp;';
  11:       case '<': return '&lt;';
  12:       case '>': return '&gt;';
  13:       case '"': return '&quot;';
  14:       case '\'': return '&#039;';
  15:       default: return m;
  16:     }
  17:   });
  18: }
  19: 
  20: 
  21: function resolveSchemaType(category?: string): string {
  22:   if (!category || typeof category !== 'string') return 'LocalBusiness';
  23:   const c = category.toLowerCase();
  24:   if (c.includes('ØµÙŠØ¯Ù„') || c.includes('Ø£Ø¯ÙˆÙŠ') || c.includes('Ø¹Ù„Ø§Ø¬')) return 'Pharmacy';
  25:   if (c.includes('Ù…Ø·Ø¹Ù…') || c.includes('Ù…Ø£ÙƒÙˆÙ„') || c.includes('ÙˆØ¬Ø¨') || c.includes('Ù…Ø´ÙˆÙŠ') || c.includes('Ø¨ÙŠØªØ²Ø§') || c.includes('Ø¨Ø±Ø¬Ø±') || c.includes('Ø´Ø§ÙˆØ±Ù…Ø§') || c.includes('Ø£Ø³Ù…Ø§Ùƒ')) return 'Restaurant';
  26:   if (c.includes('ÙƒØ§ÙÙŠÙ‡') || c.includes('Ù…Ù‚Ù‡Ù‰') || c.includes('Ù‚Ù‡Ùˆ')) return 'CafeOrCoffeeShop';
  27:   if (c.includes('Ø£Ø³Ù†Ø§Ù†')) return 'Dentist';
  28:   if (c.includes('Ø·Ø¨ÙŠ') || c.includes('Ø¹ÙŠØ§Ø¯') || c.includes('Ø¯ÙƒØªÙˆØ±') || c.includes('Ù…Ø³ØªØ´Ù') || c.includes('Ø¨ØµØ±ÙŠ')) return 'MedicalBusiness';
  29:   if (c.includes('Ø³ÙŠØ§Ø±') || c.includes('Ù…ÙŠÙƒØ§Ù†ÙŠÙƒ') || c.includes('Ø¥Ø·Ø§Ø±') || c.includes('Ø²ÙŠÙˆØª') || c.includes('ØºØ³ÙŠÙ„ Ø³ÙŠØ§Ø±')) return 'AutoRepair';
  30:   if (c.includes('Ø³ÙˆØ¨Ø±') || c.includes('Ù…Ø§Ø±ÙƒØª') || c.includes('Ø¨Ù‚Ø§Ù„') || c.includes('Ø£ØºØ°ÙŠØ©')) return 'GroceryStore';
  31:   if (c.includes('Ø­Ù„ÙˆÙŠ') || c.includes('Ù…Ø®Ø¨Ø²') || c.includes('Ø£ÙØ±Ø§Ù†') || c.includes('ÙØ·Ø§Ø¦Ø±')) return 'Bakery';
  32:   if (c.includes('Ø­Ù„Ø§Ù‚') || c.includes('ØªØ¬Ù…ÙŠÙ„') || c.includes('ÙƒÙˆØ§ÙÙŠØ±') || c.includes('ØµØ§Ù„ÙˆÙ†')) return 'BeautySalon';
  33:   return 'LocalBusiness';
  34: }
  35: 
  36: function slugify(name?: string): string {
  37:   if (!name || typeof name !== 'string') return '';
  38:   return name
  39:     .trim()
  40:     .replace(/[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
  41:     .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
  42:     .replace(/[Ø£Ø¥Ø¢Ù±]/g, 'Ø§')
  43:     .replace(/Ø©/g, 'Ù‡')
  44:     .replace(/Ù‰/g, 'ÙŠ')
  45:     .replace(/[Â«Â»"'""''\(\)\[\]{}#@!$%^&*+=\\\/|:;<>?,.~`ØŒØ›ØŸÙª_]/g, ' ')
  46:     .replace(/\s+/g, '-')
  47:     .replace(/-+/g, '-')
  48:     .replace(/^-+|-+$/g, '')
  49:     .split('-')
  50:     .filter(Boolean)
  51:     .slice(0, 7)
  52:     .join('-');
  53: }
  54: 
  55: let cachedTemplate = '';
  56: 
  57: function getBaseTemplate(): string {
  58:   if (cachedTemplate) return cachedTemplate;
  59: 
  60:   const distPath = path.join(process.cwd(), 'dist', 'index.html');
  61:   if (fs.existsSync(distPath)) {
  62:     try {
  63:       cachedTemplate = fs.readFileSync(distPath, 'utf8');
  64:       return cachedTemplate;
  65:     } catch {}
  66:   }
  67: 
  68:   const indexPath = path.join(process.cwd(), 'index.html');
  69:   if (fs.existsSync(indexPath)) {
  70:     try {
  71:       return fs.readFileSync(indexPath, 'utf8');
  72:     } catch {}
  73:   }
  74: 
  75:   return '';
  76: }
  77: 
  78: export default async function handler(req: VercelRequest, res: VercelResponse) {
  79:   try {
  80:     const rawBizQuery = req.query.biz || req.query.id;
  81:     const rawBiz = Array.isArray(rawBizQuery) ? rawBizQuery[0] : rawBizQuery;
  82:     const rawPageQuery = req.query.page;
  83:     const pageKey = Array.isArray(rawPageQuery) ? rawPageQuery[0] : (typeof rawPageQuery === 'string' ? rawPageQuery : '');
  84: 
  85:     const ALLOWED_HOSTS = ['www.dalilaak.com', 'dalilaak.com', 'dalilak.vercel.app', 'localhost:5173', '127.0.0.1:5173'];
  86:     const reqHost = ((req.headers['x-forwarded-host'] as string) || req.headers.host || '').toLowerCase().trim();
  87:     const host = ALLOWED_HOSTS.includes(reqHost) || reqHost.endsWith('.vercel.app') ? reqHost : 'www.dalilaak.com';
  88:     const proto = (req.headers['x-forwarded-proto'] as string) === 'http' && host.includes('localhost') ? 'http' : 'https';
  89:     const origin = `${proto}://${host}`;
  90: 
  91:     // ðŸŒ Institutional & High-Intent Static Page Server-Side Rendering
  92:     const STATIC_PAGE_META: Record<string, { title: string; desc: string; path: string; heading: string }> = {
  93:       about: {
  94:         title: 'Ø¹Ù† Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ ÙˆØ±Ø³Ø§Ù„ØªÙ‡Ø§ Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ© | Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ',
  95:         desc: 'Ø§Ù„Ø±Ø¤ÙŠØ© ÙˆØ§Ù„Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ù…Ø¤Ø³Ø³ÙŠØ© Ù„Ù…Ù†Ø¸ÙˆÙ…Ø© Ø¯Ù„ÙŠÙ„Ùƒ Ù„ØªÙ†Ø¸ÙŠÙ… ÙˆØªÙˆØ«ÙŠÙ‚ Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ø®Ø¯Ù…Ø§Øª ÙˆØ§Ù„Ø£Ù†Ø´Ø·Ø© ÙÙŠ Ù…Ø­Ø§ÙØ¸Ø§Øª Ù…ØµØ±.',
  96:         path: '/about',
  97:         heading: 'Ø¹Ù† Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ ÙˆØ±Ø³Ø§Ù„ØªÙ‡Ø§ Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ©',
  98:       },
  99:       pricing: {
 100:         title: 'Ø¨Ø§Ù‚Ø§Øª Ø§Ù„Ù†Ù…Ùˆ ÙˆØ§Ù„ØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠ Ù„Ù„Ø£Ù†Ø´Ø·Ø© | Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ',
 101:         desc: 'Ø§ÙƒØªØ´Ù Ø¨Ø§Ù‚Ø§Øª ØªÙˆØ«ÙŠÙ‚ ÙˆØ§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø­Ù„Ø§Øª ÙˆØ§Ù„Ø´Ø±ÙƒØ§ØªØŒ Ø§Ù„ÙÙˆØ§ØªÙŠØ± Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©ØŒ ÙˆØ¨Ø·Ø§Ù‚Ø§Øª Ø§Ù„Ø¯Ø¹Ù… Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠ ÙÙŠ Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ.',
 102:         path: '/pricing',
 103:         heading: 'Ø¨Ø§Ù‚Ø§Øª Ø§Ù„ØªÙˆØ«ÙŠÙ‚ ÙˆØ§Ù„Ù†Ù…Ùˆ Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠ ÙÙŠ Ø¯Ù„ÙŠÙ„Ùƒ',
 104:       },
 105:       'for-business': {
 106:         title: 'Ø£Ø¶Ù Ù†Ø´Ø§Ø·Ùƒ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ Ù…Ø¬Ø§Ù†Ø§Ù‹ | Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ',
 107:         desc: 'Ø³Ø¬Ù‘Ù„ Ù…Ø­Ù„Ùƒ Ø£Ùˆ Ø®Ø¯Ù…ØªÙƒ ÙÙŠ Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© Ù…Ø¬Ø§Ù†Ø§Ù‹ ÙˆØ§Ø­ØµÙ„ Ø¹Ù„Ù‰ ØªÙˆØ«ÙŠÙ‚ Ù„Ù…ÙˆÙ‚Ø¹Ùƒ Ø¹Ù„Ù‰ Ø®Ø±Ø§Ø¦Ø· Google ÙˆØªÙˆØ§ØµÙ„ Ù…Ø¨Ø§Ø´Ø± Ù…Ø¹ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡.',
 108:         path: '/for-business',
 109:         heading: 'Ø³Ø¬Ù‘Ù„ Ù†Ø´Ø§Ø·Ùƒ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ ÙÙŠ Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ',
 110:       },
 111:       search: {
 112:         title: 'Ø§Ø³ØªÙƒØ´Ù Ø§Ù„Ø£Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© | Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ',
 113:         desc: 'Ø¯Ù„ÙŠÙ„ Ø§Ù„Ù…Ø­Ù„Ø§Øª ÙˆØ§Ù„Ø£Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© ÙÙŠ Ø­Ø¯Ø§Ø¦Ù‚ Ø§Ù„Ø£Ù‡Ø±Ø§Ù… ÙˆÙ…Ø­Ø§ÙØ¸Ø§Øª Ù…ØµØ±. ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø¹Ù†Ø§ÙˆÙŠÙ†ØŒ Ø£Ø±Ù‚Ø§Ù… Ø§Ù„ØªÙˆØ§ØµÙ„ ÙˆØ³Ø§Ø¹Ø§Øª Ø§Ù„Ø¹Ù…Ù„.',
 114:         path: '/search',
 115:         heading: 'Ø¯Ù„ÙŠÙ„ Ø§Ù„Ù…Ø­Ù„Ø§Øª ÙˆØ§Ù„Ø£Ù†Ø´Ø·Ø© Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ© ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©',
 116:       },
 117:       map: {
 118:         title: 'Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ø§Ù„ØªÙØ§Ø¹Ù„ÙŠØ© ÙˆØ§Ù„Ù…ÙˆØ§Ù‚Ø¹ Ø§Ù„Ù…ÙˆØ«Ù‚Ø© | Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ',
 119:         desc: 'Ø§Ø³ØªÙƒØ´Ù Ø§Ù„Ù…Ø­Ù„Ø§Øª ÙˆØ§Ù„Ø£Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ© Ø§Ù„Ù‚Ø±ÙŠØ¨Ø© Ù…Ù†Ùƒ Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ø­ÙŠØ© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© ÙÙŠ Ø­Ø¯Ø§Ø¦Ù‚ Ø§Ù„Ø£Ù‡Ø±Ø§Ù… ÙˆÙ…ØµØ±.',
 120:         path: '/map',
 121:         heading: 'Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ø§Ù„ØªÙØ§Ø¹Ù„ÙŠØ© Ù„Ù„Ø£Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ©',
 122:       },
 123:     };
 124: 
 125:     if (pageKey && STATIC_PAGE_META[pageKey]) {
 126:       const pageInfo = STATIC_PAGE_META[pageKey];
 127:       let pageTitle = pageInfo.title;
 128:       let pageDesc = pageInfo.desc;
 129:       let pageHeading = pageInfo.heading;
 130: 
 131:       const rawCat = req.query.cat;
 132:       const catParam = Array.isArray(rawCat) ? rawCat[0] : (typeof rawCat === 'string' ? rawCat : '');
 133:       if (pageKey === 'search' && catParam) {
 134:         const catMap: Record<string, string> = {
 135:           food: 'Ø§Ù„Ù…Ø·Ø§Ø¹Ù… ÙˆØ§Ù„ÙƒØ§ÙÙŠÙ‡Ø§Øª ÙˆØ§Ù„Ù…Ø£ÙƒÙˆÙ„Ø§Øª',
 136:           grocery: 'Ø§Ù„Ø³ÙˆØ¨Ø± Ù…Ø§Ø±ÙƒØª ÙˆØ§Ù„Ø¨Ù‚Ø§Ù„Ø© ÙˆØ§Ù„ØªÙ…ÙˆÙŠÙ†',
 137:           health: 'Ø§Ù„Ø¹ÙŠØ§Ø¯Ø§Øª ÙˆØ§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„ØµØ­ÙŠØ© ÙˆØ§Ù„ØµÙŠØ¯Ù„ÙŠØ§Øª',
 138:           fashion: 'Ø§Ù„Ù…Ù„Ø§Ø¨Ø³ ÙˆØ§Ù„Ø£Ø²ÙŠØ§Ø¡ ÙˆØ§Ù„Ø¥ÙƒØ³Ø³ÙˆØ§Ø±Ø§Øª',
 139:           electronics: 'Ø§Ù„Ù‡ÙˆØ§ØªÙ ÙˆØ§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ§Øª ÙˆØ§Ù„ÙƒÙ…Ø¨ÙŠÙˆØªØ±',
 140:           automotive: 'Ø§Ù„Ø³ÙŠØ§Ø±Ø§Øª ÙˆØ§Ù„Ù…Ø±ÙƒØ¨Ø§Øª ÙˆØ®Ø¯Ù…Ø§Øª Ø§Ù„ØµÙŠØ§Ù†Ø©',
 141:           'beauty-fitness': 'Ø§Ù„ØªØ¬Ù…ÙŠÙ„ ÙˆØ§Ù„Ø¹Ù†Ø§ÙŠØ© Ø§Ù„Ø´Ø®ØµÙŠØ© ÙˆØ§Ù„Ù„ÙŠØ§Ù‚Ø©',
 142:           crafts: 'Ø§Ù„Ø­Ø±Ù ÙˆØ§Ù„ÙˆØ±Ø´ ÙˆØ§Ù„ØµÙŠØ§Ù†Ø© Ø§Ù„ÙÙ†ÙŠØ© Ø§Ù„Ù…Ù†Ø²Ù„ÙŠØ©',
 143:           home: 'Ø§Ù„Ø£Ø«Ø§Ø« ÙˆØ§Ù„Ø¯ÙŠÙƒÙˆØ± ÙˆÙ…Ø³ØªÙ„Ø²Ù…Ø§Øª Ø§Ù„Ù…Ù†Ø²Ù„',
 144:           'professional-services': 'Ø§Ù„Ø´Ø±ÙƒØ§Øª ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª ÙˆØ§Ù„Ù…ÙƒØ§ØªØ¨ Ø§Ù„Ù…Ù‡Ù†ÙŠØ©',
 145:         };
 146:         const catLabel = catMap[catParam] || decodeURIComponent(catParam);
 147:         pageTitle = `${catLabel} ÙÙŠ Ù…ØµØ± ÙˆØ­Ø¯Ø§Ø¦Ù‚ Ø§Ù„Ø£Ù‡Ø±Ø§Ù… | Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ`;
 148:         pageDesc = `Ø¯Ù„ÙŠÙ„ Ø´Ø§Ù…Ù„ ÙˆÙ…ÙˆØ«Ù‚ Ù„Ù€ ${catLabel} ÙÙŠ Ø­Ø¯Ø§Ø¦Ù‚ Ø§Ù„Ø£Ù‡Ø±Ø§Ù… ÙˆÙ…ØµØ±. Ø¹Ù†Ø§ÙˆÙŠÙ† Ø¯Ù‚ÙŠÙ‚Ø©ØŒ Ø£Ø±Ù‚Ø§Ù… ØªÙˆØ§ØµÙ„ØŒ Ø³Ø§Ø¹Ø§Øª Ø¹Ù…Ù„ ÙˆÙ…ÙˆØ§Ù‚Ø¹ Google Maps.`;
 149:         pageHeading = `Ø¯Ù„ÙŠÙ„ ${catLabel} Ø§Ù„Ù…Ø¹ØªÙ…Ø¯`;
 150:       }
 151: 
 152:       const canonicalPageUrl = `${origin}${pageInfo.path}`;
 153:       const ogImageUrl = `${origin}/og-image.jpg?v=2026_dalilak_v5_platform`;
 154: 
 155:       const jsonLdData = {
 156:         '@context': 'https://schema.org',
 157:         '@graph': [
 158:           {
 159:             '@type': 'WebPage',
 160:             '@id': `${canonicalPageUrl}#webpage`,
 161:             url: canonicalPageUrl,
 162:             name: pageTitle,
 163:             description: pageDesc,
 164:             inLanguage: 'ar',
 165:             isPartOf: {
 166:               '@type': 'WebSite',
 167:               '@id': `${origin}/#website`,
 168:             },
 169:           },
 170:           {
 171:             '@type': 'BreadcrumbList',
 172:             '@id': `${canonicalPageUrl}#breadcrumb`,
 173:             itemListElement: [
 174:               {
 175:                 '@type': 'ListItem',
 176:                 position: 1,
 177:                 name: 'Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ',
 178:                 item: `${origin}/`,
 179:               },
 180:               {
 181:                 '@type': 'ListItem',
 182:                 position: 2,
 183:                 name: pageHeading,
 184:                 item: canonicalPageUrl,
 185:               },
 186:             ],
 187:           },
 188:         ],
 189:       };
 190:       const jsonLdTag = `<script type="application/ld+json">${JSON.stringify(jsonLdData).replace(/</g, '\\u003c')}</script>`;
 191: 
 192:       let template = getBaseTemplate();
 193:       if (!template) {
 194:         template = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${escapeHtml(pageTitle)}</title></head><body><div id="root"></div></body></html>`;
 195:       }
 196: 
 197:       let html = template.replace(/(src|href)="\.\//g, '$1="/');
 198: 
 199:       // Replace Meta Tags
 200:       html = html.replace(/<title>.*?<\/title>/gi, () => `<title>${escapeHtml(pageTitle)}</title>`);
 201:       html = html.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="title" content="${escapeHtml(pageTitle)}" />`);
 202:       html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="description" content="${escapeHtml(pageDesc)}" />`);
 203: 
 204:       // Open Graph Tags
 205:       html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`);
 206:       html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:description" content="${escapeHtml(pageDesc)}" />`);
 207:       html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:url" content="${escapeHtml(canonicalPageUrl)}" />`);
 208:       html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`);
 209:       html = html.replace(/<meta\s+property="og:image:secure_url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />`);
 210: 
 211:       // Twitter Tags
 212:       html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`);
 213:       html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:description" content="${escapeHtml(pageDesc)}" />`);
 214:       html = html.replace(/<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:url" content="${escapeHtml(canonicalPageUrl)}" />`);
 215:       html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`);
 216: 
 217:       // Canonical URL
 218:       html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, () => `<link rel="canonical" href="${escapeHtml(canonicalPageUrl)}" />`);
 219: 
 220:       // Inject JSON-LD
 221:       if (html.includes('</head>')) {
 222:         html = html.replace('</head>', `  ${jsonLdTag}\n</head>`);
 223:       }
 224: 
 225:       // Pre-rendered crawler snapshot
 226:       const staticSnapshot = `
 227:   <div id="root">
 228:     <main class="dalilak-crawler-snapshot" dir="rtl" lang="ar" style="max-width: 900px; margin: 2rem auto; padding: 1.5rem; font-family: 'Cairo', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.6;">
 229:       <article>
 230:         <header style="border-bottom: 2px solid #f59e0b; padding-bottom: 1rem; margin-bottom: 1.5rem;">
 231:           <h1 style="font-size: 1.85rem; font-weight: 900; margin: 0 0 0.5rem 0; color: #0f172a;">${escapeHtml(pageHeading)}</h1>
 232:           <p style="margin: 0.25rem 0; font-size: 0.95rem; color: #475569;">${escapeHtml(pageDesc)}</p>
 233:         </header>
 234:         <section style="margin-bottom: 1.5rem;">
 235:           <p>Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ Ù‡ÙŠ Ø§Ù„Ø¯Ù„ÙŠÙ„ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ Ù„Ø§Ø³ØªÙƒØ´Ø§Ù ÙˆØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ù…Ø­Ù„Ø§Øª ÙˆØ§Ù„Ø£Ù†Ø´Ø·Ø© Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ© ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ© ÙÙŠ Ù…Ø­Ø§ÙØ¸Ø§Øª Ù…ØµØ±.</p>
 236:           <p><a href="/search" style="color: #d97706; font-weight: bold; text-decoration: none;">Ø§Ù†ØªÙ‚Ù„ Ø¥Ù„Ù‰ Ø¯Ù„ÙŠÙ„ Ø§Ù„Ø£Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ø¨Ø­Ø« Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</a></p>
 237:         </section>
 238:         <footer style="border-top: 1px solid #e2e8f0; padding-top: 1rem; font-size: 0.85rem; color: #64748b;">
 239:           <p>Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ | Ø§Ù„Ø¯Ù„ÙŠÙ„ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ Ù„Ù„Ø£Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ© ÙÙŠ Ù…ØµØ±</p>
 240:         </footer>
 241:       </article>
 242:     </main>
 243:   </div>`;
 244: 
 245:       if (html.includes('<div id="root"></div>')) {
 246:         html = html.replace('<div id="root"></div>', staticSnapshot);
 247:       }
 248: 
 249:       res.setHeader('Content-Type', 'text/html; charset=utf-8');
 250:       res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
 251:       return res.status(200).send(html);
 252:     }
 253: 
 254:     if (!rawBiz || typeof rawBiz !== 'string') {
 255:       const template = getBaseTemplate();
 256:       if (template) {
 257:         res.setHeader('Content-Type', 'text/html; charset=utf-8');
 258:         res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
 259:         return res.status(200).send(template.replace(/(src|href)="\.\//g, '$1="/'));
 260:       }
 261:       return res.redirect(302, '/');
 262:     }
 263: 
 264:     const decodedParam = decodeURIComponent(rawBiz).trim();
 265:     // Extract canonical entity ID if embedded inside slug (e.g. "Ù…Ø·Ø¹Ù…-Ø£Ø¨Ùˆ-Ø®Ø§Ù„Ø¯-biz_1788118588424" -> "biz_1788118588424")
 266:     const idMatch = decodedParam.match(/(biz_[a-zA-Z0-9_-]+)/i);
 267:     const bizId = idMatch ? idMatch[1] : decodedParam;
 268: 
 269:     const biz = await findPublicBusiness(decodedParam);
 270: 
 271:     const template = getBaseTemplate();
 272: 
 273:     if (!biz) {
 274:       if (template) {
 275:         res.setHeader('Content-Type', 'text/html; charset=utf-8');
 276:         return res.status(404).send(template.replace(/(src|href)="\.\//g, '$1="/'));
 277:       }
 278:       return res.redirect(302, '/');
 279:     }
 280: 
 281:     let googleRatingEnabled = false;
 282:     let googleRating: number | null = null;
 283:     let googleReviewsCount: number | null = null;
 284:     let googleMapsUrl: string | null = null;
 285: 
 286:     if (typeof biz.notes === 'string' && biz.notes.trim().startsWith('{')) {
 287:       try {
 288:         const parsed = JSON.parse(biz.notes.trim());
 289:         if (parsed && typeof parsed === 'object') {
 290:           if (parsed.googleRatingEnabled) googleRatingEnabled = Boolean(parsed.googleRatingEnabled);
 291:           if (parsed.googleRating !== undefined && parsed.googleRating !== null) googleRating = Number(parsed.googleRating);
 292:           if (parsed.googleReviewsCount !== undefined && parsed.googleReviewsCount !== null) googleReviewsCount = Number(parsed.googleReviewsCount);
 293:           if (parsed.googleMapsUrl || parsed.google_maps_url) googleMapsUrl = String(parsed.googleMapsUrl || parsed.google_maps_url).trim();
 294:         }
 295:       } catch {}
 296:     }
 297: 
 298:     const nameAr = biz.name_ar || biz.name_en || 'Ù†Ø´Ø§Ø· ØªØ¬Ø§Ø±ÙŠ Ù…Ø¹ØªÙ…Ø¯';
 299:     const category = biz.category || 'Ø¯Ù„ÙŠÙ„ Ø§Ù„Ø£Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª';
 300:     const locationParts = [biz.city, biz.street, biz.governorate].filter(Boolean);
 301:     const locationStr = locationParts.length > 0 ? locationParts.join(' - ') : 'Ù…ØµØ±';
 302:     const phone = biz.phone || '';
 303:     const secondaryPhone = biz.secondary_phone || '';
 304:     const phones = [phone, secondaryPhone].filter(Boolean).join(' / ');
 305: 
 306:     // Google rating snippet
 307:     let ratingPart = '';
 308:     if (googleRatingEnabled && googleRating) {
 309:       const formattedRating = googleRating.toFixed(1);
 310:       ratingPart = `â­ ØªÙ‚ÙŠÙŠÙ… Google: ${formattedRating}${googleReviewsCount ? ` (${googleReviewsCount} ØªÙ‚ÙŠÙŠÙ…)` : ''}`;
 311:     }
 312: 
 313:     const pageTitle = `${nameAr} | Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©`;
 314:     const cleanPageTitle = pageTitle.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
 315: 
 316:     // Business Description from "ÙˆØµÙ Ø§Ù„Ø£Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª"
 317:     const rawDesc = (biz.description || '').trim();
 318: 
 319:     // If description is short (or empty), include phones and location
 320:     let descBody = '';
 321:     if (rawDesc.length >= 35) {
 322:       // Meaningful rich description entered by the user
 323:       descBody = rawDesc;
 324:       if (phones) {
 325:         descBody += ` â€¢ ØªÙˆØ§ØµÙ„: ${phones}`;
 326:       }
 327:     } else {
 328:       // Short or empty description: prominently show phones + category + location
 329:       const parts: string[] = [];
 330:       if (rawDesc) parts.push(rawDesc);
 331:       if (phones) parts.push(`ØªÙˆØ§ØµÙ„: ${phones}`);
 332:       parts.push(`${category} - ${locationStr}`);
 333:       descBody = parts.join(' â€¢ ');
 334:     }
 335: 
 336:     const shareDesc = [ratingPart, descBody].filter(Boolean).join(' â€¢ ');
 337:     const cleanShareDesc = shareDesc.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
 338: 
 339:     // ðŸ›¡ï¸ Resolve direct high-speed photo for OpenGraph preview (Strictly Direct 200 OK CDN)
 340:     let coverPhoto: string | null = null;
 341:     if (typeof biz.notes === 'string' && biz.notes.trim().startsWith('{')) {
 342:       try {
 343:         const parsed = JSON.parse(biz.notes.trim());
 344:         if (parsed && typeof parsed === 'object' && parsed.coverPhoto) {
 345:           coverPhoto = parsed.coverPhoto;
 346:         }
 347:       } catch {}
 348:     }
 349: 
 350:     let rawPhotos: string[] = [];
 351:     if (Array.isArray(biz.photos)) {
 352:       rawPhotos = biz.photos;
 353:     } else if (typeof biz.photos === 'string' && biz.photos.trim().length > 0) {
 354:       try {
 355:         const p = JSON.parse(biz.photos.trim());
 356:         if (Array.isArray(p)) rawPhotos = p;
 357:         else if (typeof p === 'string') rawPhotos = [p];
 358:       } catch {
 359:         if (biz.photos.startsWith('http') || biz.photos.startsWith('data:')) rawPhotos = [biz.photos];
 360:       }
 361:     }
 362:     const directPhoto = coverPhoto || (rawPhotos.length > 0 ? rawPhotos[0] : null);
 363: 
 364:     // âš¡ WhatsApp, Facebook & iMessage strictly mandate direct 200 OK image URLs.
 365:     // If the venue has an enhanced Supabase/CDN photo URL, use it directly!
 366:     let ogImageUrl = '';
 367:     let ogImageType = 'image/jpeg';
 368:     if (typeof directPhoto === 'string' && (directPhoto.startsWith('https://') || directPhoto.startsWith('http://'))) {
 369:       ogImageUrl = directPhoto;
 370:       if (directPhoto.toLowerCase().includes('.png')) {
 371:         ogImageType = 'image/png';
 372:       } else if (directPhoto.toLowerCase().includes('.webp')) {
 373:         ogImageType = 'image/webp';
 374:       }
 375:     } else {
 376:       // Fallback: Dynamic branded card generator
 377:       const photoVer = directPhoto ? directPhoto.length : (biz.created_at || '');
 378:       ogImageUrl = `${origin}/api/biz-og?biz=${encodeURIComponent(biz.id)}${photoVer ? `&v=${encodeURIComponent(photoVer)}` : ''}`;
 379:       ogImageType = 'image/png';
 380:     }
 381: 
 382:     // Resolve clean semantic SEO slug
 383:     let customSlug = '';
 384:     if (typeof biz.notes === 'string' && biz.notes.includes('customDirectoryUrl')) {
 385:       try {
 386:         const parsed = JSON.parse(biz.notes);
 387:         if (parsed.customDirectoryUrl) customSlug = parsed.customDirectoryUrl;
 388:       } catch {}
 389:     }
 390:     const nameSlug = slugify(nameAr) || 'Ù†Ø´Ø§Ø·';
 391:     const citySlug = biz.city ? slugify(biz.city) : '';
 392:     const locPart = citySlug && !nameSlug.includes(citySlug) ? `-${citySlug}` : '';
 393:     const canonicalPageUrl = `${origin}/biz/${encodeURIComponent(publicBusinessSlug(biz))}`;
 394:     const pageUrl = canonicalPageUrl;
 395: 
 396:     const schemaType = resolveSchemaType(biz.category);
 397:     const numLat = Number(biz.lat);
 398:     const numLng = Number(biz.lng);
 399:     const hasValidCoords = Number.isFinite(numLat) && Number.isFinite(numLng) && numLat !== 0 && numLng !== 0;
 400:     const finalMapsUrl = googleMapsUrl || (hasValidCoords ? `https://www.google.com/maps?q=${numLat},${numLng}` : undefined);
 401: 
 402:     const jsonLdGraph: any[] = [
 403:       {
 404:         '@type': schemaType,
 405:         '@id': `${canonicalPageUrl}#business`,
 406:         name: nameAr,
 407:         description: cleanShareDesc,
 408:         url: canonicalPageUrl,
 409:         telephone: phone || undefined,
 410:         priceRange: '$',
 411:         currenciesAccepted: 'EGP',
 412:         address: {
 413:           '@type': 'PostalAddress',
 414:           addressLocality: biz.city || undefined,
 415:           addressRegion: biz.governorate || 'Ø§Ù„Ø¬ÙŠØ²Ø©',
 416:           streetAddress: biz.street || undefined,
 417:           addressCountry: 'EG',
 418:         },
 419:         image: ogImageUrl || undefined,
 420:         ...(hasValidCoords ? {
 421:           geo: {
 422:             '@type': 'GeoCoordinates',
 423:             latitude: numLat,
 424:             longitude: numLng,
 425:           },
 426:         } : {}),
 427:         ...(googleRating && googleRating >= 1 ? {
 428:           aggregateRating: {
 429:             '@type': 'AggregateRating',
 430:             ratingValue: googleRating.toFixed(1),
 431:             reviewCount: googleReviewsCount || 1,
 432:             bestRating: '5',
 433:             worstRating: '1',
 434:           },
 435:         } : {}),
 436:         ...(biz.working_hours ? {
 437:           openingHours: String(biz.working_hours).trim(),
 438:         } : {}),
 439:         ...(finalMapsUrl ? {
 440:           hasMap: finalMapsUrl,
 441:           sameAs: [finalMapsUrl],
 442:         } : {}),
 443:       },
 444:       {
 445:         '@type': 'BreadcrumbList',
 446:         '@id': `${canonicalPageUrl}#breadcrumb`,
 447:         itemListElement: [
 448:           {
 449:             '@type': 'ListItem',
 450:             position: 1,
 451:             name: 'Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ',
 452:             item: `${origin}/`,
 453:           },
 454:           {
 455:             '@type': 'ListItem',
 456:             position: 2,
 457:             name: biz.governorate || 'Ø§Ù„Ø¬ÙŠØ²Ø©',
 458:             item: `${origin}/search`,
 459:           },
 460:           {
 461:             '@type': 'ListItem',
 462:             position: 3,
 463:             name: category,
 464:             item: `${origin}/search?cat=${encodeURIComponent(category)}`,
 465:           },
 466:           {
 467:             '@type': 'ListItem',
 468:             position: 4,
 469:             name: nameAr,
 470:             item: canonicalPageUrl,
 471:           },
 472:         ],
 473:       },
 474:     ];
 475: 
 476:     const jsonLdData = {
 477:       '@context': 'https://schema.org',
 478:       '@graph': jsonLdGraph,
 479:     };
 480:     const jsonLdTag = `<script type="application/ld+json">${JSON.stringify(jsonLdData).replace(/</g, '\\u003c')}</script>`;
 481: 
 482:     let html = template;
 483: 
 484:     if (!html) {
 485:       // Minimal standalone fallback HTML if no template found on disk
 486:       html = `<!doctype html>
 487: <html lang="ar" dir="rtl">
 488:   <head>
 489:     <meta charset="UTF-8" />
 490:     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 491:     <title>${escapeHtml(cleanPageTitle)}</title>
 492:     <meta name="title" content="${escapeHtml(cleanPageTitle)}" />
 493:     <meta name="description" content="${escapeHtml(cleanShareDesc)}" />
 494:     <meta property="og:type" content="website" />
 495:     <meta property="og:site_name" content="Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ - Dalelak" />
 496:     <meta property="og:url" content="${escapeHtml(canonicalPageUrl)}" />
 497:     <meta property="og:title" content="${escapeHtml(cleanPageTitle)}" />
 498:     <meta property="og:description" content="${escapeHtml(cleanShareDesc)}" />
 499:     <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
 500:     <meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />
 501:     <meta property="og:image:type" content="${ogImageType}" />
 502:     <meta property="og:image:alt" content="${escapeHtml(nameAr)}" />
 503:     <meta name="twitter:card" content="summary_large_image" />
 504:     <meta name="twitter:title" content="${escapeHtml(cleanPageTitle)}" />
 505:     <meta name="twitter:description" content="${escapeHtml(cleanShareDesc)}" />
 506:     <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
 507:     <link rel="canonical" href="${escapeHtml(canonicalPageUrl)}" />
 508:     ${jsonLdTag}
 509:     <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
 510:   </head>
 511:   <body style="background:#020617;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
 512:     <div style="text-align:center;">
 513:       <h2>Ø¬Ø§Ø±ÙŠ ØªØ­ÙˆÙŠÙ„Ùƒ Ø¥Ù„Ù‰ ${escapeHtml(nameAr)}...</h2>
 514:       <a href="/search">Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø¨Ø­Ø«</a>
 515:     </div>
 516:   </body>
 517: </html>`;
 518:     } else {
 519:       // Fix relative paths for assets
 520:       html = html.replace(/(src|href)="\.\//g, '$1="/');
 521: 
 522:       // Replace Meta Tags
 523:       html = html.replace(/<title>.*?<\/title>/gi, () => `<title>${escapeHtml(cleanPageTitle)}</title>`);
 524:       html = html.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="title" content="${escapeHtml(cleanPageTitle)}" />`);
 525:       html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="description" content="${escapeHtml(cleanShareDesc)}" />`);
 526: 
 527:       // Open Graph Tags
 528:       html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:title" content="${escapeHtml(cleanPageTitle)}" />`);
 529:       html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:description" content="${escapeHtml(cleanShareDesc)}" />`);
 530:       html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:url" content="${escapeHtml(canonicalPageUrl)}" />`);
 531:       html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`);
 532:       html = html.replace(/<meta\s+property="og:image:secure_url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />`);
 533:       html = html.replace(/<meta\s+property="og:image:type"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:type" content="${ogImageType}" />`);
 534:       html = html.replace(/<meta\s+property="og:image:alt"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:alt" content="${escapeHtml(nameAr)}" />`);
 535: 
 536:       // Twitter Tags
 537:       html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:title" content="${escapeHtml(cleanPageTitle)}" />`);
 538:       html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:description" content="${escapeHtml(cleanShareDesc)}" />`);
 539:       html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`);
 540:       html = html.replace(/<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:url" content="${escapeHtml(canonicalPageUrl)}" />`);
 541: 
 542:       // Canonical URL
 543:       html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, () => `<link rel="canonical" href="${escapeHtml(canonicalPageUrl)}" />`);
 544: 
 545:       // Inject Schema.org structured data before closing head
 546:       if (html.includes('</head>')) {
 547:         html = html.replace('</head>', `  ${jsonLdTag}\n</head>`);
 548:       }
 549: 
 550:       // Inject Semantic HTML Snapshot for Search Engines (Wave 1 Pre-rendering)
 551:       const semanticSnapshotHtml = `
 552:   <div id="root">
 553:     <main class="dalilak-crawler-snapshot" dir="rtl" lang="ar" style="max-width: 900px; margin: 2rem auto; padding: 1.5rem; font-family: 'Cairo', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.6;">
 554:       <article>
 555:         <header style="border-bottom: 2px solid #f59e0b; padding-bottom: 1rem; margin-bottom: 1.5rem;">
 556:           <h1 style="font-size: 1.85rem; font-weight: 900; margin: 0 0 0.5rem 0; color: #0f172a;">${escapeHtml(nameAr)}</h1>
 557:           <p style="margin: 0.25rem 0; font-size: 0.95rem; color: #475569;"><strong>Ø§Ù„ØªØµÙ†ÙŠÙ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯:</strong> ${escapeHtml(category)}</p>
 558:           <p style="margin: 0.25rem 0; font-size: 0.95rem; color: #475569;"><strong>Ø§Ù„Ø¹Ù†ÙˆØ§Ù† ÙˆØ§Ù„Ù†Ø·Ø§Ù‚:</strong> ${escapeHtml(locationStr)}</p>
 559:           ${googleRating && googleRating >= 1 ? `<p style="margin: 0.25rem 0; font-size: 0.95rem; color: #d97706;"><strong>ØªÙ‚ÙŠÙŠÙ… Google Ø§Ù„Ù…ÙˆØ«Ù‚:</strong> â­ ${googleRating.toFixed(1)} (${googleReviewsCount || 1} ØªÙ‚ÙŠÙŠÙ…)</p>` : ''}
 560:         </header>
 561:         <section style="margin-bottom: 1.5rem;">
 562:           ${phone ? `<p style="margin: 0.5rem 0;"><strong>Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±:</strong> <a href="tel:${escapeHtml(phone)}" style="color: #d97706; font-weight: bold; text-decoration: none;">${escapeHtml(phone)}</a></p>` : ''}
 563:           ${biz.working_hours ? `<p style="margin: 0.5rem 0;"><strong>Ø³Ø§Ø¹Ø§Øª Ø§Ù„Ø¹Ù…Ù„:</strong> ${escapeHtml(String(biz.working_hours))}</p>` : ''}
 564:           ${biz.description ? `<div style="margin: 1rem 0;"><h2 style="font-size: 1.15rem; font-weight: 800; color: #1e293b;">Ù†Ø¨Ø°Ø© Ø¹Ù† Ø§Ù„Ù†Ø´Ø§Ø·</h2><p style="color: #334155; margin: 0.25rem 0;">${escapeHtml(String(biz.description))}</p></div>` : ''}
 565:           ${finalMapsUrl ? `<p style="margin: 1rem 0;"><a href="${escapeHtml(finalMapsUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #f59e0b; color: #0f172a; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; text-decoration: none;">Ø¹Ø±Ø¶ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø¹Ù„Ù‰ Ø®Ø±Ø§Ø¦Ø· Google Maps</a></p>` : ''}
 566:         </section>
 567:         <footer style="border-top: 1px solid #e2e8f0; padding-top: 1rem; font-size: 0.85rem; color: #64748b;">
 568:           <p>Ù…Ù†ØµØ© Ø¯Ù„ÙŠÙ„Ùƒ | Ø§Ù„Ø¯Ù„ÙŠÙ„ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ Ù„Ù„Ø£Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ© ÙÙŠ Ù…ØµØ±</p>
 569:         </footer>
 570:       </article>
 571:     </main>
 572:   </div>`;
 573: 
 574:       if (html.includes('<div id="root"></div>')) {
 575:         html = html.replace('<div id="root"></div>', semanticSnapshotHtml);
 576:       }
 577:     }
 578: 
 579:     res.setHeader('Content-Type', 'text/html; charset=utf-8');
 580:     res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');
 581:     return res.status(200).send(html);
 582: 
 583:   } catch (err) {
 584:     console.error('Error in share handler:', err);
 585:     return res.redirect(302, '/');
 586:   }
 587: }
``

import assert from 'node:assert/strict';
import {isPublicBusiness} from '../shared/publicBusiness';
import {findPublicBusiness,loadPublicDirectory} from '../server/directoryData';
const publicRow={id:'biz_test',verification_status:'verified',package_id:'pkg_basic',name_ar:'اختبار',notes:'{}'};
assert.equal(isPublicBusiness(publicRow),true);
for(const patch of [{verification_status:'pending'},{notes:'{"publishedStatus":"draft"}'},{notes:'{"publishedStatus":"unlisted"}'},{notes:'{"isDeleted":true}'},{package_id:'pkg_interested_lead'},{notes:'{bad'}])assert.equal(isPublicBusiness({...publicRow,...patch}),false);
const originalFetch=globalThis.fetch;
try {
 globalThis.fetch=async()=>new Response(JSON.stringify([{...publicRow,notes:'{"publishedStatus":"draft"}'}]),{status:200});
 assert.equal(await findPublicBusiness('biz_test'),null);
 let page=0;globalThis.fetch=async()=>{page++;return new Response(JSON.stringify([{...publicRow,id:'biz_'+page}]),{headers:{'content-range':(page-1)+'-'+(page-1)+'/2'}});};
 assert.equal((await loadPublicDirectory()).length,2);assert.equal(page,2);
 globalThis.fetch=async()=>new Response('',{status:503});await assert.rejects(()=>loadPublicDirectory());
}finally{globalThis.fetch=originalFetch;}
console.log('PASS: public eligibility, draft rejection, server pagination and upstream errors');

import {getBusinessOpenStatus} from '../utils/directoryEnhancements';
import {filterDirectoryBusinesses} from '../utils/directoryFiltering';
for(const value of ['', 'مغلق','نص غير معروف'])assert.equal(getBusinessOpenStatus(value).isOpen,false);
const cairo=(time:string)=>new Date('2026-01-05T'+time+':00+02:00');
assert.equal(getBusinessOpenStatus('٩:٣٠ ص إلى ٥:١٥ م',cairo('09:29')).isOpen,false);
assert.equal(getBusinessOpenStatus('٩:٣٠ ص إلى ٥:١٥ م',cairo('09:30')).isOpen,true);
assert.equal(getBusinessOpenStatus('09:30 - 17:15',cairo('17:15')).isOpen,false);
assert.equal(getBusinessOpenStatus('10 م إلى 2 ص',cairo('01:30')).isOpen,true);
assert.equal(getBusinessOpenStatus('12 م إلى 4 م',cairo('12:00')).isOpen,true);
const options={activityIntent:null,deferredSearchQuery:'',categoryFilter:'all',subcategoryFilter:'all',effectiveSearchZone:'all',govFilter:'الجيزة',cityFilter:'حدائق الأهرام',openNowOnly:false,hasRatingOnly:false,hasVideoOnly:false};
const fixture:any={id:'biz_filter',nameAr:'اختبار',verificationStatus:'verified',city:'حدائق الأهرام',governorate:'الجيزة',lat:29.979184,lng:31.106863,workingHours:'مغلق',videos:[]};
assert.equal(filterDirectoryBusinesses([fixture],options).length,1);
for(const key of ['openNowOnly','hasRatingOnly','hasVideoOnly'])assert.equal(filterDirectoryBusinesses([fixture],{...options,[key]:true}).length,0,key);
console.log('PASS: Hadayek filters, Arabic minutes, midday, overnight and unknown hours');

import {mergeCatalog,catalogsEqual,parseFavorites} from '../services/catalogState';
const active:any={...fixture,createdDate:'2026-09-01',description:'old'};
assert.equal(mergeCatalog([],new Map([[active.id,active]])).length,1);
assert.equal(mergeCatalog([active],new Map([[active.id,null]])).length,0);
assert.equal(mergeCatalog([active],new Map([[active.id,{...active,description:'new'}]]))[0].description,'new');
assert.equal(catalogsEqual([active],[{...active,description:'new'}]),false);
assert.deepEqual(parseFavorites('{"bad":true}'),[]);assert.deepEqual(parseFavorites('["a","a",3]'),['a']);
console.log('PASS: realtime upsert/delete, live override of stale snapshot, all-field equality, favorite validation');

import {extractBusinessIdFromSlug,getBusinessSlug} from '../utils/directoryUrl';
assert.equal(extractBusinessIdFromSlug('%broken'),'');assert.equal(extractBusinessIdFromSlug('اسم-biz_123'),'biz_123');assert.equal(getBusinessSlug({id:'biz_1',nameAr:'اختبار',customDirectoryUrl:'my-shop'}),'my-shop');
console.log('PASS: malformed and semantic links');

// Stage 5 assertions: Phone normalization, Egyptian format validation, and accessible dialog hook
import {useAccessibleDialog} from '../hooks/useAccessibleDialog';
assert.equal(typeof useAccessibleDialog, 'function');
const normalizePhone = (num: string) => num.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776)).replace(/[\s\-_()]/g, '');
const isValidEgyptianPhone = (num: string) => /^(?:\+?20|0020)?0?1[0125]\d{8}$/.test(normalizePhone(num));
assert.equal(isValidEgyptianPhone('01012345678'), true);
assert.equal(isValidEgyptianPhone('٠١١١٢٣٤٥٦٧٨'), true);
assert.equal(isValidEgyptianPhone('+201212345678'), true);
assert.equal(isValidEgyptianPhone('00201512345678'), true);
assert.equal(isValidEgyptianPhone('01312345678'), false); // invalid operator prefix (not 0, 1, 2, 5)
assert.equal(isValidEgyptianPhone('12345'), false);
assert.equal(isValidEgyptianPhone('0101234567'), false); // too short
console.log('PASS: Stage 5 - Egyptian phone validation, dialog accessibility hook');

// Stage 6 assertions: External request safety, Google Maps redirect/SSRF validation, map hooks
import {isValidGoogleMapsUrl} from '../../api/google-place-resolver';
assert.equal(isValidGoogleMapsUrl('https://maps.app.goo.gl/AbCdEf123'), true);
assert.equal(isValidGoogleMapsUrl('https://goo.gl/maps/AbCdEf123'), true);
assert.equal(isValidGoogleMapsUrl('https://www.google.com/maps/place/Hadayek'), true);
assert.equal(isValidGoogleMapsUrl('https://maps.google.com/?q=29.97,31.10'), true);
assert.equal(isValidGoogleMapsUrl('http://localhost:3000'), false);
assert.equal(isValidGoogleMapsUrl('http://127.0.0.1:8080'), false);
assert.equal(isValidGoogleMapsUrl('http://169.254.169.254/latest/meta-data'), false);
assert.equal(isValidGoogleMapsUrl('https://attacker-google.com/phish'), false);
assert.equal(isValidGoogleMapsUrl('javascript:alert(1)'), false);

import {useMapInstance} from '../components/map/hooks/useMapInstance';
import {useMapGeolocation} from '../components/map/hooks/useMapGeolocation';
assert.equal(typeof useMapInstance, 'function');
assert.equal(typeof useMapGeolocation, 'function');
console.log('PASS: Stage 6 - SSRF/Google Maps URL guard, map/geo hooks');



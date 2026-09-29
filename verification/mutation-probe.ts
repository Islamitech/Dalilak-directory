import assert from 'node:assert/strict';import path from 'node:path';import{pathToFileURL}from'node:url';
const root=process.env.MUTATION_ROOT!;const id=process.env.MUTATION_ID!;const imp=(p:string)=>import(pathToFileURL(path.join(root,p)).href);
const biz:any={id:'biz_x',verificationStatus:'verified',nameAr:'نشاط',governorate:'الجيزة',city:'حدائق الأهرام',lat:29.979184,lng:31.106863,workingHours:'مغلق',description:'old',photos:[],videos:[]};
if(id==='U1'){const m=await imp('src/utils/directoryFiltering.ts');const o:any={activityIntent:null,deferredSearchQuery:'',categoryFilter:'all',subcategoryFilter:'all',effectiveSearchZone:'all',govFilter:'الجيزة',cityFilter:'هضبة الأهرام',openNowOnly:false,hasRatingOnly:false,hasVideoOnly:false};assert.equal(m.filterDirectoryBusinesses([biz],o).length,1,'positive geographic control');assert.equal(m.filterDirectoryBusinesses([biz],{...o,hasVideoOnly:true}).length,0,'alias early return must not skip filter');}
if(id==='U2'){const m=await imp('src/utils/directoryEnhancements.ts');assert.equal(m.getBusinessOpenStatus('مغلق').isOpen,false);assert.equal(m.getBusinessOpenStatus('24 ساعة').isOpen,true);}
if(id==='B1'){const m=await imp('src/shared/publicBusiness.ts');assert.equal(m.isPublicBusiness(biz),true);assert.equal(m.isPublicBusiness({...biz,notes:'{"publishedStatus":"draft"}'}),false);}
if(id==='B2'){const m=await imp('src/services/catalogState.ts');assert.equal(m.mergeCatalog([],new Map([[biz.id,biz]])).length,1);assert.equal(m.mergeCatalog([biz],new Map([[biz.id,null]])).length,0);}
if(id==='B3'){const m=await imp('src/services/catalogState.ts');assert.equal(m.catalogsEqual([biz],[{...biz,description:'new'}]),false);assert.equal(m.catalogsEqual([biz],[{...biz}]),true);}
console.log('PASS '+id);

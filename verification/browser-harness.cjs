let chromium;
try {
  ({ chromium } = require('@playwright/test'));
} catch {
  try {
    ({ chromium } = require('playwright'));
  } catch {
    const custom = process.env.PLAYWRIGHT_MODULE || 'playwright';
    ({ chromium } = require(custom));
  }
}
const fs=require('fs');
const base={category:'صيدلية',governorate:'الجيزة',city:'حدائق الأهرام',street:'منطقة ب',phone:'01012345678',lat:29.979184,lng:31.106863,verification_status:'verified',package_id:'pkg_basic',created_at:'2026-09-01T00:00:00Z',description:'وصف الاختبار',notes:'{}'};
const rows=[{...base,id:'biz_alpha',name_ar:'صيدلية ألفا',working_hours:'24 ساعة',photos:['https://fixture.test/a.svg'],cover_photo:'https://fixture.test/a.svg',notes:JSON.stringify({videos:['https://fixture.test/video.mp4'],googleRatingEnabled:true,googleRating:4.5,googleReviewsCount:12})},{...base,id:'biz_beta',name_ar:'صيدلية بيتا',working_hours:'مغلق',photos:[],created_at:'2026-08-01T00:00:00Z'}];
async function setup(browser,viewport={width:390,height:844},port=5291){
 const context=await browser.newContext({viewport});const evidence={errors:[],console:[],network:[]};let failed=false,catalogCalls=0;
 await context.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());
 if(u.pathname.includes('/rest/v1/businesses')){catalogCalls++;const id=u.searchParams.get('id')?.replace('eq.','');const data=id?rows.filter(r=>r.id===id):rows;return route.fulfill({status:failed?503:200,contentType:'application/json',headers:{'content-range':`0-${Math.max(0,data.length-1)}/${data.length}`},body:failed?'unavailable':JSON.stringify(data)});}
 if(u.hostname==='fixture.test'||u.pathname==='/api/biz-og')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="green"/><text x="30" y="60">ALPHA PHOTO</text></svg>'});
 if(!['127.0.0.1','localhost'].includes(u.hostname)){evidence.network.push({blocked:req.url().split('?')[0]});return route.abort('blockedbyclient');}
 if(u.pathname.startsWith('/api/'))return route.fulfill({contentType:'application/json',body:'{}'});
 return route.continue();});
 await context.routeWebSocket(/supabase/,ws=>ws.close());
 await context.addInitScript(()=>{window.__opened=[];window.open=(url)=>{window.__opened.push(String(url));return null;};window.__alerts=[];window.alert=(s)=>window.__alerts.push(String(s));});
 context.on('page',p=>{p.on('pageerror',e=>evidence.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')evidence.console.push(m.text().replace(/sb_(?:publishable|secret)_[\w-]+/g,'[REDACTED]'));});p.on('requestfailed',r=>evidence.network.push({failed:r.url().split('?')[0],error:r.failure()?.errorText}));});
 const page=await context.newPage();return {context,page,evidence,url:'http://127.0.0.1:'+port,fail:v=>failed=v,calls:()=>catalogCalls};
}
module.exports={chromium,setup,rows};
if(require.main===module)(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const s=await setup(b);await s.page.goto(s.url+'/search');await s.page.waitForTimeout(2000);fs.writeFileSync('verification/evidence/explore.txt',await s.page.locator('body').innerText());console.log((await s.page.locator('body').innerText()).slice(-5500));console.log(await s.page.locator('button,input').evaluateAll(es=>es.map(e=>({tag:e.tagName,text:e.textContent?.trim().slice(0,50),aria:e.getAttribute('aria-label'),placeholder:e.getAttribute('placeholder')}))));await s.page.screenshot({path:'verification/evidence/explore.png'});await b.close();})();

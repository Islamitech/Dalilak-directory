import React, { useState } from 'react';
import type { ActionKind, DirectoryPlace } from '../contracts/directory';
import { Dialog } from '../design-system/Dialog';
const labels: Record<ActionKind,string> = {call:'الاتصال بالنشاط',whatsapp:'التواصل عبر واتساب',directions:'الاتجاهات إلى المكان',share:'مشاركة النشاط',contact:'حفظ جهة الاتصال',report:'تصحيح معلومة',package:'طلب باقة أعمال'};
export function ActionPreview({kind,place,packageName,onClose,fail}:{kind:ActionKind;place?:DirectoryPlace;packageName?:string;onClose:()=>void;fail:boolean}) {
 const [status,setStatus]=useState<'ready'|'success'|'error'>('ready');
 const [message,setMessage]=useState(''); const [invalid,setInvalid]=useState(false);
 const finish=()=>{if(kind==='report'&&!message.trim()){setInvalid(true);return;}setStatus(fail?'error':'success');};
 return <Dialog title={labels[kind]} onClose={onClose}>{status==='ready'?<>
 <h3 className="text-xl font-bold mb-3">{packageName||place?.name||'معاينة الإجراء'}</h3>
 {kind==='call'&&<p><bdi>{place?.phone}</bdi></p>}
 {kind==='directions'&&<p>{place?place.address+'، '+place.city:'سيظهر هنا مسار الوصول إلى البوابة المختارة.'}</p>}
 {kind==='report'&&<label className="directory-field mb-4">ما المعلومة التي تحتاج تصحيحًا؟<textarea rows={3} maxLength={500} value={message} onChange={e=>{setMessage(e.target.value);setInvalid(false);}} aria-invalid={invalid} aria-describedby={invalid?'report-error':undefined}/>{invalid&&<small role="alert" id="report-error">اكتب المعلومة التي ترغب في تصحيحها.</small>}</label>}
 <p className="directory-form-help">هذا إجراء محاكاة فقط. لن نفتح تطبيقًا خارجيًا أو نرسل رسالة أو ننسخ بيانات أو ننشئ سجلًا.</p>
 <button className="directory-button mt-3" onClick={finish}>تجربة نتيجة الإجراء</button>
 </>:status==='success'?<div role="status"><h3>نجحت المحاكاة</h3><p>اكتملت تجربة «{labels[kind]}» دون تنفيذ عملية فعلية.</p><button className="directory-button" onClick={onClose}>العودة إلى الدليل</button></div>:<div role="alert"><h3>تعذر إكمال الإجراء</h3><p>حُفظت المعلومات داخل النافذة. يمكنك إعادة المحاولة بعد تغيير سيناريو الفشل من أدوات التجربة.</p><button className="directory-button" onClick={()=>setStatus('ready')}>العودة والمحاولة مجددًا</button></div>}</Dialog>;
}

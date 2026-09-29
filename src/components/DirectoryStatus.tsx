import React from 'react';
import {useDirectoryLoad} from '../contexts/DirectoryLoadContext';
export function DirectoryStatus(){const {pending,error}=useDirectoryLoad();if(!pending&&!error)return null;return <div role="status" aria-live="polite" className="px-4 py-3 text-sm bg-amber-50 text-slate-800 flex gap-3 items-center justify-center"><span>{error||'جارٍ استكمال وتحديث النتائج…'}</span>{error&&<button className="underline min-h-11 font-bold" onClick={()=>window.dispatchEvent(new Event('directory:retry'))}>إعادة المحاولة</button>}</div>;}

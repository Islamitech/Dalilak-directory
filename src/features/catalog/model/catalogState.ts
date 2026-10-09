import type {Business} from '../../../types';
import {isPublicBusiness} from '../../../shared/publicBusiness';
export function mergeCatalog(snapshot:Business[],overrides:Map<string,Business|null>):Business[]{
 const map=new Map(snapshot.filter(isPublicBusiness).map(b=>[b.id,b]));
 for(const [id,b] of overrides){if(b&&isPublicBusiness(b))map.set(id,b);else map.delete(id);}
 return [...map.values()].sort((a,b)=>(b.createdDate||'').localeCompare(a.createdDate||'')||a.id.localeCompare(b.id));
}
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;

  const isArrA = Array.isArray(a);
  const isArrB = Array.isArray(b);
  if (isArrA !== isArrB) return false;

  if (isArrA) {
    const arrA = a as unknown[];
    const arrB = b as unknown[];
    if (arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i++) {
      if (!deepEqual(arrA[i], arrB[i])) return false;
    }
    return true;
  }

  // Consistent policy: a property with value undefined is not equal to a missing key (keys must match strictly).
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
    if (!deepEqual(objA[key], objB[key])) return false;
  }

  return true;
}

export function catalogsEqual(a: Business[], b: Business[]): boolean {
  return deepEqual(a, b);
}
export function parseFavorites(raw:string|null):string[]{try{const value=JSON.parse(raw||'[]');return Array.isArray(value)?[...new Set(value.filter((id):id is string=>typeof id==='string'))]:[];}catch{return [];}}

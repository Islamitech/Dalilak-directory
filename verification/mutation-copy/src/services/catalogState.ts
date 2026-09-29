import type {Business} from '../types';
import {isPublicBusiness} from '../shared/publicBusiness';
export function mergeCatalog(snapshot:Business[],overrides:Map<string,Business|null>):Business[]{
 const map=new Map(snapshot.filter(isPublicBusiness).map(b=>[b.id,b]));
 for(const [id,b] of overrides){if(b&&isPublicBusiness(b))map.set(id,b);else map.delete(id);}
 return [...map.values()].sort((a,b)=>(b.createdDate||'').localeCompare(a.createdDate||'')||a.id.localeCompare(b.id));
}
export function catalogsEqual(a:Business[],b:Business[]):boolean{return JSON.stringify(a)===JSON.stringify(b);}
export function parseFavorites(raw:string|null):string[]{try{const value=JSON.parse(raw||'[]');return Array.isArray(value)?[...new Set(value.filter((id):id is string=>typeof id==='string'))]:[];}catch{return [];}}

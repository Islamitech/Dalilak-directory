import {useCallback,useEffect,useState} from 'react';
import {extractBusinessIdFromSlug} from '../utils/directoryUrl';
function readLocation(){
 const params=new URLSearchParams(window.location.search);
 const raw=window.location.pathname.match(/^\/biz\/([^/]+)/)?.[1]||params.get('biz')||params.get('place')||params.get('b')||params.get('id')||params.get('preview')||'';
 const token=extractBusinessIdFromSlug(raw);
 const background=token?(window.history.state?.directoryBackground||'/search'):window.location.pathname;
 return {token,path:background.split('?')[0],search:window.location.search,revision:Date.now()+Math.random()};
}
export function useDirectoryNavigation(){
 const [route,setRoute]=useState(readLocation);
 const sync=useCallback(()=>setRoute(readLocation()),[]);
 useEffect(()=>{window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[sync]);
 const navigate=useCallback((url:string,replace=false)=>{window.history[replace?'replaceState':'pushState'](null,'',url);sync();},[sync]);
 const open=useCallback((path:string)=>{
  const state=window.history.state;
  const already=!!readLocation().token;
  const background=already?(state?.directoryBackground||'/search'):window.location.pathname+window.location.search;
  const owned=already?!!state?.directoryModal:true;
  window.history[already?'replaceState':'pushState']({directoryModal:owned,directoryBackground:background},'',path);sync();
 },[sync]);
 const close=useCallback(()=>{if(window.history.state?.directoryModal)window.history.back();else navigate(window.history.state?.directoryBackground||'/search',true);},[navigate]);
 return {...route,navigate,open,close};
}

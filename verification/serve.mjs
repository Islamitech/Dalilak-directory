import {createServer} from '../node_modules/vite/dist/node/index.js';
import react from '../node_modules/@vitejs/plugin-react/dist/index.js';
import tailwind from '../node_modules/@tailwindcss/vite/dist/index.mjs';
import path from 'node:path';
const base=process.cwd();
for(const [name,root,port] of [['worktree',base,5291],['baseline',path.join(base,'verification/baseline'),5292]]){
 const server=await createServer({configFile:false,root,cacheDir:path.join(base,'verification/vite-cache',name),plugins:[react(),tailwind()],server:{host:'127.0.0.1',port,strictPort:true,watch:{ignored:['**/*.zip','**/verification/mutation-copy/**','**/verification/evidence/**','**/verification/vite-cache/**']},fs:{allow:[base]}},optimizeDeps:{include:['react','react-dom/client','react/jsx-runtime']}});
 await server.listen();console.log(name+' listening '+port);
}



import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const tasks=[['node_modules/typescript/bin/tsc','--noEmit'],...['map_fixes','activity_search_intent','progressive_work','spatial_activity_groups','repair'].filter(name=>existsSync('src/tests/'+name+'.test.ts')).map(name=>['node_modules/tsx/dist/cli.mjs','src/tests/'+name+'.test.ts']),['scripts/verify-directory-preview.mjs']];
for(const args of tasks){console.log('CHECK',args.join(' '));const result=spawnSync(process.execPath,args,{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}

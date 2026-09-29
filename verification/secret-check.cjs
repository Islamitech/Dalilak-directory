const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const root=process.cwd(),v=path.join(root,'verification');
const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(p=>p&&!p.startsWith('verification/'));
const hashes={};for(const p of files){if(fs.existsSync(p)&&fs.statSync(p).isFile())hashes[p]=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}
fs.writeFileSync(path.join(v,'source-before.json'),JSON.stringify(hashes,null,2));
fs.writeFileSync(path.join(v,'git-status-before.txt'),cp.execFileSync('git',['status','--short'],{encoding:'utf8'}));
const target=fs.readFileSync('src/server/directoryData.ts','utf8');
const jwt=target.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
let decoded={found:false};if(jwt){const payload=JSON.parse(Buffer.from(jwt[0].split('.')[1],'base64url').toString('utf8'));decoded={role:payload.role??null,expiry:payload.exp??null,expiryUTC:payload.exp?new Date(payload.exp*1000).toISOString():null};}
const hits=[];let scanned=0;
const patterns=[/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/,/AIza[0-9A-Za-z_-]{30,}/,/(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{15,}|AKIA[0-9A-Z]{16}|sb_secret_[A-Za-z0-9_-]{15,})/,/(?:api[_-]?key|access[_-]?token|client[_-]?secret|service[_-]?role[_-]?key)\s*[:=]\s*['"][^'"\r\n]{24,}['"]/i];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git'].includes(ent.name))continue;const p=path.join(dir,ent.name);if(ent.isDirectory()){walk(p);continue;}if(!/\.(?:[cm]?[jt]sx?|json|html|md|txt|ya?ml|toml|env|example|map|css|svg)$/.test(ent.name)&&!ent.name.startsWith('.env'))continue;const buf=fs.readFileSync(p);if(buf.includes(0))continue;scanned++;buf.toString('utf8').split(/\r?\n/).forEach((line,i)=>{if(patterns.some(r=>r.test(line)))hits.push(path.relative(root,p).replaceAll('\\','/')+':'+(i+1));});}}
walk(root);
const report='# Secrets check\n\nLocal JWT payload decode only (no network, payload not logged).\n\n'+JSON.stringify(decoded,null,2)+'\n\nRepository heuristic scan excluding node_modules and .git; includes baseline and built files. Findings below are locations only, redacted. Pattern candidates require interpretation; absence is not proof no secrets exist.\nFiles scanned: '+scanned+'\n\n'+hits.map(p=>'- '+p+' [REDACTED]').join('\n')+'\n';
fs.writeFileSync(path.join(v,'SECRETS_REVIEW.md'),report);console.log(JSON.stringify({jwt:decoded,filesScanned:scanned,candidateLocations:hits.length}));

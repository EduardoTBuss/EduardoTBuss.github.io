/** Check local links and fragment targets in the actual static output. */
import {readdir,readFile,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
const root=resolve('dist');
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const f=join(dir,e.name);files.push(...e.isDirectory()?await walk(f):[f]);}return files;}
const files=await walk(root);
const pages=files.filter(f=>f.endsWith('.html'));
const contents=new Map(await Promise.all(pages.map(async f=>[f,await readFile(f,'utf8')])));
let count=0;const errors=[];
for(const [file,html] of contents){
 const route=file.slice(root.length).replaceAll('\\','/').replace(/index\.html$/,'');
 for(const [,raw] of html.matchAll(/\bhref="([^"]*)"/g)){
  const url=new URL(raw.replaceAll('&amp;','&'),'https://portfolio.test'+route);
  if(url.origin!=='https://portfolio.test')continue;
  let target=join(root,decodeURIComponent(url.pathname));
  try{if((await stat(target)).isDirectory())target=join(target,'index.html');await stat(target);}catch{errors.push(`${route}: missing ${raw}`);continue;}
  if(url.hash && contents.has(target)){
   const ids=[...contents.get(target).matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
   if(!ids.includes(decodeURIComponent(url.hash.slice(1))))errors.push(`${route}: missing fragment ${raw}`);
  }
  count++;
 }
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`check-links: ${count} local links and fragment targets valid across ${pages.length} routes`);

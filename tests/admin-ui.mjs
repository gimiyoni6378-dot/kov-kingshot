import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setImmediate as flush} from 'node:timers/promises';
const {parseHTML}=await import(process.env.DOM_MODULE||'linkedom');
const {document,window}=parseHTML(await readFile('admin.html','utf8'));globalThis.document=document;globalThis.location={pathname:'/admin.html'};globalThis.CustomEvent=window.CustomEvent;
let member=null,allow=false,pending,privateCalls=0;
const client={rpc:async name=>{
 if(name==='kov_is_admin')return pending?await pending:{data:allow};
 assert.equal(name,'kov_admin_members');privateCalls++;return {data:{total:1,stats:{members:1,recent:1,points:500},members:[{nickname:'<img src=x onerror=alert(1)>',email:'member@example.test',rank_label:'Lv.6',points:500,created_at:'2026-11-20T00:00:00Z',last_sign_in_at:null}]}};
}};
const access=await import('../admin-access.js?v=1');const controller=access.createAdminAccess(()=>client,()=>member);
await controller.refresh();assert.equal(document.querySelector('[data-admin-link]').hidden,true);
globalThis.ADMIN_TEST={client,get user(){return member;}};
const root=new URL('../',import.meta.url),moduleUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
let source=await readFile('admin.js','utf8');source=source.replace(/from '(\.\/[^']+)'/g,(_,path)=>path.startsWith('./auth.js')?`from '${moduleUrl("export const client=globalThis.ADMIN_TEST.client;export let user=null;export const authReady=Promise.resolve(true);export function sync(){user=globalThis.ADMIN_TEST.user;}")}'`:`from '${new URL(path,root).href}'`);
// Import the identical auth stub so its live binding can simulate account changes.
const stub=source.match(/from '(data:[^']+)'/)[1];const auth=await import(stub);await import(moduleUrl(source));assert.equal(privateCalls,0);assert.equal(document.querySelector('#admin-content').hidden,true);
member={id:'owner'};auth.sync();allow=true;await controller.refresh();await flush();assert.equal(document.querySelector('[data-admin-link]').hidden,false);assert.equal(document.querySelector('#admin-content').hidden,false);assert.equal(document.querySelectorAll('#member-rows tr').length,1);assert.equal(document.querySelectorAll('#member-rows img').length,0);assert.ok(document.querySelector('#member-rows').textContent.includes('member@example.test'));assert.equal(document.querySelector('#stats-points').textContent,'500 P');
member={id:'other'};auth.sync();controller.reset();document.dispatchEvent(new CustomEvent('kov:session'));assert.equal(document.querySelector('#admin-content').hidden,true);assert.equal(document.querySelector('#member-rows').textContent,'');assert.equal(document.querySelector('[data-admin-link]').hidden,true);
let resolve;pending=new Promise(r=>resolve=r);const request=controller.refresh();controller.reset();resolve({data:true});await request;assert.equal(access.isAdmin,false);assert.equal(document.querySelector('[data-admin-link]').hidden,true);
console.log('PASS: hidden admin menu, no anonymous private requests, authorized dashboard, escaped member text, immediate account-change cleanup and stale role-response rejection');

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setImmediate as flush} from 'node:timers/promises';
const {parseHTML}=await import(process.env.DOM_MODULE||'linkedom');
const root=new URL('../',import.meta.url);const {document,window}=parseHTML(await readFile(new URL('gallery.html',root),'utf8'));globalThis.document=document;globalThis.confirm=()=>true;
for(const el of document.querySelectorAll('input,textarea'))el.setCustomValidity=message=>{el.validationMessage=message;};
const detail=document.querySelector('#detail-dialog');detail.showModal=()=>detail.setAttribute('open','');detail.close=()=>detail.removeAttribute('open');Object.defineProperty(detail,'open',{get:()=>detail.hasAttribute('open')});
Object.defineProperty(document.querySelector('#photo'),'files',{value:[{type:'image/png'}]});
const posts=Array.from({length:111},(_,i)=>{const n=111-i;return{id:`post-${n}`,author_id:`member-${n%3}`,nickname:`글쓴이${n%3}`,title:`게시글${n}`,body:`내용${n}`,image_path:`photo-${n}.png`,created_at:'2026-11-20T00:00:00Z'};});let uploads=0,selectedField;
const client={rpc:async(name,args)=>({data:args.p_authors.map(id=>({author_id:id,rank_label:'Lv.1'}))}),storage:{from:()=>({getPublicUrl:path=>({data:{publicUrl:'https://example.test/'+path}}),upload:async()=>{uploads++;return{};}})},from:()=>{
 let rows=posts;const query={select(){return this;},order(){return this;},ilike(field,value){selectedField=field;const needle=value.slice(1,-1).replace(/\\([\\%_])/g,'$1');rows=rows.filter(r=>r[field].includes(needle));return this;},async range(a,b){return {data:rows.slice(a,b+1),count:rows.length};}};return query;
}};
globalThis.TEST_BOARD={client,user:{id:'member-0',user_metadata:{nickname:'member'}}};
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
let source=await readFile(new URL('gallery.js',root),'utf8');source=source.replace(/from '(\.\/[^']+)'/g,(full,path)=>{
 if(path.startsWith('./auth.js'))return `from '${moduleUrl("export const client=globalThis.TEST_BOARD.client,user=globalThis.TEST_BOARD.user,authReady=Promise.resolve(true);export const showAuth=()=>{},friendly=e=>e.message;")}'`;
 if(path.startsWith('./comments.js'))return `from '${moduleUrl("export const openComments=id=>{globalThis.TEST_BOARD.opened=id;};")}'`;
 return `from '${new URL(path,root).href}'`;
});await import(moduleUrl(source));await flush();
assert.equal(document.querySelectorAll('.post-row').length,10);assert.equal(document.querySelectorAll('.page-number').length,10);assert.equal(document.querySelector('.post-number').textContent,'111');
document.querySelector('#pages-next').click();await flush();assert.equal(document.querySelector('#page-info').textContent,'11 / 12 페이지');assert.deepEqual([...document.querySelectorAll('.page-number')].map(el=>el.textContent),['11','12']);
document.querySelectorAll('.page-number')[1].click();await flush();assert.equal(document.querySelectorAll('.post-row').length,1);assert.equal(document.querySelector('.post-number').textContent,'1');
Object.defineProperty(document.querySelector('#search-field'),'value',{value:'body',writable:true});document.querySelector('#search-query').value='내용7';document.querySelector('#post-search').dispatchEvent(new window.Event('submit',{cancelable:true}));await flush();assert.equal(selectedField,'body');assert.equal(document.querySelectorAll('.post-row').length,10);assert.equal(document.querySelector('#page-info').textContent,'1 / 2 페이지');
document.querySelector('.post-open').click();assert.equal(detail.open,true);assert.ok(globalThis.TEST_BOARD.opened);assert.equal(document.querySelector('#detail-title').textContent,'게시글79');
document.querySelector('#search-reset').click();await flush();assert.equal(document.querySelector('#post-count').textContent,'111개의 글');
document.querySelector('#post-title').value='정상 제목';document.querySelector('#post-body').value='씨발';document.querySelector('#post-form').dispatchEvent(new window.Event('submit',{cancelable:true}));await flush();assert.equal(uploads,0);assert.ok(document.querySelector('#write-status').textContent.includes('욕설'));
assert.equal(document.querySelector('#gallery-account-internals').hasAttribute('hidden'),true);assert.ok(!document.querySelector('#more-button'));
console.log('PASS:111-post board,10-row pages,1–10/11–12 navigation,body search/reset,detail open,hidden account controls and profanity rejected before upload');

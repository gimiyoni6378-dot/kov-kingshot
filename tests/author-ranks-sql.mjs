import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {rankForPoints} from '../ranks.js';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
for(const path of ['tests/points-bootstrap.sql','supabase/002-points.sql','supabase/004-author-ranks.sql','supabase/004-author-ranks.sql'])await db.exec(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const one='11111111-1111-1111-1111-111111111111',two='22222222-2222-2222-2222-222222222222',hidden='33333333-3333-3333-3333-333333333333';
await db.query('insert into auth.users(id) values($1)',[hidden]);
await db.query("insert into public.gallery_comments(post_id,author_id,nickname,body) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',$1,'two','hello')",[two]);
await db.exec('set role anon');
const ranks=async ids=>(await db.query('select * from public.kov_author_ranks($1)',[ids])).rows;
assert.deepEqual((await ranks([one,two,hidden])).sort((a,b)=>a.author_id.localeCompare(b.author_id)),[{author_id:one,rank_label:'Lv.1'},{author_id:two,rank_label:'Lv.1'}]);
await assert.rejects(db.query('select * from public.point_events'),/permission denied/);
await assert.rejects(ranks(Array(101).fill(one)),/at most 100/);
assert.deepEqual(await ranks([]),[]);
for(const points of [-10,0,99,100,2899,2900,3899,3900,4899,4900,12899,12900,12910]){
 await db.exec('reset role');await db.query('delete from public.point_events where user_id=$1',[one]);
 if(points<0)await db.query("insert into public.point_events(user_id,event_key,kind,delta) values($1,'test-negative','post_deleted',-10)",[one]);
 else{
  await db.query("insert into public.point_events(user_id,event_key,kind,delta) select $1,'test:'||n,'post',10 from generate_series(1,$2::integer) n",[one,Math.floor(points/10)]);
  await db.query("insert into public.point_events(user_id,event_key,kind,delta) select $1,'remainder:'||n,'attendance',1 from generate_series(1,$2::integer) n",[one,points%10]);
 }
 await db.exec('set role anon');assert.equal((await ranks([one]))[0].rank_label,rankForPoints(points).label);
}
await db.exec('reset role;set role authenticated');assert.equal((await ranks([one]))[0].rank_label,'TG10');
await db.close();console.log('PASS: SQL rerun; post/comment author visibility; no hidden-account or point-balance disclosure; anonymous read; batch cap; all level/TG boundaries match ranks.js');

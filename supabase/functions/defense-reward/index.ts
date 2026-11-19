import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import {verifyRunReplay,REPLAY_VERSION,BALANCE_VERSION} from './replay.js';
const headers={'Access-Control-Allow-Origin':'https://gimiyoni6378-dot.github.io','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Content-Type':'application/json'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method==='GET')return reply({balance_version:BALANCE_VERSION,supported_balance_versions:[1,2,3]});
 if(req.method!=='POST')return reply({error:'POST required'},405);
 try{
  const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');if(!token)return reply({error:'로그인이 필요해요.'},401);
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await admin.auth.getUser(token);if(authError||!user)return reply({error:'다시 로그인해주세요.'},401);
  if(Number(req.headers.get('content-length'))>250000)return reply({error:'기록이 너무 길어요.'},413);
  const raw=await req.text();if(raw.length>250000)return reply({error:'기록이 너무 길어요.'},413);
  const body=JSON.parse(raw);
  if(typeof body.run_id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.run_id)||body.version!==REPLAY_VERSION)return reply({error:'게임을 새로 시작해주세요.'},400);
  const {data:run,error:runError}=await admin.from('defense_runs').select('id,user_id,version,created_at,finished_at,cleared,points').eq('id',body.run_id).eq('user_id',user.id).single();
  if(runError||!run||run.version!==REPLAY_VERSION)return reply({error:'게임 기록을 찾지 못했어요.'},400);
  let verified={cleared:run.cleared,ticks:0};
  if(!run.finished_at){
   if(Date.now()-Date.parse(run.created_at)>86400000)return reply({error:'게임 기록이 만료됐어요. 새로 시작해주세요.'},400);
   try{verified=verifyRunReplay(body.commands,body.balance_version??1,run.created_at,run.id);}catch{return reply({error:'플레이 기록 검증에 실패했어요.'},400);}
  }
  const {data,error}=await admin.rpc('kov_defense_finish',{p_run:run.id,p_member:user.id,p_cleared:verified.cleared,p_ticks:verified.ticks});
  if(error){console.error('Defense settlement failed',error.code);return reply({error:'보상을 저장하지 못했어요. 잠시 후 다시 시도해주세요.'},409);}
  return reply(data);
 }catch{return reply({error:'요청을 처리하지 못했어요.'},400);}
});

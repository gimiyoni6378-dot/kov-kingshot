import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),policy=JSON.parse(await readFile(new URL('moderation/korean-policy.json',root),'utf8'));
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const normalize=value=>value.normalize('NFKC').toLowerCase();
// Shared JS/Postgres alphabet: punctuation, spacing and digits may separate syllables.
const separator='[^A-Za-z가-힣ᄀ-ᇿ]';
const patterns=[...policy.terms.map(term=>[...normalize(term)].map(escape).join(separator+'{0,12}')),...policy.compact_terms.map(term=>escape(normalize(term))),...policy.compact_terms.map(term=>[...normalize(term)].map(escape).join(separator+'{1,12}')+'(?![가-힣])'),'(^|[^a-z])('+policy.romanized.map(escape).join('|')+')($|[^a-z])'];
const allowed=policy.allowed_words.map(normalize);
await writeFile(new URL('moderation-rules.js',root),'// Generated from moderation/korean-policy.json by scripts/build-moderation.mjs.\nexport const PROFANITY_PATTERNS='+JSON.stringify(patterns,null,2)+';\nexport const ALLOWED_WORDS='+JSON.stringify(allowed)+';\n');
const quote=value=>"'"+value.replaceAll("'","''")+"'";
const sql=`-- Run after gallery.sql and002-points.sql. Safe to rerun; existing content stays intact.
begin;
create or replace function public.kov_contains_profanity(p_text text) returns boolean
language plpgsql immutable parallel safe set search_path='' as $$
declare value text; allowed text; pattern text;
begin
 value:=lower(normalize(coalesce(p_text,''),NFKC));
 value:=regexp_replace(value,U&'[\\200B-\\200F\\202A-\\202E\\2060-\\206F\\FEFF]','','g');
 foreach allowed in array ARRAY[${allowed.map(quote).join(',')}] loop value:=replace(value,allowed,' '); end loop;
 foreach pattern in array ARRAY[${patterns.map(quote).join(',\n')}] loop
  if value ~ pattern then return true; end if;
 end loop;
 return false;
end $$;
revoke all on function public.kov_contains_profanity(text) from public,anon,authenticated;
create or replace function public.kov_moderate_gallery_content() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if TG_TABLE_NAME='gallery_posts' then
  if public.kov_contains_profanity(new.title) or public.kov_contains_profanity(new.body) then
   raise exception 'KOV_PROFANITY: Please revise inappropriate language.' using errcode='P0001';
  end if;
 elsif public.kov_contains_profanity(new.body) then
  raise exception 'KOV_PROFANITY: Please revise inappropriate language.' using errcode='P0001';
 end if;
 return new;
end $$;
revoke all on function public.kov_moderate_gallery_content() from public,anon,authenticated;
drop trigger if exists kov_posts_language on public.gallery_posts;
create trigger kov_posts_language before insert or update of title,body on public.gallery_posts for each row execute function public.kov_moderate_gallery_content();
drop trigger if exists kov_comments_language on public.gallery_comments;
create trigger kov_comments_language before insert or update of body on public.gallery_comments for each row execute function public.kov_moderate_gallery_content();
commit;
`;
await writeFile(new URL('supabase/006-content-language.sql',root),sql);

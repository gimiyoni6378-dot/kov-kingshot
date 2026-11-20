-- Run after gallery.sql and002-points.sql. Safe to rerun; existing content stays intact.
begin;
create or replace function public.kov_contains_profanity(p_text text) returns boolean
language plpgsql immutable parallel safe set search_path='' as $$
declare value text; allowed text; pattern text;
begin
 value:=lower(normalize(coalesce(p_text,''),NFKC));
 value:=regexp_replace(value,U&'[\200B-\200F\202A-\202E\2060-\206F\FEFF]','','g');
 foreach allowed in array ARRAY['시발점','시발역','시발지','도시발전'] loop value:=replace(value,allowed,' '); end loop;
 foreach pattern in array ARRAY['씨[^A-Za-z가-힣ᄀ-ᇿ]{0,12}발',
'씨[^A-Za-z가-힣ᄀ-ᇿ]{0,12}팔',
'씨[^A-Za-z가-힣ᄀ-ᇿ]{0,12}벌',
'씨[^A-Za-z가-힣ᄀ-ᇿ]{0,12}빨',
'씹[^A-Za-z가-힣ᄀ-ᇿ]{0,12}새',
'씹[^A-Za-z가-힣ᄀ-ᇿ]{0,12}년',
'씹[^A-Za-z가-힣ᄀ-ᇿ]{0,12}놈',
'개[^A-Za-z가-힣ᄀ-ᇿ]{0,12}새[^A-Za-z가-힣ᄀ-ᇿ]{0,12}끼',
'개[^A-Za-z가-힣ᄀ-ᇿ]{0,12}새[^A-Za-z가-힣ᄀ-ᇿ]{0,12}키',
'개[^A-Za-z가-힣ᄀ-ᇿ]{0,12}새[^A-Za-z가-힣ᄀ-ᇿ]{0,12}꺄',
'개[^A-Za-z가-힣ᄀ-ᇿ]{0,12}세[^A-Za-z가-힣ᄀ-ᇿ]{0,12}끼',
'개[^A-Za-z가-힣ᄀ-ᇿ]{0,12}색[^A-Za-z가-힣ᄀ-ᇿ]{0,12}끼',
'개[^A-Za-z가-힣ᄀ-ᇿ]{0,12}색[^A-Za-z가-힣ᄀ-ᇿ]{0,12}기',
'개[^A-Za-z가-힣ᄀ-ᇿ]{0,12}쌔[^A-Za-z가-힣ᄀ-ᇿ]{0,12}끼',
'개[^A-Za-z가-힣ᄀ-ᇿ]{0,12}쉐[^A-Za-z가-힣ᄀ-ᇿ]{0,12}끼',
'개[^A-Za-z가-힣ᄀ-ᇿ]{0,12}년',
'개[^A-Za-z가-힣ᄀ-ᇿ]{0,12}놈',
'병[^A-Za-z가-힣ᄀ-ᇿ]{0,12}신',
'븅[^A-Za-z가-힣ᄀ-ᇿ]{0,12}신',
'지[^A-Za-z가-힣ᄀ-ᇿ]{0,12}랄',
'좆',
'존[^A-Za-z가-힣ᄀ-ᇿ]{0,12}나',
'미[^A-Za-z가-힣ᄀ-ᇿ]{0,12}친[^A-Za-z가-힣ᄀ-ᇿ]{0,12}놈',
'미[^A-Za-z가-힣ᄀ-ᇿ]{0,12}친[^A-Za-z가-힣ᄀ-ᇿ]{0,12}년',
'느[^A-Za-z가-힣ᄀ-ᇿ]{0,12}금[^A-Za-z가-힣ᄀ-ᇿ]{0,12}마',
'니[^A-Za-z가-힣ᄀ-ᇿ]{0,12}애[^A-Za-z가-힣ᄀ-ᇿ]{0,12}미',
'니[^A-Za-z가-힣ᄀ-ᇿ]{0,12}에[^A-Za-z가-힣ᄀ-ᇿ]{0,12}미',
'엠[^A-Za-z가-힣ᄀ-ᇿ]{0,12}창',
'시[^A-Za-z가-힣ᄀ-ᇿ]{0,12}발[^A-Za-z가-힣ᄀ-ᇿ]{0,12}놈',
'시[^A-Za-z가-힣ᄀ-ᇿ]{0,12}발[^A-Za-z가-힣ᄀ-ᇿ]{0,12}년',
'시[^A-Za-z가-힣ᄀ-ᇿ]{0,12}발[^A-Za-z가-힣ᄀ-ᇿ]{0,12}새[^A-Za-z가-힣ᄀ-ᇿ]{0,12}끼',
'ᄉ[^A-Za-z가-힣ᄀ-ᇿ]{0,12}ᄇ',
'ᄊ[^A-Za-z가-힣ᄀ-ᇿ]{0,12}ᄇ',
'ᄇ[^A-Za-z가-힣ᄀ-ᇿ]{0,12}ᄉ',
'ᄌ[^A-Za-z가-힣ᄀ-ᇿ]{0,12}ᄅ',
'ᄌ[^A-Za-z가-힣ᄀ-ᇿ]{0,12}ᄂ',
'시발',
'시팔',
'시벌',
'시[^A-Za-z가-힣ᄀ-ᇿ]{1,12}발(?![가-힣])',
'시[^A-Za-z가-힣ᄀ-ᇿ]{1,12}팔(?![가-힣])',
'시[^A-Za-z가-힣ᄀ-ᇿ]{1,12}벌(?![가-힣])',
'(^|[^a-z])(ssibal|sibal|sipal|byungsin|byeongsin|jiral|gaesaekki)($|[^a-z])'] loop
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

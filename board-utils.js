export const POSTS_PER_PAGE=10;
export const SEARCH_FIELDS={title:'제목',body:'내용',nickname:'글쓴이'};
export function literalSearch(value){return String(value||'').trim().slice(0,100).replace(/[\\%_]/g,'\\$&');}
export function pageGroup(page,totalPages){
 const total=Math.max(1,Math.floor(Number(totalPages)||1));
 const current=Math.max(0,Math.min(total-1,Math.floor(Number(page)||0)));
 const start=Math.floor(current/10)*10,end=Math.min(start+10,total);
 return {current,pages:Array.from({length:end-start},(_,i)=>start+i),previous:start>0?start-1:null,next:end<total?end:null};
}

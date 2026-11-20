// A UI hint only. Every protected action is authorized again by PostgreSQL.
export let isAdmin=false;
export function createAdminAccess(getClient,getUser){
 let generation=0;
 const nav=document.querySelector('.main-nav');let link;
 if(nav){link=document.createElement('a');link.href='./admin.html';link.textContent='관리';link.hidden=true;link.dataset.adminLink='';if(location.pathname.endsWith('/admin.html'))link.setAttribute('aria-current','page');nav.insertBefore(link,nav.querySelector('.nav-button'));}
 const publish=value=>{isAdmin=value;if(link)link.hidden=!value;document.dispatchEvent(new CustomEvent('kov:admin'));};
 async function refresh(){
  const ticket=++generation,member=getUser()?.id;publish(false);
  if(!member||!getClient())return;
  try{const {data,error}=await getClient().rpc('kov_is_admin');if(ticket===generation&&getUser()?.id===member)publish(!error&&data===true);}catch{if(ticket===generation)publish(false);}
 }
 return {refresh,reset(){++generation;publish(false);}};
}

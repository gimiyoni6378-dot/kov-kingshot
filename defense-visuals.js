// Pure geometry: sprite positioning never changes the combat simulation.
export const PORTRAIT_FOCUS={archer:{x:230,y:155,w:270,h:245},infantry:{x:215,y:542,w:270,h:245},cavalry:{x:238,y:917,w:270,h:245}};
export function portraitLayout(type,width,height){
 const focus=PORTRAIT_FOCUS[type];if(!focus||width<=0||height<=0)return null;
 const scale=Math.max(width/focus.w,height/focus.h);
 return {scale,imageWidth:1254*scale,imageHeight:1254*scale,x:width/2-focus.x*scale,y:height/2-focus.y*scale};
}
export function formation(count){
 if(count<=0)return [];
 if(count===1)return [{x:0,y:0}];
 if(count===2)return [{x:-32,y:3},{x:32,y:-3}];
 if(count===3)return [{x:0,y:-17},{x:-38,y:10},{x:38,y:10}];
 if(count===4)return [{x:-24,y:-16},{x:24,y:-16},{x:-42,y:12},{x:42,y:12}];
 return Array.from({length:count},(_,i)=>{
  const angle=i/count*Math.PI*2-Math.PI/2;
  const radius=i%3===0?.48:.84;
  return {x:Math.cos(angle)*68*radius,y:Math.sin(angle)*22*radius};
 });
}
export const RUN_FRAMES={
 raider:[{rect:[70,35,258,295],foot:[139.5,295]},{rect:[457,36,222,300],foot:[110,300]},{rect:[804,33,247,290],foot:[128,290]},{rect:[1172,33,217,304],foot:[100,304]}],
 captain:[{rect:[47,375,272,313],foot:[175,313]},{rect:[408,376,279,318],foot:[163,318]},{rect:[785,376,265,295],foot:[130,295]},{rect:[1138,378,259,316],foot:[143,316]}],
 warlord:[{rect:[43,736,313,314],foot:[163.5,314]},{rect:[424,737,281,320],foot:[144,320]},{rect:[775,739,291,301],foot:[152,301]},{rect:[1159,739,262,319],foot:[121,319]}]
};
export function runFrame(distance,reduced=false){return reduced?0:Math.floor(Math.max(0,distance)/.018*4)%4;}
export const FX_RECTS={arrow:[217,27,96,470],slash:[520,12,480,490],hoof:[1030,60,480,410],hit:[20,535,480,450],dust:[520,555,480,420],strongSlash:[1030,530,500,450]};

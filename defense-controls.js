// Selecting an occupied pad must never silently buy another soldier.
export function choosePad(game,index,type){
 const army=game.slots[index];
 if(army?.type==='wizard')return {ok:true,action:'select',type:'wizard',message:'화염 마법사를 선택했어요. 회수하면 이번 도전에서 다시 배치할 수 없어요.'};
 if(army)return {ok:true,action:'select',type:army.type,message:`${index+1}번 ${army.type==='wizard'?'화염 마법사':army.type==='archer'?'궁병':army.type==='infantry'?'보병':'기병'} 부대를 선택했어요. 추가 모집 또는 회수를 눌러주세요.`};
 const result=game.recruit(index,type);return {...result,action:'recruit',type};
}

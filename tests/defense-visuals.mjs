import assert from 'node:assert/strict';
import {formation,portraitLayout,RUN_FRAMES,runFrame,FX_RECTS} from '../defense-visuals.js';
for(let count=1;count<=13;count++){
 const points=formation(count);assert.equal(points.length,count);
 for(const p of points)assert.ok((p.x/97)**2+(p.y/27)**2<.85,'Feet must stay on inner stone ellipse');
}
for(const type of ['archer','infantry','cavalry'])for(const width of [84,110,166]){
 const l=portraitLayout(type,width,width/1.1);assert.equal(l.imageWidth/l.imageHeight,1,'Source sheet must stay square');
 assert.equal(l.imageWidth/1254,l.scale);assert.equal(l.imageHeight/1254,l.scale);
}
for(const frames of Object.values(RUN_FRAMES)){assert.equal(frames.length,4);for(const f of frames){assert.equal(f.rect.length,4);assert.ok(f.foot[0]>=0&&f.foot[0]<=f.rect[2]);assert.ok(f.foot[1]<=f.rect[3]);}}
assert.equal(runFrame(0),0);assert.equal(runFrame(.0046),1);assert.equal(runFrame(.0091),2);assert.equal(runFrame(.0136),3);assert.equal(runFrame(.018),0);assert.equal(runFrame(.01,true),0);
for(const key of ['arrow','slash','hoof','hit','dust','strongSlash'])assert.equal(FX_RECTS[key].length,4);
console.log('PASS: formation feet, undistorted responsive portraits, gait frames/anchors, reduced motion and distinct FX assets');

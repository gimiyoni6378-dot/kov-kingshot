import assert from 'node:assert/strict';
import {canDeletePost,deleteGalleryPost} from '../gallery-delete.js';
const post={id:'post-one',author_id:'owner',image_path:'owner/photo.jpg'};
assert.equal(canDeletePost(post,{id:'owner'}),true);assert.equal(canDeletePost(post,{id:'other'}),false);assert.equal(canDeletePost(post,null),false);
let requests=0,cleanups=0;
function mock({rows=[{id:post.id}],dbError=null,cleanupError=null,throwCleanup=false,admin=false}={}){return {
 from(table){assert.equal(table,'gallery_posts');requests++;const filters=[];return {delete(){return this;},eq(key,value){filters.push([key,value]);return this;},async select(fields){assert.equal(fields,'id');assert.deepEqual(filters,admin?[['id',post.id]]:[['id',post.id],['author_id','owner']]);return {data:rows,error:dbError};}};},
 storage:{from(bucket){assert.equal(bucket,'gallery');return {async remove(paths){cleanups++;assert.deepEqual(paths,[post.image_path]);if(throwCleanup)throw new Error('network');return {error:cleanupError};}};}}
};}
await assert.rejects(deleteGalleryPost(mock(),post,{id:'other'}),/permission denied/);await assert.rejects(deleteGalleryPost(mock(),post,null),/permission denied/);assert.equal(requests,0);assert.equal(cleanups,0);
await assert.rejects(deleteGalleryPost(mock({rows:[]}),post,{id:'owner'}),/permission denied/);assert.equal(cleanups,0);
await assert.rejects(deleteGalleryPost(mock({dbError:new Error('denied')}),post,{id:'owner'}),/denied/);assert.equal(cleanups,0);
assert.deepEqual(await deleteGalleryPost(mock(),post,{id:'owner'}),{cleanupFailed:false});
assert.deepEqual(await deleteGalleryPost(mock({throwCleanup:true}),post,{id:'owner'}),{cleanupFailed:true});
console.log('PASS: owner-only guard, owner/id delete filter, no cleanup on denied deletion, own-photo cleanup and cleanup-failure reporting');

assert.equal(canDeletePost(post,{id:'admin'},true),true);
assert.deepEqual(await deleteGalleryPost(mock({admin:true}),post,{id:'admin'},true),{cleanupFailed:false});
console.log('PASS: admin delete targets the selected post without owner filter');

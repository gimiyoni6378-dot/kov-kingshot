// The UI guard is convenience; gallery_delete RLS is the authority.
export function canDeletePost(post,member){return Boolean(member?.id&&post?.author_id===member.id);}
export async function deleteGalleryPost(client,post,member){
 if(!canDeletePost(post,member))throw new Error('permission denied');
 const {data,error}=await client.from('gallery_posts').delete().eq('id',post.id).eq('author_id',member.id).select('id');
 if(error)throw error;
 if(!data?.length)throw new Error('permission denied');
 let cleanupFailed=false;
 try{const result=await client.storage.from('gallery').remove([post.image_path]);cleanupFailed=Boolean(result.error);}catch{cleanupFailed=true;}
 return {cleanupFailed};
}

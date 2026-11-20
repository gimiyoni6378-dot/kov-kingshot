// The UI guard is convenience; gallery_delete RLS is the authority.
export function canDeletePost(post,member,isAdmin=false){return Boolean(member?.id&&post&&(isAdmin||post.author_id===member.id));}
export async function deleteGalleryPost(client,post,member,isAdmin=false){
 if(!canDeletePost(post,member,isAdmin))throw new Error('permission denied');
 let query=client.from('gallery_posts').delete().eq('id',post.id);
 if(!isAdmin)query=query.eq('author_id',member.id);
 const {data,error}=await query.select('id');
 if(error)throw error;
 if(!data?.length)throw new Error('permission denied');
 let cleanupFailed=false;
 try{const result=await client.storage.from('gallery').remove([post.image_path]);cleanupFailed=Boolean(result.error);}catch{cleanupFailed=true;}
 return {cleanupFailed};
}

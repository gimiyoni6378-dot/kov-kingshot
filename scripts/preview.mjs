import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const args=process.argv.slice(2);const host=args.includes('--host')?args[args.indexOf('--host')+1]:'127.0.0.1';const port=Number(args.includes('--port')?args[args.indexOf('--port')+1]:4173);const root=process.cwd();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
 try{let path=decodeURIComponent(new URL(req.url,'http://preview').pathname);if(path==='/')path='/defense.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw new Error('outside root');await stat(file);const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}
}).listen(port,host,()=>console.log(`Defense preview on ${host}:${port}`));

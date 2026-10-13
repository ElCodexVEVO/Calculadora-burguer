import { createClient } from "npm:@supabase/supabase-js@2";
import jpeg from "npm:jpeg-js@0.4.4";

const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info, x-photo-version","Access-Control-Allow-Methods":"POST, DELETE, OPTIONS"};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:cors});
const MAX=524288;

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{headers:cors});
  if(!["POST","DELETE"].includes(req.method))return reply({error:"Método inválido"},405);
  let uploaded:string|null=null;
  const url=Deno.env.get("SUPABASE_URL")!;
  const admin=createClient(url,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
  const bucket=admin.storage.from("employee-avatars");
  try {
    const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
    if(!token)return reply({error:"Inicia sesión nuevamente"},401);
    const {data:{user},error:authError}=await admin.auth.getUser(token);
    if(authError||!user)return reply({error:"Sesión inválida"},401);
    const {data:p,error:pe}=await admin.from("profiles").select("user_id,store_id,active").eq("user_id",user.id).single();
    if(pe||!p?.active)return reply({error:"Perfil inactivo"},403);
    const expected=Number(req.headers.get("x-photo-version"));
    if(!req.headers.has("x-photo-version")||!Number.isSafeInteger(expected)||expected<0)return reply({error:"Versión de foto inválida"},400);
    const {data:old,error:oe}=await admin.from("employee_appearance").select("photo_path,photo_version").eq("user_id",user.id).maybeSingle();
    if(oe)throw oe;
    if((old?.photo_version||0)!==expected)return reply({error:"La foto cambió en otro dispositivo. Actualiza y vuelve a intentarlo."},409);
    if(req.method==="POST"){
      if(req.headers.get("content-type")?.split(";")[0]!=="image/jpeg")return reply({error:"Envía la fotografía procesada como JPEG"},415);
      if(Number(req.headers.get("content-length"))>MAX)return reply({error:"Fotografía demasiado grande"},413);
      const reader=req.body?.getReader();if(!reader)return reply({error:"Falta la fotografía"},400);
      const chunks:Uint8Array[]=[];let length=0;
      while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>MAX){await reader.cancel();return reply({error:"Fotografía demasiado grande"},413)}chunks.push(part.value)}
      const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
      if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)return reply({error:"El archivo no es una imagen JPEG válida"},400);
      let image;try{image=jpeg.decode(bytes,{useTArray:true,maxResolutionInMP:1,maxMemoryUsageInMB:32})}catch{return reply({error:"No se pudo leer la fotografía"},400)}
      if(image.width!==512||image.height!==512)return reply({error:"El recorte debe medir 512 × 512"},400);
      // Recodificar elimina metadatos y contenido adjunto; no se confía en la extensión.
      const clean=jpeg.encode(image,85).data;if(clean.length>MAX)return reply({error:"Reduce el tamaño de la fotografía"},413);
      uploaded=`${p.store_id}/${user.id}/${crypto.randomUUID()}.jpg`;
      const {error}=await bucket.upload(uploaded,clean,{contentType:"image/jpeg",upsert:false,cacheControl:"300"});if(error)throw error;
    }
    const {data:appearance,error}=await admin.rpc("commit_profile_photo",{p_user:user.id,p_expected:expected,p_path:uploaded});
    if(error){if(uploaded)await bucket.remove([uploaded]);uploaded=null;return reply({error:error.message.includes("PHOTO_CONFLICT")?"La foto cambió en otro dispositivo. Actualiza y vuelve a intentarlo.":"No se pudo guardar la fotografía"},error.message.includes("PHOTO_CONFLICT")?409:500)}
    // El objeto anterior deja de ser accesible por RLS al cambiar la referencia.
    if(old?.photo_path){const cleanup=await bucket.remove([old.photo_path]);if(cleanup.error)console.error("avatar_cleanup",old.photo_path,cleanup.error.message)}
    return reply({appearance});
  }catch(error){if(uploaded)await bucket.remove([uploaded]);console.error("profile-photo",error instanceof Error?error.message:"storage error");return reply({error:"No se pudo guardar. Inténtalo de nuevo; tu foto anterior se conserva."},500)}
});

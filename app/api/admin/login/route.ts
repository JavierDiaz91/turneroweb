import {NextRequest,NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {makeSession,ADMIN_COOKIE} from '@/lib/admin-auth';
import {checkLoginLimit,clearLoginFailures,loginIdentity,registerLoginFailure} from '@/lib/login-rate-limit';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 const expected=process.env.ADMIN_PASSWORD||'';
 const secret=process.env.ADMIN_SESSION_SECRET||'';
 if(!expected||!secret)return NextResponse.json({error:'Acceso administrativo no configurado'},{status:503});
 const forwarded=req.headers.get('x-forwarded-for')||'';
 const ip=forwarded.split(',')[0]?.trim()||req.headers.get('x-real-ip')||'unknown';
 const identity=loginIdentity(ip,secret);
 try{
  const limit=await checkLoginLimit(identity);
  if(limit.blocked)return NextResponse.json({error:'Demasiados intentos. Intentá nuevamente en unos minutos.'},{status:429,headers:{'Retry-After':String(limit.retrySeconds)}});
  let password='';
  try{const body=await req.json();if(typeof body.password!=='string'||body.password.length>512)return NextResponse.json({error:'Solicitud inválida'},{status:400});password=body.password}catch{return NextResponse.json({error:'Solicitud inválida'},{status:400})}
  const a=Buffer.from(password),b=Buffer.from(expected);
  if(a.length!==b.length||!timingSafeEqual(a,b)){
   const failed=await registerLoginFailure(identity);
   return NextResponse.json({error:failed.blocked?'Demasiados intentos. Esperá 15 minutos.':'Contraseña incorrecta'},{status:failed.blocked?429:401,headers:failed.blocked?{'Retry-After':'900'}:{}});
  }
  await clearLoginFailures(identity);
  const res=NextResponse.json({ok:true});
  res.cookies.set(ADMIN_COOKIE,makeSession(),{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:28800});
  return res;
 }catch(error){console.error('Admin login security check failed',error);return NextResponse.json({error:'No se pudo validar el acceso. Intentá más tarde.'},{status:503})}
}

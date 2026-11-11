import {createHmac,timingSafeEqual} from 'node:crypto';import {cookies} from 'next/headers';
const cookieName='renaser_admin';const ttl=60*60*8;
function secret(){return process.env.ADMIN_SESSION_SECRET||''}
function signature(payload:string){return createHmac('sha256',secret()).update(payload).digest('hex')}
export function makeSession(){if(!secret())throw Error('ADMIN_SESSION_SECRET no configurada');const payload=String(Math.floor(Date.now()/1000)+ttl);return payload+'.'+signature(payload)}
export async function isAdmin(){if(!secret())return false;const raw=(await cookies()).get(cookieName)?.value||'';const [payload,sig]=raw.split('.');if(!payload||!sig||!/^\d+$/.test(payload)||Number(payload)<Date.now()/1000)return false;const a=Buffer.from(signature(payload),'hex'),b=Buffer.from(sig,'hex');return a.length===b.length&&timingSafeEqual(a,b)}
export const ADMIN_COOKIE=cookieName;

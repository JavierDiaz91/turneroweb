import {createHmac} from 'node:crypto';
import {pool} from './db';

const MAX_FAILURES=5;
const WINDOW_MINUTES=15;
let initialized:Promise<void>|undefined;

function ensureTable(){
 initialized??=pool.query(`CREATE TABLE IF NOT EXISTS admin_login_attempts (
  identity_hash text PRIMARY KEY,
  failures integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz
 )`).then(()=>undefined).catch(error=>{initialized=undefined;throw error});
 return initialized;
}

export function loginIdentity(ip:string,secret:string){
 return createHmac('sha256',secret).update(ip).digest('hex');
}

export async function checkLoginLimit(identity:string){
 await ensureTable();
 const result=await pool.query<{blocked:boolean;retry_seconds:number}>(`SELECT blocked_until>now() AS blocked,
 GREATEST(1,CEIL(EXTRACT(EPOCH FROM (blocked_until-now()))))::integer AS retry_seconds
 FROM admin_login_attempts WHERE identity_hash=$1`,[identity]);
 const row=result.rows[0];
 return {blocked:row?.blocked===true,retrySeconds:row?.blocked?row.retry_seconds:0};
}

export async function registerLoginFailure(identity:string){
 await ensureTable();
 const result=await pool.query<{blocked_until:Date|null}>(`
 INSERT INTO admin_login_attempts(identity_hash,failures,window_started_at,blocked_until)
 VALUES($1,1,now(),NULL)
 ON CONFLICT(identity_hash) DO UPDATE SET
 failures=CASE WHEN admin_login_attempts.window_started_at < now()-interval '15 minutes'
 THEN 1 ELSE admin_login_attempts.failures+1 END,
 window_started_at=CASE WHEN admin_login_attempts.window_started_at < now()-interval '15 minutes'
 THEN now() ELSE admin_login_attempts.window_started_at END,
 blocked_until=CASE WHEN admin_login_attempts.window_started_at < now()-interval '15 minutes'
 THEN NULL WHEN admin_login_attempts.failures+1 >= $2 THEN now()+interval '15 minutes'
 ELSE admin_login_attempts.blocked_until END
 RETURNING blocked_until`,[identity,MAX_FAILURES]);
 return {blocked:result.rows[0]?.blocked_until!=null};
}

export async function clearLoginFailures(identity:string){
 await ensureTable();
 await pool.query('DELETE FROM admin_login_attempts WHERE identity_hash=$1',[identity]);
}

import { pool } from './db';
export const BUFFER_MINUTES=10;
export function validDate(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
export function localToUtc(date:string,time:string){if(!validDate(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Fecha u hora inválida');return new Date(date+'T'+time+':00-03:00');}
export function dayOfWeek(date:string){return new Date(date+'T12:00:00Z').getUTCDay();}
export function minute(t:string){const [h,m]=t.slice(0,5).split(':').map(Number);return h*60+m;}
export async function availableSlots(serviceId:number,date:string,excludeAppointmentId?:number){
 if(!validDate(date))throw Error('Fecha inválida');
 const s=await pool.query<{duration_minutes:number}>('SELECT duration_minutes FROM services WHERE id=$1 AND active=true',[serviceId]);
 if(!s.rowCount)throw Error('Servicio inexistente');
 const hours=await pool.query<{open_time:string;close_time:string}>('SELECT open_time::text,close_time::text FROM business_hours WHERE day_of_week=$1 AND enabled=true',[dayOfWeek(date)]);
 if(!hours.rowCount)return [];
 const {open_time,close_time}=hours.rows[0],start=minute(open_time),close=minute(close_time);
 const dayStart=localToUtc(date,'00:00'),dayEnd=new Date(dayStart.getTime()+86400000);
 const busy=await pool.query<{starts_at:Date;blocked_until:Date}>("SELECT starts_at,blocked_until FROM appointments WHERE status IN ('confirmed','completed','no_show') AND starts_at<$2 AND blocked_until>$1 AND ($3::bigint IS NULL OR id<>$3)",[dayStart,dayEnd,excludeAppointmentId??null]);
 const blocked=await pool.query<{starts_at:Date;ends_at:Date}>('SELECT starts_at,ends_at FROM blocked_periods WHERE starts_at<$2 AND ends_at>$1',[dayStart,dayEnd]);
 const slots:string[]=[];
 for(let m=Math.ceil(start/30)*30;m+s.rows[0].duration_minutes<=close;m+=30){
 const time=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
 const begins=localToUtc(date,time).getTime(),until=begins+(s.rows[0].duration_minutes+BUFFER_MINUTES)*60000;
 if(begins<=Date.now())continue;
 if(busy.rows.some(b=>begins<new Date(b.blocked_until).getTime()&&until>new Date(b.starts_at).getTime()))continue;
 if(blocked.rows.some(b=>begins<new Date(b.ends_at).getTime()&&until>new Date(b.starts_at).getTime()))continue;
 slots.push(time);
 }return slots;
}
import {NextRequest,NextResponse} from 'next/server';
import {isAdmin} from '@/lib/admin-auth';
import {pool} from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 if(!await isAdmin())return NextResponse.json({error:'No autorizado'},{status:401});
 const q=(req.nextUrl.searchParams.get('q')||'').trim();
 if(q.length>100)return NextResponse.json({error:'Búsqueda demasiado larga'},{status:400});
 try{
 const r=await pool.query(`SELECT p.id,p.full_name,p.phone,
 COUNT(a.id)::int AS total,
 COUNT(a.id) FILTER(WHERE a.status='completed')::int AS completed,
 COUNT(a.id) FILTER(WHERE a.status='cancelled')::int AS cancelled,
 COALESCE(SUM(a.price_ars) FILTER(WHERE a.payment_status='paid' AND a.status<>'cancelled'),0)::numeric AS paid,
 MAX(a.starts_at) AS last_visit
 FROM patients p LEFT JOIN appointments a ON a.patient_id=p.id
 WHERE ($1='' OR p.full_name ILIKE '%'||$1||'%' OR p.phone LIKE '%'||regexp_replace($1,'[^0-9]','','g')||'%')
 GROUP BY p.id,p.full_name,p.phone ORDER BY last_visit DESC NULLS LAST,p.full_name LIMIT 100`,[q]);
 return NextResponse.json(r.rows);
 }catch(e){console.error(e);return NextResponse.json({error:'No se pudo consultar pacientes'},{status:500})}
}

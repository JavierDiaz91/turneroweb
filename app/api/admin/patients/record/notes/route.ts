import {NextRequest,NextResponse} from 'next/server';
import {isAdmin} from '@/lib/admin-auth';
import {pool} from '@/lib/db';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 if(!await isAdmin())return NextResponse.json({error:'No autorizado'},{status:401});
 let d:Record<string,unknown>;try{d=await req.json()}catch{return NextResponse.json({error:'JSON inválido'},{status:400})}
 const id=Number(d?.patient_id);
 if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'Paciente inválido'},{status:400});
 const date=d.session_date;
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return NextResponse.json({error:'Fecha inválida'},{status:400});
 for(const k of ['treatment','observations','next_appointment'])if(typeof d[k]!=='string'||(d[k] as string).length>2000)return NextResponse.json({error:'Campo inválido: '+k},{status:400});
 try{
  const r=await pool.query('INSERT INTO patient_session_notes(patient_id,session_date,treatment,observations,next_appointment) VALUES($1,$2,$3,$4,$5) RETURNING id',[id,date,d.treatment,d.observations,d.next_appointment]);
  return NextResponse.json({ok:true,id:r.rows[0].id},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('patient note save failed',e);return NextResponse.json({error:'No se pudo registrar la sesión'},{status:500})}
}

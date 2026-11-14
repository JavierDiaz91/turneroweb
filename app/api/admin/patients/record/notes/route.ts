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
 const professionalId=d.professional_id===null||d.professional_id===undefined?null:Number(d.professional_id);
 if(professionalId!==null&&(!Number.isSafeInteger(professionalId)||professionalId<1))return NextResponse.json({error:'Profesional inválido'},{status:400});
 try{
  if(professionalId!==null){const p=await pool.query('SELECT id FROM professionals WHERE id=$1 AND active=TRUE',[professionalId]);if(!p.rowCount)return NextResponse.json({error:'Profesional no disponible'},{status:400})}
  const r=await pool.query('INSERT INTO patient_session_notes(patient_id,session_date,treatment,observations,next_appointment,professional_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[id,date,d.treatment,d.observations,d.next_appointment,professionalId]);
  return NextResponse.json({ok:true,id:r.rows[0].id},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('patient note save failed',e);return NextResponse.json({error:'No se pudo registrar la sesión'},{status:500})}
}

export async function PATCH(req:NextRequest){
 if(!await isAdmin())return NextResponse.json({error:'No autorizado'},{status:401});
 let d:Record<string,unknown>;try{d=await req.json()}catch{return NextResponse.json({error:'JSON inválido'},{status:400})}
 const id=Number(d.id),patientId=Number(d.patient_id);
 if(!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(patientId)||patientId<1)return NextResponse.json({error:'Consulta o paciente inválido'},{status:400});
 if(typeof d.session_date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d.session_date))return NextResponse.json({error:'Fecha inválida'},{status:400});
 for(const key of ['treatment','observations','next_appointment'])if(typeof d[key]!=='string'||(d[key] as string).length>2000)return NextResponse.json({error:'Campo inválido: '+key},{status:400});
 const professionalId=d.professional_id==null||d.professional_id===''?null:Number(d.professional_id);
 if(professionalId!==null&&(!Number.isSafeInteger(professionalId)||professionalId<1))return NextResponse.json({error:'Profesional inválido'},{status:400});
 try{
  if(professionalId!==null){const p=await pool.query('SELECT id FROM professionals WHERE id=$1',[professionalId]);if(!p.rowCount)return NextResponse.json({error:'Profesional no encontrado'},{status:400})}
  const result=await pool.query('UPDATE patient_session_notes SET session_date=$3,treatment=$4,observations=$5,next_appointment=$6,professional_id=$7 WHERE id=$1 AND patient_id=$2 RETURNING id',[id,patientId,d.session_date,d.treatment,d.observations,d.next_appointment,professionalId]);
  if(!result.rowCount)return NextResponse.json({error:'Consulta no encontrada para este paciente'},{status:404});
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('patient note update failed',e);return NextResponse.json({error:'No se pudo actualizar la consulta'},{status:500})}
}

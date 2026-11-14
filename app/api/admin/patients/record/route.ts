import {NextRequest,NextResponse} from 'next/server';
import {isAdmin} from '@/lib/admin-auth';
import {pool} from '@/lib/db';
export const dynamic='force-dynamic';
const fields=['birth_date','locality','intake_date','allergies','heart_or_pressure','recent_surgeries','pregnancy','chronic_pain','injuries','medications','consultation_reason','massage_type','work_areas','avoid_areas','preferred_intensity'] as const;
function patientId(req:NextRequest){const n=Number(req.nextUrl.searchParams.get('id'));return Number.isSafeInteger(n)&&n>0?n:null}
export async function GET(req:NextRequest){
 if(!await isAdmin())return NextResponse.json({error:'No autorizado'},{status:401});
 const id=patientId(req);if(!id)return NextResponse.json({error:'Paciente inválido'},{status:400});
 try{
  const p=await pool.query('SELECT id,full_name,phone FROM patients WHERE id=$1',[id]);
  if(!p.rowCount)return NextResponse.json({error:'Paciente no encontrado'},{status:404});
  const [record,notes]=await Promise.all([
   pool.query('SELECT * FROM patient_records WHERE patient_id=$1',[id]),
   pool.query('SELECT n.id,n.session_date,n.treatment,n.observations,n.next_appointment,n.professional_id,p.full_name AS professional_name FROM patient_session_notes n LEFT JOIN professionals p ON p.id=n.professional_id WHERE n.patient_id=$1 ORDER BY n.session_date DESC,n.id DESC LIMIT 100',[id])
  ]);
  return NextResponse.json({patient:p.rows[0],record:record.rows[0]||null,notes:notes.rows},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('patient record read failed',e);return NextResponse.json({error:'No se pudo consultar la ficha'},{status:500})}
}
export async function PUT(req:NextRequest){
 if(!await isAdmin())return NextResponse.json({error:'No autorizado'},{status:401});
 const id=patientId(req);if(!id)return NextResponse.json({error:'Paciente inválido'},{status:400});
 let data:Record<string,unknown>;try{data=await req.json()}catch{return NextResponse.json({error:'JSON inválido'},{status:400})}
 if(!data||typeof data!=='object'||Array.isArray(data))return NextResponse.json({error:'Datos inválidos'},{status:400});
 const values:(string|null)[]=[];
 for(const key of fields){
  const value=data[key];
  if(value===undefined||value===null||value===''){values.push(key.endsWith('_date')?null:'');continue}
  if(typeof value!=='string'||value.length>2000)return NextResponse.json({error:'Campo inválido: '+key},{status:400});
  if(key.endsWith('_date')&&!/^\d{4}-\d{2}-\d{2}$/.test(value))return NextResponse.json({error:'Fecha inválida: '+key},{status:400});
  values.push(value);
 }
 try{
  const columns=fields.join(',');
  const placeholders=fields.map((_,i)=>'$'+(i+2)).join(',');
  const updates=fields.map(k=>k+'=EXCLUDED.'+k).join(',');
  const sql='INSERT INTO patient_records (patient_id,'+columns+') VALUES ($1,'+placeholders+') ON CONFLICT (patient_id) DO UPDATE SET '+updates+',updated_at=NOW() RETURNING patient_id';
  await pool.query(sql,[id,...values]);
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('patient record save failed',e);return NextResponse.json({error:'No se pudo guardar la ficha'},{status:500})}
}

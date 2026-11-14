import {NextRequest,NextResponse} from 'next/server';
import {isAdmin} from '@/lib/admin-auth';
import {pool} from '@/lib/db';
export const dynamic='force-dynamic';
const escapeHtml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const date=(value:unknown)=>{
 if(value==null||value==='')return 'Sin registrar';
 if(value instanceof Date&&!Number.isNaN(value.getTime()))return new Intl.DateTimeFormat('es-AR',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(value);
 const raw=String(value).trim();
 const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if(iso)return iso[3]+'/'+iso[2]+'/'+iso[1];
 const parsed=new Date(raw);
 if(!Number.isNaN(parsed.getTime()))return new Intl.DateTimeFormat('es-AR',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(parsed);
 return 'Fecha no disponible';
};
const field=(label:string,value:unknown)=>'<div class="field"><small>'+escapeHtml(label)+'</small><div>'+escapeHtml(value||'Sin registrar')+'</div></div>';
const section=(title:string,body:string)=>'<section><h2>'+escapeHtml(title)+'</h2><div class="fields">'+body+'</div></section>';
export async function GET(req:NextRequest){
 if(!await isAdmin())return NextResponse.json({error:'No autorizado'},{status:401});
 const id=Number(req.nextUrl.searchParams.get('id'));
 if(!Number.isSafeInteger(id)||id<=0)return NextResponse.json({error:'Paciente inválido'},{status:400});
 try{
  const p=await pool.query('SELECT id,full_name,phone FROM patients WHERE id=$1',[id]);
  if(!p.rowCount)return NextResponse.json({error:'Paciente no encontrado'},{status:404});
  const [r,n]=await Promise.all([
   pool.query('SELECT * FROM patient_records WHERE patient_id=$1',[id]),
   pool.query('SELECT session_date,treatment,observations,next_appointment FROM patient_session_notes WHERE patient_id=$1 ORDER BY session_date DESC,id DESC',[id])
  ]);
  const patient=p.rows[0],record=r.rows[0]||{},notes=n.rows;
  const personal=section('Datos personales',field('Nombre y apellido',patient.full_name)+field('Teléfono / WhatsApp',patient.phone)+field('Nacimiento',date(record.birth_date))+field('Dirección / localidad',record.locality)+field('Fecha de ingreso',date(record.intake_date)));
  const health=section('Antecedentes de salud',field('Alergias',record.allergies)+field('Problemas cardíacos / presión',record.heart_or_pressure)+field('Cirugías recientes',record.recent_surgeries)+field('Embarazo',record.pregnancy)+field('Dolores crónicos',record.chronic_pain)+field('Lesiones / fracturas',record.injuries)+field('Medicación actual',record.medications));
  const prefs=section('Motivo de consulta y preferencias',field('Motivo de consulta',record.consultation_reason)+field('Tipo de masaje',record.massage_type)+field('Zonas a trabajar',record.work_areas)+field('Zonas a evitar',record.avoid_areas)+field('Intensidad preferida',record.preferred_intensity));
  const visits=notes.length?notes.map((note:{session_date:unknown;treatment:string;observations:string;next_appointment:string})=>'<article class="visit"><h3>'+escapeHtml(date(note.session_date))+' · '+escapeHtml(note.treatment||'Sin especificar')+'</h3>'+field('Observaciones',note.observations)+field('Próximo turno / indicaciones',note.next_appointment)+'</article>').join(''):'<p>Sin consultas documentadas.</p>';
  const issued=new Intl.DateTimeFormat('es-AR',{timeZone:'America/Argentina/Buenos_Aires',dateStyle:'long'}).format(new Date());
  const last=notes[0];const latestHtml=last?'<article class="visit"><h3>'+escapeHtml(date(last.session_date))+' · '+escapeHtml(last.treatment||'Sin especificar')+'</h3>'+field('Observaciones',last.observations)+field('Próximo turno / indicaciones',last.next_appointment)+'</article>':'<p>Sin consultas documentadas.</p>';
  const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ficha RENASER - ${escapeHtml(patient.full_name)}</title><style>
  @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:14px Arial,sans-serif;color:#294334;max-width:850px;margin:0 auto;padding:22px;background:#f7f5f0}
  header{text-align:center;border-bottom:2px solid #b7c9b9;padding:10px 0 20px;margin-bottom:24px}h1{font:42px Georgia,serif;letter-spacing:5px;margin:0}header p{letter-spacing:3px;margin:5px}h2{font:22px Georgia,serif;border-bottom:1px solid #d8e2d7;padding-bottom:8px}h3{font-size:15px}
  section{background:#fff;padding:16px 20px;margin:14px 0;border:1px solid #d8e2d7;border-radius:10px;break-inside:avoid}
  .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.field{overflow-wrap:anywhere}.field small{display:block;color:#6c8071;margin-bottom:4px}
  .visit{border-bottom:1px solid #d8e2d7;padding:12px 0;break-inside:avoid}.visit .field{margin:10px 0}.visit:last-child{border:0}
  footer{border-top:1px solid #d8e2d7;padding-top:12px;margin-top:22px;color:#6c8071;font-size:11px;text-align:center}
  .actions{position:sticky;top:0;background:#f7f5f0;padding:12px;text-align:center}.actions button{padding:12px 20px;border:0;border-radius:8px;background:#5c8067;color:white;cursor:pointer;font-size:15px}
  @media print{body{background:white;padding:0;font-size:12px;max-width:none}header{padding:0 0 10px;margin-bottom:12px}h1{font-size:30px}header p{margin:2px}section{padding:8px 12px;margin:6px 0;border-radius:0;break-inside:avoid}h2{font-size:16px;margin:0 0 6px;padding-bottom:4px}.fields{gap:8px}.visit{padding:6px 0}h2,.visit{break-after:avoid}footer{margin-top:10px;padding-top:8px}}
  </style></head><body><div class="actions"><button onclick="window.print()">Imprimir / Guardar como PDF</button></div><header><h1>RENASER</h1><p>MASAJES</p><strong>FICHA PRIVADA DEL PACIENTE</strong></header><p>Emitida el ${escapeHtml(issued)}</p>${personal}${health}${prefs}${notes.length>1?`<section><h2>Última consulta (resumen)</h2>${latestHtml}</section>`:""}<section><h2>Historial de consultas (${notes.length})</h2>${visits}</section><footer>Documento confidencial · Uso exclusivo del gabinete RENASER</footer></body></html>`;
  return new NextResponse(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
 }catch(e){console.error('patient print failed',e);return NextResponse.json({error:'No se pudo generar la ficha imprimible'},{status:500})}
}

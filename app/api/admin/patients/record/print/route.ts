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
  const [r,n,b]=await Promise.all([
   pool.query('SELECT * FROM patient_records WHERE patient_id=$1',[id]),
   pool.query('SELECT n.session_date,n.treatment,n.observations,n.next_appointment,p.full_name AS professional_name,p.specialty,p.license_number FROM patient_session_notes n LEFT JOIN professionals p ON p.id=n.professional_id WHERE n.patient_id=$1 ORDER BY n.session_date DESC,n.id DESC',[id]),
   pool.query('SELECT business_name,address,phone FROM business_settings WHERE id=1')
  ]);
  const patient=p.rows[0],record=r.rows[0]||{},notes=n.rows,business=b.rows[0]||{business_name:'RENASER Masajes',address:'',phone:''};
  const personal=section('Datos personales',field('Nombre y apellido',patient.full_name)+field('Teléfono / WhatsApp',patient.phone)+field('Nacimiento',date(record.birth_date))+field('Dirección / localidad',record.locality)+field('Fecha de ingreso',date(record.intake_date)));
  const health=section('Antecedentes de salud',field('Alergias',record.allergies)+field('Problemas cardíacos / presión',record.heart_or_pressure)+field('Cirugías recientes',record.recent_surgeries)+field('Embarazo',record.pregnancy)+field('Dolores crónicos',record.chronic_pain)+field('Lesiones / fracturas',record.injuries)+field('Medicación actual',record.medications));
  const prefs=section('Motivo de consulta y preferencias',field('Motivo de consulta',record.consultation_reason)+field('Tipo de masaje',record.massage_type)+field('Zonas a trabajar',record.work_areas)+field('Zonas a evitar',record.avoid_areas)+field('Intensidad preferida',record.preferred_intensity));
  const visits=notes.length?notes.map((note:{session_date:unknown;treatment:string;observations:string;next_appointment:string;professional_name:string|null;specialty:string|null;license_number:string|null})=>'<article class="visit"><div class="visit-heading"><span class="visit-date">CONSULTA DEL '+escapeHtml(date(note.session_date))+'</span><h3>'+escapeHtml(note.treatment||'Tratamiento sin especificar')+'</h3></div><div class="consultation-details">'+field('Observaciones',note.observations)+field('Próximo turno / indicaciones',note.next_appointment)+'</div><div class="professional-panel"><div class="professional-details"><div class="professional-label">Profesional responsable</div><div class="professional-name">'+escapeHtml(note.professional_name||'Sin asignar')+'</div>'+(note.specialty?'<div class="professional-meta">'+escapeHtml(note.specialty)+'</div>':'')+(note.license_number?'<div class="professional-meta">Matrícula: '+escapeHtml(note.license_number)+'</div>':'')+'</div><div class="professional-signature"><div class="signature-line"></div><span>Firma del profesional</span></div></div></article>').join(''):'<p>Sin consultas documentadas.</p>';
  const issued=new Intl.DateTimeFormat('es-AR',{timeZone:'America/Argentina/Buenos_Aires',dateStyle:'long'}).format(new Date());
  const cabinet=section('Gabinete',field('Nombre comercial',business.business_name)+field('Dirección / localidad',business.address)+field('Teléfono',business.phone));
  const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ficha RENASER - ${escapeHtml(patient.full_name)}</title><style>
  @page{size:A4;margin:11mm 12mm}
  *{box-sizing:border-box}
  body{font:13px/1.35 Arial,sans-serif;color:#294334;max-width:850px;margin:0 auto;padding:20px;background:#f7f5f0}
  header{text-align:center;border-bottom:1px solid #b7c9b9;padding:8px 0 12px;margin-bottom:12px}
  h1{font:34px Georgia,serif;letter-spacing:4px;margin:0}
  header p{letter-spacing:2px;margin:2px 0}
  header strong{font-size:10px}
  .issued{font-size:11px;margin:0 0 8px}
  h2{font:19px Georgia,serif;border-bottom:1px solid #d8e2d7;padding-bottom:5px;margin:0 0 9px}
  h3{font-size:13px;margin:0 0 8px}
  section{background:#fff;padding:12px 16px;margin:10px 0;border:1px solid #d8e2d7;border-radius:8px}
  .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px}
  .field{overflow-wrap:anywhere}
  .field small{display:block;color:#6c8071;font-size:11px;margin-bottom:1px}
  .visit{border-bottom:1px solid #d8e2d7;padding:12px 0;break-inside:avoid;page-break-inside:avoid}\n  .visit-heading{margin-bottom:8px}.visit-date{font-size:10px;letter-spacing:1px;color:#6c8071;font-weight:600}.visit-heading h3{margin:3px 0 0;font:17px Georgia,serif}.consultation-details{display:grid;grid-template-columns:1fr 1fr;gap:10px}.professional-panel{display:flex;justify-content:space-between;align-items:end;gap:20px;border-top:1px solid #d8e2d7;margin-top:12px;padding-top:10px}.professional-label{font-size:11px;font-weight:600;margin-bottom:5px}.professional-name{font-size:14px;font-weight:700}.professional-meta{font-size:11px;color:#6c8071;margin-top:3px}.professional-signature{width:40%;max-width:210px;text-align:center;flex-shrink:0}.signature-line{height:34px;border-bottom:1px solid #627b69}.professional-signature span{font-size:10px;color:#6c8071;display:block;margin-top:5px}
  .visit .field{margin:5px 0}
  .visit:last-child{border:0}
  footer{border-top:1px solid #d8e2d7;padding-top:8px;margin-top:12px;color:#6c8071;font-size:10px;text-align:center}
  .actions{position:sticky;top:0;background:#f7f5f0;padding:12px;text-align:center}
  .actions button{padding:12px 20px;border:0;border-radius:8px;background:#5c8067;color:white;cursor:pointer;font-size:15px}
  @media print{
    .actions{display:none!important}
    body{background:#fff;padding:0;max-width:none;font-size:10px;line-height:1.2;color:#294334}
    header{padding:0 0 6px;margin:0 0 6px}
    h1{font-size:25px;letter-spacing:3px}
    header p{font-size:9px;margin:0}
    header strong{font-size:8px}
    .issued{font-size:9px;margin:0 0 5px}
    section{padding:6px 9px;margin:4px 0;border-radius:0;break-inside:auto}
    h2{font-size:13px;margin:0 0 4px;padding-bottom:3px;break-after:avoid;page-break-after:avoid}
    h3{font-size:10px;margin:0 0 3px;break-after:avoid}
    .fields{gap:3px 12px}
    .field small{font-size:8px;margin:0}
    .visit{padding:6px 0;break-inside:avoid;page-break-inside:avoid}\n    .visit-heading{margin-bottom:4px}.visit-date{font-size:8px}.visit-heading h3{font-size:12px;margin:2px 0}.consultation-details{gap:6px}.professional-panel{margin-top:6px;padding-top:6px;gap:10px}.professional-label{font-size:8px;margin-bottom:2px}.professional-name{font-size:11px}.professional-meta{font-size:8px;margin-top:1px}.professional-signature{width:35%;max-width:160px}.signature-line{height:23px}.professional-signature span{font-size:8px;margin-top:3px}
    .visit .field{margin:2px 0}
    footer{margin-top:7px;padding-top:5px;font-size:8px}
  }
  </style></head><body><div class="actions"><button onclick="window.print()">Imprimir / Guardar como PDF</button></div><header><h1>RENASER</h1><p>MASAJES</p><strong>FICHA PRIVADA DEL PACIENTE</strong></header><p class="issued">Emitida el ${escapeHtml(issued)}</p>${cabinet}${personal}${health}${prefs}<section><h2>Historial de consultas (${notes.length})</h2>${visits}</section><footer>Documento confidencial · Uso exclusivo del gabinete RENASER</footer></body></html>`;
  return new NextResponse(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
 }catch(e){console.error('patient print failed',e);return NextResponse.json({error:'No se pudo generar la ficha imprimible'},{status:500})}
}

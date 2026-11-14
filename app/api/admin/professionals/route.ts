import {NextRequest,NextResponse} from 'next/server';
import {isAdmin} from '@/lib/admin-auth';
import {pool} from '@/lib/db';
export const dynamic='force-dynamic';
const denied=()=>NextResponse.json({error:'No autorizado'},{status:401});
const invalid=(error:string)=>NextResponse.json({error},{status:400});
export async function GET(){if(!await isAdmin())return denied();try{const [business,professionals]=await Promise.all([pool.query('SELECT business_name,address,phone FROM business_settings WHERE id=1'),pool.query('SELECT id,full_name,specialty,license_number,phone,active FROM professionals ORDER BY active DESC,full_name,id')]);return NextResponse.json({business:business.rows[0]||null,professionals:professionals.rows},{headers:{'Cache-Control':'no-store'}})}catch(e){console.error(e);return NextResponse.json({error:'No se pudo consultar la configuración. Ejecutá primero la migración SQL.'},{status:500})}}
export async function POST(req:NextRequest){if(!await isAdmin())return denied();let d:Record<string,unknown>;try{d=await req.json()}catch{return invalid('JSON inválido')}
const name=typeof d.full_name==='string'?d.full_name.trim():'';
if(!name||name.length>150)return invalid('Ingresá un nombre válido');
const vals=['specialty','license_number','phone'].map(k=>typeof d[k]==='string'?d[k] as string:null);
if(vals.some(v=>v===null||v.length>200))return invalid('Datos inválidos');
try{const r=await pool.query('INSERT INTO professionals(full_name,specialty,license_number,phone) VALUES($1,$2,$3,$4) RETURNING id',[name,...vals]);return NextResponse.json({id:r.rows[0].id},{status:201})}catch(e){console.error(e);return NextResponse.json({error:'No se pudo crear el profesional'},{status:500})}}
export async function PATCH(req:NextRequest){if(!await isAdmin())return denied();let d:Record<string,unknown>;try{d=await req.json()}catch{return invalid('JSON inválido')}
if(d.kind==='business'){const values=['business_name','address','phone'].map(k=>typeof d[k]==='string'?(d[k] as string).trim():null);if(values.some(v=>v===null||v.length>200)||!values[0])return invalid('Datos del gabinete inválidos');try{await pool.query('INSERT INTO business_settings(id,business_name,address,phone) VALUES(1,$1,$2,$3) ON CONFLICT(id) DO UPDATE SET business_name=$1,address=$2,phone=$3,updated_at=NOW()',values);return NextResponse.json({ok:true})}catch(e){console.error(e);return NextResponse.json({error:'No se pudo guardar el gabinete'},{status:500})}}
const id=Number(d.id),name=typeof d.full_name==='string'?d.full_name.trim():'';
if(!Number.isSafeInteger(id)||id<1||!name||name.length>150||typeof d.active!=='boolean')return invalid('Profesional inválido');
const vals=['specialty','license_number','phone'].map(k=>typeof d[k]==='string'?d[k] as string:null);
if(vals.some(v=>v===null||v.length>200))return invalid('Datos inválidos');
try{const r=await pool.query('UPDATE professionals SET full_name=$2,specialty=$3,license_number=$4,phone=$5,active=$6,updated_at=NOW() WHERE id=$1 RETURNING id',[id,name,...vals,d.active]);return r.rowCount?NextResponse.json({ok:true}):NextResponse.json({error:'Profesional no encontrado'},{status:404})}catch(e){console.error(e);return NextResponse.json({error:'No se pudo actualizar el profesional'},{status:500})}}

import Image from 'next/image';
import AdminDashboard from './dashboard';
export const metadata={title:'Administración | RENASER'};
export default function AdminPage(){
 return <main className="renaser-admin-page">
  <header className="renaser-admin-header" style={{display:"flex",alignItems:"center",justifyContent:"flex-start",height:"88px",minHeight:"88px",marginBottom:"8px"}}>
   <a href="/admin" className="renaser-admin-brand" style={{display:"inline-flex",width:"64px",height:"82px",flex:"0 0 64px",alignItems:"center",overflow:"hidden"}} aria-label="RENASER - volver a Mi agenda">
    <Image src="/renaser-site-logo.webp" alt="RENASER masajes" width={72} height={93} priority className="renaser-admin-logo" style={{display:"block",width:"64px",height:"82px",objectFit:"contain",maxWidth:"100%"}}/>
   </a>
  </header>
  <AdminDashboard/>
 </main>
}
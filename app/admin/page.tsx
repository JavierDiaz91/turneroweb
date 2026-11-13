import Image from 'next/image';
import AdminDashboard from './dashboard';
export const metadata={title:'Administración | RENASER'};
export default function AdminPage(){
 return <main className="renaser-admin-page">
  <header className="renaser-admin-header">
   <a href="/admin" className="renaser-admin-brand" aria-label="RENASER - volver a Mi agenda">
    <Image src="/renaser-site-logo.webp" alt="RENASER masajes" width={700} height={900} priority className="renaser-admin-logo"/>
   </a>
  </header>
  <AdminDashboard/>
 </main>
}
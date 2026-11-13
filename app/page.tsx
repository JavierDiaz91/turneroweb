import Image from 'next/image';
import Reservation from './reservation';

export default function Home(){
 return <main className="renaser-home">
  <nav className="renaser-site-nav" aria-label="Navegación principal">
   <a className="renaser-home-link" href="/" aria-label="RENASER Masajes - volver al inicio">
    <Image src="/renaser-site-logo.webp" alt="" width={700} height={900} className="renaser-nav-logo" priority/>
   </a>
   <a className="renaser-nav-book" href="#reservar">Reservar turno</a>
  </nav>
  <header className="renaser-banner">
   <div className="renaser-banner-content">
    <p className="renaser-banner-eyebrow">MASAJES Y BIENESTAR</p>
    <h1>Un espacio para renovar tu ser.</h1>
    <p>Elegí tu masaje y reservá tu momento de bienestar.</p>
    <a className="renaser-banner-cta" href="#reservar">Elegir mi masaje <span aria-hidden="true">→</span></a>
   </div>
  </header>
  <div id="reservar"><Reservation/></div>
  <footer className="renaser-site-footer"><span>© {new Date().getFullYear()} RENASER Masajes · Reservas online · Pago presencial</span></footer>
 </main>
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Building, Crown, Inbox, LayoutDashboard, Map as MapIcon, Menu, Smartphone, Users, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { CIUDADES } from "@/lib/mock/ciudades";
import { EQUIPO } from "@/lib/mock/negocio";
import { useDatosMaqueta, useSinRespuesta } from "@/lib/vista";
import { Maqueta } from "../three/Scenes";
import { Avatar, Toasts } from "../ui";
import { MarcaIc } from "../Marca";

const NAV = [
  { href: "/panel", texto: "Resumen", icono: LayoutDashboard },
  { href: "/panel/pedidos", texto: "Pedidos", icono: Inbox },
  { href: "/panel/arquitectos", texto: "Arquitectos", icono: Users },
  { href: "/panel/zonas", texto: "Zonas", icono: MapIcon },
  { href: "/panel/planes", texto: "Planes y publicidad", icono: Crown },
];

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const { arquitectos, listo, ciudadPanel, setCiudadPanel, foco, zonas } = useStore();
  const sinRespuesta = useSinRespuesta();
  const datos = useDatosMaqueta(ciudadPanel);
  const actual = NAV.find((n) => (n.href === "/panel" ? ruta === "/panel" : ruta.startsWith(n.href)));
  const yo = EQUIPO[0];
  const deCiudad = new Set(zonas.filter((z) => z.ciudadId === ciudadPanel).map((z) => z.id));
  const porVerificar = arquitectos.filter((a) => a.ciudadId === ciudadPanel && !a.verificado).length;
  const listas = zonas.filter((z) => z.ciudadId === ciudadPanel && z.estado === "espera" && z.enEspera > 0 && arquitectos.some((a) => a.zonas.includes(z.id))).length;
  const porLlamar = sinRespuesta.filter((p) => deCiudad.has(p.zonaId) && !p.contactado).length;

  useEffect(() => setAbierto(false), [ruta]);

  return (
    <div className="pn">
      <div className="pn-fondo">
        {!ruta.startsWith("/panel/zonas") && <Maqueta modo="fondo" {...datos} focoZona={foco?.tipo === "zona" ? foco.id : null} focoPedido={foco?.tipo === "pedido" ? foco.id : null} casaPropia={null} fotos={[]} />}
        <div className="pn-velo" />
      </div>
      <aside className={`pn-side ${abierto ? "open" : ""}`}>
        <div className="pn-marca">
          <MarcaIc />
          <span>
            <strong>Trazo</strong>
            <small>Administración</small>
          </span>
          <button className="icon-btn pn-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>
        <nav className="pn-nav">
          {NAV.map((n) => {
            const Ic = n.icono;
            const on = actual?.href === n.href;
            const c = !listo ? 0 : n.href === "/panel" ? porLlamar : n.href === "/panel/arquitectos" ? porVerificar : n.href === "/panel/zonas" ? listas : 0;
            return (
              <Link key={n.href} href={n.href} className={`pn-item ${on ? "on" : ""}`}>
                <Ic size={18} />
                <span>{n.texto}</span>
                {c > 0 && <em>{c}</em>}
              </Link>
            );
          })}
        </nav>
        <div className="pn-side-pie">
          <Link href="/" className="btn btn-sec ancho">
            <Smartphone size={16} /> Ver la app
          </Link>
          <div className="pn-quien">
            <Avatar k={yo.foto} nombre={yo.nombre} size={36} />
            <span>
              <strong>{yo.nombre}</strong>
              <small>{yo.rol}</small>
            </span>
          </div>
        </div>
      </aside>
      <div className={`scrim ${abierto ? "show" : ""}`} onClick={() => setAbierto(false)} />
      <div className="pn-main">
        <header className="pn-top">
          <button className="icon-btn pn-menu" onClick={() => setAbierto(true)} aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <div className="pn-top-tit">
            <small>Administración</small>
            <strong>{actual?.texto ?? "Panel"}</strong>
          </div>
          <label className="pn-ciudad">
            <Building size={15} />
            <select value={ciudadPanel} onChange={(e) => setCiudadPanel(e.target.value)} aria-label="Ciudad">
              {CIUDADES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
        </header>
        <main className="pn-contenido">{children}</main>
        <footer className="pn-pie">
          <span>© 2026 Trazo · Arquitectos de tu barrio</span>
          <span>Fotos: Unsplash</span>
        </footer>
      </div>
      <Toasts />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BatteryFull, Crown, FileText, House, Inbox, LayoutDashboard, MapPin, MessageCircle, Plus, Signal, UserRound, Wifi } from "lucide-react";
import { useStore, type TabArq, type TabCliente } from "@/lib/store";
import { hora } from "@/lib/format";
import { ARQUITECTO_ACTUAL, CLIENTE_ACTUAL } from "@/lib/mock/pedidos";
import { useZona } from "@/lib/vista";
import type { Especialidad } from "@/lib/types";
import { DetallePedidoCliente, InicioCliente, MisPedidos, PerfilCliente, Publicar } from "./cliente";
import { DetallePedidoArq, MisPropuestas, PedidosZona, PerfilArq, PlanArq } from "./arquitecto";
import { Chat, FichaArquitecto, Mensajes } from "./comunes";
import { MarcaIc } from "../Marca";

const TABS_CLIENTE: { id: TabCliente; texto: string; icono: typeof House }[] = [
  { id: "inicio", texto: "Inicio", icono: House },
  { id: "pedidos", texto: "Pedidos", icono: Inbox },
  { id: "publicar", texto: "Publicar", icono: Plus },
  { id: "mensajes", texto: "Mensajes", icono: MessageCircle },
  { id: "perfil", texto: "Perfil", icono: UserRound },
];
const TABS_ARQ: { id: TabArq; texto: string; icono: typeof House }[] = [
  { id: "pedidos", texto: "Pedidos", icono: Inbox },
  { id: "propuestas", texto: "Propuestas", icono: FileText },
  { id: "mensajes", texto: "Mensajes", icono: MessageCircle },
  { id: "plan", texto: "Plan", icono: Crown },
  { id: "perfil", texto: "Perfil", icono: UserRound },
];

export function SelectorRol({ compacto = false }: { compacto?: boolean }) {
  const { rol, setRol } = useStore();
  return (
    <div className={`selector-rol ${compacto ? "compacto" : ""}`} role="tablist" aria-label="Ver la app como">
      <button role="tab" aria-selected={rol === "cliente"} className={rol === "cliente" ? "on" : ""} onClick={() => setRol("cliente")}>
        Cliente
      </button>
      <button role="tab" aria-selected={rol === "arquitecto"} className={rol === "arquitecto" ? "on" : ""} onClick={() => setRol("arquitecto")}>
        Arquitecto
      </button>
      <i className={rol === "arquitecto" ? "der" : ""} aria-hidden="true" />
    </div>
  );
}

export default function TrazoApp({ marco }: { marco: boolean }) {
  const { rol, tabCliente, irCliente, tabArq, irArq, listo, ahora, yo, conversaciones, pedidos, propuestas } = useStore();
  const cuerpo = useRef<HTMLDivElement | null>(null);
  const [tipoInicial, setTipoInicial] = useState<Especialidad | null>(null);
  const [vueltaPublicar, setVueltaPublicar] = useState(0);
  const zona = useZona(yo.cliente?.zonaId);
  const tab = rol === "cliente" ? tabCliente : tabArq;

  useEffect(() => {
    cuerpo.current?.scrollTo({ top: 0 });
    window.dispatchEvent(new CustomEvent("trazo:scroll", { detail: { p: 0 } }));
  }, [tab, rol]);

  const onScroll = () => {
    const el = cuerpo.current;
    if (!el) return;
    const p = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    window.dispatchEvent(new CustomEvent("trazo:scroll", { detail: { p } }));
  };

  const sinLeer = conversaciones.filter((c) => !c.leida && (rol === "cliente" ? c.clienteId === CLIENTE_ACTUAL : c.arquitectoId === ARQUITECTO_ACTUAL)).length;
  const conPropuestasNuevas = pedidos.filter((p) => p.clienteId === CLIENTE_ACTUAL && p.estado === "abierto" && propuestas.some((x) => x.pedidoId === p.id && x.estado === "enviada")).length;

  const alPublicar = (t: Especialidad | null) => {
    setTipoInicial(t);
    setVueltaPublicar((v) => v + 1);
    irCliente("publicar");
  };

  return (
    <div className={`app ${marco ? "app-marco" : "app-pantalla"} app-${rol}`}>
      {marco && (
        <div className="barra-estado" aria-hidden="true">
          <span className="be-hora">{listo ? hora(ahora.toISOString()) : "--:--"}</span>
          <span className="be-isla" />
          <span className="be-iconos">
            <Signal size={13} />
            <Wifi size={13} />
            <BatteryFull size={16} />
          </span>
        </div>
      )}
      <header className="app-cab">
        <div className="app-marca">
          <MarcaIc />
          <div>
            <strong>Trazo</strong>
            {rol === "cliente" ? (
              <small className="ubi-chip">
                <MapPin size={11} /> {zona?.nombre ?? "..."}
              </small>
            ) : (
              <small className="ubi-chip">Para arquitectos</small>
            )}
          </div>
        </div>
        <div className="app-cab-acc">
          {!marco && <SelectorRol compacto />}
          {!marco && (
            <Link href="/panel" className="icon-btn" aria-label="Panel de administración">
              <LayoutDashboard size={18} />
            </Link>
          )}
        </div>
      </header>

      <div className="app-cuerpo" ref={cuerpo} onScroll={onScroll}>
        <div key={`${rol}-${tab}-${tab === "publicar" ? vueltaPublicar : 0}`} className="vista-entra">
          {rol === "cliente" ? (
            <>
              {tabCliente === "inicio" && <InicioCliente marco={marco} alPublicar={alPublicar} />}
              {tabCliente === "pedidos" && <MisPedidos />}
              {tabCliente === "publicar" && <Publicar tipoInicial={tipoInicial} alTerminar={() => setTipoInicial(null)} />}
              {tabCliente === "mensajes" && <Mensajes />}
              {tabCliente === "perfil" && <PerfilCliente />}
            </>
          ) : (
            <>
              {tabArq === "pedidos" && <PedidosZona marco={marco} />}
              {tabArq === "propuestas" && <MisPropuestas />}
              {tabArq === "mensajes" && <Mensajes />}
              {tabArq === "plan" && <PlanArq />}
              {tabArq === "perfil" && <PerfilArq />}
            </>
          )}
        </div>
      </div>

      <nav className="app-tabs" aria-label="Secciones">
        {(rol === "cliente" ? TABS_CLIENTE : TABS_ARQ).map((t) => {
          const Ic = t.icono;
          const on = tab === t.id;
          const central = rol === "cliente" && t.id === "publicar";
          const badge = t.id === "mensajes" ? sinLeer : rol === "cliente" && t.id === "pedidos" ? conPropuestasNuevas : 0;
          return (
            <button
              key={t.id}
              className={`tab ${on ? "on" : ""} ${central ? "tab-central" : ""}`}
              onClick={() => (rol === "cliente" ? (t.id === "publicar" ? alPublicar(null) : irCliente(t.id as TabCliente)) : irArq(t.id as TabArq))}
              aria-current={on ? "page" : undefined}
            >
              <span className="tab-ic">
                <Ic size={central ? 22 : 20} strokeWidth={on || central ? 2.4 : 2} />
                {badge > 0 && <em className="tab-n">{badge}</em>}
              </span>
              <span>{t.texto}</span>
            </button>
          );
        })}
      </nav>

      {rol === "cliente" ? <DetallePedidoCliente /> : <DetallePedidoArq />}
      <FichaArquitecto />
      <Chat />
    </div>
  );
}

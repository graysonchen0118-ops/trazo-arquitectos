"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, BellRing, Gift, LayoutDashboard, Smartphone } from "lucide-react";
import { useStore } from "@/lib/store";
import { diasHasta, plural } from "@/lib/format";
import { CLIENTE_ACTUAL } from "@/lib/mock/pedidos";
import { proyectosDe } from "@/lib/photos";
import { foto } from "@/lib/photos";
import { useAncho, useDatosMaqueta, usePropuestasPorPedido, useZona } from "@/lib/vista";
import { Maqueta } from "./three/Scenes";
import TrazoApp, { SelectorRol } from "./app/TrazoApp";
import { Toasts } from "./ui";
import { MarcaIc } from "./Marca";

export default function Experiencia() {
  const ancho = useAncho();
  const { rol, foco, pedidos, arquitectos, yo, listo, ahora, abrirPedido, irCliente, irArq, planes } = useStore();
  const datos = useDatosMaqueta("cdmx");
  const cuenta = usePropuestasPorPedido();
  const zonaCasa = useZona(yo.cliente?.zonaId);
  const fotos = useMemo(() => [...proyectosDe("cocina").slice(0, 2), ...proyectosDe("exterior").slice(0, 2), ...proyectosDe("interiorismo").slice(0, 2)].map((k) => foto(k, 512, 360)), []);
  const marco = ancho !== null && ancho >= 768;
  const escritorio = ancho !== null && ancho >= 1024;
  const izq = ancho && ancho <= 1180 ? 350 : 390;
  const der = ancho && ancho <= 1180 ? 450 : 480;
  const centroX = escritorio && ancho ? (izq + (ancho - der - izq) / 2) / ancho : undefined;
  const focoPedido = foco?.tipo === "pedido" ? foco.id : null;
  const pedidoFoco = pedidos.find((p) => p.id === focoPedido);

  if (ancho === null) return <div className="cargando-pantalla" aria-hidden="true" />;

  if (!marco) {
    return (
      <div className="exp-movil">
        <TrazoApp marco={false} />
        <Toasts />
      </div>
    );
  }

  const a = yo.arquitecto;
  const plan = a ? planes.find((p) => p.id === a.plan) : null;
  const enMisZonas = a ? pedidos.filter((p) => p.estado === "abierto" && a.zonas.includes(p.zonaId)) : [];
  const sinNada = enMisZonas.filter((p) => !cuenta.get(p.id)).length;
  const cubrenCasa = arquitectos.filter((x) => zonaCasa && x.zonas.includes(zonaCasa.id) && x.estadoPlan !== "cancelado" && !x.suspendido).length;
  const avisados = pedidoFoco ? arquitectos.filter((x) => x.zonas.includes(pedidoFoco.zonaId) && x.estadoPlan !== "cancelado" && !x.suspendido).length : 0;
  const miCocina = pedidos.find((p) => p.clienteId === CLIENTE_ACTUAL && p.estado === "abierto");

  return (
    <div className={`exp ${escritorio ? "exp-escritorio" : "exp-tablet"}`}>
      <div className="escenario">
        <Maqueta modo="escenario" {...datos} focoPedido={focoPedido} rol={rol} casaPropia={rol === "cliente" ? (zonaCasa?.id ?? null) : null} centroX={centroX} fotos={fotos} />
      </div>

      <header className="exp-top">
        <Link href="/" className="exp-marca">
          <MarcaIc />
          <span>
            <strong>Trazo</strong>
            <small>Arquitectos de tu barrio</small>
          </span>
        </Link>
        <nav className="exp-nav">
          <Link href="/" className="on">
            <Smartphone size={16} /> La app
          </Link>
          <Link href="/panel">
            <LayoutDashboard size={16} /> Administración
          </Link>
        </nav>
      </header>

      {escritorio && (
        <aside className="exp-info">
          <h1>Quien quiere reformar su casa y el arquitecto de su barrio, en la misma maqueta.</h1>
          <p className="exp-bajada">El cliente sube fotos de lo que quiere cambiar. Los arquitectos que cubren esa zona mandan su propuesta con imágenes. El cliente compara, conversa y elige.</p>

          <div className="rol-card">
            <small>Ver la app como</small>
            <SelectorRol />
            <p>{rol === "cliente" ? "Mariana vive en Coyoacán y quiere abrir su cocina al comedor." : "Daniela tiene un taller en Coyoacán y está probando el plan Profesional."}</p>
          </div>

          <div className="contexto-card" key={`${rol}-${focoPedido ?? "general"}`}>
            {rol === "cliente" && pedidoFoco ? (
              <>
                <small>Pedido en la maqueta</small>
                <strong>{pedidoFoco.titulo}</strong>
                <p>
                  <BellRing size={14} /> {plural(avisados, "arquitecto avisado", "arquitectos avisados")} · {plural(cuenta.get(pedidoFoco.id) ?? 0, "propuesta", "propuestas")}
                </p>
              </>
            ) : rol === "cliente" ? (
              <>
                <small>{zonaCasa?.nombre ?? "Tu barrio"} hoy</small>
                <strong>{listo ? `${cubrenCasa} arquitectos cubren el barrio` : "..."}</strong>
                <p>La casa con techo de barro es la de Mariana. Cada punto azul es un estudio que recibe sus pedidos.</p>
                {miCocina && (
                  <button
                    className="link"
                    onClick={() => {
                      irCliente("pedidos");
                      abrirPedido(miCocina.id);
                    }}
                  >
                    Ver su pedido de la cocina <ArrowRight size={14} />
                  </button>
                )}
              </>
            ) : (
              <>
                <small>Tus zonas hoy</small>
                <strong>{listo ? `${plural(enMisZonas.length, "pedido abierto", "pedidos abiertos")}, ${sinNada} sin ninguna propuesta` : "..."}</strong>
                {a?.estadoPlan === "prueba" && a.pruebaHasta && plan && (
                  <p>
                    <Gift size={14} /> Prueba del plan {plan.nombre}: quedan {diasHasta(a.pruebaHasta, ahora)} días antes del primer cobro
                  </p>
                )}
                <button className="link" onClick={() => irArq("pedidos")}>
                  Ver pedidos de Coyoacán y Del Valle <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>

          <div className="leyenda">
            <span>
              <i className="ley-azul" /> Estudio de arquitectura
            </span>
            <span>
              <i className="ley-barro" /> Pedido de un cliente
            </span>
            <span>
              <i className="ley-ambar" /> Pedido sin respuesta en 24 h
            </span>
            <span>
              <i className="ley-gris" /> Zona por abrir
            </span>
          </div>
        </aside>
      )}

      <div className="exp-telefono">
        {!escritorio && <SelectorRol />}
        <div className="telefono">
          <TrazoApp marco />
        </div>
      </div>

      <footer className="exp-pie">
        <span>© 2026 Trazo · Arquitectos de tu barrio</span>
        <span>Fotos: Unsplash</span>
      </footer>
      <Toasts />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Activity, AlarmClock, BadgeCheck, CheckCheck, Clock3, Gift, Inbox, Phone, PhoneCall, TrendingUp, Users, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { DIA, ESPECIALIDADES, fechaCorta, hace, horasDesde, usd } from "@/lib/format";
import { ciudadDe } from "@/lib/mock/ciudades";
import { usePropuestasPorPedido, useSinRespuesta } from "@/lib/vista";
import { Avatar, Cargando, Foto, Modal, Skel, Tilt, Vacio } from "@/components/ui";

export default function Resumen() {
  const { listo, pedidos, propuestas, arquitectos, zonas, clientes, ciudadPanel, planes, actividad, ahora, marcarContactado, enfocar, toast } = useStore();
  const ciudad = ciudadDe(ciudadPanel);
  const zonasCiudad = useMemo(() => new Set(zonas.filter((z) => z.ciudadId === ciudadPanel).map((z) => z.id)), [zonas, ciudadPanel]);
  const cuenta = usePropuestasPorPedido();
  const sinRespuesta = useSinRespuesta().filter((p) => zonasCiudad.has(p.zonaId));
  const [llamar, setLlamar] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const deCiudad = pedidos.filter((p) => zonasCiudad.has(p.zonaId));
  const abiertos = deCiudad.filter((p) => p.estado === "abierto");
  const arqs = arquitectos.filter((a) => a.ciudadId === ciudadPanel);
  const pagando = arqs.filter((a) => a.estadoPlan === "activo");
  const enPrueba = arqs.filter((a) => a.estadoPlan === "prueba");
  const ingreso = pagando.reduce((s, a) => s + (planes.find((p) => p.id === a.plan)?.precioUsd ?? 0), 0);

  const mediana = useMemo(() => {
    const horas: number[] = [];
    deCiudad.forEach((p) => {
      const ps = propuestas.filter((x) => x.pedidoId === p.id);
      if (!ps.length) return;
      const primera = Math.min(...ps.map((x) => new Date(x.enviada).getTime()));
      horas.push((primera - new Date(p.creado).getTime()) / 3600_000);
    });
    horas.sort((a, b) => a - b);
    return horas.length ? horas[Math.floor(horas.length / 2)] : null;
  }, [deCiudad, propuestas]);

  const porDia = useMemo(() => {
    const dias: { d: Date; n: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(ahora.getTime() - i * DIA);
      d.setHours(0, 0, 0, 0);
      dias.push({ d, n: 0 });
    }
    propuestas.forEach((x) => {
      const p = pedidos.find((y) => y.id === x.pedidoId);
      if (!p || !zonasCiudad.has(p.zonaId)) return;
      const t = new Date(x.enviada);
      t.setHours(0, 0, 0, 0);
      const f = dias.find((d) => d.d.getTime() === t.getTime());
      if (f) f.n++;
    });
    return dias;
  }, [propuestas, pedidos, zonasCiudad, ahora]);
  const maxDia = Math.max(1, ...porDia.map((d) => d.n));

  const pruebas = enPrueba.filter((a) => a.pruebaHasta).sort((a, b) => new Date(a.pruebaHasta!).getTime() - new Date(b.pruebaHasta!).getTime());
  const pedidoLlamar = pedidos.find((p) => p.id === llamar);
  const candidatos = pedidoLlamar
    ? arquitectos
        .filter((a) => a.zonas.includes(pedidoLlamar.zonaId) && !a.suspendido && a.estadoPlan !== "cancelado")
        .sort((a, b) => Number(b.especialidades.includes(pedidoLlamar.tipo)) - Number(a.especialidades.includes(pedidoLlamar.tipo)) || a.respondeHoras - b.respondeHoras)
    : [];

  const ordenados = [...sinRespuesta].sort((a, b) => Number(a.contactado) - Number(b.contactado));

  return (
    <div className="pn-pagina">
      <div className="pn-titulo">
        <h1>{ciudad.nombre}</h1>
        <p className="muted">
          {listo ? `${zonas.filter((z) => z.ciudadId === ciudadPanel && z.estado === "abierta").length} zonas abiertas de ${zonasCiudad.size}` : "Cargando..."}
        </p>
      </div>

      <div className="kpis">
        {[
          { ic: Inbox, t: "Pedidos abiertos", v: abiertos.length, s: `${deCiudad.length} en total` },
          { ic: AlarmClock, t: "Sin propuesta en 24 h", v: sinRespuesta.length, s: sinRespuesta.length ? "Alguien tiene que llamar hoy" : "Todo con respuesta", alerta: sinRespuesta.length > 0 },
          { ic: Clock3, t: "Hasta la primera propuesta", v: mediana === null ? "Sin datos" : `${mediana < 1 ? "<1" : Math.round(mediana)} h`, s: "Mediana de la ciudad" },
          { ic: Users, t: "Arquitectos", v: arqs.length, s: `${pagando.length} pagando, ${enPrueba.length} en prueba` },
          { ic: Wallet, t: "Suscripciones al mes", v: usd(ingreso), s: "Antes de la comisión de las tiendas" },
        ].map((k, i) => {
          const Ic = k.ic;
          return (
            <Tilt key={k.t} className={`kpi ${k.alerta ? "alerta" : ""}`}>
              <div style={{ animationDelay: `${i * 60}ms` }}>
                <span className="kpi-ic">
                  <Ic size={18} />
                </span>
                {listo ? <strong>{k.v}</strong> : <Skel h={30} w={70} />}
                <span>{k.t}</span>
                <small>{k.s}</small>
              </div>
            </Tilt>
          );
        })}
      </div>

      <div className="pn-grid">
        <section className="pn-card pn-card-ancha sin-respuesta">
          <div className="pn-card-cab">
            <h2>
              <AlarmClock size={18} /> Pedidos sin ninguna propuesta hace más de 24 h
            </h2>
            <span className="badge aviso">{sinRespuesta.filter((p) => !p.contactado).length} por llamar</span>
          </div>
          <p className="muted chico">Un cliente que espera días sin respuesta no vuelve. Esta lista dice a qué arquitecto llamar esta mañana.</p>
          {!listo ? (
            <Skel h={70} r={14} />
          ) : ordenados.length === 0 ? (
            <Vacio icono={<CheckCheck size={24} />} titulo="Todo con respuesta" texto={`Ningún pedido de ${ciudad.nombre} lleva un día sin propuestas.`} />
          ) : (
            <div className="sr-lista">
              {ordenados.map((p) => {
                const z = zonas.find((x) => x.id === p.zonaId);
                const c = clientes.find((x) => x.id === p.clienteId);
                const h = Math.round(horasDesde(p.creado, ahora));
                return (
                  <div key={p.id} className={`sr-fila aparece ${p.contactado ? "hecho" : ""}`} onMouseEnter={() => enfocar({ tipo: "pedido", id: p.id })} onMouseLeave={() => enfocar(null)}>
                    <Foto k={p.fotos[0]} w={110} h={110} alt={p.titulo} className="pn-mini" />
                    <span className="sr-txt">
                      <strong>{p.titulo}</strong>
                      <small>
                        {z?.nombre} · {ESPECIALIDADES[p.tipo].corto} · {c?.nombre}
                      </small>
                    </span>
                    <span className={`sr-horas ${h >= 48 ? "rojo" : ""}`}>{h} h</span>
                    <span className="sr-acc">
                      {p.contactado ? (
                        <span className="badge ok">
                          <BadgeCheck size={13} /> Contactado
                        </span>
                      ) : (
                        <>
                          <button className="btn btn-pri chico" onClick={() => setLlamar(p.id)}>
                            <PhoneCall size={15} /> A quién llamar
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="pn-card">
          <div className="pn-card-cab">
            <h2>
              <TrendingUp size={18} /> Propuestas por día
            </h2>
            <small className="muted">Últimas 2 semanas</small>
          </div>
          <div className="barras" role="img" aria-label="Propuestas enviadas por día">
            {porDia.map((d, i) => (
              <span key={i} className="barra-dia" title={`${fechaCorta(d.d.toISOString())}: ${d.n}`}>
                <i style={{ height: `${(d.n / maxDia) * 100}%`, animationDelay: `${i * 35}ms` }} />
                <small>{d.d.getDate()}</small>
              </span>
            ))}
          </div>
        </section>

        <section className="pn-card">
          <div className="pn-card-cab">
            <h2>
              <Gift size={18} /> Pruebas que terminan pronto
            </h2>
          </div>
          {!listo ? (
            <Skel h={80} r={12} />
          ) : pruebas.length === 0 ? (
            <p className="muted chico">Nadie está en prueba en {ciudad.nombre}.</p>
          ) : (
            <ul className="pn-lista">
              {pruebas.slice(0, 5).map((a) => {
                const enviadas = propuestas.filter((x) => x.arquitectoId === a.id).length;
                const zonasAbiertas = a.zonas.filter((z) => zonas.find((x) => x.id === z)?.estado === "abierta").length;
                const vio = pedidos.filter((p) => a.zonas.includes(p.zonaId) && p.estado !== "espera").length;
                const dias = Math.max(0, Math.ceil((new Date(a.pruebaHasta!).getTime() - ahora.getTime()) / DIA));
                return (
                  <li key={a.id}>
                    <Avatar k={a.foto} nombre={a.nombre} size={34} />
                    <span>
                      <strong>{a.nombre}</strong>
                      <small>{zonasAbiertas === 0 ? "Sus zonas todavía no abren: no vio ningún pedido" : `Vio ${vio} pedidos y envió ${enviadas} propuestas`}</small>
                    </span>
                    <span className={`badge ${dias <= 7 ? "aviso" : "info"}`}>{dias} días</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="pn-card">
          <div className="pn-card-cab">
            <h2>
              <Activity size={18} /> Actividad
            </h2>
          </div>
          <ul className="actividad">
            {actividad.slice(0, 7).map((a) => (
              <li key={a.id} className="aparece">
                <i className={`act-punto ${a.tipo}`} />
                <span>
                  {a.texto}
                  <small>{hace(a.en, ahora)}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Modal
        abierto={!!pedidoLlamar}
        titulo={pedidoLlamar ? `A quién llamar por "${pedidoLlamar.titulo}"` : ""}
        onClose={() => setLlamar(null)}
        ancho={520}
        pie={
          <>
            <button className="btn btn-sec" onClick={() => setLlamar(null)}>
              Cerrar
            </button>
            <button
              className="btn btn-pri"
              disabled={ocupado === "marcar"}
              onClick={async () => {
                if (!pedidoLlamar) return;
                setOcupado("marcar");
                await marcarContactado(pedidoLlamar.id);
                setOcupado(null);
                setLlamar(null);
              }}
            >
              {ocupado === "marcar" ? <Cargando texto="Guardando" /> : "Ya llamé, marcar contactado"}
            </button>
          </>
        }
      >
        <p className="muted chico">Primero los que hacen {pedidoLlamar ? ESPECIALIDADES[pedidoLlamar.tipo].nombre.toLowerCase() : ""} y responden más rápido. Hay {cuenta.get(pedidoLlamar?.id ?? "") ?? 0} propuestas hasta ahora.</p>
        <ul className="pn-lista">
          {candidatos.map((a) => (
            <li key={a.id}>
              <Avatar k={a.foto} nombre={a.nombre} size={36} />
              <span>
                <strong>
                  {a.nombre} · {a.estudio}
                </strong>
                <small>
                  {a.especialidades.map((e) => ESPECIALIDADES[e].corto).join(", ")} · responde en {Math.round(a.respondeHoras) || 1} h
                </small>
              </span>
              <a className="btn btn-sec chico" href={`tel:${a.telefono.replace(/\s/g, "")}`} onClick={(e) => { e.preventDefault(); toast(`Llamando a ${a.nombre}: ${a.telefono}`, "info"); }}>
                <Phone size={14} /> {a.telefono}
              </a>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

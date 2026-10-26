"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CalendarClock, Check, Clock3, Crown, FileText, Gift, Inbox, MapPin, MessageCircle, Plus, ScanFace, Search, Sparkles, TriangleAlert, Undo2, X } from "lucide-react";
import { ErrorValidacion, useStore } from "@/lib/store";
import { ESPECIALIDADES, ESTADO_PLAN, ESTADO_PROPUESTA, INICIOS, LISTA_ESPECIALIDADES, PRESUPUESTOS, diasHasta, fecha, hace, norm, plata, rangoPlata, usd } from "@/lib/format";
import { ARQUITECTO_ACTUAL, honorarioSugerido } from "@/lib/mock/pedidos";
import { ciudadDe } from "@/lib/mock/ciudades";
import { todosLosProyectos } from "@/lib/photos";
import { useDatosMaqueta, usePropuestasPorPedido, useZona } from "@/lib/vista";
import type { Especialidad, EstadoPropuesta, PlanId } from "@/lib/types";
import { Avatar, Cargando, Foto, Modal, Nota, Skel, Switch, Tilt, Vacio } from "../ui";
import { Anuncio, Hoja } from "./comunes";
import { Maqueta } from "../three/Scenes";

function BannerPlan({ compacto = false }: { compacto?: boolean }) {
  const { yo, planes, ahora, irArq } = useStore();
  const a = yo.arquitecto;
  if (!a) return null;
  const plan = planes.find((p) => p.id === a.plan)!;
  if (a.estadoPlan === "prueba" && a.pruebaHasta) {
    const quedan = diasHasta(a.pruebaHasta, ahora);
    const usados = Math.max(0, plan.pruebaDias - quedan);
    return (
      <div className="banner-prueba aparece">
        <span className="bp-ic">
          <Gift size={18} />
        </span>
        <div>
          <strong>
            Prueba gratis del plan {plan.nombre}: te {quedan === 1 ? "queda 1 día" : `quedan ${quedan} días`}
          </strong>
          {!compacto && <p>Ves pedidos reales de tus zonas antes del primer cobro, el {fecha(a.pruebaHasta)}.</p>}
          <span className="barra">
            <i style={{ width: `${(usados / Math.max(1, plan.pruebaDias)) * 100}%` }} />
          </span>
        </div>
        {!compacto && (
          <button className="link" onClick={() => irArq("plan")}>
            Planes
          </button>
        )}
      </div>
    );
  }
  if (a.estadoPlan === "cancelado" || a.estadoPlan === "vencido") {
    return (
      <div className="banner-prueba off aparece">
        <span className="bp-ic">
          <TriangleAlert size={18} />
        </span>
        <div>
          <strong>{a.estadoPlan === "vencido" ? "Tu tienda no pudo cobrar el plan" : "Tu plan está cancelado"}</strong>
          <p>Sigues viendo pedidos, pero no puedes enviar propuestas hasta reactivarlo.</p>
        </div>
        <button className="link" onClick={() => irArq("plan")}>
          Reactivar
        </button>
      </div>
    );
  }
  return null;
}

/* ---------------- pedidos de mis zonas ---------------- */

export function PedidosZona({ marco }: { marco: boolean }) {
  const { listo, yo, pedidos, propuestas, zonas, abrirPedido, ahora, planes, propuestasUsadasMes, rol, foco } = useStore();
  const cuenta = usePropuestasPorPedido();
  const a = yo.arquitecto;
  const [zona, setZona] = useState<string>("todas");
  const [tipo, setTipo] = useState<Especialidad | "todos">("todos");
  const [soloSin, setSoloSin] = useState(false);
  const [orden, setOrden] = useState<"recientes" | "menos">("recientes");
  const [q, setQ] = useState("");
  const maqueta = useDatosMaqueta("cdmx");
  const plan = a ? planes.find((p) => p.id === a.plan) : null;
  const enviadas = useMemo(() => new Set(propuestas.filter((p) => p.arquitectoId === ARQUITECTO_ACTUAL && p.estado !== "retirada").map((p) => p.pedidoId)), [propuestas]);

  const lista = useMemo(() => {
    if (!a) return [];
    const t = norm(q);
    const l = pedidos
      .filter((p) => p.estado === "abierto" && a.zonas.includes(p.zonaId))
      .filter((p) => (zona === "todas" ? true : p.zonaId === zona))
      .filter((p) => (tipo === "todos" ? true : p.tipo === tipo))
      .filter((p) => (soloSin ? !cuenta.get(p.id) : true))
      .filter((p) => (t ? norm(`${p.titulo} ${p.descripcion}`).includes(t) : true));
    l.sort((x, y) => (orden === "recientes" ? new Date(y.creado).getTime() - new Date(x.creado).getTime() : (cuenta.get(x.id) ?? 0) - (cuenta.get(y.id) ?? 0)));
    return l;
  }, [a, pedidos, zona, tipo, soloSin, orden, q, cuenta]);

  return (
    <div className="seccion">
      {!marco && (
        <div className="hero-3d">
          <Maqueta modo="hero" {...maqueta} casaPropia={null} rol={rol} focoPedido={foco?.tipo === "pedido" ? foco.id : null} fotos={[]} />
          <div className="hero-3d-txt">
            <small>Tus zonas</small>
            <strong>{a ? a.zonas.map((z) => zonas.find((x) => x.id === z)?.nombre).join(" y ") : "..."}</strong>
          </div>
        </div>
      )}
      {listo ? <BannerPlan /> : <Skel h={86} r={16} />}
      <div className="seccion-cab fila">
        <div>
          <h2>Pedidos en tus zonas</h2>
          <p className="muted chico">{listo && plan ? `Propuestas este mes: ${propuestasUsadasMes} de ${plan.propuestasMes >= 999 ? "sin límite" : plan.propuestasMes}` : " "}</p>
        </div>
        <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} aria-label="Ordenar">
          <option value="recientes">Más recientes</option>
          <option value="menos">Menos propuestas</option>
        </select>
      </div>
      <label className="buscar">
        <Search size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en los pedidos" />
      </label>
      <div className="chips">
        <button className={`chip ${zona === "todas" ? "on" : ""}`} onClick={() => setZona("todas")}>
          Todas mis zonas
        </button>
        {a?.zonas.map((z) => (
          <button key={z} className={`chip ${zona === z ? "on" : ""}`} onClick={() => setZona(z)}>
            {zonas.find((x) => x.id === z)?.nombre}
          </button>
        ))}
        <button className={`chip chip-sutil ${soloSin ? "on" : ""}`} onClick={() => setSoloSin((v) => !v)}>
          Sin propuestas todavía
        </button>
      </div>
      <div className="chips">
        <button className={`chip ${tipo === "todos" ? "on" : ""}`} onClick={() => setTipo("todos")}>
          Todo tipo
        </button>
        {LISTA_ESPECIALIDADES.map((e) => (
          <button key={e} className={`chip ${tipo === e ? "on" : ""}`} onClick={() => setTipo(e)}>
            {ESPECIALIDADES[e].corto}
          </button>
        ))}
      </div>
      <div className="lista-pedidos">
        {!listo ? (
          [0, 1, 2].map((i) => <Skel key={i} h={110} r={16} />)
        ) : lista.length === 0 ? (
          <Vacio icono={<Inbox size={26} />} titulo="No hay pedidos con ese filtro" texto="Los pedidos nuevos de tus zonas aparecen aquí apenas se publican." />
        ) : (
          lista.map((p, i) => {
            const n = cuenta.get(p.id) ?? 0;
            const ya = enviadas.has(p.id);
            return (
              <div key={p.id}>
                <Tilt as="button" className="pedido-card aparece-abajo" onClick={() => abrirPedido(p.id)}>
                  <span className="pedido-foto" style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}>
                    <Foto k={p.fotos[0]} w={220} h={220} alt={p.titulo} />
                  </span>
                  <span className="pedido-txt">
                    {ya ? <span className="badge ok">Ya enviaste propuesta</span> : n === 0 ? <span className="badge aviso">Sé la primera propuesta</span> : <span className="badge gris">{n} {n === 1 ? "propuesta" : "propuestas"}</span>}
                    <strong>{p.titulo}</strong>
                    <small>
                      <MapPin size={11} /> {zonas.find((z) => z.id === p.zonaId)?.nombre} · {ESPECIALIDADES[p.tipo].corto} · {hace(p.creado, ahora)}
                    </small>
                    <em>{p.descripcion}</em>
                  </span>
                </Tilt>
                {i === 1 && <Anuncio espacio="pedidos-arquitecto" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function DetallePedidoArq() {
  const { pedidoSel, abrirPedido, pedidos, propuestas, clientes, zonas, rol, yo, enviarPropuesta, retirarPropuesta, conversacionCon, abrirConversacion, ahora, toast } = useStore();
  const cuenta = usePropuestasPorPedido();
  const p = pedidos.find((x) => x.id === pedidoSel);
  const a = yo.arquitecto;
  const zona = useZona(p?.zonaId);
  const ciudad = ciudadDe(zona?.ciudadId ?? "cdmx");
  const mia = propuestas.find((x) => x.pedidoId === pedidoSel && x.arquitectoId === ARQUITECTO_ACTUAL && x.estado !== "retirada");
  const sugerido = useMemo(() => (p ? honorarioSugerido(p.tipo, zona?.ciudadId ?? "cdmx", () => 0.4) : { min: 0, max: 0 }), [p, zona?.ciudadId]);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [semanas, setSemanas] = useState("4");
  const [mensaje, setMensaje] = useState("");
  const [imgs, setImgs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [fotoN, setFotoN] = useState(0);

  useEffect(() => {
    setMin(String(sugerido.min || ""));
    setMax(String(sugerido.max || ""));
    setMensaje("");
    setImgs([]);
    setError("");
    setFotoN(0);
  }, [pedidoSel, sugerido.min, sugerido.max]);

  if (!p || rol !== "arquitecto" || !a) return null;
  const cliente = clientes.find((c) => c.id === p.clienteId);
  const n = cuenta.get(p.id) ?? 0;

  const enviar = async () => {
    setError("");
    setEnviando(true);
    try {
      await enviarPropuesta(p.id, { honorarioMin: Number(min), honorarioMax: Number(max), plazoSemanas: Number(semanas), mensaje, imagenes: imgs.length ? imgs : a.portafolio.slice(0, 2).map((t) => t.foto) });
    } catch (e) {
      if (e instanceof ErrorValidacion) setError(e.message);
      else toast("No se pudo enviar. Intenta otra vez.", "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Hoja abierta onClose={() => abrirPedido(null)} clase="hoja-ficha" titulo={p.titulo}>
      <div className="galeria">
        <div className="galeria-pista" onScroll={(ev) => setFotoN(Math.round(ev.currentTarget.scrollLeft / Math.max(1, ev.currentTarget.clientWidth)))}>
          {p.fotos.map((f, i) => (
            <Foto key={i} k={f} w={760} h={460} alt={`Foto ${i + 1} de ${p.titulo}`} eager={i === 0} />
          ))}
        </div>
        {p.fotos.length > 1 && (
          <div className="galeria-puntos">
            {p.fotos.map((_, i) => (
              <i key={i} className={i === fotoN ? "on" : ""} />
            ))}
          </div>
        )}
        <button className="icon-btn flotante" onClick={() => abrirPedido(null)} aria-label="Cerrar">
          <X size={18} />
        </button>
      </div>
      <div className="ficha-cuerpo">
        <div className="ficha-cab">
          <span className={`badge ${n === 0 ? "aviso" : "gris"}`}>{n === 0 ? "Todavía sin propuestas" : `${n} ${n === 1 ? "propuesta" : "propuestas"} hasta ahora`}</span>
          <h2>{p.titulo}</h2>
          <div className="ficha-meta">
            <span>
              <MapPin size={13} /> {zona?.nombre}
            </span>
            <span>{ESPECIALIDADES[p.tipo].nombre}</span>
            {p.metros && <span>{p.metros} m²</span>}
            <span>{hace(p.creado, ahora)}</span>
          </div>
        </div>
        <div className="cliente-linea">
          <Avatar k={cliente?.foto ?? ""} nombre={cliente?.nombre ?? ""} size={36} />
          <span>
            <strong>{cliente?.nombre.split(" ")[0]}</strong>
            <small>
              {PRESUPUESTOS[p.presupuesto]} · {INICIOS[p.inicio]}
            </small>
          </span>
          <button
            className="btn btn-sec chico"
            onClick={() => {
              const id = conversacionCon(p.id, a.id);
              abrirConversacion(id);
            }}
          >
            <MessageCircle size={15} /> Preguntar
          </button>
        </div>
        <p className="ficha-bio">{p.descripcion}</p>

        {mia ? (
          <div className="mi-propuesta">
            <div className="fila-sb">
              <strong>Tu propuesta</strong>
              <span className={`badge ${ESTADO_PROPUESTA[mia.estado].clase}`}>{ESTADO_PROPUESTA[mia.estado].texto}</span>
            </div>
            <p>
              {rangoPlata(mia.honorarioMin, mia.honorarioMax, ciudad)} · {mia.plazoSemanas} semanas · enviada {hace(mia.enviada, ahora)}
            </p>
            <p className="muted">{mia.mensaje}</p>
            {(mia.estado === "enviada" || mia.estado === "vista") && (
              <button className="btn btn-sec chico" onClick={() => retirarPropuesta(mia.id)}>
                <Undo2 size={15} /> Retirar propuesta
              </button>
            )}
          </div>
        ) : (
          <div className="form-propuesta">
            <h3 className="sub">Tu propuesta</h3>
            <div className="form-fila">
              <label className="campo">
                <span>Honorario mínimo ({ciudad.moneda})</span>
                <input type="number" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
              </label>
              <label className="campo">
                <span>Honorario máximo ({ciudad.moneda})</span>
                <input type="number" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} />
              </label>
            </div>
            <small className="muted">
              En {zona?.nombre} los proyectos de {ESPECIALIDADES[p.tipo].nombre.toLowerCase()} suelen ir de {rangoPlata(sugerido.min, sugerido.max, ciudad)}.
            </small>
            <label className="campo">
              <span>Semanas hasta entregar el proyecto</span>
              <input type="number" inputMode="numeric" value={semanas} onChange={(e) => setSemanas(e.target.value)} min={1} max={52} />
            </label>
            <label className="campo">
              <span>Cómo encararías esta obra</span>
              <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={4} placeholder="Cuéntale qué harías primero y por qué, mirando sus fotos." />
              <small className={mensaje.trim().length >= 40 ? "ok-txt" : "muted"}>{mensaje.trim().length} de 40 caracteres mínimos</small>
            </label>
            <div className="campo">
              <span>Imágenes de referencia ({imgs.length} de 4)</span>
              <div className="galeria-cliente">
                {a.portafolio.map((t) => {
                  const on = imgs.includes(t.foto);
                  return (
                    <button key={t.id} className={`foto-op ${on ? "on" : ""}`} onClick={() => setImgs((x) => (on ? x.filter((y) => y !== t.foto) : x.length >= 4 ? x : [...x, t.foto]))} aria-pressed={on} title={t.titulo}>
                      <Foto k={t.foto} w={160} h={160} alt={t.titulo} />
                      {on && (
                        <i>
                          <Check size={12} />
                        </i>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {error && (
              <p className="error-txt" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-pri ancho" onClick={enviar} disabled={enviando}>
              {enviando ? <Cargando texto="Enviando" /> : "Enviar propuesta"}
            </button>
          </div>
        )}
      </div>
    </Hoja>
  );
}

/* ---------------- mis propuestas ---------------- */

export function MisPropuestas() {
  const { propuestas, pedidos, zonas, listo, abrirPedido, ahora } = useStore();
  const [filtro, setFiltro] = useState<EstadoPropuesta | "todas">("todas");
  const mias = propuestas.filter((p) => p.arquitectoId === ARQUITECTO_ACTUAL).sort((a, b) => new Date(b.enviada).getTime() - new Date(a.enviada).getTime());
  const lista = mias.filter((p) => (filtro === "todas" ? true : p.estado === filtro));
  const elegidas = mias.filter((p) => p.estado === "elegida").length;
  const decididas = mias.filter((p) => p.estado === "elegida" || p.estado === "descartada").length;
  const estados: (EstadoPropuesta | "todas")[] = ["todas", "enviada", "vista", "elegida", "descartada", "retirada"];
  return (
    <div className="seccion">
      <div className="seccion-cab">
        <h2>Mis propuestas</h2>
        <p className="muted chico">{listo ? `Te eligieron en ${elegidas} de ${decididas} pedidos ya decididos` : " "}</p>
      </div>
      <div className="chips">
        {estados.map((e) => {
          const n = e === "todas" ? mias.length : mias.filter((p) => p.estado === e).length;
          return (
            <button key={e} className={`chip ${filtro === e ? "on" : ""}`} onClick={() => setFiltro(e)}>
              {e === "todas" ? "Todas" : ESTADO_PROPUESTA[e].texto} <small>{n}</small>
            </button>
          );
        })}
      </div>
      {!listo ? (
        <Skel h={90} r={16} />
      ) : lista.length === 0 ? (
        <Vacio icono={<FileText size={26} />} titulo="Nada por aquí" texto="Las propuestas que envíes aparecen en esta lista con su estado." />
      ) : (
        <div className="lista-prop">
          {lista.map((pr, i) => {
            const p = pedidos.find((x) => x.id === pr.pedidoId);
            const z = zonas.find((x) => x.id === p?.zonaId);
            const c = ciudadDe(z?.ciudadId ?? "cdmx");
            const e = ESTADO_PROPUESTA[pr.estado];
            return (
              <button key={pr.id} className="prop-fila aparece-abajo" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }} onClick={() => p && abrirPedido(p.id)} disabled={!p}>
                <Foto k={p?.fotos[0] ?? "base"} w={120} h={120} alt={p?.titulo ?? ""} />
                <span>
                  <strong>{p?.titulo ?? "Pedido eliminado"}</strong>
                  <small>
                    {z?.nombre} · {rangoPlata(pr.honorarioMin, pr.honorarioMax, c)}
                  </small>
                  <small>Enviada {hace(pr.enviada, ahora)}</small>
                </span>
                <span className={`badge ${e.clase}`}>{e.texto}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- plan ---------------- */

export function PlanArq() {
  const { yo, planes, cambiarPlan, cancelarPrueba, propuestasUsadasMes, ahora, listo } = useStore();
  const a = yo.arquitecto;
  const [elegir, setElegir] = useState<PlanId | null>(null);
  const [cancelar, setCancelar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  if (!listo || !a) return <div className="seccion"><Skel h={160} r={18} /></div>;
  const actual = planes.find((p) => p.id === a.plan)!;
  const est = ESTADO_PLAN[a.estadoPlan];
  const planElegir = planes.find((p) => p.id === elegir);
  const inactivo = a.estadoPlan === "cancelado" || a.estadoPlan === "vencido";
  return (
    <div className="seccion">
      <div className="seccion-cab">
        <h2>Tu plan</h2>
      </div>
      <div className="plan-actual">
        <div className="fila-sb">
          <span>
            <small>Plan actual</small>
            <strong>{actual.nombre}</strong>
          </span>
          <span className={`badge ${est.clase}`}>{est.texto}</span>
        </div>
        {a.estadoPlan === "prueba" && a.pruebaHasta && (
          <p className="plan-nota">
            <CalendarClock size={14} /> Primer cobro el {fecha(a.pruebaHasta)}, en {diasHasta(a.pruebaHasta, ahora)} días. Hasta entonces no pagas nada.
          </p>
        )}
        <div className="uso">
          <span>
            Zonas <b>{a.zonas.length} de {actual.zonasMax}</b>
          </span>
          <span className="barra">
            <i style={{ width: `${(a.zonas.length / actual.zonasMax) * 100}%` }} />
          </span>
          <span>
            Propuestas este mes <b>{propuestasUsadasMes} de {actual.propuestasMes >= 999 ? "sin límite" : actual.propuestasMes}</b>
          </span>
          <span className="barra">
            <i style={{ width: `${actual.propuestasMes >= 999 ? 8 : Math.min(100, (propuestasUsadasMes / actual.propuestasMes) * 100)}%` }} />
          </span>
        </div>
        {a.estadoPlan === "prueba" && (
          <button className="link peligro-link" onClick={() => setCancelar(true)}>
            Cancelar la prueba
          </button>
        )}
      </div>

      <div className="planes">
        {planes.map((p, i) => {
          const es = p.id === a.plan;
          return (
            <Tilt key={p.id} className={`plan-card aparece-abajo ${es ? "actual" : ""} ${p.destacado ? "destacado" : ""}`}>
              <div style={{ animationDelay: `${i * 70}ms` }}>
                <div className="fila-sb">
                  <strong>{p.nombre}</strong>
                  {p.destacado && (
                    <span className="badge info">
                      <Crown size={12} /> Destacado
                    </span>
                  )}
                </div>
                <p className="plan-precio">
                  {usd(p.precioUsd)}
                  <small> al mes</small>
                </p>
                <p className="muted chico">{p.bajada}</p>
                <ul className="plan-lista">
                  <li>
                    <Check size={14} /> {p.zonasMax} {p.zonasMax === 1 ? "zona" : "zonas"} de cobertura
                  </li>
                  <li>
                    <Check size={14} /> {p.propuestasMes >= 999 ? "Propuestas sin límite" : `${p.propuestasMes} propuestas al mes`}
                  </li>
                  <li>
                    <Check size={14} /> {p.pruebaDias} días de prueba sin cobro
                  </li>
                  {p.destacado && (
                    <li>
                      <Sparkles size={14} /> Primero en la lista de tu barrio
                    </li>
                  )}
                </ul>
                <button className={`btn ${es && !inactivo ? "btn-sec" : "btn-pri"} ancho chico`} disabled={es && !inactivo} onClick={() => setElegir(p.id)}>
                  {es && !inactivo ? "Tu plan" : es ? "Reactivar" : "Cambiar a este"}
                </button>
              </div>
            </Tilt>
          );
        })}
      </div>
      <p className="muted chico">La suscripción se paga dentro de la app con la cuenta de la tienda de tu celular.</p>

      <Modal
        abierto={!!planElegir}
        titulo={`Plan ${planElegir?.nombre ?? ""}`}
        onClose={() => setElegir(null)}
        ancho={420}
        pie={
          <>
            <button className="btn btn-sec" onClick={() => setElegir(null)}>
              Volver
            </button>
            <button
              className="btn btn-pri"
              disabled={ocupado}
              onClick={async () => {
                if (!elegir) return;
                setOcupado(true);
                if (inactivo && elegir === a.plan) {
                  await cambiarPlan(elegir);
                } else await cambiarPlan(elegir);
                window.dispatchEvent(new CustomEvent("trazo:3d", { detail: { tipo: "plan" } }));
                setOcupado(false);
                setElegir(null);
              }}
            >
              {ocupado ? <Cargando texto="Confirmando con la tienda" /> : "Confirmar suscripción"}
            </button>
          </>
        }
      >
        <div className="tienda-hoja">
          <strong>{planElegir?.nombre} · Trazo para arquitectos</strong>
          <p>{planElegir ? `${usd(planElegir.precioUsd)} al mes, renovación automática` : ""}</p>
          <p className="muted chico">{a.estadoPlan === "prueba" ? "Sigues en tu prueba gratis: el primer cobro mantiene la misma fecha." : "El cambio se aplica hoy y el cobro se ajusta en tu próxima renovación."}</p>
        </div>
      </Modal>
      <Modal
        abierto={cancelar}
        titulo="¿Cancelar la prueba?"
        onClose={() => setCancelar(false)}
        ancho={420}
        pie={
          <>
            <button className="btn btn-sec" onClick={() => setCancelar(false)}>
              Seguir probando
            </button>
            <button
              className="btn btn-peligro"
              disabled={ocupado}
              onClick={async () => {
                setOcupado(true);
                await cancelarPrueba();
                setOcupado(false);
                setCancelar(false);
              }}
            >
              {ocupado ? <Cargando texto="Cancelando" /> : "Cancelar prueba"}
            </button>
          </>
        }
      >
        <p className="muted">No se te cobrará nada. Tus propuestas enviadas siguen visibles para los clientes.</p>
      </Modal>
    </div>
  );
}

/* ---------------- perfil del arquitecto ---------------- */

export function PerfilArq() {
  const { yo, zonas, planes, guardarZonasArq, agregarTrabajo, quitarTrabajo, biometria, alternarBiometria, resenas, listo, toast } = useStore();
  const a = yo.arquitecto;
  const [sel, setSel] = useState<string[] | null>(null);
  const [errorZ, setErrorZ] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [nueva, setNueva] = useState(false);
  const [fotoN, setFotoN] = useState<string | null>(null);
  const [tituloN, setTituloN] = useState("");
  const [tipoN, setTipoN] = useState<Especialidad>("cocina");
  const [errorN, setErrorN] = useState("");
  if (!listo || !a) return <div className="seccion"><Skel h={90} r={16} /></div>;
  const plan = planes.find((p) => p.id === a.plan)!;
  const elegidas = sel ?? a.zonas;
  const cambiado = sel !== null && (sel.length !== a.zonas.length || sel.some((z) => !a.zonas.includes(z)));
  const suyas = resenas.filter((r) => r.arquitectoId === a.id).slice(0, 4);
  const pool = todosLosProyectos();
  return (
    <div className="seccion">
      <div className="perfil-cab">
        <Avatar k={a.foto} nombre={a.nombre} size={72} />
        <div>
          <h2>{a.estudio}</h2>
          <p className="muted">{a.nombre}</p>
          <p className="perfil-linea">
            <Nota v={a.nota} n={a.resenas} />
            {a.verificado ? (
              <span className="verif">
                <BadgeCheck size={14} /> {a.matricula}
              </span>
            ) : (
              <span className="badge aviso">Matrícula en revisión</span>
            )}
          </p>
        </div>
      </div>

      <h3 className="sub">Zonas que cubres</h3>
      <p className="muted chico">
        Tu plan {plan.nombre} cubre hasta {plan.zonasMax} {plan.zonasMax === 1 ? "zona" : "zonas"}. Solo ves pedidos de las zonas elegidas.
      </p>
      <div className="chips-grilla">
        {zonas
          .filter((z) => z.ciudadId === a.ciudadId)
          .map((z) => {
            const on = elegidas.includes(z.id);
            return (
              <button key={z.id} className={`chip ${on ? "on" : ""}`} onClick={() => setSel(on ? elegidas.filter((x) => x !== z.id) : [...elegidas, z.id])}>
                {on && <Check size={13} />} {z.nombre}
                {z.estado === "espera" && <small>por abrir</small>}
              </button>
            );
          })}
      </div>
      {errorZ && <p className="error-txt">{errorZ}</p>}
      {cambiado && (
        <div className="fila-acciones aparece">
          <button className="btn btn-sec chico" onClick={() => { setSel(null); setErrorZ(""); }}>
            Deshacer
          </button>
          <button
            className="btn btn-pri chico"
            disabled={guardando}
            onClick={async () => {
              setErrorZ("");
              setGuardando(true);
              try {
                await guardarZonasArq(elegidas);
                setSel(null);
              } catch (e) {
                if (e instanceof ErrorValidacion) setErrorZ(e.message);
              } finally {
                setGuardando(false);
              }
            }}
          >
            {guardando ? <Cargando texto="Guardando" /> : "Guardar zonas"}
          </button>
        </div>
      )}

      <div className="fila-sb">
        <h3 className="sub">Portafolio</h3>
        <button className="link" onClick={() => setNueva(true)}>
          <Plus size={15} /> Agregar obra
        </button>
      </div>
      <div className="porta-grilla">
        {a.portafolio.map((t) => (
          <div key={t.id} className="porta-item aparece">
            <Foto k={t.foto} w={320} h={240} alt={t.titulo} />
            <span>{t.titulo}</span>
            <button className="porta-quitar" onClick={() => quitarTrabajo(t.id)} aria-label={`Quitar ${t.titulo}`}>
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="ajustes">
        <div className="ajuste">
          <ScanFace size={19} />
          <span>
            <strong>Entrar con Face ID o huella</strong>
            <small>Útil cuando revisas pedidos en obra</small>
          </span>
          <Switch on={biometria.arquitecto} onChange={() => alternarBiometria("arquitecto")} label="Face ID o huella" />
        </div>
        <div className="ajuste">
          <Clock3 size={19} />
          <span>
            <strong>Respondes en unas {Math.round(a.respondeHoras)} h</strong>
            <small>Los clientes lo ven en tu perfil</small>
          </span>
        </div>
      </div>

      <h3 className="sub">Lo que dicen tus clientes</h3>
      <ul className="resenas">
        {suyas.map((r) => (
          <li key={r.id}>
            <Avatar k={r.clienteFoto} nombre={r.cliente} size={34} />
            <div>
              <strong>
                {r.cliente} <Nota v={r.nota} />
              </strong>
              <small>
                {r.obra} · {fecha(r.fecha)}
              </small>
              <p>{r.texto}</p>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        abierto={nueva}
        titulo="Agregar obra al portafolio"
        onClose={() => setNueva(false)}
        pie={
          <>
            <button className="btn btn-sec" onClick={() => setNueva(false)}>
              Cancelar
            </button>
            <button
              className="btn btn-pri"
              disabled={guardando}
              onClick={async () => {
                setErrorN("");
                if (!fotoN) return setErrorN("Elige una foto de la obra.");
                setGuardando(true);
                try {
                  await agregarTrabajo(fotoN, tituloN, tipoN);
                  setNueva(false);
                  setFotoN(null);
                  setTituloN("");
                } catch (e) {
                  if (e instanceof ErrorValidacion) setErrorN(e.message);
                  else toast("No se pudo guardar", "error");
                } finally {
                  setGuardando(false);
                }
              }}
            >
              {guardando ? <Cargando texto="Guardando" /> : "Agregar"}
            </button>
          </>
        }
      >
        <div className="form">
          <label>
            Título
            <input value={tituloN} onChange={(e) => setTituloN(e.target.value)} placeholder="Ej.: Cocina abierta en Coyoacán" />
          </label>
          <label>
            Tipo de obra
            <select value={tipoN} onChange={(e) => setTipoN(e.target.value as Especialidad)}>
              {LISTA_ESPECIALIDADES.map((e) => (
                <option key={e} value={e}>
                  {ESPECIALIDADES[e].nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="form-fotos">
            <span>Foto</span>
            <div className="fotos-grilla">
              {pool.map((k) => (
                <button key={k} className={`foto-op ${fotoN === k ? "on" : ""}`} onClick={() => setFotoN(k)}>
                  <Foto k={k} w={160} h={120} alt="Foto de obra" />
                </button>
              ))}
            </div>
          </div>
          {errorN && <p className="error-txt">{errorN}</p>}
        </div>
      </Modal>
    </div>
  );
}


"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BadgeCheck,
  Bell,
  BrickWall,
  Building2,
  Camera,
  Check,
  Clock3,
  CookingPot,
  Hammer,
  Hourglass,
  HousePlus,
  ImagePlus,
  Inbox,
  KeyRound,
  Mail,
  MapPin,
  MessageCircle,
  ScanFace,
  Search,
  Sofa,
  Star,
  Trees,
  TriangleAlert,
  X,
} from "lucide-react";
import { ErrorValidacion, useStore, type NuevoPedido } from "@/lib/store";
import { ESPECIALIDADES, ESTADO_PEDIDO, INICIOS, LISTA_ESPECIALIDADES, PRESUPUESTOS, fecha, hace, horasDesde, norm, rangoPlata } from "@/lib/format";
import { CLIENTE_ACTUAL } from "@/lib/mock/pedidos";
import { ciudadDe } from "@/lib/mock/ciudades";
import { GALERIA_CLIENTE } from "@/lib/photos";
import { useCiudadDeZona, useDatosMaqueta, usePropuestasPorPedido, useZona } from "@/lib/vista";
import type { Especialidad, Inicio as InicioT, Presupuesto } from "@/lib/types";
import { Avatar, Cargando, Estrellas, Foto, Modal, Nota, Skel, Switch, Tilt, Vacio } from "../ui";
import { Anuncio, Hoja } from "./comunes";
import { Maqueta } from "../three/Scenes";
import { foto } from "@/lib/photos";

export const ICONO_TIPO: Record<Especialidad, typeof CookingPot> = {
  cocina: CookingPot,
  bano: Bath,
  ampliacion: HousePlus,
  remodelacion: Hammer,
  fachada: Building2,
  exterior: Trees,
  interiorismo: Sofa,
  "obra-nueva": BrickWall,
};

/* ---------------- inicio ---------------- */

export function InicioCliente({ marco, alPublicar }: { marco: boolean; alPublicar: (t: Especialidad | null) => void }) {
  const { listo, yo, arquitectos, pedidos, abrirArquitecto, abrirPedido, irCliente, rol, foco } = useStore();
  const zona = useZona(yo.cliente?.zonaId);
  const cuenta = usePropuestasPorPedido();
  const [esp, setEsp] = useState<Especialidad | "todas">("todas");
  const [orden, setOrden] = useState<"nota" | "rapidez" | "resenas">("nota");
  const [q, setQ] = useState("");
  const maqueta = useDatosMaqueta("cdmx");

  const lista = useMemo(() => {
    const t = norm(q);
    const l = arquitectos
      .filter((a) => zona && a.zonas.includes(zona.id) && !a.suspendido && a.estadoPlan !== "cancelado")
      .filter((a) => (esp === "todas" ? true : a.especialidades.includes(esp)))
      .filter((a) => (t ? norm(`${a.nombre} ${a.estudio} ${a.especialidades.join(" ")}`).includes(t) : true));
    l.sort((a, b) => (orden === "nota" ? b.nota - a.nota : orden === "rapidez" ? a.respondeHoras - b.respondeHoras : b.resenas - a.resenas));
    return l;
  }, [arquitectos, zona, esp, orden, q]);

  const activo = pedidos.find((p) => p.clienteId === CLIENTE_ACTUAL && p.estado === "abierto");
  const primero = yo.cliente?.nombre.split(" ")[0] ?? "";

  return (
    <div className="seccion">
      {!marco && (
        <div className="hero-3d">
          <Maqueta modo="hero" {...maqueta} casaPropia={zona?.id ?? null} rol={rol} focoPedido={foco?.tipo === "pedido" ? foco.id : null} fotos={[]} />
          <div className="hero-3d-txt">
            <small>Tu barrio en la app</small>
            <strong>{zona?.nombre ?? "..."}</strong>
          </div>
        </div>
      )}
      <div className="saludo">
        <h2>{listo ? `Hola, ${primero}` : <Skel h={24} w={160} />}</h2>
        <p className="muted">¿Qué quieres cambiar en tu casa?</p>
      </div>
      <div className="tipos-rapidos">
        {(["cocina", "bano", "ampliacion", "exterior"] as Especialidad[]).map((t, i) => {
          const Ic = ICONO_TIPO[t];
          return (
            <Tilt key={t} as="button" className="tipo-rapido aparece-abajo" onClick={() => alPublicar(t)}>
              <span style={{ animationDelay: `${i * 60}ms` }}>
                <Ic size={22} />
              </span>
              {ESPECIALIDADES[t].corto}
            </Tilt>
          );
        })}
      </div>
      <button className="cta-publicar" onClick={() => alPublicar(null)}>
        <span>
          <strong>Publica tu proyecto</strong>
          <small>Sube fotos, cuenta qué quieres y recibe propuestas de arquitectos de {zona?.nombre ?? "tu zona"}</small>
        </span>
        <ArrowRight size={20} />
      </button>

      {listo && activo && (
        <button
          className="pedido-activo aparece"
          onClick={() => {
            irCliente("pedidos");
            abrirPedido(activo.id);
          }}
        >
          <Foto k={activo.fotos[0]} w={120} h={120} alt={activo.titulo} />
          <span>
            <small>Tu pedido en curso</small>
            <strong>{activo.titulo}</strong>
            <em>{cuenta.get(activo.id) ? `${cuenta.get(activo.id)} propuestas para comparar` : "Esperando la primera propuesta"}</em>
          </span>
          <ArrowRight size={18} />
        </button>
      )}

      <div className="seccion-cab fila">
        <div>
          <h3>Arquitectos en {zona?.nombre ?? "tu zona"}</h3>
          <p className="muted chico">{listo ? `${lista.length} cubren tu barrio` : "Buscando..."}</p>
        </div>
        <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} aria-label="Ordenar">
          <option value="nota">Mejor calificados</option>
          <option value="rapidez">Responden más rápido</option>
          <option value="resenas">Más reseñas</option>
        </select>
      </div>
      <label className="buscar">
        <Search size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o estudio" />
        {q && (
          <button onClick={() => setQ("")} aria-label="Borrar búsqueda">
            <X size={15} />
          </button>
        )}
      </label>
      <div className="chips">
        <button className={`chip ${esp === "todas" ? "on" : ""}`} onClick={() => setEsp("todas")}>
          Todas
        </button>
        {LISTA_ESPECIALIDADES.map((e) => (
          <button key={e} className={`chip ${esp === e ? "on" : ""}`} onClick={() => setEsp(e)}>
            {ESPECIALIDADES[e].corto}
          </button>
        ))}
      </div>

      <div className="lista-arq">
        {!listo
          ? [0, 1, 2].map((i) => (
              <div key={i} className="arq-card">
                <Skel h={150} r={14} />
                <Skel h={16} w="70%" />
                <Skel h={12} w="45%" />
              </div>
            ))
          : lista.length === 0
            ? <Vacio icono={<Search size={24} />} titulo="Nadie con ese filtro" texto="Prueba otra especialidad o borra la búsqueda." accion={<button className="link" onClick={() => { setEsp("todas"); setQ(""); }}>Ver todos</button>} />
            : lista.map((a, i) => (
                <div key={a.id} className="aparece-abajo" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                  <Tilt as="button" className="arq-card" onClick={() => abrirArquitecto(a.id)}>
                    <div className="arq-fotos">
                      {a.portafolio.slice(0, 3).map((t) => (
                        <Foto key={t.id} k={t.foto} w={300} h={220} alt={t.titulo} />
                      ))}
                    </div>
                    <div className="arq-pie">
                      <Avatar k={a.foto} nombre={a.nombre} size={40} />
                      <span>
                        <strong>
                          {a.estudio} {a.verificado && <BadgeCheck size={14} className="verif-ic" />}
                        </strong>
                        <small>
                          {a.nombre} · {a.especialidades.map((e) => ESPECIALIDADES[e].corto).join(", ")}
                        </small>
                      </span>
                      <span className="arq-num">
                        <Nota v={a.nota} n={a.resenas || undefined} />
                        <small>
                          <Clock3 size={11} /> {Math.round(a.respondeHoras) || 1} h
                        </small>
                      </span>
                    </div>
                  </Tilt>
                  {i === 2 && <Anuncio espacio="inicio-cliente" />}
                </div>
              ))}
        {listo && lista.length > 0 && lista.length < 3 && <Anuncio espacio="inicio-cliente" />}
      </div>
    </div>
  );
}

/* ---------------- mis pedidos ---------------- */

export function MisPedidos() {
  const { pedidos, listo, abrirPedido, ahora, zonas } = useStore();
  const cuenta = usePropuestasPorPedido();
  const [vista, setVista] = useState<"activos" | "cerrados">("activos");
  const mios = pedidos
    .filter((p) => p.clienteId === CLIENTE_ACTUAL)
    .filter((p) => (vista === "activos" ? p.estado !== "cerrado" : p.estado === "cerrado"))
    .sort((a, b) => new Date(b.creado).getTime() - new Date(a.creado).getTime());
  return (
    <div className="seccion">
      <div className="seccion-cab">
        <h2>Mis pedidos</h2>
        <div className="mini-seg">
          <button className={vista === "activos" ? "on" : ""} onClick={() => setVista("activos")}>
            En curso
          </button>
          <button className={vista === "cerrados" ? "on" : ""} onClick={() => setVista("cerrados")}>
            Terminados
          </button>
        </div>
      </div>
      {!listo ? (
        <Skel h={120} r={16} />
      ) : mios.length === 0 ? (
        <Vacio icono={<Inbox size={26} />} titulo={vista === "activos" ? "No tienes pedidos en curso" : "Aún no terminaste ninguna obra"} texto="Cuando publiques un proyecto, aquí verás las propuestas que llegan." />
      ) : (
        <div className="lista-pedidos">
          {mios.map((p, i) => {
            const n = cuenta.get(p.id) ?? 0;
            const e = ESTADO_PEDIDO[p.estado];
            const z = zonas.find((x) => x.id === p.zonaId);
            return (
              <Tilt key={p.id} as="button" className="pedido-card aparece-abajo" onClick={() => abrirPedido(p.id)}>
                <span className="pedido-foto" style={{ animationDelay: `${i * 50}ms` }}>
                  <Foto k={p.fotos[0]} w={220} h={220} alt={p.titulo} />
                </span>
                <span className="pedido-txt">
                  <span className={`badge ${e.clase}`}>{e.texto}</span>
                  <strong>{p.titulo}</strong>
                  <small>
                    <MapPin size={11} /> {z?.nombre} · {hace(p.creado, ahora)}
                  </small>
                  <em>
                    {p.estado === "espera"
                      ? "Te avisamos cuando abra la zona"
                      : p.estado === "abierto"
                        ? n
                          ? `${n} ${n === 1 ? "propuesta" : "propuestas"} para comparar`
                          : "Esperando la primera propuesta"
                        : p.estado === "cerrado" && !p.calificado
                          ? "Falta tu calificación"
                          : `${n} propuestas recibidas`}
                  </em>
                </span>
              </Tilt>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DetallePedidoCliente() {
  const { pedidoSel, abrirPedido, pedidos, propuestas, arquitectos, rol, elegirPropuesta, descartarPropuesta, abrirArquitecto, conversacionCon, abrirConversacion, calificar, ahora, toast } = useStore();
  const p = pedidos.find((x) => x.id === pedidoSel);
  const zona = useZona(p?.zonaId);
  const ciudad = useCiudadDeZona(p?.zonaId);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [nota, setNota] = useState(0);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [fotoN, setFotoN] = useState(0);
  if (!p || rol !== "cliente") return null;
  const suyas = propuestas
    .filter((x) => x.pedidoId === p.id && x.estado !== "retirada")
    .sort((a, b) => (a.estado === "elegida" ? -1 : b.estado === "elegida" ? 1 : new Date(a.enviada).getTime() - new Date(b.enviada).getTime()));
  const cubren = arquitectos.filter((a) => a.zonas.includes(p.zonaId) && !a.suspendido && a.estadoPlan !== "cancelado").length;
  const e = ESTADO_PEDIDO[p.estado];
  const elegido = arquitectos.find((a) => a.id === p.elegidoId);
  const aConfirmar = suyas.find((x) => x.id === confirmar);
  const arqConfirmar = arquitectos.find((a) => a.id === aConfirmar?.arquitectoId);

  return (
    <Hoja abierta onClose={() => abrirPedido(null)} clase="hoja-ficha" titulo={p.titulo}>
      <div className="galeria">
        <div
          className="galeria-pista"
          onScroll={(ev) => {
            const el = ev.currentTarget;
            setFotoN(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
          }}
        >
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
          <span className={`badge ${e.clase}`}>{e.texto}</span>
          <h2>{p.titulo}</h2>
          <div className="ficha-meta">
            <span>
              <MapPin size={13} /> {zona?.nombre}
            </span>
            <span>{ESPECIALIDADES[p.tipo].nombre}</span>
            {p.metros && <span>{p.metros} m²</span>}
            <span>Publicado {hace(p.creado, ahora)}</span>
          </div>
        </div>
        <p className="ficha-bio">{p.descripcion}</p>

        {p.estado === "espera" && (
          <div className="aviso-card aviso">
            <Hourglass size={18} />
            <div>
              <strong>{zona?.nombre} todavía no tiene arquitectos</strong>
              <p>Tu pedido quedó guardado y nadie ve tus fotos por ahora. Apenas abramos la zona, lo mandamos a los arquitectos del barrio y te avisamos.</p>
            </div>
          </div>
        )}
        {p.estado === "abierto" && suyas.length === 0 && (
          <div className="aviso-card info">
            <Clock3 size={18} />
            <div>
              <strong>
                Avisamos a {cubren} {cubren === 1 ? "arquitecto" : "arquitectos"} de {zona?.nombre}
              </strong>
              <p>{horasDesde(p.creado, ahora) < 24 ? "Las primeras propuestas suelen llegar en unas horas. Te mandamos una notificación con cada una." : "Estamos llamando a arquitectos de la zona para que lo vean hoy."}</p>
              <span className="barra-espera" />
            </div>
          </div>
        )}

        {p.estado === "cerrado" && !p.calificado && elegido && (
          <div className="calificar-card">
            <strong>¿Cómo te fue con {elegido.estudio}?</strong>
            <p className="muted chico">Solo quien contrató puede calificar. Tu reseña ayuda a otros vecinos a elegir.</p>
            <Estrellas valor={nota} onChange={setNota} />
            <textarea value={texto} onChange={(ev) => setTexto(ev.target.value)} rows={3} placeholder="Cuéntale a otros cómo fue la obra" />
            {error && <p className="error-txt">{error}</p>}
            <button
              className="btn btn-pri"
              disabled={ocupado === "calificar"}
              onClick={async () => {
                setError("");
                setOcupado("calificar");
                try {
                  await calificar(p.id, nota, texto);
                } catch (err) {
                  if (err instanceof ErrorValidacion) setError(err.message);
                  else toast("No se pudo guardar. Intenta de nuevo.", "error");
                } finally {
                  setOcupado(null);
                }
              }}
            >
              {ocupado === "calificar" ? <Cargando texto="Enviando" /> : "Publicar reseña"}
            </button>
          </div>
        )}

        {suyas.length > 0 && (
          <h3 className="sub">
            {p.estado === "abierto" ? `${suyas.length} ${suyas.length === 1 ? "propuesta" : "propuestas"} para comparar` : "Propuestas recibidas"}
          </h3>
        )}
        <div className="propuestas">
          {suyas.map((pr, i) => {
            const a = arquitectos.find((x) => x.id === pr.arquitectoId);
            if (!a) return null;
            const cerrada = pr.estado === "descartada";
            return (
              <article key={pr.id} className={`propuesta aparece-abajo ${pr.estado === "elegida" ? "elegida" : ""} ${cerrada ? "apagada" : ""}`} style={{ animationDelay: `${i * 70}ms` }}>
                <header>
                  <button className="prop-quien" onClick={() => abrirArquitecto(a.id)}>
                    <Avatar k={a.foto} nombre={a.nombre} size={42} />
                    <span>
                      <strong>
                        {a.estudio} {a.verificado && <BadgeCheck size={14} className="verif-ic" />}
                      </strong>
                      <small>
                        <Nota v={a.nota} n={a.resenas || undefined} /> · {hace(pr.enviada, ahora)}
                      </small>
                    </span>
                  </button>
                  {pr.estado === "elegida" && <span className="badge ok">Elegido</span>}
                  {cerrada && <span className="badge gris">No elegida</span>}
                </header>
                <div className="prop-numeros">
                  <span>
                    <small>Honorarios del proyecto</small>
                    <strong>{rangoPlata(pr.honorarioMin, pr.honorarioMax, ciudad)}</strong>
                  </span>
                  <span>
                    <small>Proyecto listo en</small>
                    <strong>{pr.plazoSemanas} semanas</strong>
                  </span>
                </div>
                <p className="prop-msj">{pr.mensaje}</p>
                <div className="prop-imgs">
                  {pr.imagenes.map((im, k) => (
                    <Foto key={k} k={im} w={300} h={210} alt={`Referencia ${k + 1} de ${a.estudio}`} />
                  ))}
                </div>
                <footer>
                  <button
                    className="btn btn-sec chico"
                    onClick={() => {
                      const id = conversacionCon(p.id, a.id);
                      abrirConversacion(id);
                    }}
                  >
                    <MessageCircle size={15} /> Mensaje
                  </button>
                  {p.estado === "abierto" && !cerrada && (
                    <>
                      <button className="btn btn-sec chico" disabled={ocupado === pr.id} onClick={async () => { setOcupado(pr.id); await descartarPropuesta(pr.id); setOcupado(null); }}>
                        Descartar
                      </button>
                      <button className="btn btn-pri chico" onClick={() => setConfirmar(pr.id)}>
                        <Check size={15} /> Elegir
                      </button>
                    </>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      </div>
      <Modal
        abierto={!!aConfirmar}
        titulo={`¿Elegir a ${arqConfirmar?.estudio ?? ""}?`}
        onClose={() => setConfirmar(null)}
        ancho={420}
        pie={
          <>
            <button className="btn btn-sec" onClick={() => setConfirmar(null)}>
              Seguir comparando
            </button>
            <button
              className="btn btn-pri"
              disabled={ocupado === "elegir"}
              onClick={async () => {
                if (!aConfirmar) return;
                setOcupado("elegir");
                await elegirPropuesta(aConfirmar.id);
                setOcupado(null);
                setConfirmar(null);
              }}
            >
              {ocupado === "elegir" ? <Cargando texto="Confirmando" /> : "Sí, elegir"}
            </button>
          </>
        }
      >
        <p className="muted">Le avisamos para coordinar la primera visita. A los demás les decimos con amabilidad que elegiste a otro estudio.</p>
      </Modal>
    </Hoja>
  );
}

/* ---------------- publicar ---------------- */

const PASOS = ["Qué obra", "Fotos", "Dónde", "Revisar"];

export function Publicar({ tipoInicial, alTerminar }: { tipoInicial: Especialidad | null; alTerminar: () => void }) {
  const { zonas, yo, publicarPedido, irCliente, abrirPedido, toast } = useStore();
  const [paso, setPaso] = useState(tipoInicial ? 1 : 0);
  const [tipo, setTipo] = useState<Especialidad | null>(tipoInicial);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [zonaId, setZonaId] = useState(yo.cliente?.zonaId ?? "coyoacan");
  const [metros, setMetros] = useState("");
  const [presupuesto, setPresupuesto] = useState<Presupuesto>("medio");
  const [inicio, setInicio] = useState<InicioT>("pronto");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enEspera, setEnEspera] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement | null>(null);
  const zonasCiudad = zonas.filter((z) => z.ciudadId === "cdmx");
  const zona = zonas.find((z) => z.id === zonaId);
  const ciudad = ciudadDe(zona?.ciudadId ?? "cdmx");

  const siguiente = () => {
    setError("");
    if (paso === 0 && !tipo) return setError("Elige qué tipo de obra quieres hacer.");
    if (paso === 1) {
      if (descripcion.trim().length < 30) return setError("Cuéntale un poco más a los arquitectos: al menos 30 caracteres.");
      if (!fotos.length) return setError("Agrega al menos una foto del lugar.");
    }
    if (paso === 2 && metros && (Number(metros) <= 0 || Number(metros) > 2000)) return setError("Revisa los metros cuadrados.");
    setPaso((p) => Math.min(3, p + 1));
  };

  const subir = (lista: FileList | null) => {
    if (!lista) return;
    const nuevas: string[] = [];
    for (const f of Array.from(lista)) {
      if (!f.type.startsWith("image/")) {
        setError(`"${f.name}" no es una imagen. Sube fotos en JPG o PNG.`);
        continue;
      }
      nuevas.push(URL.createObjectURL(f));
    }
    setFotos((x) => [...x, ...nuevas].slice(0, 8));
    if (fotos.length + nuevas.length > 8) setError("Puedes subir hasta 8 fotos por pedido.");
  };

  const publicar = async () => {
    if (!tipo) return;
    setError("");
    setEnviando(true);
    const datos: NuevoPedido = { tipo, titulo: titulo || `${ESPECIALIDADES[tipo].nombre} en ${zona?.nombre}`, descripcion, fotos, zonaId, metros: metros ? Number(metros) : null, presupuesto, inicio };
    try {
      const p = await publicarPedido(datos);
      if (p.estado === "espera") {
        setEnEspera(zona?.nombre ?? "");
      } else {
        toast(`Pedido publicado. Lo ven los arquitectos de ${zona?.nombre}.`);
        irCliente("pedidos");
        abrirPedido(p.id);
        alTerminar();
      }
    } catch (err) {
      if (err instanceof ErrorValidacion) setError(err.message);
      else setError("No pudimos publicar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (enEspera !== null) {
    return (
      <div className="seccion publicado-espera aparece">
        <span className="vacio-ic grande">
          <Bell size={28} />
        </span>
        <h2>Guardamos tu pedido</h2>
        <p className="muted">Todavía no hay arquitectos en {enEspera}. En cuanto abramos la zona, tu pedido sale primero y te avisamos al celular. Mientras tanto nadie ve tus fotos.</p>
        <button
          className="btn btn-pri ancho"
          onClick={() => {
            irCliente("pedidos");
            alTerminar();
          }}
        >
          Ver mis pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="seccion publicar">
      <div className="pasos" aria-label={`Paso ${paso + 1} de 4`}>
        {PASOS.map((t, i) => (
          <span key={t} className={i === paso ? "on" : i < paso ? "hecho" : ""}>
            <i>{i < paso ? <Check size={12} /> : i + 1}</i>
            <small>{t}</small>
          </span>
        ))}
      </div>

      <div key={paso} className="paso-cuerpo vista-entra">
        {paso === 0 && (
          <>
            <h2>¿Qué quieres hacer?</h2>
            <div className="tipos-grilla">
              {LISTA_ESPECIALIDADES.map((t) => {
                const Ic = ICONO_TIPO[t];
                return (
                  <Tilt key={t} as="button" className={`tipo-op ${tipo === t ? "on" : ""}`} onClick={() => setTipo(t)}>
                    <Ic size={24} />
                    <span>{ESPECIALIDADES[t].nombre}</span>
                  </Tilt>
                );
              })}
            </div>
          </>
        )}

        {paso === 1 && (
          <>
            <h2>Muéstranos el lugar</h2>
            <label className="campo">
              <span>Título del pedido</span>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={tipo ? `${ESPECIALIDADES[tipo].nombre} en ${zona?.nombre}` : ""} maxLength={60} />
            </label>
            <label className="campo">
              <span>Qué quieres cambiar y por qué</span>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} placeholder="Ej.: la cocina es oscura y quiero abrirla al comedor. La casa es de los años 70." />
              <small className={descripcion.trim().length >= 30 ? "ok-txt" : "muted"}>{descripcion.trim().length} de 30 caracteres mínimos</small>
            </label>
            <div className="campo">
              <span>Fotos ({fotos.length} de 8)</span>
              <div className="fotos-elegidas">
                {fotos.map((f, i) => (
                  <span key={f + i} className="foto-elegida aparece">
                    <img src={f.startsWith("blob:") ? f : foto(f, 200, 200)} alt={`Foto ${i + 1}`} width={86} height={86} />
                    <button onClick={() => setFotos((x) => x.filter((_, k) => k !== i))} aria-label="Quitar foto">
                      <X size={13} />
                    </button>
                  </span>
                ))}
                <button className="foto-subir" onClick={() => archivo.current?.click()}>
                  <Camera size={20} />
                  <small>Subir</small>
                </button>
                <input ref={archivo} type="file" accept="image/*" multiple hidden onChange={(e) => subir(e.target.files)} />
              </div>
              <small className="muted">O elige de tu galería:</small>
              <div className="galeria-cliente">
                {GALERIA_CLIENTE.map((g) => {
                  const on = fotos.includes(g);
                  return (
                    <button key={g} className={`foto-op ${on ? "on" : ""}`} onClick={() => setFotos((x) => (on ? x.filter((y) => y !== g) : [...x, g].slice(0, 8)))} aria-pressed={on}>
                      <Foto k={g} w={160} h={160} alt="Foto de la galería" />
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
          </>
        )}

        {paso === 2 && (
          <>
            <h2>¿Dónde y cuánto?</h2>
            <label className="campo">
              <span>Zona de la casa</span>
              <select value={zonaId} onChange={(e) => setZonaId(e.target.value)}>
                {zonasCiudad.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}
                    {z.estado === "espera" ? " (por abrir)" : ""}
                  </option>
                ))}
              </select>
            </label>
            {zona?.estado === "espera" && (
              <div className="aviso-card aviso aparece">
                <TriangleAlert size={17} />
                <p>En {zona.nombre} todavía no hay arquitectos. Puedes publicar igual: guardamos tu pedido y te avisamos cuando abra.</p>
              </div>
            )}
            <label className="campo">
              <span>Metros cuadrados aproximados (opcional)</span>
              <input type="number" inputMode="numeric" value={metros} onChange={(e) => setMetros(e.target.value)} placeholder="Ej.: 14" />
            </label>
            <div className="campo">
              <span>Tamaño de la obra</span>
              <div className="chips-grilla">
                {(Object.keys(PRESUPUESTOS) as Presupuesto[]).map((k) => (
                  <button key={k} className={`chip ${presupuesto === k ? "on" : ""}`} onClick={() => setPresupuesto(k)}>
                    {PRESUPUESTOS[k]}
                  </button>
                ))}
              </div>
            </div>
            <div className="campo">
              <span>¿Cuándo quieres empezar?</span>
              <div className="chips-grilla">
                {(Object.keys(INICIOS) as InicioT[]).map((k) => (
                  <button key={k} className={`chip ${inicio === k ? "on" : ""}`} onClick={() => setInicio(k)}>
                    {INICIOS[k]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {paso === 3 && tipo && (
          <>
            <h2>Revisa antes de publicar</h2>
            <div className="resumen">
              <div className="resumen-fotos">
                {fotos.slice(0, 4).map((f, i) => (
                  <img key={i} src={f.startsWith("blob:") ? f : foto(f, 220, 220)} alt={`Foto ${i + 1}`} width={110} height={110} />
                ))}
              </div>
              <dl>
                <dt>Obra</dt>
                <dd>{titulo || `${ESPECIALIDADES[tipo].nombre} en ${zona?.nombre}`}</dd>
                <dt>Zona</dt>
                <dd>
                  {zona?.nombre}, {ciudad.nombre}
                  {zona?.estado === "espera" ? " (por abrir)" : ""}
                </dd>
                <dt>Tamaño</dt>
                <dd>
                  {PRESUPUESTOS[presupuesto]}
                  {metros ? `, ${metros} m²` : ""}
                </dd>
                <dt>Inicio</dt>
                <dd>{INICIOS[inicio]}</dd>
              </dl>
              <p className="resumen-desc">{descripcion}</p>
            </div>
            <p className="muted chico">Lo verán solo los arquitectos que cubren {zona?.nombre}, y te llega un aviso con cada propuesta.</p>
          </>
        )}
      </div>

      {error && (
        <p className="error-txt aparece" role="alert">
          {error}
        </p>
      )}

      <div className="publicar-pie">
        {paso > 0 ? (
          <button className="btn btn-sec" onClick={() => { setError(""); setPaso((p) => p - 1); }}>
            <ArrowLeft size={16} /> Atrás
          </button>
        ) : (
          <span />
        )}
        {paso < 3 ? (
          <button className="btn btn-pri" onClick={siguiente}>
            Continuar <ArrowRight size={16} />
          </button>
        ) : (
          <button className="btn btn-pri" onClick={publicar} disabled={enviando}>
            {enviando ? <Cargando texto="Publicando" /> : "Publicar pedido"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- perfil ---------------- */

export function PerfilCliente() {
  const { yo, biometria, alternarBiometria, pedidos, arquitectos, resenas, abrirPedido, irCliente, listo, toast } = useStore();
  const zona = useZona(yo.cliente?.zonaId);
  const [avisos, setAvisos] = useState(true);
  const c = yo.cliente;
  const pendientes = pedidos.filter((p) => p.clienteId === CLIENTE_ACTUAL && p.estado === "cerrado" && !p.calificado);
  const mias = c ? resenas.filter((r) => r.cliente.startsWith(c.nombre.split(" ")[0]) && r.clienteFoto === c.foto) : [];
  if (!listo || !c) return <div className="seccion"><Skel h={90} r={16} /></div>;
  return (
    <div className="seccion">
      <div className="perfil-cab">
        <Avatar k={c.foto} nombre={c.nombre} size={72} />
        <div>
          <h2>{c.nombre}</h2>
          <p className="muted">
            <MapPin size={13} /> {zona?.nombre}, Ciudad de México
          </p>
        </div>
      </div>

      {pendientes.map((p) => {
        const a = arquitectos.find((x) => x.id === p.elegidoId);
        return (
          <button
            key={p.id}
            className="pendiente-card aparece"
            onClick={() => {
              irCliente("pedidos");
              abrirPedido(p.id);
            }}
          >
            <Star size={20} />
            <span>
              <strong>Califica a {a?.estudio}</strong>
              <small>Por {p.titulo}. Solo tú puedes dejar esta reseña.</small>
            </span>
            <ArrowRight size={17} />
          </button>
        );
      })}

      <div className="ajustes">
        <h3 className="sub">Acceso</h3>
        <div className="ajuste">
          <ScanFace size={19} />
          <span>
            <strong>Entrar con Face ID o huella</strong>
            <small>Sin escribir la contraseña cada vez</small>
          </span>
          <Switch on={biometria.cliente} onChange={() => alternarBiometria("cliente")} label="Face ID o huella" />
        </div>
        <div className="ajuste">
          <KeyRound size={19} />
          <span>
            <strong>Cuentas conectadas</strong>
            <small>Puedes entrar con cualquiera</small>
          </span>
          <span className="cuentas">
            <i>Apple</i>
            <i>Google</i>
            <i>
              <Mail size={11} /> Correo
            </i>
          </span>
        </div>
        <div className="ajuste">
          <Bell size={19} />
          <span>
            <strong>Avisos de propuestas nuevas</strong>
            <small>Te llega una notificación con cada propuesta</small>
          </span>
          <Switch
            on={avisos}
            onChange={() => {
              setAvisos((v) => !v);
              toast(avisos ? "Avisos desactivados" : "Avisos activados", "info");
            }}
            label="Avisos"
          />
        </div>
      </div>

      <h3 className="sub">Tus reseñas</h3>
      {mias.length === 0 ? (
        <p className="muted chico">Todavía no dejaste reseñas. Aparecen aquí cuando calificas una obra terminada.</p>
      ) : (
        <ul className="resenas">
          {mias.map((r) => (
            <li key={r.id}>
              <Avatar k={r.clienteFoto} nombre={r.cliente} size={34} />
              <div>
                <strong>
                  {r.obra} <Nota v={r.nota} />
                </strong>
                <small>{fecha(r.fecha)}</small>
                <p>{r.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

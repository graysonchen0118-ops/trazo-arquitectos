"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Actividad, Anuncio, Arquitecto, Cliente, Conversacion, Especialidad, EstadoZona, Inicio, Pedido, Plan, PlanId, Presupuesto, Propuesta, Resena, Zona } from "./types";
import { crearZonas, CIUDADES } from "./mock/ciudades";
import { crearArquitectos } from "./mock/arquitectos";
import { ARQUITECTO_ACTUAL, CLIENTE_ACTUAL, crearPedidos, honorarioSugerido } from "./mock/pedidos";
import { crearActividad, crearAnuncios, PLANES_BASE } from "./mock/negocio";
import { DIA, espera, uid } from "./format";
import { proyectosDe } from "./photos";

export type Rol = "cliente" | "arquitecto";
export type TabCliente = "inicio" | "pedidos" | "publicar" | "mensajes" | "perfil";
export type TabArq = "pedidos" | "propuestas" | "mensajes" | "plan" | "perfil";

export interface Toast {
  id: string;
  texto: string;
  tono: "ok" | "error" | "info";
}

export interface NuevoPedido {
  tipo: Especialidad;
  titulo: string;
  descripcion: string;
  fotos: string[];
  zonaId: string;
  metros: number | null;
  presupuesto: Presupuesto;
  inicio: Inicio;
}

export interface NuevaPropuesta {
  honorarioMin: number;
  honorarioMax: number;
  plazoSemanas: number;
  mensaje: string;
  imagenes: string[];
}

/** lo que la escena 3D tiene que mostrar en cada momento */
export type Foco3D = { tipo: "pedido"; id: string } | { tipo: "zona"; id: string } | null;

export class ErrorValidacion extends Error {}

interface Ctx {
  listo: boolean;
  ahora: Date;
  zonas: Zona[];
  arquitectos: Arquitecto[];
  clientes: Cliente[];
  pedidos: Pedido[];
  propuestas: Propuesta[];
  conversaciones: Conversacion[];
  resenas: Resena[];
  planes: Plan[];
  anuncios: Anuncio[];
  actividad: Actividad[];
  rol: Rol;
  setRol: (r: Rol) => void;
  tabCliente: TabCliente;
  irCliente: (t: TabCliente) => void;
  tabArq: TabArq;
  irArq: (t: TabArq) => void;
  pedidoSel: string | null;
  abrirPedido: (id: string | null) => void;
  arquitectoSel: string | null;
  abrirArquitecto: (id: string | null) => void;
  conversacionSel: string | null;
  abrirConversacion: (id: string | null) => void;
  escribiendo: string | null;
  foco: Foco3D;
  enfocar: (f: Foco3D) => void;
  ciudadPanel: string;
  setCiudadPanel: (id: string) => void;
  biometria: Record<Rol, boolean>;
  alternarBiometria: (r: Rol) => void;
  toasts: Toast[];
  toast: (texto: string, tono?: Toast["tono"]) => void;
  yo: { cliente: Cliente | null; arquitecto: Arquitecto | null };
  publicarPedido: (n: NuevoPedido) => Promise<Pedido>;
  elegirPropuesta: (id: string) => Promise<void>;
  descartarPropuesta: (id: string) => Promise<void>;
  calificar: (pedidoId: string, nota: number, texto: string) => Promise<void>;
  conversacionCon: (pedidoId: string, arquitectoId: string) => string;
  enviarMensaje: (convId: string, de: "cliente" | "arquitecto", texto: string) => void;
  enviarPropuesta: (pedidoId: string, n: NuevaPropuesta) => Promise<void>;
  retirarPropuesta: (id: string) => Promise<void>;
  propuestasUsadasMes: number;
  cambiarPlan: (p: PlanId) => Promise<void>;
  cancelarPrueba: () => Promise<void>;
  guardarZonasArq: (zonas: string[]) => Promise<void>;
  agregarTrabajo: (fotoK: string, titulo: string, tipo: Especialidad) => Promise<void>;
  quitarTrabajo: (id: string) => void;
  marcarContactado: (pedidoId: string) => Promise<void>;
  moderarPedido: (id: string, visible: boolean) => Promise<void>;
  eliminarPedido: (id: string) => Promise<void>;
  verificarArquitecto: (id: string) => Promise<void>;
  suspenderArquitecto: (id: string, s: boolean) => Promise<void>;
  guardarArquitecto: (a: Arquitecto, nuevo: boolean) => Promise<void>;
  eliminarArquitecto: (id: string) => Promise<void>;
  cambiarEstadoZona: (id: string, estado: EstadoZona) => Promise<void>;
  crearZona: (nombre: string, ciudadId: string) => Promise<void>;
  guardarPlan: (p: Plan) => Promise<void>;
  guardarAnuncio: (a: Anuncio) => Promise<void>;
  activarAnuncio: (id: string) => Promise<void>;
  apagarAnuncio: (id: string) => Promise<void>;
  contarImpresion: (id: string) => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore fuera del proveedor");
  return c;
}

export const emitir3D = (detalle: Record<string, unknown>) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("trazo:3d", { detail: detalle }));
};

const LATENCIA = 650;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [listo, setListo] = useState(false);
  const [ahora, setAhora] = useState(() => new Date(0));
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [arquitectos, setArquitectos] = useState<Arquitecto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [planes, setPlanes] = useState<Plan[]>(PLANES_BASE);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [actividad, setActividad] = useState<Actividad[]>([]);
  const [rol, setRolState] = useState<Rol>("cliente");
  const [tabCliente, setTabCliente] = useState<TabCliente>("inicio");
  const [tabArq, setTabArq] = useState<TabArq>("pedidos");
  const [pedidoSel, setPedidoSel] = useState<string | null>(null);
  const [arquitectoSel, setArquitectoSel] = useState<string | null>(null);
  const [conversacionSel, setConversacionSel] = useState<string | null>(null);
  const [escribiendo, setEscribiendo] = useState<string | null>(null);
  const [foco, setFoco] = useState<Foco3D>(null);
  const [ciudadPanel, setCiudadPanel] = useState("cdmx");
  const [biometria, setBiometria] = useState<Record<Rol, boolean>>({ cliente: true, arquitecto: false });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);
  const impresiones = useRef(new Set<string>());

  // carga inicial con la demora de una API real, para que se vean los esqueletos
  useEffect(() => {
    const t0 = new Date();
    setAhora(t0);
    const arqs = crearArquitectos(t0);
    const d = crearPedidos(t0, arqs);
    const id = window.setTimeout(() => {
      setZonas(crearZonas());
      setArquitectos(arqs);
      setClientes(d.clientes);
      setPedidos(d.pedidos);
      setPropuestas(d.propuestas);
      setConversaciones(d.conversaciones);
      setResenas(d.resenas);
      setAnuncios(crearAnuncios());
      setActividad(crearActividad(t0));
      setListo(true);
    }, 900);
    const reloj = window.setInterval(() => setAhora(new Date()), 30_000);
    const ts = timers.current;
    return () => {
      window.clearTimeout(id);
      window.clearInterval(reloj);
      ts.forEach((x) => window.clearTimeout(x));
    };
  }, []);

  const toast = useCallback((texto: string, tono: Toast["tono"] = "ok") => {
    const id = uid("t");
    setToasts((t) => [...t.slice(-2), { id, texto, tono }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const despues = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const registrar = (texto: string, tipo: Actividad["tipo"]) => setActividad((a) => [{ id: uid("act"), texto, en: new Date().toISOString(), tipo }, ...a].slice(0, 30));

  const yo = useMemo(
    () => ({ cliente: clientes.find((c) => c.id === CLIENTE_ACTUAL) ?? null, arquitecto: arquitectos.find((a) => a.id === ARQUITECTO_ACTUAL) ?? null }),
    [clientes, arquitectos],
  );

  const setRol = (r: Rol) => {
    setRolState(r);
    setPedidoSel(null);
    setArquitectoSel(null);
    setConversacionSel(null);
    setFoco(null);
    emitir3D({ tipo: "rol", rol: r });
  };
  const irCliente = (t: TabCliente) => {
    setTabCliente(t);
    setPedidoSel(null);
    setArquitectoSel(null);
    setConversacionSel(null);
    if (t !== "pedidos") setFoco(null);
  };
  const irArq = (t: TabArq) => {
    setTabArq(t);
    setPedidoSel(null);
    setArquitectoSel(null);
    setConversacionSel(null);
    if (t !== "pedidos") setFoco(null);
  };
  const abrirPedido = (id: string | null) => {
    setPedidoSel(id);
    if (id) setFoco({ tipo: "pedido", id });
  };

  /* ---------- cliente ---------- */

  const publicarPedido = async (n: NuevoPedido): Promise<Pedido> => {
    if (n.descripcion.trim().length < 30) throw new ErrorValidacion("Cuéntale un poco más a los arquitectos: al menos 30 caracteres.");
    if (!n.fotos.length) throw new ErrorValidacion("Agrega al menos una foto del lugar.");
    if (n.fotos.length > 8) throw new ErrorValidacion("Puedes subir hasta 8 fotos por pedido.");
    await espera(1100);
    const zona = zonas.find((z) => z.id === n.zonaId);
    const abierta = zona?.estado === "abierta";
    const p: Pedido = {
      id: uid("p"),
      clienteId: CLIENTE_ACTUAL,
      titulo: n.titulo.trim() || "Mi proyecto",
      tipo: n.tipo,
      descripcion: n.descripcion.trim(),
      fotos: n.fotos,
      zonaId: n.zonaId,
      metros: n.metros,
      presupuesto: n.presupuesto,
      inicio: n.inicio,
      creado: new Date().toISOString(),
      estado: abierta ? "abierto" : "espera",
      elegidoId: null,
      contactado: false,
      calificado: false,
    };
    setPedidos((ps) => [p, ...ps]);
    if (!abierta) {
      setZonas((zs) => zs.map((z) => (z.id === n.zonaId ? { ...z, enEspera: z.enEspera + 1 } : z)));
      registrar(`${zona?.nombre ?? "Una zona"} sumó un cliente en espera`, "zona");
      return p;
    }
    const cubren = arquitectos.filter((a) => a.zonas.includes(n.zonaId) && !a.suspendido && a.estadoPlan !== "cancelado");
    registrar(`Nuevo pedido en ${zona?.nombre}: ${p.titulo}`, "pedido");
    emitir3D({ tipo: "publicado", pedidoId: p.id, zonaId: n.zonaId, arquitectos: cubren.map((a) => a.id) });
    // la primera propuesta llega sola al rato, como pasaría con arquitectos en prueba mirando su zona
    const primero = [...cubren].filter((a) => a.id !== ARQUITECTO_ACTUAL).sort((a, b) => Number(b.especialidades.includes(n.tipo)) - Number(a.especialidades.includes(n.tipo)) || a.respondeHoras - b.respondeHoras)[0];
    if (primero) {
      despues(8000, () => {
        const ciudadId = zona?.ciudadId ?? "cdmx";
        const { min, max } = honorarioSugerido(n.tipo, ciudadId);
        const pr: Propuesta = {
          id: uid("pr"),
          pedidoId: p.id,
          arquitectoId: primero.id,
          honorarioMin: min,
          honorarioMax: max,
          plazoSemanas: 4,
          mensaje: "Vi tus fotos y me gustaría ir a medir esta semana. Te dejo dos referencias de obras parecidas para que veas por dónde iría.",
          imagenes: proyectosDe(n.tipo).slice(0, 2),
          enviada: new Date().toISOString(),
          estado: "enviada",
        };
        setPropuestas((x) => [...x, pr]);
        toast(`Llegó la primera propuesta: ${primero.estudio}`, "info");
        emitir3D({ tipo: "propuesta", pedidoId: p.id, arquitectoId: primero.id, zonaId: n.zonaId });
        registrar(`${primero.nombre} envió una propuesta para ${p.titulo}`, "propuesta");
      });
    }
    return p;
  };

  const elegirPropuesta = async (id: string) => {
    const pr = propuestas.find((x) => x.id === id);
    if (!pr) return;
    await espera(LATENCIA);
    setPropuestas((ps) => ps.map((x) => (x.pedidoId !== pr.pedidoId ? x : x.id === id ? { ...x, estado: "elegida" } : x.estado === "retirada" ? x : { ...x, estado: "descartada" })));
    setPedidos((ps) => ps.map((p) => (p.id === pr.pedidoId ? { ...p, estado: "elegido", elegidoId: pr.arquitectoId } : p)));
    const a = arquitectos.find((x) => x.id === pr.arquitectoId);
    const ped = pedidos.find((p) => p.id === pr.pedidoId);
    toast(`Elegiste a ${a?.estudio}. Ya pueden coordinar la visita por mensaje.`);
    registrar(`${yo.cliente?.nombre ?? "Un cliente"} eligió a ${a?.estudio} para ${ped?.titulo}`, "pedido");
    emitir3D({ tipo: "elegido", pedidoId: pr.pedidoId, arquitectoId: pr.arquitectoId, zonaId: ped?.zonaId });
  };

  const descartarPropuesta = async (id: string) => {
    await espera(LATENCIA / 2);
    setPropuestas((ps) => ps.map((x) => (x.id === id ? { ...x, estado: "descartada" } : x)));
    toast("Propuesta descartada", "info");
  };

  const calificar = async (pedidoId: string, nota: number, texto: string) => {
    const p = pedidos.find((x) => x.id === pedidoId);
    if (!p?.elegidoId) return;
    if (nota < 1) throw new ErrorValidacion("Elige de 1 a 5 estrellas.");
    if (texto.trim().length < 10) throw new ErrorValidacion("Escribe al menos una frase sobre cómo fue la obra.");
    await espera(LATENCIA);
    const c = yo.cliente;
    setResenas((rs) => [
      { id: uid("rs"), arquitectoId: p.elegidoId!, cliente: c ? `${c.nombre.split(" ")[0]} ${c.nombre.split(" ").slice(-1)[0][0]}.` : "Cliente", clienteFoto: c?.foto ?? "", nota, texto: texto.trim(), fecha: new Date().toISOString(), obra: p.titulo },
      ...rs,
    ]);
    setArquitectos((as) => as.map((a) => (a.id === p.elegidoId ? { ...a, nota: Math.round(((a.nota * a.resenas + nota) / (a.resenas + 1)) * 10) / 10, resenas: a.resenas + 1 } : a)));
    setPedidos((ps) => ps.map((x) => (x.id === pedidoId ? { ...x, calificado: true } : x)));
    toast("Gracias. Tu reseña ya aparece en su perfil.");
  };

  const conversacionCon = (pedidoId: string, arquitectoId: string) => {
    const ex = conversaciones.find((c) => c.pedidoId === pedidoId && c.arquitectoId === arquitectoId);
    if (ex) return ex.id;
    const p = pedidos.find((x) => x.id === pedidoId);
    const id = uid("cv");
    setConversaciones((cs) => [{ id, pedidoId, arquitectoId, clienteId: p?.clienteId ?? CLIENTE_ACTUAL, mensajes: [], leida: true }, ...cs]);
    return id;
  };

  const RESPUESTAS = {
    arquitecto: ["Perfecto, lo anoto. ¿Te queda bien que pase el jueves en la tarde a medir?", "Buena pregunta. Lo reviso con las fotos y te confirmo hoy mismo.", "Sí, eso se puede. Te mando un boceto rápido para que lo veas."],
    cliente: ["¡Gracias! El jueves en la tarde me queda perfecto.", "Ok, lo platico en casa y te confirmo.", "Me parece bien, ¿qué necesitas que tenga listo para la visita?"],
  };

  const enviarMensaje = (convId: string, de: "cliente" | "arquitecto", texto: string) => {
    const limpio = texto.trim();
    if (!limpio) return;
    setConversaciones((cs) => cs.map((c) => (c.id === convId ? { ...c, leida: true, mensajes: [...c.mensajes, { id: uid("m"), de, texto: limpio, en: new Date().toISOString() }] } : c)));
    const otro = de === "cliente" ? "arquitecto" : "cliente";
    despues(900, () => setEscribiendo(convId));
    despues(3000, () => {
      setEscribiendo((e) => (e === convId ? null : e));
      setConversaciones((cs) =>
        cs.map((c) => {
          if (c.id !== convId) return c;
          const lista = RESPUESTAS[otro];
          return { ...c, mensajes: [...c.mensajes, { id: uid("m"), de: otro, texto: lista[c.mensajes.length % lista.length], en: new Date().toISOString() }] };
        }),
      );
    });
  };

  /* ---------- arquitecto ---------- */

  const inicioMes = useMemo(() => {
    const d = new Date(ahora);
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  }, [ahora]);
  const propuestasUsadasMes = useMemo(() => propuestas.filter((p) => p.arquitectoId === ARQUITECTO_ACTUAL && new Date(p.enviada).getTime() >= inicioMes && p.estado !== "retirada").length, [propuestas, inicioMes]);

  const enviarPropuesta = async (pedidoId: string, n: NuevaPropuesta) => {
    const a = yo.arquitecto;
    if (!a) return;
    const plan = planes.find((p) => p.id === a.plan)!;
    if (a.estadoPlan === "cancelado" || a.estadoPlan === "vencido") throw new ErrorValidacion("Tu plan no está activo. Reactívalo para volver a enviar propuestas.");
    if (propuestasUsadasMes >= plan.propuestasMes) throw new ErrorValidacion(`Usaste las ${plan.propuestasMes} propuestas de tu plan este mes.`);
    if (!n.honorarioMin || !n.honorarioMax) throw new ErrorValidacion("Indica el honorario mínimo y máximo.");
    if (n.honorarioMin > n.honorarioMax) throw new ErrorValidacion("El mínimo no puede ser mayor que el máximo.");
    if (n.plazoSemanas < 1 || n.plazoSemanas > 52) throw new ErrorValidacion("El plazo va de 1 a 52 semanas.");
    if (n.mensaje.trim().length < 40) throw new ErrorValidacion("Escribe al menos 40 caracteres: cuéntale al cliente cómo encararías su obra.");
    await espera(1000);
    const pr: Propuesta = { id: uid("pr"), pedidoId, arquitectoId: a.id, ...n, mensaje: n.mensaje.trim(), enviada: new Date().toISOString(), estado: "enviada" };
    setPropuestas((ps) => [...ps, pr]);
    const ped = pedidos.find((p) => p.id === pedidoId);
    toast("Propuesta enviada. Te avisamos cuando el cliente la abra.");
    registrar(`${a.nombre} envió una propuesta para ${ped?.titulo}`, "propuesta");
    emitir3D({ tipo: "propuesta", pedidoId, arquitectoId: a.id, zonaId: ped?.zonaId });
    // al rato el cliente la abre
    despues(9000, () => setPropuestas((ps) => ps.map((x) => (x.id === pr.id && x.estado === "enviada" ? { ...x, estado: "vista" } : x))));
  };

  const retirarPropuesta = async (id: string) => {
    await espera(LATENCIA / 2);
    setPropuestas((ps) => ps.map((x) => (x.id === id ? { ...x, estado: "retirada" } : x)));
    toast("Retiraste la propuesta. No cuenta para tu límite del mes.", "info");
  };

  const cambiarPlan = async (p: PlanId) => {
    const a = yo.arquitecto;
    if (!a) return;
    const plan = planes.find((x) => x.id === p)!;
    await espera(1200);
    setArquitectos((as) =>
      as.map((x) => {
        if (x.id !== a.id) return x;
        const sigueEnPrueba = x.estadoPlan === "prueba";
        return { ...x, plan: p, estadoPlan: sigueEnPrueba ? "prueba" : "activo", zonas: x.zonas.slice(0, plan.zonasMax) };
      }),
    );
    toast(a.estadoPlan === "prueba" ? `Ahora pruebas el plan ${plan.nombre}. El primer cobro sigue siendo al terminar la prueba.` : `Cambiaste al plan ${plan.nombre}.`);
    registrar(`${a.nombre} pasó al plan ${plan.nombre}`, "plan");
  };

  const cancelarPrueba = async () => {
    const a = yo.arquitecto;
    if (!a) return;
    await espera(900);
    setArquitectos((as) => as.map((x) => (x.id === a.id ? { ...x, estadoPlan: "cancelado", pruebaHasta: null } : x)));
    toast("Cancelaste la prueba. No se te cobrará nada.", "info");
    registrar(`${a.nombre} canceló la prueba`, "plan");
  };

  const guardarZonasArq = async (zs: string[]) => {
    const a = yo.arquitecto;
    if (!a) return;
    const plan = planes.find((x) => x.id === a.plan)!;
    if (!zs.length) throw new ErrorValidacion("Elige al menos una zona.");
    if (zs.length > plan.zonasMax) throw new ErrorValidacion(`Tu plan ${plan.nombre} cubre hasta ${plan.zonasMax} ${plan.zonasMax === 1 ? "zona" : "zonas"}.`);
    await espera(LATENCIA);
    setArquitectos((as) => as.map((x) => (x.id === a.id ? { ...x, zonas: zs } : x)));
    toast("Zonas actualizadas. Verás los pedidos nuevos de esos barrios.");
  };

  const agregarTrabajo = async (fotoK: string, titulo: string, tipo: Especialidad) => {
    if (titulo.trim().length < 4) throw new ErrorValidacion("Ponle un título a la obra.");
    await espera(LATENCIA);
    setArquitectos((as) => as.map((x) => (x.id === ARQUITECTO_ACTUAL ? { ...x, portafolio: [{ id: uid("tp"), foto: fotoK, titulo: titulo.trim(), tipo }, ...x.portafolio] } : x)));
    toast("Obra agregada al portafolio");
  };
  const quitarTrabajo = (id: string) => {
    setArquitectos((as) => as.map((x) => (x.id === ARQUITECTO_ACTUAL ? { ...x, portafolio: x.portafolio.filter((t) => t.id !== id) } : x)));
    toast("Obra quitada del portafolio", "info");
  };

  /* ---------- panel ---------- */

  const marcarContactado = async (pedidoId: string) => {
    await espera(LATENCIA / 2);
    setPedidos((ps) => ps.map((p) => (p.id === pedidoId ? { ...p, contactado: true } : p)));
    const p = pedidos.find((x) => x.id === pedidoId);
    registrar(`Operaciones llamó a arquitectos por ${p?.titulo}`, "equipo");
    toast("Marcado como contactado");
  };
  const moderarPedido = async (id: string, visible: boolean) => {
    await espera(LATENCIA);
    setPedidos((ps) => ps.map((p) => (p.id === id ? { ...p, estado: visible ? (p.elegidoId ? "elegido" : "abierto") : "oculto" } : p)));
    toast(visible ? "Pedido visible otra vez" : "Pedido oculto para los arquitectos", "info");
  };
  const eliminarPedido = async (id: string) => {
    await espera(LATENCIA);
    setPedidos((ps) => ps.filter((p) => p.id !== id));
    setPropuestas((ps) => ps.filter((p) => p.pedidoId !== id));
    toast("Pedido eliminado", "info");
  };
  const verificarArquitecto = async (id: string) => {
    await espera(LATENCIA);
    setArquitectos((as) => as.map((a) => (a.id === id ? { ...a, verificado: true } : a)));
    const a = arquitectos.find((x) => x.id === id);
    registrar(`Se verificó la matrícula de ${a?.nombre}`, "equipo");
    toast("Matrícula verificada. Ya aparece con la insignia.");
  };
  const suspenderArquitecto = async (id: string, s: boolean) => {
    await espera(LATENCIA);
    setArquitectos((as) => as.map((a) => (a.id === id ? { ...a, suspendido: s } : a)));
    toast(s ? "Cuenta suspendida: deja de ver pedidos" : "Cuenta reactivada", "info");
  };
  const guardarArquitecto = async (a: Arquitecto, nuevo: boolean) => {
    if (a.nombre.trim().length < 3) throw new ErrorValidacion("Escribe el nombre completo.");
    if (a.estudio.trim().length < 2) throw new ErrorValidacion("Escribe el nombre del estudio.");
    if (!a.zonas.length) throw new ErrorValidacion("Elige al menos una zona de cobertura.");
    const plan = planes.find((p) => p.id === a.plan)!;
    if (a.zonas.length > plan.zonasMax) throw new ErrorValidacion(`El plan ${plan.nombre} cubre hasta ${plan.zonasMax} ${plan.zonasMax === 1 ? "zona" : "zonas"}.`);
    await espera(LATENCIA);
    if (nuevo) setArquitectos((as) => [a, ...as]);
    else setArquitectos((as) => as.map((x) => (x.id === a.id ? a : x)));
    toast(nuevo ? "Arquitecto dado de alta, con 30 días de prueba" : "Cambios guardados");
  };
  const eliminarArquitecto = async (id: string) => {
    await espera(LATENCIA);
    setArquitectos((as) => as.filter((a) => a.id !== id));
    toast("Arquitecto eliminado", "info");
  };
  const cambiarEstadoZona = async (id: string, estado: EstadoZona) => {
    const z = zonas.find((x) => x.id === id);
    if (!z) return;
    const cubren = arquitectos.filter((a) => a.zonas.includes(id) && !a.suspendido && a.estadoPlan !== "cancelado").length;
    if (estado === "abierta" && cubren === 0) throw new ErrorValidacion(`${z.nombre} no tiene arquitectos todavía. Abrirla dejaría a los clientes esperando sin respuesta.`);
    await espera(900);
    setZonas((zs) => zs.map((x) => (x.id === id ? { ...x, estado, enEspera: estado === "abierta" ? 0 : x.enEspera } : x)));
    if (estado === "abierta") {
      setPedidos((ps) => ps.map((p) => (p.zonaId === id && p.estado === "espera" ? { ...p, estado: "abierto", creado: new Date().toISOString() } : p)));
      toast(`${z.nombre} abierta. Avisamos a ${z.enEspera} ${z.enEspera === 1 ? "cliente" : "clientes"} en espera y a ${cubren} ${cubren === 1 ? "arquitecto" : "arquitectos"}.`);
      registrar(`Se abrió la zona ${z.nombre}`, "zona");
    } else {
      toast(`${z.nombre} queda en espera. Los pedidos nuevos se guardan hasta que abra.`, "info");
      registrar(`${z.nombre} pasó a espera`, "zona");
    }
    emitir3D({ tipo: "zona", zonaId: id, estado });
  };
  const crearZona = async (nombre: string, ciudadId: string) => {
    if (nombre.trim().length < 3) throw new ErrorValidacion("Escribe el nombre del barrio.");
    const deCiudad = zonas.filter((z) => z.ciudadId === ciudadId);
    if (deCiudad.some((z) => z.nombre.toLowerCase() === nombre.trim().toLowerCase())) throw new ErrorValidacion("Esa zona ya existe en la ciudad.");
    await espera(LATENCIA);
    const n = deCiudad.length;
    setZonas((zs) => [...zs, { id: uid("z"), nombre: nombre.trim(), ciudadId, estado: "espera", celda: [n % 3, Math.floor(n / 3)], enEspera: 0 }]);
    toast("Zona creada en espera. Ábrela cuando tenga arquitectos.");
  };
  const guardarPlan = async (p: Plan) => {
    if (p.precioUsd < 1) throw new ErrorValidacion("El precio tiene que ser mayor que cero.");
    if (p.zonasMax < 1 || p.propuestasMes < 1) throw new ErrorValidacion("Zonas y propuestas tienen que ser al menos 1.");
    if (p.pruebaDias < 0 || p.pruebaDias > 90) throw new ErrorValidacion("La prueba va de 0 a 90 días.");
    await espera(LATENCIA);
    setPlanes((ps) => ps.map((x) => (x.id === p.id ? p : x)));
    toast(`Plan ${p.nombre} actualizado. Se publica también en las tiendas.`);
  };
  const guardarAnuncio = async (a: Anuncio) => {
    if (a.anunciante.trim().length < 2 || a.titulo.trim().length < 4) throw new ErrorValidacion("Completa anunciante y título.");
    if (a.titulo.length > 42) throw new ErrorValidacion("El título se corta en el celular: máximo 42 caracteres.");
    await espera(LATENCIA);
    setAnuncios((as) => (as.some((x) => x.id === a.id) ? as.map((x) => (x.id === a.id ? a : x)) : [...as, a]));
    toast("Anuncio guardado");
  };
  const activarAnuncio = async (id: string) => {
    const a = anuncios.find((x) => x.id === id);
    if (!a) return;
    await espera(LATENCIA / 2);
    setAnuncios((as) => as.map((x) => (x.espacio === a.espacio ? { ...x, activo: x.id === id } : x)));
    toast(`${a.anunciante} ahora ocupa ese espacio`);
  };
  const apagarAnuncio = async (id: string) => {
    await espera(LATENCIA / 2);
    setAnuncios((as) => as.map((x) => (x.id === id ? { ...x, activo: false } : x)));
    toast("Espacio sin anuncio: la app muestra contenido propio", "info");
  };
  const contarImpresion = (id: string) => {
    if (impresiones.current.has(id)) return;
    impresiones.current.add(id);
    setAnuncios((as) => as.map((x) => (x.id === id ? { ...x, impresiones: x.impresiones + 1 } : x)));
  };

  const valor: Ctx = {
    listo,
    ahora,
    zonas,
    arquitectos,
    clientes,
    pedidos,
    propuestas,
    conversaciones,
    resenas,
    planes,
    anuncios,
    actividad,
    rol,
    setRol,
    tabCliente,
    irCliente,
    tabArq,
    irArq,
    pedidoSel,
    abrirPedido,
    arquitectoSel,
    abrirArquitecto: setArquitectoSel,
    conversacionSel,
    abrirConversacion: (id) => {
      setConversacionSel(id);
      if (id) setConversaciones((cs) => cs.map((c) => (c.id === id ? { ...c, leida: true } : c)));
    },
    escribiendo,
    foco,
    enfocar: setFoco,
    ciudadPanel,
    setCiudadPanel,
    biometria,
    alternarBiometria: (r) => {
      setBiometria((b) => ({ ...b, [r]: !b[r] }));
      toast(biometria[r] ? "Entrarás con tu contraseña" : "Listo: entras con Face ID o huella", "info");
    },
    toasts,
    toast,
    yo,
    publicarPedido,
    elegirPropuesta,
    descartarPropuesta,
    calificar,
    conversacionCon,
    enviarMensaje,
    enviarPropuesta,
    retirarPropuesta,
    propuestasUsadasMes,
    cambiarPlan,
    cancelarPrueba,
    guardarZonasArq,
    agregarTrabajo,
    quitarTrabajo,
    marcarContactado,
    moderarPedido,
    eliminarPedido,
    verificarArquitecto,
    suspenderArquitecto,
    guardarArquitecto,
    eliminarArquitecto,
    cambiarEstadoZona,
    crearZona,
    guardarPlan,
    guardarAnuncio,
    activarAnuncio,
    apagarAnuncio,
    contarImpresion,
  };

  return <StoreCtx.Provider value={valor}>{children}</StoreCtx.Provider>;
}

export const DIAS_PRUEBA_TOTAL = 30;
export const ciudadPorId = (id: string) => CIUDADES.find((c) => c.id === id) ?? CIUDADES[0];
export const msDia = DIA;

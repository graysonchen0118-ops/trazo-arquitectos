import type { Ciudad, EstadoPedido, EstadoPlan, EstadoPropuesta, Especialidad, Inicio, Presupuesto } from "./types";

export const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const uid = (p = "id") => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const HORA = 3600_000;
export const DIA = 24 * HORA;

/** monto en la moneda de la ciudad, sin decimales */
export function plata(n: number, c: Ciudad) {
  const v = Math.round(n).toLocaleString(c.locale, { maximumFractionDigits: 0 });
  return `${c.moneda === "PEN" ? "S/" : "$"} ${v}`;
}

export function rangoPlata(min: number, max: number, c: Ciudad) {
  return `${plata(min, c)} a ${plata(max, c)}`;
}

export const usd = (n: number) => `USD ${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

/** redondea un honorario a un número que un arquitecto escribiría */
export function redondo(n: number) {
  if (n >= 1_000_000) return Math.round(n / 50_000) * 50_000;
  if (n >= 100_000) return Math.round(n / 5_000) * 5_000;
  if (n >= 10_000) return Math.round(n / 500) * 500;
  return Math.round(n / 50) * 50;
}

export function hace(iso: string, ahora: Date) {
  const ms = ahora.getTime() - new Date(iso).getTime();
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return d === 1 ? "ayer" : `hace ${d} días`;
  const mes = Math.round(d / 30);
  return mes === 1 ? "hace un mes" : `hace ${mes} meses`;
}

export const horasDesde = (iso: string, ahora: Date) => (ahora.getTime() - new Date(iso).getTime()) / HORA;

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function fecha(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
export function fechaCorta(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}
export function hora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
export function diasHasta(iso: string, ahora: Date) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - ahora.getTime()) / DIA));
}

export const ESPECIALIDADES: Record<Especialidad, { nombre: string; corto: string }> = {
  cocina: { nombre: "Cocina", corto: "Cocina" },
  bano: { nombre: "Baño", corto: "Baño" },
  ampliacion: { nombre: "Ampliación", corto: "Ampliación" },
  remodelacion: { nombre: "Remodelación completa", corto: "Remodelación" },
  fachada: { nombre: "Fachada", corto: "Fachada" },
  exterior: { nombre: "Terraza o patio", corto: "Exterior" },
  interiorismo: { nombre: "Interiorismo", corto: "Interiores" },
  "obra-nueva": { nombre: "Obra nueva", corto: "Obra nueva" },
};
export const LISTA_ESPECIALIDADES = Object.keys(ESPECIALIDADES) as Especialidad[];

export const PRESUPUESTOS: Record<Presupuesto, string> = {
  chico: "Arreglo acotado",
  medio: "Obra mediana",
  grande: "Obra grande",
  "sin-definir": "Todavía no sé",
};

export const INICIOS: Record<Inicio, string> = {
  pronto: "Lo antes posible",
  meses: "En 1 a 3 meses",
  explorando: "Solo estoy explorando",
};

export const ESTADO_PEDIDO: Record<EstadoPedido, { texto: string; clase: string }> = {
  abierto: { texto: "Recibe propuestas", clase: "info" },
  elegido: { texto: "Arquitecto elegido", clase: "ok" },
  cerrado: { texto: "Obra cerrada", clase: "gris" },
  espera: { texto: "Zona por abrir", clase: "aviso" },
  oculto: { texto: "Oculto", clase: "apagado" },
};

export const ESTADO_PROPUESTA: Record<EstadoPropuesta, { texto: string; clase: string }> = {
  enviada: { texto: "Enviada", clase: "info" },
  vista: { texto: "Vista por el cliente", clase: "aviso" },
  elegida: { texto: "Elegida", clase: "ok" },
  descartada: { texto: "No elegida", clase: "gris" },
  retirada: { texto: "Retirada", clase: "apagado" },
};

export const ESTADO_PLAN: Record<EstadoPlan, { texto: string; clase: string }> = {
  prueba: { texto: "En prueba", clase: "info" },
  activo: { texto: "Pagando", clase: "ok" },
  vencido: { texto: "Cobro pendiente", clase: "aviso" },
  cancelado: { texto: "Canceló", clase: "apagado" },
};

export const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString("es-MX")} ${n === 1 ? uno : varios}`;

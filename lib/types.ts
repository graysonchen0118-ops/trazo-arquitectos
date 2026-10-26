// Modelos con la forma que devolvería la API real: el día que exista el backend,
// las pantallas siguen leyendo exactamente estos tipos.

export type Moneda = "MXN" | "COP" | "PEN" | "CLP";

export interface Ciudad {
  id: string;
  nombre: string;
  pais: string;
  moneda: Moneda;
  locale: string;
  /** cuántas unidades locales vale un dólar, para generar honorarios coherentes */
  tasa: number;
}

export type EstadoZona = "abierta" | "espera";

export interface Zona {
  id: string;
  nombre: string;
  ciudadId: string;
  estado: EstadoZona;
  /** posición del barrio en la maqueta 3D, en una grilla de 3 x 2 */
  celda: [number, number];
  /** clientes que publicaron mientras la zona estaba en espera */
  enEspera: number;
}

export type Especialidad = "cocina" | "bano" | "ampliacion" | "remodelacion" | "fachada" | "exterior" | "interiorismo" | "obra-nueva";

export type PlanId = "basico" | "profesional" | "estudio";
export type EstadoPlan = "prueba" | "activo" | "vencido" | "cancelado";

export interface Plan {
  id: PlanId;
  nombre: string;
  precioUsd: number;
  zonasMax: number;
  propuestasMes: number;
  destacado: boolean;
  pruebaDias: number;
  bajada: string;
}

export interface TrabajoPortafolio {
  id: string;
  foto: string;
  titulo: string;
  tipo: Especialidad;
}

export interface Arquitecto {
  id: string;
  nombre: string;
  estudio: string;
  foto: string;
  ciudadId: string;
  zonas: string[];
  especialidades: Especialidad[];
  matricula: string;
  verificado: boolean;
  plan: PlanId;
  estadoPlan: EstadoPlan;
  /** fin de la prueba gratis, si está en prueba */
  pruebaHasta: string | null;
  alta: string;
  nota: number;
  resenas: number;
  respondeHoras: number;
  anios: number;
  telefono: string;
  bio: string;
  portafolio: TrabajoPortafolio[];
  suspendido: boolean;
}

export interface Cliente {
  id: string;
  nombre: string;
  foto: string;
  zonaId: string;
  alta: string;
}

export type EstadoPedido = "abierto" | "elegido" | "cerrado" | "espera" | "oculto";
export type Presupuesto = "chico" | "medio" | "grande" | "sin-definir";
export type Inicio = "pronto" | "meses" | "explorando";

export interface Pedido {
  id: string;
  clienteId: string;
  titulo: string;
  tipo: Especialidad;
  descripcion: string;
  fotos: string[];
  zonaId: string;
  metros: number | null;
  presupuesto: Presupuesto;
  inicio: Inicio;
  creado: string;
  estado: EstadoPedido;
  elegidoId: string | null;
  /** el equipo ya llamó a arquitectos de la zona por este pedido */
  contactado: boolean;
  calificado: boolean;
}

export type EstadoPropuesta = "enviada" | "vista" | "elegida" | "descartada" | "retirada";

export interface Propuesta {
  id: string;
  pedidoId: string;
  arquitectoId: string;
  honorarioMin: number;
  honorarioMax: number;
  plazoSemanas: number;
  mensaje: string;
  imagenes: string[];
  enviada: string;
  estado: EstadoPropuesta;
}

export interface Mensaje {
  id: string;
  de: "cliente" | "arquitecto";
  texto: string;
  en: string;
}

export interface Conversacion {
  id: string;
  pedidoId: string;
  arquitectoId: string;
  clienteId: string;
  mensajes: Mensaje[];
  leida: boolean;
}

export interface Resena {
  id: string;
  arquitectoId: string;
  cliente: string;
  clienteFoto: string;
  nota: number;
  texto: string;
  fecha: string;
  obra: string;
}

export type EspacioAnuncio = "inicio-cliente" | "pedidos-arquitecto";

export interface Anuncio {
  id: string;
  espacio: EspacioAnuncio;
  anunciante: string;
  titulo: string;
  texto: string;
  foto: string;
  activo: boolean;
  impresiones: number;
  clics: number;
}

export interface Actividad {
  id: string;
  texto: string;
  en: string;
  tipo: "pedido" | "propuesta" | "plan" | "zona" | "equipo";
}

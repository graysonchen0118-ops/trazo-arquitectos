import type { Arquitecto, EstadoPlan, Especialidad, PlanId, TrabajoPortafolio } from "../types";
import { DIA, mulberry32 } from "../format";
import { proyectosDe } from "../photos";
import { crearZonas } from "./ciudades";

type Fila = [
  id: string,
  nombre: string,
  estudio: string,
  ciudadId: string,
  zonas: string[],
  esp: Especialidad[],
  plan: PlanId,
  estado: EstadoPlan,
  pruebaDias: number | null,
  nota: number,
  resenas: number,
  respondeHoras: number,
  anios: number,
  verificado: boolean,
];

const FILAS: Fila[] = [
  ["a1", "Daniela Ríos", "Taller Ríos", "cdmx", ["coyoacan", "del-valle"], ["cocina", "remodelacion", "interiorismo"], "profesional", "prueba", 18, 4.8, 23, 3, 9, true],
  ["a2", "Rodrigo Salas", "Salas Arquitectura", "cdmx", ["coyoacan", "narvarte", "del-valle"], ["ampliacion", "obra-nueva", "fachada"], "estudio", "activo", null, 4.9, 41, 2, 15, true],
  ["a3", "Valeria Montes", "Estudio Montes", "cdmx", ["roma-norte", "del-valle"], ["interiorismo", "cocina", "bano"], "profesional", "activo", null, 4.7, 18, 5, 6, true],
  ["a4", "Iván Castañeda", "Taller Ceiba", "cdmx", ["coyoacan", "tlalpan"], ["exterior", "ampliacion"], "profesional", "activo", null, 4.6, 27, 4, 11, true],
  ["a5", "Lucía Arellano", "Casa Patio Arquitectos", "cdmx", ["roma-norte", "narvarte", "coyoacan"], ["remodelacion", "fachada", "exterior"], "estudio", "activo", null, 4.9, 52, 1.5, 18, true],
  ["a6", "Héctor Villalobos", "HV Taller", "cdmx", ["narvarte"], ["bano", "cocina"], "basico", "prueba", 6, 4.4, 7, 9, 4, true],
  ["a7", "Mónica Zárate", "Ocre Arquitectura", "cdmx", ["del-valle", "narvarte"], ["interiorismo", "remodelacion"], "profesional", "vencido", null, 4.5, 12, 8, 7, true],
  ["a8", "Emilio Fuentes", "Planta Baja Estudio", "cdmx", ["coyoacan"], ["ampliacion", "remodelacion"], "basico", "activo", null, 4.3, 9, 12, 5, true],
  ["a9", "Sofía Garduño", "Estudio Alero", "cdmx", ["roma-norte"], ["fachada", "interiorismo"], "basico", "prueba", 24, 5.0, 3, 4, 3, true],
  ["a10", "Arturo Méndez", "Méndez y Lara", "cdmx", ["tlalpan", "coyoacan"], ["obra-nueva", "ampliacion"], "profesional", "prueba", 11, 4.6, 15, 6, 20, true],
  ["a11", "Paola Quiroga", "Línea Blanca Estudio", "cdmx", ["del-valle", "roma-norte", "narvarte"], ["cocina", "bano", "interiorismo"], "estudio", "activo", null, 4.8, 36, 2.5, 12, true],
  ["a12", "Jorge Ledesma", "Taller Mezquite", "cdmx", ["santa-fe"], ["obra-nueva", "remodelacion"], "basico", "prueba", 27, 0, 0, 0, 2, false],
  ["b1", "Camila Restrepo", "Restrepo Taller", "bogota", ["chapinero", "teusaquillo"], ["remodelacion", "interiorismo"], "profesional", "activo", null, 4.8, 29, 3, 10, true],
  ["b2", "Andrés Mejía", "Mejía Arquitectos", "bogota", ["usaquen", "cedritos"], ["ampliacion", "obra-nueva"], "estudio", "activo", null, 4.7, 33, 4, 16, true],
  ["b3", "Natalia Ospina", "Estudio Guadua", "bogota", ["chapinero"], ["cocina", "bano"], "basico", "prueba", 9, 4.5, 6, 7, 5, true],
  ["b4", "Felipe Arango", "Arango Diseño", "bogota", ["teusaquillo", "chapinero"], ["fachada", "remodelacion"], "profesional", "vencido", null, 4.2, 10, 15, 8, true],
  ["b5", "Laura Cifuentes", "Taller Sabana", "bogota", ["cedritos", "usaquen"], ["interiorismo", "cocina"], "profesional", "prueba", 21, 4.9, 11, 2, 7, true],
  ["b6", "Santiago Murillo", "Murillo Estudio", "bogota", ["usaquen"], ["exterior", "ampliacion"], "basico", "activo", null, 4.4, 8, 10, 6, true],
  ["b7", "Juliana Torres", "Planta Libre", "bogota", ["suba"], ["remodelacion", "cocina"], "basico", "prueba", 14, 0, 0, 0, 3, false],
  ["b8", "Mauricio Lozano", "Lozano y Vélez", "bogota", ["chapinero", "usaquen", "teusaquillo"], ["obra-nueva", "ampliacion", "fachada"], "estudio", "activo", null, 4.6, 24, 5, 22, true],
  ["l1", "Carla Vargas", "Vargas Taller", "lima", ["miraflores", "san-isidro"], ["interiorismo", "cocina"], "profesional", "activo", null, 4.8, 21, 3, 9, true],
  ["l2", "Diego Salazar", "Estudio Huaca", "lima", ["surco"], ["ampliacion", "obra-nueva"], "profesional", "prueba", 16, 4.6, 9, 6, 12, true],
  ["l3", "Gabriela Chávez", "Chávez Arquitectura", "lima", ["miraflores", "barranco"], ["remodelacion", "fachada"], "basico", "activo", null, 4.5, 13, 8, 7, true],
  ["l4", "Renzo Paredes", "Taller Malecón", "lima", ["san-isidro", "miraflores", "surco"], ["obra-nueva", "remodelacion"], "estudio", "activo", null, 4.7, 30, 4, 17, true],
  ["l5", "Ana Lucía Rojas", "Rojas Interiores", "lima", ["la-molina"], ["interiorismo", "bano"], "basico", "prueba", 29, 0, 0, 0, 4, false],
  ["l6", "Martín Huamán", "Huamán Estudio", "lima", ["surco", "san-isidro"], ["exterior", "cocina", "bano"], "basico", "cancelado", null, 4.1, 5, 20, 5, true],
  ["s1", "Francisca Soto", "Soto Pizarro Arquitectos", "santiago", ["nunoa", "providencia"], ["remodelacion", "interiorismo"], "profesional", "prueba", 25, 0, 0, 0, 8, true],
  ["s2", "Ignacio Fuentealba", "Taller Andes", "santiago", ["las-condes", "vitacura"], ["obra-nueva", "ampliacion"], "estudio", "prueba", 28, 0, 0, 0, 14, true],
  ["s3", "Josefina Araya", "Estudio Patio", "santiago", ["nunoa"], ["exterior", "ampliacion"], "basico", "prueba", 30, 0, 0, 0, 5, false],
  ["s4", "Cristóbal Muñoz", "Muñoz Arquitectos", "santiago", ["maipu"], ["ampliacion", "remodelacion"], "basico", "prueba", 22, 0, 0, 0, 6, false],
];

const BIOS: Record<string, string> = {
  a1: "Me gustan las casas que ya tienen historia. Abro cocinas, ordeno la luz y trato de que la obra se haga con la familia viviendo adentro.",
  a2: "Ampliaciones y casas nuevas. Antes de dibujar reviso la estructura existente, porque un segundo piso empieza por lo que ya está abajo.",
  a3: "Interiores de departamentos chicos donde cada metro tiene que trabajar. Cocinas y baños son mi especialidad.",
  a4: "Terrazas, patios y ampliaciones ligeras. Trabajo mucho con madera, vegetación y sombra.",
  a5: "Remodelaciones completas de casas de los años 50 a 80 en la Roma, Narvarte y Coyoacán. Fachadas que respetan el barrio.",
  a11: "Cocinas y baños con plazos cortos. Entrego planos, despiece y lista de materiales lista para cotizar.",
  b1: "Remodelación de casas tradicionales de Teusaquillo y apartamentos en Chapinero. Ladrillo a la vista cuando se puede.",
  b2: "Ampliaciones con licencia en regla. Me ocupo del trámite con la curaduría desde el primer plano.",
  l1: "Departamentos frente al mar y casas de Miraflores. Interiores cálidos que aguantan la humedad de Lima.",
  l4: "Casas nuevas y remodelaciones grandes. Equipo propio de obra y seguimiento semanal con fotos.",
};

const TITULOS: Record<Especialidad, string[]> = {
  cocina: ["Cocina abierta al comedor", "Cocina en L con barra", "Cocina con isla de granito", "Cocina de departamento"],
  bano: ["Baño principal con luz cenital", "Baño de visitas renovado", "Baño con ducha abierta"],
  ampliacion: ["Segundo piso sobre la cochera", "Cuarto extra en la azotea", "Ampliación hacia el patio"],
  remodelacion: ["Casa de los años 70 completa", "Departamento con muros abiertos", "Casa familiar puesta al día"],
  fachada: ["Fachada con celosía", "Fachada y acceso nuevos", "Frente de casa con jardinera"],
  exterior: ["Terraza con pérgola", "Patio con jardín seco", "Azotea habitable"],
  interiorismo: ["Estancia con biblioteca", "Sala y comedor integrados", "Estudio en casa"],
  "obra-nueva": ["Casa de dos niveles", "Casa en terreno angosto", "Casa con patio central"],
};

const TELEFONO: Record<string, (r: () => number) => string> = {
  cdmx: (r) => `+52 55 ${n4(r)} ${n4(r)}`,
  bogota: (r) => `+57 3${Math.floor(r() * 30 + 10)} ${n3(r)} ${n4(r)}`,
  lima: (r) => `+51 9${Math.floor(r() * 90 + 10)} ${n3(r)} ${n3(r)}`,
  santiago: (r) => `+56 9 ${n4(r)} ${n4(r)}`,
};
const n3 = (r: () => number) => String(Math.floor(r() * 900 + 100));
const n4 = (r: () => number) => String(Math.floor(r() * 9000 + 1000));

const MATRICULA: Record<string, (r: () => number) => string> = {
  cdmx: (r) => `Cédula ${Math.floor(r() * 4_000_000 + 6_000_000)}`,
  bogota: (r) => `Matrícula A25${Math.floor(r() * 900_000 + 100_000)}`,
  lima: (r) => `CAP ${Math.floor(r() * 18_000 + 4_000)}`,
  santiago: (r) => `Registro ${Math.floor(r() * 9_000 + 1_000)}-${Math.floor(r() * 9)}`,
};

export function crearArquitectos(ahora: Date): Arquitecto[] {
  const zonas = crearZonas();
  return FILAS.map((f, i) => {
    const [id, nombre, estudio, ciudadId, zs, esp, plan, estadoPlan, pruebaDias, nota, resenas, respondeHoras, anios, verificado] = f;
    const r = mulberry32(i * 7919 + 17);
    const portafolio: TrabajoPortafolio[] = [];
    const usadas = new Set<string>();
    for (let k = 0; k < 6; k++) {
      const tipo = esp[k % esp.length];
      const pool = proyectosDe(tipo).filter((p) => !usadas.has(p));
      const fotoK = pool.length ? pool[Math.floor(r() * pool.length)] : proyectosDe(tipo)[k % proyectosDe(tipo).length];
      usadas.add(fotoK);
      const zona = zonas.find((z) => z.id === zs[k % zs.length]);
      const t = TITULOS[tipo][Math.floor(r() * TITULOS[tipo].length)];
      portafolio.push({ id: `${id}-p${k}`, foto: fotoK, titulo: `${t}, ${zona?.nombre ?? ""}`, tipo });
    }
    const altaDias = pruebaDias !== null ? 30 - pruebaDias : Math.floor(r() * 500 + 90);
    return {
      id,
      nombre,
      estudio,
      foto: `av-${id}`,
      ciudadId,
      zonas: zs,
      especialidades: esp,
      matricula: MATRICULA[ciudadId](r),
      verificado,
      plan,
      estadoPlan,
      pruebaHasta: pruebaDias !== null ? new Date(ahora.getTime() + pruebaDias * DIA).toISOString() : null,
      alta: new Date(ahora.getTime() - altaDias * DIA).toISOString(),
      nota,
      resenas,
      respondeHoras,
      anios,
      telefono: TELEFONO[ciudadId](r),
      bio: BIOS[id] ?? `${esp.length > 1 ? "Trabajo sobre todo" : "Me dedico a"} ${esp.map((e) => TITULO_CORTO[e]).join(", ")}. Visito la casa antes de cerrar cualquier número.`,
      portafolio,
      suspendido: false,
    };
  });
}

const TITULO_CORTO: Record<Especialidad, string> = {
  cocina: "cocinas",
  bano: "baños",
  ampliacion: "ampliaciones",
  remodelacion: "remodelaciones completas",
  fachada: "fachadas",
  exterior: "terrazas y patios",
  interiorismo: "interiorismo",
  "obra-nueva": "casas nuevas",
};

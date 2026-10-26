import type { Ciudad, Zona } from "../types";

export const CIUDADES: Ciudad[] = [
  { id: "cdmx", nombre: "Ciudad de México", pais: "México", moneda: "MXN", locale: "es-MX", tasa: 18 },
  { id: "bogota", nombre: "Bogotá", pais: "Colombia", moneda: "COP", locale: "es-CO", tasa: 4000 },
  { id: "lima", nombre: "Lima", pais: "Perú", moneda: "PEN", locale: "es-PE", tasa: 3.75 },
  { id: "santiago", nombre: "Santiago", pais: "Chile", moneda: "CLP", locale: "es-CL", tasa: 950 },
];

export const ciudadDe = (id: string) => CIUDADES.find((c) => c.id === id) ?? CIUDADES[0];

export function crearZonas(): Zona[] {
  const z = (id: string, nombre: string, ciudadId: string, estado: Zona["estado"], celda: [number, number], enEspera = 0): Zona => ({ id, nombre, ciudadId, estado, celda, enEspera });
  return [
    z("coyoacan", "Coyoacán", "cdmx", "abierta", [0, 0]),
    z("del-valle", "Del Valle", "cdmx", "abierta", [1, 0]),
    z("narvarte", "Narvarte", "cdmx", "abierta", [2, 0]),
    z("roma-norte", "Roma Norte", "cdmx", "abierta", [0, 1]),
    z("tlalpan", "Tlalpan", "cdmx", "espera", [1, 1], 6),
    z("santa-fe", "Santa Fe", "cdmx", "espera", [2, 1], 3),
    z("chapinero", "Chapinero", "bogota", "abierta", [0, 0]),
    z("usaquen", "Usaquén", "bogota", "abierta", [1, 0]),
    z("teusaquillo", "Teusaquillo", "bogota", "abierta", [2, 0]),
    z("cedritos", "Cedritos", "bogota", "abierta", [0, 1]),
    z("suba", "Suba", "bogota", "espera", [1, 1], 4),
    z("salitre", "Salitre", "bogota", "espera", [2, 1], 1),
    z("miraflores", "Miraflores", "lima", "abierta", [0, 0]),
    z("san-isidro", "San Isidro", "lima", "abierta", [1, 0]),
    z("surco", "Surco", "lima", "abierta", [2, 0]),
    z("barranco", "Barranco", "lima", "espera", [0, 1], 5),
    z("la-molina", "La Molina", "lima", "espera", [1, 1], 2),
    z("jesus-maria", "Jesús María", "lima", "espera", [2, 1], 0),
    z("nunoa", "Ñuñoa", "santiago", "espera", [0, 0], 7),
    z("providencia", "Providencia", "santiago", "espera", [1, 0], 4),
    z("la-reina", "La Reina", "santiago", "espera", [2, 0], 2),
    z("las-condes", "Las Condes", "santiago", "espera", [0, 1], 3),
    z("maipu", "Maipú", "santiago", "espera", [1, 1], 1),
    z("vitacura", "Vitacura", "santiago", "espera", [2, 1], 0),
  ];
}

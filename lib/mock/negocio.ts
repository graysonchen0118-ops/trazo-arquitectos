import type { Actividad, Anuncio, Plan } from "../types";
import { HORA } from "../format";

export const PLANES_BASE: Plan[] = [
  { id: "basico", nombre: "Básico", precioUsd: 19, zonasMax: 1, propuestasMes: 8, destacado: false, pruebaDias: 30, bajada: "Para quien empieza a recibir obras por la app" },
  { id: "profesional", nombre: "Profesional", precioUsd: 39, zonasMax: 3, propuestasMes: 25, destacado: false, pruebaDias: 30, bajada: "Tres barrios y propuestas de sobra para un estudio chico" },
  { id: "estudio", nombre: "Estudio", precioUsd: 79, zonasMax: 6, propuestasMes: 999, destacado: true, pruebaDias: 30, bajada: "Toda la ciudad, sin tope de propuestas y perfil destacado" },
];

export function crearAnuncios(): Anuncio[] {
  return [
    {
      id: "an-1",
      espacio: "inicio-cliente",
      anunciante: "Azulejo Norte",
      titulo: "Porcelanato para cocina y baño",
      texto: "Muestras gratis en tu casa antes de decidir el piso",
      foto: "ad-1",
      activo: true,
      impresiones: 18420,
      clics: 412,
    },
    {
      id: "an-2",
      espacio: "pedidos-arquitecto",
      anunciante: "Centro de Materiales Ocre",
      titulo: "Entregas en obra el mismo día",
      texto: "Cotiza la lista de materiales de tu proyecto en una hora",
      foto: "ad-3",
      activo: true,
      impresiones: 6210,
      clics: 197,
    },
    {
      id: "an-3",
      espacio: "inicio-cliente",
      anunciante: "Pinturas Alba",
      titulo: "La carta de colores, en tu pantalla",
      texto: "Prueba el tono de tu fachada con una foto",
      foto: "ad-2",
      activo: false,
      impresiones: 9930,
      clics: 151,
    },
    {
      id: "an-4",
      espacio: "pedidos-arquitecto",
      anunciante: "Maderas del Sur",
      titulo: "Pisos de madera con instalación",
      texto: "Precio de lista para estudios registrados",
      foto: "ad-4",
      activo: false,
      impresiones: 2480,
      clics: 38,
    },
  ];
}

export const EQUIPO = [
  { nombre: "Andrea Paredes", rol: "Operaciones", foto: "eq-1" },
  { nombre: "Tomás Vidal", rol: "Soporte a arquitectos", foto: "eq-2" },
];

export function crearActividad(ahora: Date): Actividad[] {
  const a = (h: number, texto: string, tipo: Actividad["tipo"]): Actividad => ({ id: `act-${h}-${texto.length}`, texto, en: new Date(ahora.getTime() - h * HORA).toISOString(), tipo });
  return [
    a(0.4, "Daniela Ríos envió una propuesta para Abrir la cocina hacia el comedor", "propuesta"),
    a(1.2, "Nuevo pedido en Chapinero: Cocina abierta en apartamento de los 80", "pedido"),
    a(2.5, "Valeria Montes pasó del plan Básico al Profesional", "plan"),
    a(3.1, "Tomás Vidal verificó la matrícula de Rodrigo Salas", "equipo"),
    a(5.0, "Lima, Barranco: 5 clientes esperan que abra la zona", "zona"),
    a(7.8, "Gustavo Peña eligió a Taller Ceiba para su terraza", "pedido"),
    a(9.4, "Felipe Arango no renovó: la tarjeta fue rechazada", "plan"),
    a(12.0, "Andrea Paredes abrió la zona Cedritos en Bogotá", "zona"),
  ];
}

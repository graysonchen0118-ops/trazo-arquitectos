import type { Arquitecto, Cliente, Conversacion, Especialidad, EstadoPedido, Inicio, Pedido, Presupuesto, Propuesta, Resena } from "../types";
import { DIA, HORA, mulberry32, redondo } from "../format";
import { PLANOS, fotosAntesDe, proyectosDe } from "../photos";
import { CIUDADES, crearZonas } from "./ciudades";

// Los dos usuarios desde los que se recorre la app
export const CLIENTE_ACTUAL = "c1";
export const ARQUITECTO_ACTUAL = "a1";

type FilaCliente = [id: string, nombre: string, zonaId: string];
const CLIENTES: FilaCliente[] = [
  ["c1", "Mariana López", "coyoacan"],
  ["c2", "Gustavo Peña", "coyoacan"],
  ["c3", "Rocío Espinosa", "narvarte"],
  ["c4", "Fernando Ibarra", "del-valle"],
  ["c5", "Alejandra Ruiz", "roma-norte"],
  ["c6", "Patricio Gómez", "tlalpan"],
  ["c7", "Teresa Navarro", "narvarte"],
  ["c8", "Ricardo Olvera", "del-valle"],
  ["c9", "Elena Cárdenas", "coyoacan"],
  ["c10", "Óscar Delgado", "santa-fe"],
  ["c11", "Diana Pulido", "chapinero"],
  ["c12", "Hernán Rincón", "usaquen"],
  ["c13", "Marcela Duarte", "teusaquillo"],
  ["c14", "Sandra Becerra", "cedritos"],
  ["c15", "María Fernanda Gil", "suba"],
  ["c16", "Rosa Quispe", "miraflores"],
  ["c17", "Jimena Alvarado", "surco"],
  ["c18", "Pilar Benavides", "san-isidro"],
  ["c19", "Carmen Cáceres", "barranco"],
  ["c20", "Carolina Valdés", "nunoa"],
  ["c21", "Pablo Henríquez", "providencia"],
  ["c22", "Susana Aguilar", "roma-norte"],
  ["c23", "Ernesto Lira", "narvarte"],
  ["c24", "Beatriz Solano", "chapinero"],
];

// [id, cliente, tipo, título, descripción, horas desde que se publicó, estado, propuestas, metros, presupuesto, inicio]
type FilaPedido = [string, string, Especialidad, string, string, number, EstadoPedido, number, number | null, Presupuesto, Inicio];

const PEDIDOS: FilaPedido[] = [
  ["p1", "c1", "cocina", "Abrir la cocina hacia el comedor", "La cocina está encerrada y casi no entra luz. Quiero tirar el muro que da al comedor y poner una barra donde desayunar con los niños. La casa es de 1978 y no sé si ese muro carga.", 30, "abierto", 3, 14, "medio", "pronto"],
  ["p2", "c1", "exterior", "Terraza en la azotea", "La azotea hoy solo tiene los tinacos y la ropa tendida. Me gustaría una terraza con sombra para comer los domingos, sin que se filtre el agua al cuarto de abajo.", 20 * 24, "elegido", 4, 38, "medio", "meses"],
  ["p3", "c1", "bano", "Baño de visitas", "Baño chico junto a la entrada, con azulejo de los ochenta y una regadera que nadie usa. Quiero dejarlo como medio baño bonito.", 75 * 24, "cerrado", 3, 4, "chico", "pronto"],
  ["p4", "c2", "exterior", "Pérgola para el patio trasero", "Patio de 6 por 5 metros que en la tarde es un horno. Busco sombra y un lugar para una mesa larga.", 9 * 24, "elegido", 3, 30, "chico", "pronto"],
  ["p5", "c3", "fachada", "Fachada con humedad", "La fachada tiene manchas de humedad que vuelven cada temporada de lluvias. Quiero arreglarla de raíz y de paso cambiarle la cara a la casa.", 31, "abierto", 0, 48, "medio", "pronto"],
  ["p6", "c4", "remodelacion", "Departamento de los años 70 completo", "Compré un departamento en Del Valle con la distribución original: pasillo largo, cocina chica y tres recámaras. Quiero algo más abierto antes de mudarme.", 52, "abierto", 4, 96, "grande", "pronto"],
  ["p7", "c5", "interiorismo", "Sala y comedor para un departamento chico", "Departamento de 58 m² con buena luz pero los muebles no caben. Necesito ideas de distribución y muebles a medida.", 18, "abierto", 2, 58, "chico", "meses"],
  ["p8", "c7", "bano", "Baño principal que no se ventila", "El baño no tiene ventana y el espejo se llena de vapor en dos minutos. Quiero rehacerlo completo.", 27, "abierto", 0, 6, "medio", "pronto"],
  ["p9", "c8", "ampliacion", "Cuarto extra sobre la cochera", "Somos cuatro y la casa tiene dos recámaras. Hay espacio arriba de la cochera para un cuarto con baño.", 44, "abierto", 3, 20, "grande", "meses"],
  ["p10", "c9", "cocina", "Cocina integral con más guardado", "La cocina funciona pero no hay dónde guardar nada. Busco cocina integral nueva aprovechando la altura.", 6, "abierto", 1, 11, "medio", "pronto"],
  ["p11", "c22", "fachada", "Cambiar la cara de la casa", "Casa de dos pisos con fachada gris y una reja enorme. Queremos que se vea cálida sin perder seguridad.", 36, "abierto", 2, 40, "medio", "meses"],
  ["p12", "c23", "remodelacion", "Casa heredada en Narvarte", "Heredamos la casa de mis papás y queremos vivir ahí. Está bien construida pero todo quedó en los ochenta.", 26, "abierto", 0, 160, "grande", "explorando"],
  ["p13", "c6", "ampliacion", "Segundo piso en Tlalpan", "Terreno de 200 m² con casa de un piso. Queremos subir un segundo nivel para mis suegros.", 4 * 24, "espera", 0, 70, "grande", "meses"],
  ["p14", "c10", "obra-nueva", "Casa nueva en terreno con pendiente", "Tenemos un terreno con bastante pendiente en Santa Fe y no sabemos por dónde empezar.", 6 * 24, "espera", 0, 180, "grande", "explorando"],
  ["p15", "c4", "cocina", "Cocina del departamento de mi mamá", "Mi mamá tiene 74 años y la cocina tiene alacenas altísimas. Quiero que todo le quede a la mano.", 12 * 24, "cerrado", 2, 9, "chico", "pronto"],
  ["p16", "c8", "bano", "Medio baño en planta baja", "No hay baño abajo y los invitados tienen que subir. Hay un clóset debajo de la escalera que podría servir.", 3, "abierto", 0, 3, "chico", "pronto"],
  ["p17", "c2", "interiorismo", "Estudio en casa para dos", "Trabajamos los dos desde casa y la mesa del comedor ya no aguanta. Tenemos un cuarto de 3 por 3.", 40 * 24, "cerrado", 3, 9, "chico", "pronto"],
  ["p18", "c5", "bano", "Baño con tina vieja", "Quiero sacar la tina y poner ducha amplia. El baño es de 2 por 2,5 metros.", 15 * 24, "elegido", 3, 5, "chico", "pronto"],
  ["p19", "c11", "cocina", "Cocina abierta en apartamento de los 80", "Apartamento en Chapinero con cocina cerrada y zona de ropas al lado. Quiero integrarla a la sala.", 1.2, "abierto", 0, 12, "medio", "pronto"],
  ["p20", "c12", "ampliacion", "Ampliar la casa hacia el jardín", "Casa en Usaquén con jardín grande atrás. Queremos un estudio y un cuarto de huéspedes.", 33, "abierto", 3, 35, "grande", "meses"],
  ["p21", "c13", "remodelacion", "Casa de Teusaquillo con ladrillo", "Casa de 1950 con muros de ladrillo, techos altos y mucha humedad. Queremos restaurarla sin perder su carácter.", 40, "abierto", 0, 210, "grande", "meses"],
  ["p22", "c14", "interiorismo", "Apartamento para alquilar amoblado", "Vamos a alquilar el apartamento amoblado y queremos que se vea bien en fotos sin gastar de más.", 10, "abierto", 2, 64, "chico", "pronto"],
  ["p23", "c15", "remodelacion", "Remodelación en Suba", "Casa de dos pisos que necesita pisos, baños y cocina nuevos.", 8 * 24, "espera", 0, 120, "grande", "meses"],
  ["p24", "c24", "bano", "Dos baños del apartamento", "Los dos baños tienen el enchape original y filtraciones. Queremos hacerlos al tiempo.", 22 * 24, "elegido", 3, 9, "medio", "pronto"],
  ["p25", "c11", "fachada", "Fachada del edificio de tres pisos", "Somos tres propietarios y queremos arreglar la fachada juntos.", 30 * 24, "cerrado", 2, 90, "medio", "meses"],
  ["p26", "c16", "interiorismo", "Departamento frente al malecón", "Departamento con vista al mar pero los muebles se oxidan y todo huele a humedad.", 21, "abierto", 2, 85, "medio", "pronto"],
  ["p27", "c17", "ampliacion", "Ampliación en Surco", "Casa de un piso con techo para segundo nivel. Queremos dos dormitorios arriba.", 52, "abierto", 0, 60, "grande", "meses"],
  ["p28", "c18", "cocina", "Cocina con isla", "Cocina grande pero mal distribuida. Me gustaría una isla para cocinar mirando a la familia.", 16, "abierto", 1, 18, "medio", "pronto"],
  ["p29", "c19", "remodelacion", "Casona en Barranco", "Casona de quincha que necesita ponerse al día por dentro sin tocar la fachada.", 5 * 24, "espera", 0, 240, "grande", "explorando"],
  ["p30", "c16", "bano", "Baño de servicio", "Quiero convertir el baño de servicio en baño de visitas.", 45 * 24, "cerrado", 2, 4, "chico", "pronto"],
  ["p31", "c20", "remodelacion", "Casa en Ñuñoa", "Casa pareada de dos pisos, queremos abrir el primer piso y renovar baños.", 3 * 24, "espera", 0, 110, "grande", "meses"],
  ["p32", "c21", "cocina", "Cocina de departamento en Providencia", "Cocina americana que se ve vieja. Muebles nuevos y mejor iluminación.", 2 * 24, "espera", 0, 10, "medio", "pronto"],
  ["p33", "c3", "interiorismo", "Recámara de los niños", "Dos niños en un cuarto de 3 por 3,5. Necesito literas y guardado.", 60 * 24, "cerrado", 3, 11, "chico", "pronto"],
  ["p34", "c7", "cocina", "Cocina que da al patio", "Me gustaría abrir la cocina al patio con una puerta grande de vidrio.", 4.5, "abierto", 1, 13, "medio", "pronto"],
  ["p35", "c9", "exterior", "Jardín frontal y cochera", "Queremos un frente con plantas que no necesite tanto riego y una cochera techada.", 64, "abierto", 3, 45, "medio", "meses"],
  ["p36", "c22", "interiorismo", "Local en planta baja convertido en estudio", "La planta baja era un local. Queremos un estudio de cerámica con luz natural.", 7 * 24, "oculto", 0, 40, "medio", "explorando"],
];

const MENSAJES_PROPUESTA: Record<Especialidad, string[]> = {
  cocina: [
    "Antes de tocar el muro revisaría si carga con una cala chica, cuesta poco y define todo lo demás. Te propongo una barra en el mismo eje de la ventana para que entre la luz hasta el comedor.",
    "Vi las fotos: la ventana es lo mejor que tiene la cocina. Movería la tarja debajo de ella y dejaría la estufa en el muro ciego, así el guardado sube hasta el techo sin tapar la luz.",
    "Haría la cocina en L con alacenas abiertas arriba y cerradas abajo. Incluyo planos, despiece de muebles y lista de materiales para cotizar con tu carpintero o con el mío.",
  ],
  bano: [
    "Con un baño así lo que más cambia es la ventilación. Propongo un extractor silencioso con salida a la azotea y una ducha a piso sin escalón.",
    "Mantendría las tuberías donde están para no romper de más y cambiaría todo lo que se ve. En tres semanas de obra queda listo.",
    "Te mando dos ideas de acabado sobre tus fotos: una clara con terrazo y otra más cálida con barro. Las dos caben en el mismo presupuesto.",
  ],
  ampliacion: [
    "Lo primero sería revisar la losa de la cochera, porque de eso depende si el cuarto se apoya ahí o necesita columnas nuevas. Incluyo el cálculo estructural y el trámite.",
    "Propongo construir en seco, con estructura metálica ligera: menos peso sobre lo existente y menos semanas de polvo en la casa.",
    "Dibujaría la ampliación pensando en que algún día puedan subir otro nivel. Te dejo una referencia de una obra parecida.",
  ],
  remodelacion: [
    "En casas de esa época conviene abrir por partes. Propongo empezar por la cocina y la sala para que puedan seguir viviendo arriba mientras tanto.",
    "Haría un levantamiento completo antes de dibujar, con instalaciones eléctricas incluidas, porque en casas de esos años suele estar ahí la sorpresa.",
    "Te propongo tres etapas con presupuesto separado, así deciden después de ver la primera terminada.",
  ],
  fachada: [
    "La humedad que vuelve cada año casi siempre sube desde abajo o entra por el pretil. Haría el diagnóstico primero y el diseño después, para no pintar encima del problema.",
    "Propongo una celosía de barro que da privacidad sin la reja y deja pasar el aire.",
  ],
  exterior: [
    "Pérgola de madera tratada con lona retráctil para la temporada de lluvias. Te mando una vista con tus propias fotos.",
    "En la azotea lo primero es impermeabilizar bien y dar pendiente al agua. Arriba de eso, una pérgola ligera y jardineras con riego por goteo.",
    "Usaría plantas de la zona que aguanten sol directo. Menos riego y menos mantenimiento.",
  ],
  interiorismo: [
    "Con muebles a medida en el muro largo ganas guardado y liberas el centro. Incluyo planos de carpintería.",
    "Propongo una paleta de tres materiales y muebles que se puedan mover si un día cambian de casa.",
    "Haría una visita de una hora para medir y ver la luz a distintas horas antes de proponer nada definitivo.",
  ],
  "obra-nueva": [
    "En un terreno con pendiente la casa puede escalonarse y ahorrar mucho en muros de contención. Lo veríamos en la primera visita.",
    "Incluyo anteproyecto, proyecto ejecutivo y acompañamiento del permiso de construcción.",
  ],
};

const BASE_USD: Record<Especialidad, [number, number]> = {
  cocina: [700, 1400],
  bano: [450, 950],
  ampliacion: [1800, 3600],
  remodelacion: [2500, 5200],
  fachada: [600, 1200],
  exterior: [650, 1300],
  interiorismo: [700, 1500],
  "obra-nueva": [4500, 9000],
};
const SEMANAS: Record<Especialidad, [number, number]> = {
  cocina: [3, 6],
  bano: [2, 4],
  ampliacion: [6, 12],
  remodelacion: [8, 16],
  fachada: [3, 6],
  exterior: [3, 6],
  interiorismo: [2, 5],
  "obra-nueva": [12, 24],
};

export function honorarioSugerido(tipo: Especialidad, ciudadId: string, r = Math.random) {
  const c = CIUDADES.find((x) => x.id === ciudadId) ?? CIUDADES[0];
  const [a, b] = BASE_USD[tipo];
  const min = redondo((a + (b - a) * r() * 0.5) * c.tasa);
  const max = redondo(min * (1.35 + r() * 0.35));
  return { min, max };
}

export interface DatosPedidos {
  clientes: Cliente[];
  pedidos: Pedido[];
  propuestas: Propuesta[];
  conversaciones: Conversacion[];
  resenas: Resena[];
}

export function crearPedidos(ahora: Date, arquitectos: Arquitecto[]): DatosPedidos {
  const zonas = crearZonas();
  const t = (horasAtras: number) => new Date(ahora.getTime() - horasAtras * HORA).toISOString();
  const clientes: Cliente[] = CLIENTES.map(([id, nombre, zonaId], i) => ({ id, nombre, foto: `cli-${id}`, zonaId, alta: t(24 * (40 + i * 9)) }));

  const pedidos: Pedido[] = [];
  const propuestas: Propuesta[] = [];

  PEDIDOS.forEach((f, i) => {
    const [id, clienteId, tipo, titulo, descripcion, horas, estado, nProp, metros, presupuesto, inicio] = f;
    const r = mulberry32(i * 104729 + 11);
    const zonaId = clientes.find((c) => c.id === clienteId)!.zonaId;
    const zona = zonas.find((z) => z.id === zonaId)!;
    const antes = fotosAntesDe(tipo);
    const nFotos = 2 + Math.floor(r() * 3);
    const fotos: string[] = [];
    for (let k = 0; k < nFotos; k++) fotos.push(antes[(i + k * 3) % antes.length]);
    const candidatos = arquitectos.filter((a) => a.zonas.includes(zonaId) && a.estadoPlan !== "cancelado");
    // los que cubren la especialidad primero, para que las propuestas tengan sentido
    candidatos.sort((a, b) => Number(b.especialidades.includes(tipo)) - Number(a.especialidades.includes(tipo)) || b.nota - a.nota);
    let elegidos = candidatos.slice(0, Math.min(nProp, candidatos.length));
    // el pedido de la cocina de Mariana tiene la propuesta de Daniela
    if (id === "p1" && !elegidos.some((a) => a.id === ARQUITECTO_ACTUAL)) elegidos = [arquitectos.find((a) => a.id === ARQUITECTO_ACTUAL)!, ...elegidos.slice(0, nProp - 1)];
    let elegidoId: string | null = null;
    if ((estado === "elegido" || estado === "cerrado") && elegidos.length) elegidoId = elegidos[id === "p2" ? 1 : 0].id;

    elegidos.forEach((a, k) => {
      const { min, max } = honorarioSugerido(tipo, zona.ciudadId, r);
      const [sa, sb] = SEMANAS[tipo];
      const delay = Math.min(horas - 0.3, (k === 0 ? 2 : 4) + k * (3 + r() * 6));
      const msgs = MENSAJES_PROPUESTA[tipo];
      const imgs = proyectosDe(tipo);
      let estadoP: Propuesta["estado"] = "enviada";
      if (elegidoId) estadoP = a.id === elegidoId ? "elegida" : "descartada";
      else if (k < nProp - 1 || r() > 0.5) estadoP = "vista";
      propuestas.push({
        id: `${id}-pr${k}`,
        pedidoId: id,
        arquitectoId: a.id,
        honorarioMin: min,
        honorarioMax: max,
        plazoSemanas: Math.round(sa + (sb - sa) * r()),
        mensaje: msgs[(i + k) % msgs.length],
        imagenes: [imgs[(i + k) % imgs.length], (i + k) % 2 === 0 ? PLANOS[(i + k) % PLANOS.length] : imgs[(i + k + 2) % imgs.length]],
        enviada: t(Math.max(0.2, horas - delay)),
        estado: estadoP,
      });
    });

    pedidos.push({
      id,
      clienteId,
      titulo,
      tipo,
      descripcion,
      fotos,
      zonaId,
      metros,
      presupuesto,
      inicio,
      creado: t(horas),
      estado,
      elegidoId,
      contactado: false,
      calificado: estado === "cerrado" && id !== "p3",
    });
  });

  // Daniela ya trabajó para dos clientes de la app, y una propuesta suya quedó sin elegir
  const extra = (pedidoId: string, estado: Propuesta["estado"], horasAtras: number, mensaje: string, min: number, max: number, semanas: number) =>
    propuestas.push({ id: `${pedidoId}-da`, pedidoId, arquitectoId: ARQUITECTO_ACTUAL, honorarioMin: min, honorarioMax: max, plazoSemanas: semanas, mensaje, imagenes: proyectosDe("cocina").slice(0, 2), enviada: t(horasAtras), estado });
  if (!propuestas.some((p) => p.pedidoId === "p10" && p.arquitectoId === ARQUITECTO_ACTUAL))
    extra("p10", "vista", 3, "Con esa altura caben alacenas hasta el techo con un riel para la escalera. Te mando una referencia de una cocina parecida que hice en Del Valle.", 16500, 23000, 4);

  const conversaciones: Conversacion[] = [
    {
      id: "cv1",
      pedidoId: "p1",
      arquitectoId: ARQUITECTO_ACTUAL,
      clienteId: CLIENTE_ACTUAL,
      leida: false,
      mensajes: [
        { id: "m1", de: "cliente", texto: "Hola Daniela, vi tu propuesta. ¿La cala para ver si el muro carga la haces tú o tengo que buscar a alguien?", en: t(6) },
        { id: "m2", de: "arquitecto", texto: "La hago yo en la primera visita, es un hueco chico arriba del marco de la puerta. En media hora sabemos si carga.", en: t(5.6) },
        { id: "m3", de: "arquitecto", texto: "Si carga no pasa nada, se pone una viga y la barra queda igual. Solo cambia un poco el costo de obra.", en: t(5.5) },
      ],
    },
  ];
  const p2 = pedidos.find((p) => p.id === "p2")!;
  if (p2.elegidoId) {
    conversaciones.push({
      id: "cv2",
      pedidoId: "p2",
      arquitectoId: p2.elegidoId,
      clienteId: CLIENTE_ACTUAL,
      leida: true,
      mensajes: [
        { id: "m4", de: "arquitecto", texto: "Mariana, ya tengo la propuesta de impermeabilización. Antes de la pérgola hay que dar pendiente hacia la bajada del agua.", en: t(50) },
        { id: "m5", de: "cliente", texto: "Perfecto. ¿Los tinacos se quedan donde están?", en: t(48) },
        { id: "m6", de: "arquitecto", texto: "Los movería al lado norte, así la sombra de la pérgola queda sobre la mesa y no sobre los tanques.", en: t(47) },
        { id: "m7", de: "cliente", texto: "Me encanta. ¿El sábado puedes venir a medir?", en: t(26) },
        { id: "m8", de: "arquitecto", texto: "Sí, a las 10 estoy allá.", en: t(25) },
      ],
    });
  }
  const p24 = pedidos.find((p) => p.id === "p18")!;
  if (p24.elegidoId) {
    conversaciones.push({
      id: "cv3",
      pedidoId: "p18",
      arquitectoId: p24.elegidoId,
      clienteId: "c5",
      leida: true,
      mensajes: [
        { id: "m9", de: "cliente", texto: "¿Podemos dejar la ventana donde está?", en: t(70) },
        { id: "m10", de: "arquitecto", texto: "Sí, y la ducha queda justo debajo para que se ventile.", en: t(69) },
      ],
    });
  }

  const resenas = crearResenas(ahora, arquitectos, clientes);
  return { clientes, pedidos, propuestas, conversaciones, resenas };
}

const TEXTOS_RESENA = [
  "Llegó a la primera visita con ideas sobre nuestras propias fotos. La obra terminó una semana antes de lo que dijo.",
  "Muy claro con los números desde el principio. Nada de sorpresas a mitad de obra.",
  "Nos ayudó a decidir qué no hacer, y eso nos ahorró dinero.",
  "Respondía rápido y mandaba fotos de la obra cada viernes.",
  "La cocina quedó como la imaginábamos, y mi mamá alcanza todo sin escalera.",
  "Buen diseño. Hubo retraso con un proveedor, pero lo resolvió y nos avisó a tiempo.",
  "Entendió que vivíamos en la casa durante la obra y organizó todo por partes.",
  "Planos muy completos, el maestro de obra no tuvo que preguntar nada.",
  "La terraza es ahora el lugar favorito de la casa.",
  "Excelente trato con mis papás, que son mayores y desconfían de todo.",
  "Propuso materiales que aguantan la humedad, después de dos lluvias fuertes todo sigue igual.",
  "Nos dio dos opciones de presupuesto y respetó la que elegimos.",
];
const OBRAS_RESENA = ["Cocina", "Baño principal", "Terraza", "Remodelación de sala", "Ampliación", "Fachada", "Estudio en casa", "Medio baño"];

function crearResenas(ahora: Date, arquitectos: Arquitecto[], clientes: Cliente[]): Resena[] {
  const out: Resena[] = [];
  arquitectos.forEach((a, i) => {
    const r = mulberry32(i * 31337 + 5);
    const n = Math.min(a.resenas, 4);
    for (let k = 0; k < n; k++) {
      const c = clientes[(i * 3 + k * 5) % clientes.length];
      const nota = Math.max(3, Math.min(5, Math.round(a.nota + (r() - 0.6))));
      out.push({
        id: `rs-${a.id}-${k}`,
        arquitectoId: a.id,
        cliente: c.nombre.split(" ")[0] + " " + c.nombre.split(" ").slice(-1)[0][0] + ".",
        clienteFoto: c.foto,
        nota,
        texto: TEXTOS_RESENA[(i + k * 4) % TEXTOS_RESENA.length],
        fecha: new Date(ahora.getTime() - (20 + k * 37 + Math.floor(r() * 30)) * DIA).toISOString(),
        obra: OBRAS_RESENA[(i + k) % OBRAS_RESENA.length],
      });
    }
  });
  return out;
}

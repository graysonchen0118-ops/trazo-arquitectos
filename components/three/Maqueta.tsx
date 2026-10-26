"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { css, damp, montar, sombraSuave } from "./kit";
import { mulberry32 } from "@/lib/format";

// La maqueta: un barrio de casas blancas sobre una tabla de cartón, como la que un arquitecto
// arma en su estudio. Cada manzana es una zona de la app; las abiertas están en blanco y
// las que esperan arquitectos quedan en gris. Encima viajan los pedidos y las propuestas.

export interface ZonaEsc {
  id: string;
  nombre: string;
  estado: "abierta" | "espera";
  celda: [number, number];
}
export interface PinArq {
  id: string;
  zonaId: string;
  propio: boolean;
}
export interface PinPedido {
  id: string;
  zonaId: string;
  propio: boolean;
  sinRespuesta: boolean;
}

export interface MaquetaProps {
  modo: "escenario" | "fondo" | "hero";
  zonas: ZonaEsc[];
  arquitectos: PinArq[];
  pedidos: PinPedido[];
  focoPedido?: string | null;
  focoZona?: string | null;
  rol?: "cliente" | "arquitecto";
  /** zona donde vive el cliente de la app: ahí está su casa con el techo que se levanta */
  casaPropia?: string | null;
  centroX?: number;
  fotos?: string[];
}

const CW = 12.6;
const CD = 10.4;
const LOTES: [number, number][] = [];
for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) LOTES.push([(i - 1.5) * 2.65, (j - 1) * 2.75]);
const LOTE_CASA = 5;
const ARBOLES = new Set([2, 8]);

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
};

function centroCelda(c: [number, number]) {
  return new THREE.Vector3((c[0] - 1) * CW, 0, (c[1] - 0.5) * CD);
}

/** etiqueta nítida con el ancho justo para el texto */
function etiqueta(texto: string, sub: string | null, fondo: string, color: string) {
  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  const familia = getComputedStyle(document.body).fontFamily || "sans-serif";
  const H = sub ? 132 : 96;
  g.font = `700 50px ${familia}`;
  const w1 = g.measureText(texto).width;
  g.font = `500 32px ${familia}`;
  const w2 = sub ? g.measureText(sub).width : 0;
  const W = Math.ceil(Math.max(w1, w2) + 64);
  c.width = W;
  c.height = H;
  g.fillStyle = fondo;
  const r = 30;
  g.beginPath();
  g.moveTo(r, 0);
  g.arcTo(W, 0, W, H, r);
  g.arcTo(W, H, 0, H, r);
  g.arcTo(0, H, 0, 0, r);
  g.arcTo(0, 0, W, 0, r);
  g.fill();
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `700 50px ${familia}`;
  g.fillText(texto, W / 2, sub ? 46 : H / 2 + 2);
  if (sub) {
    g.globalAlpha = 0.75;
    g.font = `500 32px ${familia}`;
    g.fillText(sub, W / 2, 98);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { t, aspecto: W / H, alto: H };
}

/** textura de la tabla: cartón con la cuadrícula fina de un plano */
function texturaTabla(color: string, linea: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = color;
  g.fillRect(0, 0, 512, 512);
  const r = mulberry32(7);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(90,60,30,${r() * 0.05})`;
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
  }
  g.strokeStyle = linea;
  for (let i = 0; i <= 512; i += 32) {
    g.globalAlpha = i % 128 === 0 ? 0.32 : 0.13;
    g.lineWidth = i % 128 === 0 ? 2 : 1;
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 512);
    g.moveTo(0, i);
    g.lineTo(512, i);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** rayado de las manzanas que todavía esperan arquitectos */
function texturaEspera() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e1ddd4";
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(120,110,95,0.28)";
  g.lineWidth = 6;
  for (let i = -128; i < 256; i += 22) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 128, 128);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2.4);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** planta de la casa propia, que aparece cuando se levanta el techo */
function texturaPlanta(tinta: string, acento: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fbf8f2";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = tinta;
  g.lineWidth = 7;
  g.strokeRect(10, 10, 236, 236);
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(10, 120);
  g.lineTo(150, 120);
  g.moveTo(150, 10);
  g.lineTo(150, 80);
  g.moveTo(150, 160);
  g.lineTo(150, 246);
  g.moveTo(150, 170);
  g.lineTo(246, 170);
  g.stroke();
  // el muro que se abre entre cocina y comedor
  g.setLineDash([10, 8]);
  g.strokeStyle = acento;
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(150, 80);
  g.lineTo(150, 160);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = acento;
  g.globalAlpha = 0.18;
  g.fillRect(150, 10, 96, 160);
  g.globalAlpha = 1;
  g.fillStyle = tinta;
  g.globalAlpha = 0.5;
  g.fillRect(168, 24, 60, 14);
  g.fillRect(30, 140, 70, 40);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function prisma() {
  // techo a dos aguas de 1 x 1 x 1, apoyado en y = 0
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0);
  s.lineTo(0.5, 0);
  s.lineTo(0, 1);
  s.lineTo(-0.5, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  return g;
}

interface Manzana {
  grupo: THREE.Group;
  placa: THREE.Mesh;
  borde: THREE.LineSegments;
  cuerpos: THREE.InstancedMesh;
  techos: THREE.InstancedMesh;
  label: THREE.Sprite;
  estado: string;
  nombre: string;
  subida: number;
  colorCasa: THREE.Color;
}

interface Arco {
  mesh: THREE.Mesh;
  total: number;
  t: number;
  retraso: number;
  vida: number;
  fijo: boolean;
}
interface Tarjeta {
  grupo: THREE.Group;
  curva: THREE.QuadraticBezierCurve3;
  t: number;
  dur: number;
}
interface Onda {
  mesh: THREE.Mesh;
  t: number;
  dur: number;
  max: number;
}

export default function Maqueta(props: MaquetaProps) {
  const mount = useRef<HTMLDivElement | null>(null);
  const api = useRef<{ sync: (p: MaquetaProps) => void } | null>(null);
  const ultimas = useRef(props);
  ultimas.current = props;

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const cena = montar(el, { dpr: props.modo === "fondo" ? 1.25 : 1.75 });
    if (!cena) return;
    const { scene, renderer, small, reduce, track } = cena;
    const modo = props.modo;

    const tinta = css("--ink", "#1d2a33");
    const acento = css("--accent", "#c0613a");
    const apoyo = css("--support", "#2f5d8a");
    const fondoCss = css("--bg", "#f3efe7");
    const aviso = css("--warn", "#c98a1e");

    scene.fog = new THREE.Fog(new THREE.Color(fondoCss), modo === "fondo" ? 46 : 40, modo === "fondo" ? 110 : 96);
    const camara = new THREE.PerspectiveCamera(modo === "hero" ? 36 : 32, 1, 0.5, 260);
    const { w: w0, h: h0 } = cena.size();
    camara.aspect = w0 / h0;
    camara.updateProjectionMatrix();

    scene.add(new THREE.HemisphereLight(0xfff8ee, 0xb9a283, 1.55));
    const sol = new THREE.DirectionalLight(0xfff1dc, 1.75);
    sol.position.set(-18, 30, 14);
    scene.add(sol);
    const relleno = new THREE.DirectionalLight(0xdbe7f5, 0.45);
    relleno.position.set(20, 10, -16);
    scene.add(relleno);

    const raiz = new THREE.Group();
    scene.add(raiz);

    // tabla
    const texTabla = track(texturaTabla("#d9c4a2", apoyo));
    const tabla = new THREE.Mesh(new THREE.BoxGeometry(CW * 3 + 5, 0.9, CD * 2 + 6), [
      new THREE.MeshLambertMaterial({ color: 0xb79a72 }),
      new THREE.MeshLambertMaterial({ color: 0xb79a72 }),
      new THREE.MeshLambertMaterial({ map: texTabla }),
      new THREE.MeshLambertMaterial({ color: 0xa88b64 }),
      new THREE.MeshLambertMaterial({ color: 0xc4a77e }),
      new THREE.MeshLambertMaterial({ color: 0xb79a72 }),
    ]);
    tabla.position.y = -0.45;
    raiz.add(tabla);
    const sombraTabla = sombraSuave(CW * 3 + 14, CD * 2 + 16, 0.28);
    sombraTabla.position.y = -0.92;
    raiz.add(sombraTabla);

    const geoCuerpo = track(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
    const geoTecho = track(prisma());
    const geoCopa = track(new THREE.IcosahedronGeometry(0.55, 1));
    const geoTronco = track(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 6).translate(0, 0.3, 0));
    const matCuerpo = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const matTecho = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const matCopa = new THREE.MeshLambertMaterial({ color: 0xc9d4bf });
    const matTronco = new THREE.MeshLambertMaterial({ color: 0xa08868 });
    const texEspera = track(texturaEspera());
    const blanco = new THREE.Color(0xf6f2ea);
    const gris = new THREE.Color(0xcfcac0);

    // seis manzanas fijas: los nombres y estados cambian con la ciudad
    const manzanas: Manzana[] = [];
    const posCasa: THREE.Vector3[][] = [];
    for (let k = 0; k < 6; k++) {
      const celda: [number, number] = [k % 3, Math.floor(k / 3)];
      const grupo = new THREE.Group();
      grupo.position.copy(centroCelda(celda));
      raiz.add(grupo);
      const placa = new THREE.Mesh(new THREE.BoxGeometry(CW - 1.7, 0.22, CD - 1.5), new THREE.MeshLambertMaterial({ color: 0xf1ebe0 }));
      placa.position.y = 0.11;
      grupo.add(placa);
      const borde = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(CW - 1.7, 0.22, CD - 1.5)), new THREE.LineBasicMaterial({ color: new THREE.Color(acento), transparent: true, opacity: 0.85 }));
      borde.position.y = 0.11;
      grupo.add(borde);
      const r = mulberry32(k * 97 + 3);
      const cuerpos = new THREE.InstancedMesh(geoCuerpo, matCuerpo, LOTES.length);
      const techos = new THREE.InstancedMesh(geoTecho, matTecho, LOTES.length);
      cuerpos.frustumCulled = false;
      techos.frustumCulled = false;
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const lista: THREE.Vector3[] = [];
      LOTES.forEach(([lx, lz], i) => {
        const ancho = 1.5 + r() * 0.55;
        const fondo = 1.55 + r() * 0.6;
        const pisos = r() > 0.55 ? 2 : 1;
        const alto = pisos === 2 ? 1.55 + r() * 0.3 : 0.85 + r() * 0.2;
        const pos = new THREE.Vector3(lx + (r() - 0.5) * 0.3, 0.22, lz + (r() - 0.5) * 0.25);
        const giro = r() > 0.5 ? 0 : Math.PI / 2;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), giro);
        const oculto = ARBOLES.has(i);
        m.compose(pos, q, new THREE.Vector3(oculto ? 0 : ancho, oculto ? 0 : alto, oculto ? 0 : fondo));
        cuerpos.setMatrixAt(i, m);
        const techoPlano = r() > 0.62;
        m.compose(new THREE.Vector3(pos.x, pos.y + alto, pos.z), q, oculto || techoPlano ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(ancho * 1.06, 0.62, fondo * 1.04));
        techos.setMatrixAt(i, m);
        lista.push(new THREE.Vector3(pos.x, pos.y + alto + (techoPlano ? 0 : 0.62), pos.z));
        cuerpos.setColorAt(i, blanco);
        techos.setColorAt(i, blanco);
        if (oculto) {
          for (let a = 0; a < 3; a++) {
            const ax = lx + (a - 1) * 0.7 + (r() - 0.5) * 0.2;
            const az = lz + (r() - 0.5) * 0.9;
            const tronco = new THREE.Mesh(geoTronco, matTronco);
            tronco.position.set(ax, 0.22, az);
            const copa = new THREE.Mesh(geoCopa, matCopa);
            const s = 0.75 + r() * 0.45;
            copa.scale.setScalar(s);
            copa.position.set(ax, 0.22 + 0.6 + 0.4 * s, az);
            grupo.add(tronco, copa);
          }
        }
      });
      grupo.add(cuerpos, techos);
      posCasa.push(lista);
      const sombra = sombraSuave(CW + 1.5, CD + 1.5, 0.16);
      sombra.position.y = 0.01;
      grupo.add(sombra);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false }));
      label.position.set(-CW / 2 + 2.9, 0.75, CD / 2 - 0.45);
      label.renderOrder = 5;
      grupo.add(label);
      manzanas.push({ grupo, placa, borde, cuerpos, techos, label, estado: "", nombre: "", subida: 0, colorCasa: blanco.clone() });
    }

    // la casa del cliente, con techo que se levanta y la planta adentro
    const casa = new THREE.Group();
    const cuerpoCasa = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.25, 2.2).translate(0, 0.625, 0), new THREE.MeshLambertMaterial({ color: 0xfbf7f0 }));
    const techoCasa = new THREE.Mesh(geoTecho, new THREE.MeshLambertMaterial({ color: new THREE.Color(acento) }));
    techoCasa.scale.set(2.3, 0.75, 2.35);
    techoCasa.position.y = 1.25;
    const planta = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 2.05).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: track(texturaPlanta(tinta, acento)) }));
    planta.position.y = 1.262;
    casa.add(cuerpoCasa, planta, techoCasa);
    const brillo = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.75, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(acento), transparent: true, opacity: 0.5, depthWrite: false }));
    brillo.position.y = 0.25;
    casa.add(brillo);
    casa.visible = false;
    let casaZona = -1;
    let techoArriba = 0;

    // pines
    const geoPinArq = track(new THREE.SphereGeometry(0.3, 16, 12));
    const geoPalo = track(new THREE.CylinderGeometry(0.035, 0.035, 1, 6).translate(0, 0.5, 0));
    const geoPinPed = track(new THREE.ConeGeometry(0.32, 0.7, 4).rotateX(Math.PI));
    const matArq = new THREE.MeshLambertMaterial({ color: new THREE.Color(apoyo), emissive: new THREE.Color(apoyo), emissiveIntensity: 0.25 });
    const matArqPropio = new THREE.MeshLambertMaterial({ color: new THREE.Color(apoyo), emissive: new THREE.Color(apoyo), emissiveIntensity: 0.55 });
    const matPed = new THREE.MeshLambertMaterial({ color: new THREE.Color(acento), emissive: new THREE.Color(acento), emissiveIntensity: 0.3 });
    const matPedAviso = new THREE.MeshLambertMaterial({ color: new THREE.Color(aviso), emissive: new THREE.Color(aviso), emissiveIntensity: 0.45 });
    const matPalo = new THREE.MeshBasicMaterial({ color: new THREE.Color(tinta), transparent: true, opacity: 0.35 });
    const capaPines = new THREE.Group();
    raiz.add(capaPines);
    const pinesArq = new Map<string, { g: THREE.Group; cabeza: THREE.Mesh; pos: THREE.Vector3; propio: boolean; zona: number }>();
    const pinesPed = new Map<string, { g: THREE.Group; cabeza: THREE.Mesh; pos: THREE.Vector3; sinRespuesta: boolean; propio: boolean; zona: number }>();

    const efectos = new THREE.Group();
    raiz.add(efectos);
    const arcos: Arco[] = [];
    const tarjetas: Tarjeta[] = [];
    const ondas: Onda[] = [];
    let arcoFijo: Arco | null = null;

    // fotos para las tarjetas de propuesta que vuelan
    const cargador = new THREE.TextureLoader();
    cargador.setCrossOrigin("anonymous");
    const texFotos: THREE.Texture[] = [];
    (props.fotos ?? []).slice(0, 6).forEach((u) => {
      cargador.load(u, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        texFotos.push(track(t));
      });
    });

    let zonasIdx = new Map<string, number>();
    const indiceZona = (id: string) => zonasIdx.get(id) ?? -1;

    const posLote = (zona: number, semilla: string, evitar: number[] = []) => {
      const libres = LOTES.map((_, i) => i).filter((i) => !ARBOLES.has(i) && !evitar.includes(i));
      const i = libres[hash(semilla) % libres.length];
      const base = manzanas[zona].grupo.position;
      const top = posCasa[zona][i];
      return new THREE.Vector3(base.x + top.x, top.y, base.z + top.z);
    };

    const nuevoArco = (a: THREE.Vector3, b: THREE.Vector3, color: string, retraso: number, fijo = false, vida = 4.2) => {
      const medio = a.clone().lerp(b, 0.5);
      medio.y = Math.max(a.y, b.y) + 2.2 + a.distanceTo(b) * 0.18;
      const curva = new THREE.QuadraticBezierCurve3(a, medio, b);
      const geo = new THREE.TubeGeometry(curva, 48, fijo ? 0.07 : 0.05, 6, false);
      const total = geo.index ? geo.index.count : 0;
      geo.setDrawRange(0, 0);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.95 }));
      efectos.add(mesh);
      const arco = { mesh, total, t: 0, retraso, vida, fijo };
      arcos.push(arco);
      return arco;
    };
    const nuevaOnda = (p: THREE.Vector3, color: string, max = 5, dur = 1.6) => {
      const mesh = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.8, depthWrite: false }));
      mesh.position.set(p.x, 0.3, p.z);
      efectos.add(mesh);
      ondas.push({ mesh, t: 0, dur, max });
    };
    const nuevaTarjeta = (a: THREE.Vector3, b: THREE.Vector3) => {
      const g = new THREE.Group();
      const marco = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.4), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
      const tex = texFotos.length ? texFotos[Math.floor(Math.random() * texFotos.length)] : null;
      const foto = new THREE.Mesh(new THREE.PlaneGeometry(1.74, 1.1), new THREE.MeshBasicMaterial({ map: tex, color: tex ? 0xffffff : new THREE.Color(apoyo), side: THREE.DoubleSide }));
      foto.position.set(0, 0.08, 0.01);
      const linea = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.08), new THREE.MeshBasicMaterial({ color: new THREE.Color(tinta), transparent: true, opacity: 0.35 }));
      linea.position.set(-0.36, -0.58, 0.01);
      g.add(marco, foto, linea);
      const medio = a.clone().lerp(b, 0.5);
      medio.y = Math.max(a.y, b.y) + 4;
      efectos.add(g);
      tarjetas.push({ grupo: g, curva: new THREE.QuadraticBezierCurve3(a.clone().add(new THREE.Vector3(0, 1.6, 0)), medio, b.clone().add(new THREE.Vector3(0, 1.4, 0))), t: 0, dur: 2.1 });
    };

    // cámara
    const objetivo = new THREE.Vector3(0, 0, 0);
    const objetivoDeseado = new THREE.Vector3(0, 0, 0);
    let radio = modo === "fondo" ? 50 : modo === "hero" ? 30 : 44;
    let radioDeseado = radio;
    let puntero = { x: 0, y: 0 };
    let scrollP = 0;
    let azim = 0;

    const alPuntero = (e: PointerEvent) => {
      puntero = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 };
    };
    const alScroll = (e: Event) => {
      scrollP = (e as CustomEvent<{ p: number }>).detail?.p ?? 0;
    };
    const alScrollVentana = () => {
      if (modo !== "fondo") return;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollP = window.scrollY / max;
    };
    window.addEventListener("pointermove", alPuntero);
    window.addEventListener("trazo:scroll", alScroll);
    window.addEventListener("scroll", alScrollVentana, { passive: true });

    const aplicarVista = () => {
      const { w, h } = cena.size();
      camara.aspect = w / h;
      const cx = ultimas.current.centroX;
      if (cx !== undefined && w > 0) camara.setViewOffset(w, h, -(cx - 0.5) * w, 0, w, h);
      else camara.clearViewOffset();
      camara.updateProjectionMatrix();
    };
    aplicarVista();
    cena.onResize(aplicarVista);

    // sincroniza zonas, pines y foco con lo que dice la app
    const sync = (p: MaquetaProps) => {
      zonasIdx = new Map();
      p.zonas.slice(0, 6).forEach((z) => {
        const k = z.celda[1] * 3 + z.celda[0];
        if (k < 0 || k > 5) return;
        zonasIdx.set(z.id, k);
        const mz = manzanas[k];
        if (mz.nombre !== z.nombre || mz.estado !== z.estado) {
          const abierta = z.estado === "abierta";
          const { t, aspecto } = etiqueta(z.nombre, abierta ? null : "por abrir", abierta ? "rgba(255,255,255,0.95)" : "rgba(236,232,224,0.95)", abierta ? tinta : "#7a7368");
          const mat = mz.label.material as THREE.SpriteMaterial;
          mat.map?.dispose();
          mat.map = t;
          mat.needsUpdate = true;
          const alto = abierta ? 0.72 : 0.95;
          mz.label.scale.set(alto * aspecto, alto, 1);
          const placaMat = mz.placa.material as THREE.MeshLambertMaterial;
          placaMat.map = abierta ? null : texEspera;
          placaMat.color.set(abierta ? 0xf3ece0 : 0xffffff);
          placaMat.needsUpdate = true;
          (mz.borde.material as THREE.LineBasicMaterial).color.set(abierta ? acento : "#b3ab9e");
          (mz.borde.material as THREE.LineBasicMaterial).opacity = abierta ? 0.9 : 0.5;
          mz.colorCasa.copy(abierta ? blanco : gris);
          for (let i = 0; i < LOTES.length; i++) {
            mz.cuerpos.setColorAt(i, mz.colorCasa);
            mz.techos.setColorAt(i, mz.colorCasa);
          }
          if (mz.cuerpos.instanceColor) mz.cuerpos.instanceColor.needsUpdate = true;
          if (mz.techos.instanceColor) mz.techos.instanceColor.needsUpdate = true;
          if (mz.estado === "espera" && abierta) mz.subida = 1;
          mz.estado = z.estado;
          mz.nombre = z.nombre;
        }
      });

      // casa propia
      const kc = p.casaPropia ? indiceZona(p.casaPropia) : -1;
      if (kc !== casaZona) {
        if (casaZona >= 0) casa.removeFromParent();
        casaZona = kc;
        if (kc >= 0) {
          const [lx, lz] = LOTES[LOTE_CASA];
          casa.position.set(lx, 0.22, lz);
          manzanas[kc].grupo.add(casa);
          casa.visible = true;
          const cero = new THREE.Matrix4().makeScale(0, 0, 0);
          manzanas[kc].cuerpos.setMatrixAt(LOTE_CASA, cero);
          manzanas[kc].techos.setMatrixAt(LOTE_CASA, cero);
          manzanas[kc].cuerpos.instanceMatrix.needsUpdate = true;
          manzanas[kc].techos.instanceMatrix.needsUpdate = true;
        } else casa.visible = false;
      }

      // pines de arquitectos
      const vistosA = new Set<string>();
      p.arquitectos.forEach((a) => {
        const k = indiceZona(a.zonaId);
        if (k < 0) return;
        vistosA.add(a.id);
        const ex = pinesArq.get(a.id);
        if (ex && ex.zona === k && ex.propio === a.propio) return;
        if (ex) capaPines.remove(ex.g);
        const pos = posLote(k, a.id, [LOTE_CASA]);
        const g = new THREE.Group();
        g.position.copy(pos);
        const palo = new THREE.Mesh(geoPalo, matPalo);
        palo.scale.y = a.propio ? 2.2 : 1.5;
        const cabeza = new THREE.Mesh(geoPinArq, a.propio ? matArqPropio : matArq);
        cabeza.position.y = a.propio ? 2.4 : 1.7;
        if (a.propio) cabeza.scale.setScalar(1.45);
        g.add(palo, cabeza);
        capaPines.add(g);
        pinesArq.set(a.id, { g, cabeza, pos: pos.clone().add(new THREE.Vector3(0, cabeza.position.y, 0)), propio: a.propio, zona: k });
      });
      pinesArq.forEach((v, id) => {
        if (!vistosA.has(id)) {
          capaPines.remove(v.g);
          pinesArq.delete(id);
        }
      });

      // pines de pedidos
      const vistosP = new Set<string>();
      p.pedidos.forEach((pd) => {
        const k = indiceZona(pd.zonaId);
        if (k < 0) return;
        vistosP.add(pd.id);
        const ex = pinesPed.get(pd.id);
        if (ex && ex.sinRespuesta === pd.sinRespuesta && ex.propio === pd.propio && ex.zona === k) return;
        if (ex) capaPines.remove(ex.g);
        let pos: THREE.Vector3;
        if (pd.propio && k === casaZona) {
          const b = manzanas[k].grupo.position;
          const [lx, lz] = LOTES[LOTE_CASA];
          pos = new THREE.Vector3(b.x + lx, 2.2, b.z + lz);
        } else pos = posLote(k, pd.id, [LOTE_CASA]);
        const g = new THREE.Group();
        g.position.copy(pos);
        g.userData.id = pd.id;
        const cabeza = new THREE.Mesh(geoPinPed, pd.sinRespuesta ? matPedAviso : matPed);
        cabeza.position.y = 1.5;
        if (pd.propio) cabeza.scale.setScalar(1.35);
        g.add(cabeza);
        capaPines.add(g);
        pinesPed.set(pd.id, { g, cabeza, pos: pos.clone(), sinRespuesta: pd.sinRespuesta, propio: pd.propio, zona: k });
      });
      pinesPed.forEach((v, id) => {
        if (!vistosP.has(id)) {
          capaPines.remove(v.g);
          pinesPed.delete(id);
        }
      });

      // foco de la cámara
      let destino: THREE.Vector3 | null = null;
      if (p.focoPedido && pinesPed.has(p.focoPedido)) {
        destino = pinesPed.get(p.focoPedido)!.pos.clone();
        radioDeseado = modo === "hero" ? 22 : 31;
      } else if (p.focoZona && indiceZona(p.focoZona) >= 0) {
        destino = manzanas[indiceZona(p.focoZona)].grupo.position.clone();
        radioDeseado = modo === "fondo" ? 31 : 30;
      } else if (p.rol === "arquitecto") {
        const propio = Array.from(pinesArq.values()).find((v) => v.propio);
        destino = propio ? propio.pos.clone().setY(0) : null;
        radioDeseado = modo === "hero" ? 26 : 42;
      } else if (casaZona >= 0 && modo !== "fondo") {
        const [lx, lz] = LOTES[LOTE_CASA];
        destino = manzanas[casaZona].grupo.position.clone().add(new THREE.Vector3(lx, 0, lz)).multiplyScalar(modo === "hero" ? 1 : 0.7);
        radioDeseado = modo === "hero" ? 24 : 46;
      } else {
        radioDeseado = modo === "fondo" ? 50 : 44;
      }
      objetivoDeseado.copy(destino ?? new THREE.Vector3(0, 0, 0)).setY(0);

      // el arco fijo une la casa con el arquitecto elegido mientras se mira ese pedido
      if (arcoFijo && (!p.focoPedido || !arcoFijo.mesh.userData.pedido || arcoFijo.mesh.userData.pedido !== p.focoPedido)) {
        arcoFijo.vida = 0.001;
        arcoFijo.fijo = false;
        arcoFijo = null;
      }
    };
    api.current = { sync };
    sync(ultimas.current);

    const alEvento = (e: Event) => {
      const d = (e as CustomEvent<Record<string, unknown>>).detail ?? {};
      const tipo = d.tipo as string;
      if (tipo === "publicado") {
        const pid = d.pedidoId as string;
        const zona = indiceZona(d.zonaId as string);
        if (zona < 0) return;
        window.setTimeout(() => {
          const pin = pinesPed.get(pid);
          const origen = pin ? pin.pos.clone().setY(1.6) : manzanas[zona].grupo.position.clone().setY(1.6);
          nuevaOnda(origen, acento, 7, 2.2);
          const ids = (d.arquitectos as string[]) ?? [];
          ids.forEach((id, i) => {
            const pa = pinesArq.get(id);
            if (pa) nuevoArco(origen, pa.pos, acento, 0.25 + i * 0.18);
          });
        }, 120);
      } else if (tipo === "propuesta") {
        const pa = pinesArq.get(d.arquitectoId as string);
        const pd = pinesPed.get(d.pedidoId as string);
        if (pa && pd) {
          nuevaTarjeta(pa.pos, pd.pos.clone().setY(1.6));
          nuevoArco(pa.pos, pd.pos.clone().setY(1.6), apoyo, 0, false, 2.6);
        }
      } else if (tipo === "elegido") {
        const pa = pinesArq.get(d.arquitectoId as string);
        const pd = pinesPed.get(d.pedidoId as string);
        if (pa && pd) {
          const a = nuevoArco(pd.pos.clone().setY(1.6), pa.pos, acento, 0, true, 9999);
          a.mesh.userData.pedido = d.pedidoId;
          arcoFijo = a;
          nuevaOnda(pd.pos, acento, 4, 1.4);
        }
      } else if (tipo === "zona") {
        const k = indiceZona(d.zonaId as string);
        if (k >= 0) nuevaOnda(manzanas[k].grupo.position, d.estado === "abierta" ? acento : "#9c958a", 9, 2.4);
      } else if (tipo === "plan") {
        const propio = Array.from(pinesArq.values()).find((v) => v.propio);
        if (propio) nuevaOnda(propio.pos.clone().setY(0.4), apoyo, 4, 1.6);
      }
    };
    window.addEventListener("trazo:3d", alEvento);

    const tmp = new THREE.Vector3();
    cena.loop((dt, t) => {
      const mover = !reduce;
      if (mover) azim += dt * (modo === "fondo" ? 0.035 : 0.05);
      const azimuth = Math.sin(azim) * 0.32 + (mover ? puntero.x * 0.22 : 0);
      const polar = (modo === "hero" ? 0.92 : 0.86) - scrollP * 0.16 + (mover ? puntero.y * 0.06 : 0);
      radio = damp(radio, radioDeseado, 2.2, dt);
      objetivo.x = damp(objetivo.x, objetivoDeseado.x, 2.4, dt);
      objetivo.z = damp(objetivo.z, objetivoDeseado.z, 2.4, dt);
      camara.position.set(objetivo.x + radio * Math.sin(polar) * Math.sin(azimuth), radio * Math.cos(polar), objetivo.z + radio * Math.sin(polar) * Math.cos(azimuth));
      camara.lookAt(objetivo);

      // manzanas que se abren suben desde la tabla
      manzanas.forEach((mz) => {
        if (mz.subida > 0) {
          mz.subida = Math.max(0, mz.subida - dt * 0.9);
          mz.grupo.position.y = -Math.sin(mz.subida * Math.PI) * 0.9;
        } else mz.grupo.position.y = 0;
      });

      // techo de la casa propia
      const focoPropio = ultimas.current.focoPedido ? pinesPed.get(ultimas.current.focoPedido)?.propio : false;
      techoArriba = damp(techoArriba, focoPropio ? 1 : 0, 3, dt);
      techoCasa.position.y = 1.25 + techoArriba * 1.6;
      techoCasa.rotation.z = techoArriba * 0.12;
      (brillo.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(t * 2.2) * 0.15 + techoArriba * 0.3;

      // pines que flotan y los pedidos sin respuesta que laten
      pinesPed.forEach((v) => {
        v.cabeza.position.y = 1.5 + Math.sin(t * 2 + v.pos.x) * (mover ? 0.12 : 0);
        v.cabeza.rotation.y += dt * 0.8;
        if (v.sinRespuesta) v.cabeza.scale.setScalar((v.propio ? 1.35 : 1) * (1 + (mover ? Math.max(0, Math.sin(t * 4)) * 0.28 : 0)));
        const enFoco = ultimas.current.focoPedido === v.g.userData.id;
        if (enFoco) v.cabeza.scale.setScalar(1.6);
      });
      pinesArq.forEach((v) => {
        if (v.propio) v.cabeza.scale.setScalar(1.45 + (mover ? Math.sin(t * 2.4) * 0.08 : 0));
      });

      // efectos
      for (let i = arcos.length - 1; i >= 0; i--) {
        const a = arcos[i];
        a.t += dt;
        const p = Math.min(1, Math.max(0, (a.t - a.retraso) / 0.9));
        const n = Math.floor(a.total * p);
        a.mesh.geometry.setDrawRange(0, n - (n % 3));
        const mat = a.mesh.material as THREE.MeshBasicMaterial;
        if (!a.fijo && a.t > a.retraso + a.vida) mat.opacity = Math.max(0, mat.opacity - dt * 1.2);
        if (!a.fijo && mat.opacity <= 0) {
          efectos.remove(a.mesh);
          a.mesh.geometry.dispose();
          mat.dispose();
          arcos.splice(i, 1);
        }
      }
      for (let i = tarjetas.length - 1; i >= 0; i--) {
        const c = tarjetas[i];
        c.t += dt / c.dur;
        const k = Math.min(1, c.t);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        c.curva.getPoint(e, tmp);
        c.grupo.position.copy(tmp);
        c.grupo.quaternion.copy(camara.quaternion);
        const s = k < 0.15 ? k / 0.15 : k > 0.85 ? Math.max(0.05, (1 - k) / 0.15) : 1;
        c.grupo.scale.setScalar(s * 1.15);
        if (c.t >= 1) {
          const fin = c.curva.v2.clone();
          efectos.remove(c.grupo);
          c.grupo.traverse((o) => {
            const m = o as THREE.Mesh;
            if (m.geometry) m.geometry.dispose();
            if (m.material) (m.material as THREE.Material).dispose();
          });
          tarjetas.splice(i, 1);
          nuevaOnda(fin, apoyo, 3, 1.1);
        }
      }
      for (let i = ondas.length - 1; i >= 0; i--) {
        const o = ondas[i];
        o.t += dt / o.dur;
        o.mesh.scale.setScalar(0.3 + o.t * o.max);
        (o.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 * (1 - o.t));
        if (o.t >= 1) {
          efectos.remove(o.mesh);
          o.mesh.geometry.dispose();
          (o.mesh.material as THREE.Material).dispose();
          ondas.splice(i, 1);
        }
      }

      renderer.render(scene, camara);
    });

    if (small) camara.fov = modo === "hero" ? 40 : 36;
    el.dataset.listo = "1";

    return () => {
      window.removeEventListener("pointermove", alPuntero);
      window.removeEventListener("trazo:scroll", alScroll);
      window.removeEventListener("scroll", alScrollVentana);
      window.removeEventListener("trazo:3d", alEvento);
      manzanas.forEach((m) => (m.label.material as THREE.SpriteMaterial).map?.dispose());
      api.current = null;
      cena.dispose();
    };
    // la escena se arma una sola vez; los cambios llegan por sync
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.current?.sync(props);
  }, [props]);

  return <div ref={mount} className={`maqueta maqueta-${props.modo}`} aria-hidden="true" />;
}

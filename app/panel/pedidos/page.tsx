"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Inbox, Search, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { ESPECIALIDADES, ESTADO_PEDIDO, ESTADO_PROPUESTA, LISTA_ESPECIALIDADES, fecha, hace, norm, rangoPlata } from "@/lib/format";
import { ciudadDe } from "@/lib/mock/ciudades";
import { usePropuestasPorPedido } from "@/lib/vista";
import type { EstadoPedido, Especialidad } from "@/lib/types";
import { Avatar, Cargando, Foto, Modal, Skel, Vacio } from "@/components/ui";

const POR_PAGINA = 10;

export default function PanelPedidos() {
  const { listo, pedidos, propuestas, zonas, clientes, arquitectos, ciudadPanel, ahora, moderarPedido, eliminarPedido, enfocar } = useStore();
  const cuenta = usePropuestasPorPedido();
  const ciudad = ciudadDe(ciudadPanel);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoPedido | "todos">("todos");
  const [zona, setZona] = useState("todas");
  const [tipo, setTipo] = useState<Especialidad | "todos">("todos");
  const [orden, setOrden] = useState<"recientes" | "antiguos" | "menos">("recientes");
  const [pagina, setPagina] = useState(0);
  const [ver, setVer] = useState<string | null>(null);
  const [borrar, setBorrar] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const zonasCiudad = zonas.filter((z) => z.ciudadId === ciudadPanel);

  const lista = useMemo(() => {
    const ids = new Set(zonasCiudad.map((z) => z.id));
    const t = norm(q);
    const l = pedidos
      .filter((p) => ids.has(p.zonaId))
      .filter((p) => (estado === "todos" ? true : p.estado === estado))
      .filter((p) => (zona === "todas" ? true : p.zonaId === zona))
      .filter((p) => (tipo === "todos" ? true : p.tipo === tipo))
      .filter((p) => (t ? norm(`${p.titulo} ${p.descripcion} ${clientes.find((c) => c.id === p.clienteId)?.nombre ?? ""}`).includes(t) : true));
    l.sort((a, b) => (orden === "menos" ? (cuenta.get(a.id) ?? 0) - (cuenta.get(b.id) ?? 0) : (orden === "recientes" ? -1 : 1) * (new Date(a.creado).getTime() - new Date(b.creado).getTime())));
    return l;
  }, [pedidos, zonasCiudad, estado, zona, tipo, q, orden, cuenta, clientes]);

  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const pag = Math.min(pagina, paginas - 1);
  const visibles = lista.slice(pag * POR_PAGINA, pag * POR_PAGINA + POR_PAGINA);
  const pv = pedidos.find((p) => p.id === ver);
  const estados: (EstadoPedido | "todos")[] = ["todos", "abierto", "elegido", "espera", "cerrado", "oculto"];

  return (
    <div className="pn-pagina">
      <div className="pn-titulo fila">
        <div>
          <h1>Pedidos</h1>
          <p className="muted">
            {lista.length} en {ciudad.nombre}
          </p>
        </div>
      </div>
      <div className="pn-estados">
        {estados.map((e) => (
          <button key={e} className={`chip ${estado === e ? "on" : ""}`} onClick={() => { setEstado(e); setPagina(0); }}>
            {e === "todos" ? "Todos" : ESTADO_PEDIDO[e].texto}
          </button>
        ))}
      </div>
      <div className="pn-filtros">
        <label className="pn-buscar">
          <Search size={16} />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPagina(0); }} placeholder="Buscar por título, texto o cliente" />
        </label>
        <select value={zona} onChange={(e) => { setZona(e.target.value); setPagina(0); }} aria-label="Zona">
          <option value="todas">Todas las zonas</option>
          {zonasCiudad.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nombre}
            </option>
          ))}
        </select>
        <select value={tipo} onChange={(e) => { setTipo(e.target.value as Especialidad | "todos"); setPagina(0); }} aria-label="Tipo">
          <option value="todos">Todo tipo de obra</option>
          {LISTA_ESPECIALIDADES.map((e) => (
            <option key={e} value={e}>
              {ESPECIALIDADES[e].nombre}
            </option>
          ))}
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} aria-label="Orden">
          <option value="recientes">Más recientes</option>
          <option value="antiguos">Más antiguos</option>
          <option value="menos">Menos propuestas</option>
        </select>
      </div>

      <div className="pn-tabla">
        <div className="pn-fila pn-fila-cab pn-fila-ped">
          <span>Pedido</span>
          <span>Estado</span>
          <span>Propuestas</span>
          <span>Publicado</span>
          <span />
        </div>
        {!listo ? (
          [0, 1, 2, 3].map((i) => <Skel key={i} h={64} r={14} />)
        ) : visibles.length === 0 ? (
          <Vacio icono={<Inbox size={24} />} titulo="Sin pedidos con ese filtro" texto="Prueba con otra zona o borra la búsqueda." />
        ) : (
          visibles.map((p, i) => {
            const z = zonas.find((x) => x.id === p.zonaId);
            const c = clientes.find((x) => x.id === p.clienteId);
            const e = ESTADO_PEDIDO[p.estado];
            const n = cuenta.get(p.id) ?? 0;
            return (
              <div key={p.id} className={`pn-fila pn-fila-ped aparece-abajo ${p.estado === "oculto" ? "apagada" : ""}`} style={{ animationDelay: `${i * 30}ms` }} onMouseEnter={() => enfocar({ tipo: "pedido", id: p.id })} onMouseLeave={() => enfocar(null)}>
                <span className="pn-lugar">
                  <Foto k={p.fotos[0]} w={110} h={110} alt={p.titulo} className="pn-mini" />
                  <span>
                    <strong>{p.titulo}</strong>
                    <small>
                      {z?.nombre} · {ESPECIALIDADES[p.tipo].corto} · {c?.nombre}
                    </small>
                  </span>
                </span>
                <span>
                  <span className={`badge ${e.clase}`}>{e.texto}</span>
                </span>
                <span className={n === 0 && p.estado === "abierto" ? "txt-alerta" : ""}>{n}</span>
                <span>{hace(p.creado, ahora)}</span>
                <span className="pn-acciones">
                  <button className="icon-btn chico" onClick={() => setVer(p.id)} aria-label="Ver pedido" title="Ver">
                    <Eye size={16} />
                  </button>
                  <button
                    className="icon-btn chico"
                    disabled={ocupado === p.id}
                    onClick={async () => {
                      setOcupado(p.id);
                      await moderarPedido(p.id, p.estado === "oculto");
                      setOcupado(null);
                    }}
                    aria-label={p.estado === "oculto" ? "Mostrar" : "Ocultar"}
                    title={p.estado === "oculto" ? "Mostrar a los arquitectos" : "Ocultar a los arquitectos"}
                  >
                    {p.estado === "oculto" ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button className="icon-btn chico peligro" onClick={() => setBorrar(p.id)} aria-label="Eliminar" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>
      <div className="pn-paginacion">
        <small className="muted">
          Página {pag + 1} de {paginas}
        </small>
        <div>
          <button className="icon-btn" disabled={pag === 0} onClick={() => setPagina(pag - 1)} aria-label="Anterior">
            <ChevronLeft size={18} />
          </button>
          <button className="icon-btn" disabled={pag >= paginas - 1} onClick={() => setPagina(pag + 1)} aria-label="Siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <Modal abierto={!!pv} titulo={pv?.titulo ?? ""} onClose={() => setVer(null)} ancho={640}>
        {pv && (
          <div className="pn-detalle">
            <div className="pn-det-fotos">
              {pv.fotos.map((f, i) => (
                <Foto key={i} k={f} w={260} h={190} alt={`Foto ${i + 1}`} />
              ))}
            </div>
            <p>{pv.descripcion}</p>
            <p className="muted chico">
              Publicado el {fecha(pv.creado)} por {clientes.find((c) => c.id === pv.clienteId)?.nombre} · {zonas.find((z) => z.id === pv.zonaId)?.nombre}
            </p>
            <h3 className="sub">Propuestas</h3>
            {propuestas.filter((x) => x.pedidoId === pv.id).length === 0 ? (
              <p className="muted chico">Todavía ninguna.</p>
            ) : (
              <ul className="pn-lista">
                {propuestas
                  .filter((x) => x.pedidoId === pv.id)
                  .map((x) => {
                    const a = arquitectos.find((y) => y.id === x.arquitectoId);
                    return (
                      <li key={x.id}>
                        <Avatar k={a?.foto ?? ""} nombre={a?.nombre ?? ""} size={34} />
                        <span>
                          <strong>{a?.estudio}</strong>
                          <small>
                            {rangoPlata(x.honorarioMin, x.honorarioMax, ciudad)} · {x.plazoSemanas} semanas · {hace(x.enviada, ahora)}
                          </small>
                        </span>
                        <span className={`badge ${ESTADO_PROPUESTA[x.estado].clase}`}>{ESTADO_PROPUESTA[x.estado].texto}</span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        )}
      </Modal>
      <Modal
        abierto={!!borrar}
        titulo="¿Eliminar el pedido?"
        onClose={() => setBorrar(null)}
        ancho={420}
        pie={
          <>
            <button className="btn btn-sec" onClick={() => setBorrar(null)}>
              Cancelar
            </button>
            <button
              className="btn btn-peligro"
              disabled={ocupado === "borrar"}
              onClick={async () => {
                if (!borrar) return;
                setOcupado("borrar");
                await eliminarPedido(borrar);
                setOcupado(null);
                setBorrar(null);
              }}
            >
              {ocupado === "borrar" ? <Cargando texto="Eliminando" /> : "Eliminar"}
            </button>
          </>
        }
      >
        <p className="muted">Se borran también sus propuestas. Si solo es spam o fotos fuera de lugar, mejor ocultarlo.</p>
      </Modal>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Ban, ChevronLeft, ChevronRight, Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import { ErrorValidacion, useStore } from "@/lib/store";
import { DIA, ESPECIALIDADES, ESTADO_PLAN, LISTA_ESPECIALIDADES, diasHasta, norm, uid } from "@/lib/format";
import { ciudadDe } from "@/lib/mock/ciudades";
import { proyectosDe } from "@/lib/photos";
import type { Arquitecto, EstadoPlan, PlanId } from "@/lib/types";
import { Avatar, Cargando, Modal, Nota, Skel, Vacio } from "@/components/ui";

const POR_PAGINA = 10;

function vacio(ciudadId: string, ahora: Date): Arquitecto {
  return {
    id: uid("ar"),
    nombre: "",
    estudio: "",
    foto: "av-nuevo",
    ciudadId,
    zonas: [],
    especialidades: ["remodelacion"],
    matricula: "",
    verificado: false,
    plan: "basico",
    estadoPlan: "prueba",
    pruebaHasta: new Date(ahora.getTime() + 30 * DIA).toISOString(),
    alta: ahora.toISOString(),
    nota: 0,
    resenas: 0,
    respondeHoras: 6,
    anios: 1,
    telefono: "",
    bio: "",
    portafolio: proyectosDe("remodelacion").slice(0, 3).map((f, i) => ({ id: uid("tp"), foto: f, titulo: `Obra ${i + 1}`, tipo: "remodelacion" })),
    suspendido: false,
  };
}

export default function PanelArquitectos() {
  const { listo, arquitectos, zonas, planes, ciudadPanel, ahora, verificarArquitecto, suspenderArquitecto, guardarArquitecto, eliminarArquitecto, propuestas } = useStore();
  const ciudad = ciudadDe(ciudadPanel);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<PlanId | "todos">("todos");
  const [estado, setEstado] = useState<EstadoPlan | "todos" | "sin-verificar">("todos");
  const [orden, setOrden] = useState<"nota" | "nombre" | "alta">("nota");
  const [pagina, setPagina] = useState(0);
  const [editando, setEditando] = useState<{ a: Arquitecto; nuevo: boolean } | null>(null);
  const [borrar, setBorrar] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState("");
  const zonasCiudad = zonas.filter((z) => z.ciudadId === ciudadPanel);

  const lista = useMemo(() => {
    const t = norm(q);
    const l = arquitectos
      .filter((a) => a.ciudadId === ciudadPanel)
      .filter((a) => (plan === "todos" ? true : a.plan === plan))
      .filter((a) => (estado === "todos" ? true : estado === "sin-verificar" ? !a.verificado : a.estadoPlan === estado))
      .filter((a) => (t ? norm(`${a.nombre} ${a.estudio} ${a.matricula}`).includes(t) : true));
    l.sort((a, b) => (orden === "nota" ? b.nota - a.nota : orden === "nombre" ? a.nombre.localeCompare(b.nombre, "es") : new Date(b.alta).getTime() - new Date(a.alta).getTime()));
    return l;
  }, [arquitectos, ciudadPanel, plan, estado, q, orden]);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const pag = Math.min(pagina, paginas - 1);
  const visibles = lista.slice(pag * POR_PAGINA, pag * POR_PAGINA + POR_PAGINA);

  const guardar = async () => {
    if (!editando) return;
    setError("");
    setOcupado("guardar");
    try {
      await guardarArquitecto(editando.a, editando.nuevo);
      setEditando(null);
    } catch (e) {
      if (e instanceof ErrorValidacion) setError(e.message);
    } finally {
      setOcupado(null);
    }
  };
  const set = (cambio: Partial<Arquitecto>) => setEditando((x) => (x ? { ...x, a: { ...x.a, ...cambio } } : x));

  return (
    <div className="pn-pagina">
      <div className="pn-titulo fila">
        <div>
          <h1>Arquitectos</h1>
          <p className="muted">
            {lista.length} en {ciudad.nombre}
          </p>
        </div>
        <button className="btn btn-pri" onClick={() => { setError(""); setEditando({ a: vacio(ciudadPanel, ahora), nuevo: true }); }}>
          <Plus size={16} /> Dar de alta
        </button>
      </div>
      <div className="pn-estados">
        {(["todos", "prueba", "activo", "vencido", "cancelado", "sin-verificar"] as const).map((e) => (
          <button key={e} className={`chip ${estado === e ? "on" : ""}`} onClick={() => { setEstado(e); setPagina(0); }}>
            {e === "todos" ? "Todos" : e === "sin-verificar" ? "Matrícula sin verificar" : ESTADO_PLAN[e].texto}
          </button>
        ))}
      </div>
      <div className="pn-filtros">
        <label className="pn-buscar">
          <Search size={16} />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPagina(0); }} placeholder="Nombre, estudio o matrícula" />
        </label>
        <select value={plan} onChange={(e) => { setPlan(e.target.value as PlanId | "todos"); setPagina(0); }} aria-label="Plan">
          <option value="todos">Todos los planes</option>
          {planes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} aria-label="Orden">
          <option value="nota">Mejor calificados</option>
          <option value="nombre">Por nombre</option>
          <option value="alta">Más recientes</option>
        </select>
      </div>

      <div className="pn-tabla">
        <div className="pn-fila pn-fila-cab pn-fila-arq">
          <span>Arquitecto</span>
          <span>Plan</span>
          <span>Zonas</span>
          <span>Propuestas</span>
          <span />
        </div>
        {!listo ? (
          [0, 1, 2].map((i) => <Skel key={i} h={64} r={14} />)
        ) : visibles.length === 0 ? (
          <Vacio icono={<Users size={24} />} titulo="Nadie con ese filtro" texto="Prueba con otro estado o plan." />
        ) : (
          visibles.map((a, i) => {
            const est = ESTADO_PLAN[a.estadoPlan];
            const p = planes.find((x) => x.id === a.plan);
            const enviadas = propuestas.filter((x) => x.arquitectoId === a.id).length;
            return (
              <div key={a.id} className={`pn-fila pn-fila-arq aparece-abajo ${a.suspendido ? "apagada" : ""}`} style={{ animationDelay: `${i * 30}ms` }}>
                <span className="pn-lugar">
                  <Avatar k={a.foto} nombre={a.nombre} size={42} />
                  <span>
                    <strong>
                      {a.nombre} {a.verificado ? <BadgeCheck size={14} className="verif-ic" /> : <span className="badge aviso mini">Sin verificar</span>}
                    </strong>
                    <small>
                      {a.estudio} · <Nota v={a.nota} n={a.resenas || undefined} />
                    </small>
                  </span>
                </span>
                <span>
                  <strong className="chico">{p?.nombre}</strong>
                  <span className={`badge ${est.clase} mini`}>{a.suspendido ? "Suspendido" : a.estadoPlan === "prueba" && a.pruebaHasta ? `Prueba, ${diasHasta(a.pruebaHasta, ahora)} d` : est.texto}</span>
                </span>
                <span className="chico">{a.zonas.map((z) => zonas.find((x) => x.id === z)?.nombre).join(", ")}</span>
                <span>{enviadas}</span>
                <span className="pn-acciones">
                  {!a.verificado && (
                    <button
                      className="icon-btn chico"
                      disabled={ocupado === a.id}
                      onClick={async () => {
                        setOcupado(a.id);
                        await verificarArquitecto(a.id);
                        setOcupado(null);
                      }}
                      title={`Verificar ${a.matricula || "matrícula"}`}
                      aria-label="Verificar matrícula"
                    >
                      <ShieldCheck size={16} />
                    </button>
                  )}
                  <button className="icon-btn chico" onClick={() => { setError(""); setEditando({ a, nuevo: false }); }} aria-label="Editar" title="Editar">
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-btn chico"
                    disabled={ocupado === `s${a.id}`}
                    onClick={async () => {
                      setOcupado(`s${a.id}`);
                      await suspenderArquitecto(a.id, !a.suspendido);
                      setOcupado(null);
                    }}
                    aria-label={a.suspendido ? "Reactivar" : "Suspender"}
                    title={a.suspendido ? "Reactivar" : "Suspender"}
                  >
                    {a.suspendido ? <RotateCcw size={16} /> : <Ban size={16} />}
                  </button>
                  <button className="icon-btn chico peligro" onClick={() => setBorrar(a.id)} aria-label="Eliminar" title="Eliminar">
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

      <Modal
        abierto={!!editando}
        titulo={editando?.nuevo ? "Dar de alta un arquitecto" : `Editar a ${editando?.a.nombre ?? ""}`}
        onClose={() => setEditando(null)}
        ancho={620}
        pie={
          <>
            <button className="btn btn-sec" onClick={() => setEditando(null)}>
              Cancelar
            </button>
            <button className="btn btn-pri" onClick={guardar} disabled={ocupado === "guardar"}>
              {ocupado === "guardar" ? <Cargando texto="Guardando" /> : "Guardar"}
            </button>
          </>
        }
      >
        {editando && (
          <div className="form">
            <div className="form-fila">
              <label>
                Nombre completo
                <input value={editando.a.nombre} onChange={(e) => set({ nombre: e.target.value })} />
              </label>
              <label>
                Estudio
                <input value={editando.a.estudio} onChange={(e) => set({ estudio: e.target.value })} />
              </label>
            </div>
            <div className="form-fila">
              <label>
                Cédula o matrícula
                <input value={editando.a.matricula} onChange={(e) => set({ matricula: e.target.value })} />
              </label>
              <label>
                Teléfono
                <input value={editando.a.telefono} onChange={(e) => set({ telefono: e.target.value })} />
              </label>
              <label>
                Plan
                <select value={editando.a.plan} onChange={(e) => set({ plan: e.target.value as PlanId })}>
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (hasta {p.zonasMax} {p.zonasMax === 1 ? "zona" : "zonas"})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-fotos">
              <span>Zonas de cobertura</span>
              <div className="chips-grilla">
                {zonasCiudad.map((z) => {
                  const on = editando.a.zonas.includes(z.id);
                  return (
                    <button key={z.id} type="button" className={`chip ${on ? "on" : ""}`} onClick={() => set({ zonas: on ? editando.a.zonas.filter((x) => x !== z.id) : [...editando.a.zonas, z.id] })}>
                      {z.nombre}
                      {z.estado === "espera" && <small>por abrir</small>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="form-fotos">
              <span>Especialidades</span>
              <div className="chips-grilla">
                {LISTA_ESPECIALIDADES.map((e) => {
                  const on = editando.a.especialidades.includes(e);
                  return (
                    <button key={e} type="button" className={`chip ${on ? "on" : ""}`} onClick={() => set({ especialidades: on ? editando.a.especialidades.filter((x) => x !== e) : [...editando.a.especialidades, e] })}>
                      {ESPECIALIDADES[e].corto}
                    </button>
                  );
                })}
              </div>
            </div>
            {error && <p className="error-txt">{error}</p>}
          </div>
        )}
      </Modal>
      <Modal
        abierto={!!borrar}
        titulo="¿Eliminar la cuenta?"
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
                await eliminarArquitecto(borrar);
                setOcupado(null);
                setBorrar(null);
              }}
            >
              {ocupado === "borrar" ? <Cargando texto="Eliminando" /> : "Eliminar"}
            </button>
          </>
        }
      >
        <p className="muted">Sus propuestas quedan en el historial de los clientes. Si solo hay un problema de pago, mejor suspender.</p>
      </Modal>
    </div>
  );
}

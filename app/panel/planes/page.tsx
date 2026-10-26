"use client";

import { useEffect, useState } from "react";
import { Crown, Megaphone, Pencil, Plus, Power } from "lucide-react";
import { ErrorValidacion, useStore } from "@/lib/store";
import { usd, uid } from "@/lib/format";
import { todosLosProyectos } from "@/lib/photos";
import type { Anuncio, EspacioAnuncio, Plan } from "@/lib/types";
import { Cargando, Foto, Modal, Skel } from "@/components/ui";

const ESPACIOS: { id: EspacioAnuncio; nombre: string; donde: string }[] = [
  { id: "inicio-cliente", nombre: "Inicio del cliente", donde: "Entre los arquitectos del barrio, después del tercero" },
  { id: "pedidos-arquitecto", nombre: "Pedidos del arquitecto", donde: "En la lista de pedidos, después del segundo" },
];
const FOTOS_ANUNCIO = ["ad-1", "ad-2", "ad-3", "ad-4", "ad-5", "ad-6"];

function TarjetaPlan({ p }: { p: Plan }) {
  const { guardarPlan, arquitectos } = useStore();
  const [f, setF] = useState(p);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => setF(p), [p]);
  const cambiado = JSON.stringify(f) !== JSON.stringify(p);
  const pagan = arquitectos.filter((a) => a.plan === p.id && a.estadoPlan === "activo").length;
  const prueban = arquitectos.filter((a) => a.plan === p.id && a.estadoPlan === "prueba").length;
  const num = (k: keyof Plan) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });
  return (
    <section className={`pn-card plan-edit ${p.destacado ? "destacado" : ""}`}>
      <div className="pn-card-cab">
        <h2>
          <Crown size={18} /> {p.nombre}
        </h2>
        <span className="badge gris">
          {pagan} pagan · {prueban} en prueba
        </span>
      </div>
      <div className="form">
        <div className="form-fila tres">
          <label>
            Precio al mes (USD)
            <input type="number" value={f.precioUsd} onChange={num("precioUsd")} />
          </label>
          <label>
            Zonas
            <input type="number" value={f.zonasMax} onChange={num("zonasMax")} />
          </label>
          <label>
            Propuestas al mes
            <input type="number" value={f.propuestasMes} onChange={num("propuestasMes")} />
          </label>
          <label>
            Días de prueba
            <input type="number" value={f.pruebaDias} onChange={num("pruebaDias")} />
          </label>
        </div>
        <p className="muted chico">
          Ingreso hoy: {usd(pagan * p.precioUsd)} al mes. {f.propuestasMes >= 999 ? "Propuestas sin límite." : ""}
        </p>
        {error && <p className="error-txt">{error}</p>}
        {cambiado && (
          <div className="fila-acciones aparece">
            <button className="btn btn-sec chico" onClick={() => { setF(p); setError(""); }}>
              Descartar
            </button>
            <button
              className="btn btn-pri chico"
              disabled={ocupado}
              onClick={async () => {
                setError("");
                setOcupado(true);
                try {
                  await guardarPlan(f);
                } catch (e) {
                  if (e instanceof ErrorValidacion) setError(e.message);
                } finally {
                  setOcupado(false);
                }
              }}
            >
              {ocupado ? <Cargando texto="Guardando" /> : "Guardar plan"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function PanelPlanes() {
  const { listo, planes, anuncios, activarAnuncio, apagarAnuncio, guardarAnuncio } = useStore();
  const [editando, setEditando] = useState<Anuncio | null>(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const fotos = [...FOTOS_ANUNCIO, ...todosLosProyectos().slice(0, 4)];

  return (
    <div className="pn-pagina">
      <div className="pn-titulo">
        <h1>Planes y publicidad</h1>
        <p className="muted">Los planes se cobran como suscripción dentro de la app. Cada cambio de precio se publica también en las dos tiendas.</p>
      </div>
      <div className="pn-grid">{listo ? planes.map((p) => <TarjetaPlan key={p.id} p={p} />) : [0, 1, 2].map((i) => <Skel key={i} h={200} r={18} />)}</div>

      <div className="pn-titulo">
        <h1 className="h2">Espacios de publicidad</h1>
        <p className="muted">Dos lugares, un anuncio activo en cada uno. Nunca tapan un pedido ni una propuesta.</p>
      </div>
      <div className="pn-grid">
        {ESPACIOS.map((e) => {
          const del = anuncios.filter((a) => a.espacio === e.id);
          return (
            <section key={e.id} className="pn-card">
              <div className="pn-card-cab">
                <h2>
                  <Megaphone size={18} /> {e.nombre}
                </h2>
                <button
                  className="link"
                  onClick={() => {
                    setError("");
                    setEditando({ id: uid("an"), espacio: e.id, anunciante: "", titulo: "", texto: "", foto: "ad-1", activo: false, impresiones: 0, clics: 0 });
                  }}
                >
                  <Plus size={14} /> Nuevo
                </button>
              </div>
              <small className="muted">{e.donde}</small>
              <ul className="anuncios">
                {del.map((a) => (
                  <li key={a.id} className={a.activo ? "activo" : ""}>
                    <Foto k={a.foto} w={120} h={120} alt={a.titulo} className="pn-mini" />
                    <span>
                      <strong>{a.anunciante}</strong>
                      <small>{a.titulo}</small>
                      <small>
                        {a.impresiones.toLocaleString("es-MX")} vistas · {a.clics.toLocaleString("es-MX")} toques · {a.impresiones ? ((a.clics / a.impresiones) * 100).toFixed(1).replace(".", ",") : "0"} %
                      </small>
                    </span>
                    <span className="pn-acciones">
                      <button className="icon-btn chico" onClick={() => { setError(""); setEditando(a); }} aria-label="Editar anuncio" title="Editar">
                        <Pencil size={15} />
                      </button>
                      {a.activo ? (
                        <button className="btn btn-sec chico" disabled={ocupado === a.id} onClick={async () => { setOcupado(a.id); await apagarAnuncio(a.id); setOcupado(null); }}>
                          <Power size={14} /> Apagar
                        </button>
                      ) : (
                        <button className="btn btn-pri chico" disabled={ocupado === a.id} onClick={async () => { setOcupado(a.id); await activarAnuncio(a.id); setOcupado(null); }}>
                          Usar este
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <Modal
        abierto={!!editando}
        titulo={editando && anuncios.some((a) => a.id === editando.id) ? "Editar anuncio" : "Nuevo anuncio"}
        onClose={() => setEditando(null)}
        pie={
          <>
            <button className="btn btn-sec" onClick={() => setEditando(null)}>
              Cancelar
            </button>
            <button
              className="btn btn-pri"
              disabled={ocupado === "guardar"}
              onClick={async () => {
                if (!editando) return;
                setError("");
                setOcupado("guardar");
                try {
                  await guardarAnuncio(editando);
                  setEditando(null);
                } catch (e) {
                  if (e instanceof ErrorValidacion) setError(e.message);
                } finally {
                  setOcupado(null);
                }
              }}
            >
              {ocupado === "guardar" ? <Cargando texto="Guardando" /> : "Guardar"}
            </button>
          </>
        }
      >
        {editando && (
          <div className="form">
            <label>
              Anunciante
              <input value={editando.anunciante} onChange={(e) => setEditando({ ...editando, anunciante: e.target.value })} />
            </label>
            <label>
              Título ({editando.titulo.length} de 42)
              <input value={editando.titulo} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} />
            </label>
            <label>
              Texto
              <input value={editando.texto} onChange={(e) => setEditando({ ...editando, texto: e.target.value })} />
            </label>
            <div className="form-fotos">
              <span>Imagen</span>
              <div className="fotos-grilla">
                {fotos.map((k) => (
                  <button key={k} type="button" className={`foto-op ${editando.foto === k ? "on" : ""}`} onClick={() => setEditando({ ...editando, foto: k })}>
                    <Foto k={k} w={160} h={120} alt="Imagen del anuncio" />
                  </button>
                ))}
              </div>
            </div>
            <div className="vista-anuncio">
              <small>Así se ve en el celular</small>
              <div className="anuncio">
                <span className="anuncio-foto">
                  <Foto k={editando.foto} w={180} h={180} alt="" />
                </span>
                <span className="anuncio-txt">
                  <small>
                    <Megaphone size={11} /> Patrocinado · {editando.anunciante || "Anunciante"}
                  </small>
                  <strong>{editando.titulo || "Título del anuncio"}</strong>
                  <span>{editando.texto || "Texto corto"}</span>
                </span>
              </div>
            </div>
            {error && <p className="error-txt">{error}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}

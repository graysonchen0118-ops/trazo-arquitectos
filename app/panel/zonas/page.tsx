"use client";

import { useState } from "react";
import { BellRing, Hourglass, Inbox, MapPinned, Plus, Users } from "lucide-react";
import { ErrorValidacion, useStore } from "@/lib/store";
import { ciudadDe, CIUDADES } from "@/lib/mock/ciudades";
import { useDatosMaqueta } from "@/lib/vista";
import { Maqueta } from "@/components/three/Scenes";
import { Avatar, Cargando, Skel, Switch, Tilt } from "@/components/ui";

export default function PanelZonas() {
  const { listo, zonas, arquitectos, pedidos, ciudadPanel, setCiudadPanel, cambiarEstadoZona, crearZona, enfocar, foco, toast } = useStore();
  const ciudad = ciudadDe(ciudadPanel);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const deCiudad = zonas.filter((z) => z.ciudadId === ciudadPanel);
  const abiertas = deCiudad.filter((z) => z.estado === "abierta").length;
  const datos = useDatosMaqueta(ciudadPanel);

  const alternar = async (id: string, abrir: boolean) => {
    setOcupado(id);
    try {
      await cambiarEstadoZona(id, abrir ? "abierta" : "espera");
    } catch (e) {
      if (e instanceof ErrorValidacion) toast(e.message, "error");
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="pn-pagina">
      <div className="pn-titulo fila">
        <div>
          <h1>Zonas de {ciudad.nombre}</h1>
          <p className="muted">
            {abiertas} abiertas de {deCiudad.length}. Una zona se abre cuando ya tiene quien conteste los pedidos.
          </p>
        </div>
      </div>
      <div className="pn-estados">
        {CIUDADES.map((c) => (
          <button key={c.id} className={`chip ${c.id === ciudadPanel ? "on" : ""}`} onClick={() => setCiudadPanel(c.id)}>
            {c.nombre}
            <small>{zonas.filter((z) => z.ciudadId === c.id && z.estado === "abierta").length} abiertas</small>
          </button>
        ))}
      </div>

      <section className="pn-card zona-maqueta">
        <div className="zona-maqueta-lienzo">
          <Maqueta modo="fondo" {...datos} focoZona={foco?.tipo === "zona" ? foco.id : null} casaPropia={null} fotos={[]} />
        </div>
        <div className="zona-maqueta-ley">
          <span>
            <i className="ley-barro" /> Zona abierta
          </span>
          <span>
            <i className="ley-gris" /> En espera
          </span>
          <span>
            <i className="ley-azul" /> Estudio
          </span>
          <span>
            <i className="ley-ambar" /> Pedido sin respuesta en 24 h
          </span>
          <small className="muted">Toca una zona o pasa el mouse por ella para verla en la maqueta. Al abrirla, la manzana sube.</small>
        </div>
      </section>

      <div className="zonas-grilla">
        {!listo
          ? [0, 1, 2, 3].map((i) => <Skel key={i} h={190} r={18} />)
          : deCiudad.map((z, i) => {
              const cubren = arquitectos.filter((a) => a.zonas.includes(z.id) && !a.suspendido && a.estadoPlan !== "cancelado");
              const abiertos = pedidos.filter((p) => p.zonaId === z.id && p.estado === "abierto").length;
              const esperando = pedidos.filter((p) => p.zonaId === z.id && p.estado === "espera").length;
              const lista = z.estado === "espera" && cubren.length > 0 && z.enEspera > 0;
              const abierta = z.estado === "abierta";
              return (
                <Tilt key={z.id} className={`zona-card aparece-abajo ${abierta ? "abierta" : "espera"} ${lista ? "lista" : ""} ${foco?.tipo === "zona" && foco.id === z.id ? "enfocada" : ""}`} max={5}>
                  <div style={{ animationDelay: `${i * 50}ms` }} onMouseEnter={() => enfocar({ tipo: "zona", id: z.id })} onMouseLeave={() => enfocar(null)} onFocus={() => enfocar({ tipo: "zona", id: z.id })}>
                    <div className="fila-sb">
                      <span>
                        <strong>{z.nombre}</strong>
                        <span className={`badge ${abierta ? "ok" : lista ? "aviso" : "gris"}`}>{abierta ? "Abierta" : lista ? "Lista para abrir" : "En espera"}</span>
                      </span>
                      <Switch on={abierta} onChange={() => alternar(z.id, !abierta)} label={abierta ? `Pasar ${z.nombre} a espera` : `Abrir ${z.nombre}`} />
                    </div>
                    <ul className="zona-datos">
                      <li>
                        <Users size={15} /> {cubren.length} {cubren.length === 1 ? "arquitecto" : "arquitectos"}
                      </li>
                      <li>
                        <Inbox size={15} /> {abiertos} {abiertos === 1 ? "pedido abierto" : "pedidos abiertos"}
                      </li>
                      <li>
                        <Hourglass size={15} /> {z.enEspera} {z.enEspera === 1 ? "cliente espera" : "clientes esperan"}
                        {esperando > 0 && ` (${esperando} con pedido)`}
                      </li>
                    </ul>
                    <div className="zona-caras">
                      {cubren.slice(0, 5).map((a) => (
                        <Avatar key={a.id} k={a.foto} nombre={a.nombre} size={30} />
                      ))}
                      {cubren.length === 0 && <small className="muted">Sin arquitectos todavía</small>}
                    </div>
                    {lista && (
                      <button className="btn btn-pri chico ancho" disabled={ocupado === z.id} onClick={() => alternar(z.id, true)}>
                        {ocupado === z.id ? (
                          <Cargando texto="Abriendo" />
                        ) : (
                          <>
                            <BellRing size={15} /> Abrir y avisar a {z.enEspera}
                          </>
                        )}
                      </button>
                    )}
                    {ocupado === z.id && !lista && <Cargando texto="Guardando" />}
                  </div>
                </Tilt>
              );
            })}
      </div>

      <section className="pn-card nueva-zona">
        <div className="pn-card-cab">
          <h2>
            <MapPinned size={18} /> Nueva zona en {ciudad.nombre}
          </h2>
        </div>
        <form
          className="fila-acciones"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setOcupado("nueva");
            try {
              await crearZona(nombre, ciudadPanel);
              setNombre("");
            } catch (err) {
              if (err instanceof ErrorValidacion) setError(err.message);
            } finally {
              setOcupado(null);
            }
          }}
        >
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del barrio" aria-label="Nombre del barrio" />
          <button className="btn btn-pri" disabled={ocupado === "nueva"}>
            {ocupado === "nueva" ? <Cargando texto="Creando" /> : (
              <>
                <Plus size={16} /> Crear en espera
              </>
            )}
          </button>
        </form>
        {error && <p className="error-txt">{error}</p>}
        <p className="muted chico">Las zonas nuevas empiezan en espera: los clientes pueden publicar y quedan anotados, y nadie recibe silencio.</p>
      </section>
    </div>
  );
}

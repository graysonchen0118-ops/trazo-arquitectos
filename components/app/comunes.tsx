"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, Clock3, MapPin, Megaphone, MessageCircle, Send, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { ESPECIALIDADES, fecha, hace, hora } from "@/lib/format";
import { ARQUITECTO_ACTUAL, CLIENTE_ACTUAL } from "@/lib/mock/pedidos";
import type { EspacioAnuncio } from "@/lib/types";
import { Avatar, Foto, Nota, Skel, Vacio } from "../ui";

export function Hoja({ abierta, onClose, children, clase, titulo }: { abierta: boolean; onClose: () => void; children: React.ReactNode; clase?: string; titulo: string }) {
  useEffect(() => {
    if (!abierta) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [abierta, onClose]);
  if (!abierta) return null;
  return (
    <div className="hoja-capa" onClick={onClose}>
      <div className={`hoja ${clase ?? ""}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={titulo}>
        {children}
      </div>
    </div>
  );
}

export function Anuncio({ espacio }: { espacio: EspacioAnuncio }) {
  const { anuncios, contarImpresion, toast, listo } = useStore();
  const a = anuncios.find((x) => x.espacio === espacio && x.activo);
  useEffect(() => {
    if (a) contarImpresion(a.id);
  }, [a, contarImpresion]);
  if (!listo || !a) return null;
  return (
    <button className="anuncio" onClick={() => toast(`Abriríamos el sitio de ${a.anunciante}`, "info")}>
      <span className="anuncio-foto">
        <Foto k={a.foto} w={180} h={180} alt={a.titulo} />
      </span>
      <span className="anuncio-txt">
        <small>
          <Megaphone size={11} /> Patrocinado · {a.anunciante}
        </small>
        <strong>{a.titulo}</strong>
        <span>{a.texto}</span>
      </span>
    </button>
  );
}

export function FichaArquitecto() {
  const { arquitectoSel, abrirArquitecto, arquitectos, resenas, zonas } = useStore();
  const a = arquitectos.find((x) => x.id === arquitectoSel);
  const [grande, setGrande] = useState<string | null>(null);
  const suyas = useMemo(() => resenas.filter((r) => r.arquitectoId === arquitectoSel).slice(0, 6), [resenas, arquitectoSel]);
  if (!a) return null;
  const zonasTxt = a.zonas.map((z) => zonas.find((x) => x.id === z)?.nombre ?? z);
  return (
    <Hoja abierta onClose={() => abrirArquitecto(null)} clase="hoja-ficha" titulo={a.estudio}>
      <div className="ficha-portada">
        <Foto k={a.portafolio[0]?.foto ?? "base"} w={760} h={420} alt={a.portafolio[0]?.titulo ?? a.estudio} eager />
        <button className="icon-btn flotante" onClick={() => abrirArquitecto(null)} aria-label="Cerrar">
          <X size={18} />
        </button>
      </div>
      <div className="ficha-cuerpo">
        <div className="ficha-quien">
          <Avatar k={a.foto} nombre={a.nombre} size={64} />
          <div>
            <h2>{a.estudio}</h2>
            <p>
              {a.nombre}
              {a.verificado && (
                <span className="verif" title={a.matricula}>
                  <BadgeCheck size={15} /> Matrícula verificada
                </span>
              )}
            </p>
            <div className="ficha-meta">
              <Nota v={a.nota} n={a.resenas} />
              <span>
                <Clock3 size={13} /> Responde en {a.respondeHoras < 1 ? "menos de una hora" : `unas ${Math.round(a.respondeHoras)} h`}
              </span>
              <span>{a.anios} años de oficio</span>
            </div>
          </div>
        </div>
        <p className="ficha-bio">{a.bio}</p>
        <div className="etiquetas">
          {a.especialidades.map((e) => (
            <span key={e}>{ESPECIALIDADES[e].nombre}</span>
          ))}
        </div>
        <p className="ficha-zonas">
          <MapPin size={14} /> Cubre {zonasTxt.join(", ")}
        </p>
        <h3 className="sub">Portafolio</h3>
        <div className="porta-grilla">
          {a.portafolio.map((t) => (
            <button key={t.id} className="porta-item" onClick={() => setGrande(t.foto)}>
              <Foto k={t.foto} w={320} h={240} alt={t.titulo} />
              <span>{t.titulo}</span>
            </button>
          ))}
        </div>
        <h3 className="sub">Reseñas</h3>
        {suyas.length === 0 ? (
          <p className="muted chico">Todavía no tiene reseñas en la app. Las reseñas solo las deja quien lo contrató.</p>
        ) : (
          <ul className="resenas">
            {suyas.map((r) => (
              <li key={r.id}>
                <Avatar k={r.clienteFoto} nombre={r.cliente} size={34} />
                <div>
                  <strong>
                    {r.cliente} <Nota v={r.nota} />
                  </strong>
                  <small>
                    {r.obra} · {fecha(r.fecha)}
                  </small>
                  <p>{r.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {grande && (
        <div className="visor" onClick={() => setGrande(null)}>
          <Foto k={grande} w={900} h={700} alt="Obra del portafolio" eager />
          <button className="icon-btn flotante" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
      )}
    </Hoja>
  );
}

export function Mensajes() {
  const { conversaciones, rol, arquitectos, clientes, pedidos, abrirConversacion, listo, ahora } = useStore();
  const mias = conversaciones
    .filter((c) => (rol === "cliente" ? c.clienteId === CLIENTE_ACTUAL : c.arquitectoId === ARQUITECTO_ACTUAL))
    .sort((a, b) => new Date(b.mensajes.at(-1)?.en ?? 0).getTime() - new Date(a.mensajes.at(-1)?.en ?? 0).getTime());
  return (
    <div className="seccion">
      <div className="seccion-cab">
        <h2>Mensajes</h2>
        <p className="muted chico">{rol === "cliente" ? "Conversaciones con los arquitectos de tus pedidos" : "Conversaciones con clientes de tus zonas"}</p>
      </div>
      {!listo ? (
        <div className="lista-conv">
          {[0, 1, 2].map((i) => (
            <div key={i} className="conv-fila">
              <Skel h={44} w={44} r={22} />
              <div style={{ flex: 1 }}>
                <Skel h={14} w="60%" />
                <Skel h={12} w="85%" />
              </div>
            </div>
          ))}
        </div>
      ) : mias.length === 0 ? (
        <Vacio icono={<MessageCircle size={26} />} titulo="Sin conversaciones" texto="Cuando eliges una propuesta o te escriben, la conversación aparece aquí." />
      ) : (
        <div className="lista-conv">
          {mias.map((c, i) => {
            const a = arquitectos.find((x) => x.id === c.arquitectoId);
            const cl = clientes.find((x) => x.id === c.clienteId);
            const p = pedidos.find((x) => x.id === c.pedidoId);
            const ultimo = c.mensajes.at(-1);
            const nombre = rol === "cliente" ? a?.estudio : cl?.nombre;
            return (
              <button key={c.id} className={`conv-fila aparece-abajo ${!c.leida ? "nueva" : ""}`} style={{ animationDelay: `${i * 50}ms` }} onClick={() => abrirConversacion(c.id)}>
                <Avatar k={(rol === "cliente" ? a?.foto : cl?.foto) ?? ""} nombre={nombre ?? ""} size={46} />
                <span className="conv-txt">
                  <strong>{nombre}</strong>
                  <small>{p?.titulo}</small>
                  <span>{ultimo ? `${ultimo.de === rol ? "Tú: " : ""}${ultimo.texto}` : "Escribe el primer mensaje"}</span>
                </span>
                <span className="conv-hora">
                  {ultimo ? hace(ultimo.en, ahora) : ""}
                  {!c.leida && <i />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Chat() {
  const { conversacionSel, abrirConversacion, conversaciones, arquitectos, clientes, pedidos, rol, enviarMensaje, escribiendo } = useStore();
  const c = conversaciones.find((x) => x.id === conversacionSel);
  const [texto, setTexto] = useState("");
  const fin = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    fin.current?.scrollIntoView({ block: "end" });
  }, [c?.mensajes.length, escribiendo]);
  if (!c) return null;
  const a = arquitectos.find((x) => x.id === c.arquitectoId);
  const cl = clientes.find((x) => x.id === c.clienteId);
  const p = pedidos.find((x) => x.id === c.pedidoId);
  const yo = rol;
  const rapidas = yo === "cliente" ? ["¿Cuándo puedes venir a medir?", "¿Qué necesitas que tenga listo?", "Gracias, lo veo y te confirmo"] : ["¿Te queda bien el jueves en la tarde?", "Te mando un boceto hoy", "¿Me pasas una foto del techo?"];
  const enviar = (t: string) => {
    if (!t.trim()) return;
    enviarMensaje(c.id, yo, t);
    setTexto("");
  };
  return (
    <Hoja abierta onClose={() => abrirConversacion(null)} clase="hoja-chat" titulo="Conversación">
      <header className="chat-cab">
        <button className="icon-btn" onClick={() => abrirConversacion(null)} aria-label="Volver">
          <ArrowLeft size={19} />
        </button>
        <Avatar k={(yo === "cliente" ? a?.foto : cl?.foto) ?? ""} nombre="" size={38} />
        <span>
          <strong>{yo === "cliente" ? a?.estudio : cl?.nombre}</strong>
          <small>{p?.titulo}</small>
        </span>
      </header>
      <div className="chat-cuerpo">
        <p className="chat-aviso">Los datos de contacto se comparten solo dentro de la app hasta que el cliente elige.</p>
        {c.mensajes.map((m) => (
          <div key={m.id} className={`burbuja ${m.de === yo ? "mia" : ""}`}>
            <p>{m.texto}</p>
            <small>{hora(m.en)}</small>
          </div>
        ))}
        {escribiendo === c.id && (
          <div className="burbuja escribiendo" aria-label="Escribiendo">
            <i />
            <i />
            <i />
          </div>
        )}
        <div ref={fin} />
      </div>
      <div className="chat-rapidas">
        {rapidas.map((r) => (
          <button key={r} className="chip" onClick={() => enviar(r)}>
            {r}
          </button>
        ))}
      </div>
      <form
        className="chat-pie"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
      >
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje" aria-label="Mensaje" />
        <button className="btn btn-pri chico" disabled={!texto.trim()} aria-label="Enviar">
          <Send size={16} />
        </button>
      </form>
    </Hoja>
  );
}

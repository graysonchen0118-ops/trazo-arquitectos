"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, Star, TriangleAlert, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { foto } from "@/lib/photos";

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tono}`}>
          {t.tono === "ok" ? <CheckCircle2 size={18} /> : t.tono === "error" ? <TriangleAlert size={18} /> : <Info size={18} />}
          <span>{t.texto}</span>
        </div>
      ))}
    </div>
  );
}

export function Foto({ k, w, h, alt, className, eager }: { k: string; w: number; h: number; alt: string; className?: string; eager?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <img
      src={foto(k, w, h)}
      width={w}
      height={h}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`foto ${ok ? "foto-ok" : ""} ${className ?? ""}`}
      onLoad={() => setOk(true)}
    />
  );
}

export function Avatar({ k, nombre, size = 36 }: { k: string; nombre: string; size?: number }) {
  return (
    <img src={foto(k, size * 2, size * 2, true)} width={size} height={size} alt={nombre} className="avatar" style={{ width: size, height: size }} loading="lazy" />
  );
}

export function Skel({ h = 16, w = "100%", r = 10 }: { h?: number; w?: number | string; r?: number }) {
  return <span className="skel" style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />;
}

/** inclina la tarjeta en perspectiva real siguiendo el puntero, con la luz que acompaña */
export function Tilt({ children, className, max = 8, onClick, as = "div" }: { children: React.ReactNode; className?: string; max?: number; onClick?: () => void; as?: "div" | "button" }) {
  const ref = useRef<HTMLElement | null>(null);
  const mover = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
    el.style.setProperty("--lx", `${((x + 0.5) * 100).toFixed(0)}%`);
    el.style.setProperty("--ly", `${((y + 0.5) * 100).toFixed(0)}%`);
  };
  const salir = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  const props = {
    ref: (n: HTMLElement | null) => {
      ref.current = n;
    },
    className: `tilt ${className ?? ""}`,
    onPointerMove: mover,
    onPointerLeave: salir,
    onClick,
  };
  return as === "button" ? (
    <button type="button" {...props}>
      {children}
    </button>
  ) : (
    <div {...props}>{children}</div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? "on" : ""}`} onClick={onChange}>
      <span />
    </button>
  );
}

export function Modal({ abierto, titulo, onClose, children, ancho = 560, pie }: { abierto: boolean; titulo: string; onClose: () => void; children: React.ReactNode; ancho?: number; pie?: React.ReactNode }) {
  useEffect(() => {
    if (!abierto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [abierto, onClose]);
  if (!abierto) return null;
  return (
    <div className="modal-capa" onClick={onClose}>
      <div className="modal" style={{ maxWidth: ancho }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={titulo}>
        <header className="modal-cab">
          <h3>{titulo}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <div className="modal-cuerpo">{children}</div>
        {pie && <footer className="modal-pie">{pie}</footer>}
      </div>
    </div>
  );
}

export function Vacio({ icono, titulo, texto, accion }: { icono: React.ReactNode; titulo: string; texto: string; accion?: React.ReactNode }) {
  return (
    <div className="vacio">
      <span className="vacio-ic">{icono}</span>
      <strong>{titulo}</strong>
      <p>{texto}</p>
      {accion}
    </div>
  );
}

export function Nota({ v, n }: { v: number; n?: number }) {
  if (!v) return <span className="nota nota-nueva">Nuevo</span>;
  return (
    <span className="nota" aria-label={`${v.toFixed(1)} de 5`}>
      <Star size={13} fill="currentColor" strokeWidth={0} />
      {v.toFixed(1).replace(".", ",")}
      {n !== undefined && <em>({n.toLocaleString("es-MX")})</em>}
    </span>
  );
}

export function Estrellas({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  return (
    <div className="estrellas" role="radiogroup" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={valor === i} aria-label={`${i} de 5`} className={i <= valor ? "on" : ""} onClick={() => onChange(i)}>
          <Star size={26} fill={i <= valor ? "currentColor" : "none"} strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}

export function Cargando({ texto }: { texto: string }) {
  return (
    <span className="cargando-btn">
      <span className="giro" aria-hidden="true" />
      {texto}
    </span>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "./store";
import { ciudadDe } from "./mock/ciudades";
import { ARQUITECTO_ACTUAL, CLIENTE_ACTUAL } from "./mock/pedidos";
import { horasDesde } from "./format";
import type { Pedido } from "./types";
import type { PinArq, PinPedido, ZonaEsc } from "@/components/three/Maqueta";

export function useAncho() {
  const [w, setW] = useState<number | null>(null);
  useEffect(() => {
    const f = () => {
      setW(window.innerWidth);
      document.documentElement.style.setProperty("--zoom-tel", String(Math.min(1, Math.max(0.68, (window.innerHeight - 128) / 812))));
    };
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return w;
}

export function useZona(id: string | null | undefined) {
  const { zonas } = useStore();
  return useMemo(() => zonas.find((z) => z.id === id) ?? null, [zonas, id]);
}

export function useCiudadDeZona(zonaId: string | null | undefined) {
  const z = useZona(zonaId);
  return ciudadDe(z?.ciudadId ?? "cdmx");
}

/** cuántas propuestas activas tiene cada pedido */
export function usePropuestasPorPedido() {
  const { propuestas } = useStore();
  return useMemo(() => {
    const m = new Map<string, number>();
    propuestas.forEach((p) => {
      if (p.estado === "retirada") return;
      m.set(p.pedidoId, (m.get(p.pedidoId) ?? 0) + 1);
    });
    return m;
  }, [propuestas]);
}

/** pedidos abiertos que ya pasaron 24 horas sin una sola propuesta */
export function useSinRespuesta(): Pedido[] {
  const { pedidos, ahora } = useStore();
  const cuenta = usePropuestasPorPedido();
  return useMemo(
    () => pedidos.filter((p) => p.estado === "abierto" && !cuenta.get(p.id) && horasDesde(p.creado, ahora) >= 24).sort((a, b) => new Date(a.creado).getTime() - new Date(b.creado).getTime()),
    [pedidos, cuenta, ahora],
  );
}

/** lo que la maqueta necesita de una ciudad */
export function useDatosMaqueta(ciudadId: string, opciones: { soloPropios?: boolean } = {}) {
  const { zonas, arquitectos, pedidos, ahora } = useStore();
  const cuenta = usePropuestasPorPedido();
  return useMemo(() => {
    const zs: ZonaEsc[] = zonas.filter((z) => z.ciudadId === ciudadId).map((z) => ({ id: z.id, nombre: z.nombre, estado: z.estado, celda: z.celda }));
    const ids = new Set(zs.map((z) => z.id));
    const as: PinArq[] = arquitectos.filter((a) => a.ciudadId === ciudadId && !a.suspendido).map((a) => ({ id: a.id, zonaId: a.zonas.find((z) => ids.has(z)) ?? a.zonas[0], propio: a.id === ARQUITECTO_ACTUAL }));
    const ps: PinPedido[] = pedidos
      .filter((p) => ids.has(p.zonaId) && (p.estado === "abierto" || (p.clienteId === CLIENTE_ACTUAL && p.estado !== "oculto")))
      .filter((p) => (opciones.soloPropios ? p.clienteId === CLIENTE_ACTUAL : true))
      .map((p) => ({ id: p.id, zonaId: p.zonaId, propio: p.clienteId === CLIENTE_ACTUAL, sinRespuesta: p.estado === "abierto" && !cuenta.get(p.id) && horasDesde(p.creado, ahora) >= 24 }));
    return { zonas: zs, arquitectos: as, pedidos: ps };
  }, [zonas, arquitectos, pedidos, ahora, cuenta, ciudadId, opciones.soloPropios]);
}

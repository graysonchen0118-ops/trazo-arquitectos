"use client";

import dynamic from "next/dynamic";

export const Maqueta = dynamic(() => import("./Maqueta"), {
  ssr: false,
  loading: () => <div className="maqueta-ph" aria-hidden="true" />,
});

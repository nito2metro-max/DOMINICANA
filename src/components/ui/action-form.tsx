"use client";
import { useEffect, useRef, useState, type ComponentProps, type Ref } from "react";
import type { ActionState } from "@/lib/validation";

/**
 * <form> para acciones de servidor. React 19 reinicia los campos al terminar una
 * acción; si la acción devuelve error, este componente restaura lo que el usuario
 * había escrito para que no tenga que repetirlo (excepto archivos y contraseñas).
 */
export function Form({ state, ref, onSubmit, ...rest }: ComponentProps<"form"> & { state: ActionState; ref?: Ref<HTMLFormElement> }) {
  const inner = useRef<HTMLFormElement | null>(null);
  const snapshot = useRef<FormData | null>(null);
  // Marca de hidratación: útil para pruebas E2E y para estilos condicionales
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    const form = inner.current;
    const data = snapshot.current;
    if (!form || !data || !state || state.ok) return;
    for (const el of Array.from(form.elements)) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) || !el.name) continue;
      if (el instanceof HTMLInputElement) {
        if (el.type === "file" || el.type === "password" || el.type === "hidden" || el.type === "submit") continue;
        if (el.type === "checkbox" || el.type === "radio") {
          el.checked = data.getAll(el.name).includes(el.value);
          continue;
        }
      }
      const v = data.get(el.name);
      if (typeof v === "string") el.value = v;
    }
  }, [state]);

  return (
    <form
      {...rest}
      data-df-form=""
      data-hydrated={hydrated || undefined}
      ref={(node) => {
        inner.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as { current: HTMLFormElement | null }).current = node;
      }}
      onSubmit={(e) => {
        snapshot.current = new FormData(e.currentTarget);
        onSubmit?.(e);
      }}
    />
  );
}

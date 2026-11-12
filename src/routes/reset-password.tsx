import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/catalog-ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Restablecer contraseña — All Wiki" },
    { name: "description", content: "Establece una nueva contraseña para tu cuenta de All Wiki." },
    { property: "og:title", content: "Restablecer contraseña — All Wiki" },
    { property: "og:description", content: "Establece una nueva contraseña para tu cuenta de All Wiki." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [valid, setValid] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let alive = true;
    async function verify() {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const access = hash.get("access_token");
      const refresh = hash.get("refresh_token");
      if (hash.get("type") !== "recovery" || !access || !refresh) {
        setChecking(false); return;
      }
      const { error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      setValid(!error && Boolean(user)); setChecking(false);
      window.history.replaceState(null, "", window.location.pathname);
    }
    void verify().catch(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    if (password !== confirmation) { setError("Las contraseñas no coinciden."); return; }
    setBusy(true); setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setError("No se pudo actualizar la contraseña. Prueba una contraseña más segura o solicita otro enlace.");
      else setDone(true);
    } catch { setError("No se pudo conectar. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }
  return <Shell><section className="mx-auto my-16 max-w-sm space-y-4">
    <h1 className="font-display text-xl uppercase">Restablecer contraseña</h1>
    {checking ? <p>Comprobando enlace…</p> : done ? <p role="status">Contraseña actualizada.</p> : !valid ? <p role="alert">El enlace no es válido o ha caducado. Solicita uno nuevo desde Iniciar sesión.</p> :
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">Nueva contraseña<input className="border border-border bg-background px-3 py-2" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <label className="flex flex-col gap-1 text-sm">Repetir contraseña<input className="border border-border bg-background px-3 py-2" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button disabled={busy}>{busy ? "Guardando…" : "Guardar contraseña"}</Button>
      </form>}
  </section></Shell>;
}
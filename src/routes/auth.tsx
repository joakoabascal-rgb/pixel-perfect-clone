import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/catalog-ui";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso privado — All Wiki" },
      { name: "description", content: "Acceso privado de edición de All Wiki." },
      { property: "og:title", content: "Acceso privado — All Wiki" },
      { property: "og:description", content: "Acceso privado de edición de All Wiki." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setError("Correo o contraseña incorrectos.");
    navigate({ to: "/admin" });
  }

  return (
    <Shell>
      <form onSubmit={submit} className="glass mx-auto my-16 flex max-w-sm flex-col gap-4 p-6">
        <h1 className="font-display text-xl uppercase tracking-wide">Acceso privado</h1>
        <label className="flex flex-col gap-1 text-sm">Correo
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="border border-border bg-background px-3 py-2" autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1 text-sm">Contraseña
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="border border-border bg-background px-3 py-2" autoComplete="current-password" />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50">{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </Shell>
  );
}

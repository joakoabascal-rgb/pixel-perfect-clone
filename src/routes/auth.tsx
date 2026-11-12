import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/catalog-ui";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/lib/auth-state";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — All Wiki" },
      { name: "description", content: "Accede a tu cuenta de All Wiki." },
      { property: "og:title", content: "Iniciar sesión — All Wiki" },
      { property: "og:description", content: "Accede a tu cuenta de All Wiki." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAccount();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function switchMode(next: typeof mode) {
    setMode(next); setError(null); setNotice(null); setPassword("");
  }

  async function google() {
    setBusy(true); setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) setError("No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
      else if (!result.redirected) await navigate({ to: "/" });
    } catch { setError("No se pudo conectar. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) setError("No se pudo enviar el correo. Inténtalo más tarde.");
        else setNotice("Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
        if (error) setError(error.code === "signup_disabled" ? "El registro público todavía no está habilitado." : "No se pudo crear la cuenta. Revisa los datos o intenta iniciar sesión.");
        else if (!data.session) { setNotice("Revisa tu correo para confirmar tu cuenta antes de iniciar sesión."); setPassword(""); }
        else await navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) setError(error.code === "email_not_confirmed" ? "Confirma tu correo antes de iniciar sesión." : "Correo o contraseña incorrectos.");
        else await navigate({ to: "/" });
      }
    } catch { setError("No se pudo conectar. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }

  return (
    <Shell>
      {user ? <section className="mx-auto my-16 max-w-sm space-y-4">
        <h1 className="font-display text-xl uppercase">Sesión iniciada</h1>
        <p className="break-all text-sm text-muted-foreground">{user.email}</p>
        <Button onClick={() => navigate({ to: "/" })}>Volver al catálogo</Button>
      </section> : <form onSubmit={submit} className="mx-auto my-16 flex max-w-sm flex-col gap-4">
        <h1 className="font-display text-xl uppercase tracking-wide">{mode === "login" ? "Iniciar sesión" : mode === "signup" ? "Crear cuenta" : "Recuperar contraseña"}</h1>
        {mode !== "forgot" && <div className="flex border border-border" role="group" aria-label="Acceso">
          <Button type="button" className="flex-1" variant={mode === "login" ? "default" : "ghost"} disabled={busy} onClick={() => switchMode("login")}>Iniciar sesión</Button>
          <Button type="button" className="flex-1" variant={mode === "signup" ? "default" : "ghost"} disabled={busy} onClick={() => switchMode("signup")}>Crear cuenta</Button>
        </div>}
        <label className="flex flex-col gap-1 text-sm">Correo
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="border border-border bg-background px-3 py-2" autoComplete="email" />
        </label>
        {mode !== "forgot" && <label className="flex flex-col gap-1 text-sm">Contraseña
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="border border-border bg-background px-3 py-2" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        </label>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="text-sm text-foreground">{notice}</p>}
        <Button disabled={busy}>{busy ? "Procesando…" : mode === "login" ? "Entrar" : mode === "signup" ? "Crear cuenta" : "Enviar enlace"}</Button>
        {mode !== "forgot" && <Button type="button" variant="outline" disabled={busy} onClick={google}>Continuar con Google</Button>}
        <Button type="button" variant="link" disabled={busy} onClick={() => switchMode(mode === "forgot" ? "login" : "forgot")}>{mode === "forgot" ? "Volver a iniciar sesión" : "¿Olvidaste tu contraseña?"}</Button>
      </form>}
    </Shell>
  );
}

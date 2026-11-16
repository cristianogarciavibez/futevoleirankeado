import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Futevôlei Rankeado" },
      { name: "description", content: "Acesso administrativo do Futevôlei Rankeado." },
      { property: "og:title", content: "Entrar — Futevôlei Rankeado" },
      { property: "og:description", content: "Acesso administrativo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function enterWithGoogle() {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: new URL("/admin", window.location.origin).href,
          queryParams: { login_hint: "ftvrankeado@gmail.com", prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch {
      setErr("Não foi possível iniciar o acesso pelo Google. Tente novamente ou entre com sua senha.");
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-8 shadow-glow">
      <div className="mb-6 flex justify-center"><Logo className="h-14" /></div>
      <h1 className="mb-5 text-center text-3xl">Acesso administrativo</h1>
      <Button type="button" variant="outline" className="w-full" onClick={enterWithGoogle} disabled={busy}>
        Continuar com Google
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">ou entre com e-mail</div>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true); setErr(null);
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          setBusy(false);
          if (error) return setErr("Email ou senha inválidos.");
          nav({ to: "/admin" });
        }}
      >
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">Senha</Label><Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
      </form>
    </div>
  );
}

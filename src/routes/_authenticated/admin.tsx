import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { matchPoints } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel ADM — Futevôlei Rankeado" },
      { name: "description", content: "Painel administrativo do Futevôlei Rankeado." },
      { property: "og:title", content: "Painel ADM — Futevôlei Rankeado" },
      { property: "og:description", content: "Painel administrativo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Athlete = { id: string; name: string; active: boolean };

function useRoles() {
  return useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id);
      return { email: u.user!.email, roles: (data ?? []).map((r) => r.role) };
    },
  });
}
function useAthletes() {
  return useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("athletes").select("id,name,active").order("name");
      if (error) throw error;
      return data as Athlete[];
    },
  });
}

function Admin() {
  const nav = useNavigate();
  const { data, isLoading } = useRoles();
  const signOut = async () => { await supabase.auth.signOut(); nav({ to: "/" }); };
  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  const isOwner = data?.roles.includes("owner");
  const isAdmin = isOwner || data?.roles.includes("admin");
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">{data?.email}</p>
          <h1 className="text-5xl">Painel ADM</h1>
        </div>
        <Button variant="outline" onClick={signOut}>Sair</Button>
      </div>
      {!isAdmin ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="font-display text-2xl">Sem permissão de administrador</p>
          <p className="text-muted-foreground">Peça ao dono do ranking para te designar como administrador.</p>
        </div>
      ) : (
        <Tabs defaultValue="partida">
          <TabsList className="mb-4">
            <TabsTrigger value="partida">Adicionar partida</TabsTrigger>
            <TabsTrigger value="atletas">Gerir atletas</TabsTrigger>
            {isOwner && <TabsTrigger value="admins">Administradores</TabsTrigger>}
          </TabsList>
          <TabsContent value="partida"><AddMatch /></TabsContent>
          <TabsContent value="atletas"><Athletes /></TabsContent>
          {isOwner && <TabsContent value="admins"><Admins /></TabsContent>}
        </Tabs>
      )}
    </section>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

function AddMatch() {
  const qc = useQueryClient();
  const { data: athletes = [] } = useAthletes();
  const active = athletes.filter((a) => a.active);
  const [date, setDate] = useState(today());
  const [p, setP] = useState<[string, string, string, string]>(["", "", "", ""]);
  const [sa, setSa] = useState("");
  const [sb, setSb] = useState("");
  const [doubled, setDoubled] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const a = Number(sa), b = Number(sb);
  const scoresOk = sa !== "" && sb !== "" && Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a !== b;
  const distinct = p.every(Boolean) && new Set(p).size === 4;
  const preview = scoresOk ? matchPoints(a, b, doubled) : null;

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("add_match", {
        _request_id: requestId, _played_on: date, _a1: p[0], _a2: p[1], _b1: p[2], _b2: p[3],
        _score_a: a, _score_b: b, _doubled: doubled,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Partida salva e ranking atualizado");
      qc.invalidateQueries({ queryKey: ["ranking"] });
      setP(["", "", "", ""]); setSa(""); setSb(""); setDoubled(false);
      setRequestId(crypto.randomUUID());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pick = (i: number) => (
    <Select value={p[i] ?? ""} onValueChange={(v) => setP((old) => old.map((x, j) => (j === i ? v : x)) as [string, string, string, string])}>
      <SelectTrigger><SelectValue placeholder={`Atleta ${(i % 2) + 1}`} /></SelectTrigger>
      <SelectContent>
        {active.map((at) => (
          <SelectItem key={at.id} value={at.id} disabled={p.includes(at.id) && p[i] !== at.id}>{at.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  const team = (label: string, i: number, score: string, set: (v: string) => void, pts?: number) => (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-2xl">{label}</p>
        {pts !== undefined && <span className={`font-display text-2xl ${pts > 0 ? "text-success" : "text-destructive"}`}>{pts > 0 ? `+${pts}` : pts} cada</span>}
      </div>
      {pick(i)}{pick(i + 1)}
      <Input type="number" min={0} inputMode="numeric" placeholder="Pontos" value={score} onChange={(e) => set(e.target.value)} />
    </div>
  );

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!save.isPending) save.mutate(); }}>
      {active.length < 4 && <p className="text-sm text-accent">Cadastre pelo menos 4 atletas ativos em “Gerir atletas”.</p>}
      <div className="flex flex-wrap items-end gap-6">
        <div className="space-y-1.5"><Label htmlFor="d">Data</Label><Input id="d" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-44" /></div>
        <div className="flex items-center gap-2 pb-2"><Switch id="dob" checked={doubled} onCheckedChange={setDoubled} /><Label htmlFor="dob">Dobrado (×2)</Label></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {team("Dupla A", 0, sa, setSa, preview?.teamA)}
        {team("Dupla B", 2, sb, setSb, preview?.teamB)}
      </div>
      {sa !== "" && sb !== "" && a === b && <p className="text-sm text-destructive">Não existe empate.</p>}
      <Button type="submit" size="lg" disabled={!distinct || !scoresOk || !date || save.isPending}>
        {save.isPending ? "Salvando…" : "Salvar partida"}
      </Button>
    </form>
  );
}

function Athletes() {
  const qc = useQueryClient();
  const { data: athletes = [] } = useAthletes();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["athletes"] }); qc.invalidateQueries({ queryKey: ["ranking"] }); };
  const err = (m: string) => toast.error(m.includes("duplicate") ? "Já existe um atleta com esse nome" : m);

  return (
    <div className="space-y-4">
      <form className="flex gap-2" onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await supabase.from("athletes").insert({ name: name.trim() });
        if (error) { err(error.message); return; }
        setName(""); refresh(); toast.success("Atleta criado");
      }}>
        <Input placeholder="Nome do atleta" required value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit">Criar</Button>
      </form>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {athletes.length === 0 && <li className="p-4 text-muted-foreground">Nenhum atleta cadastrado.</li>}
        {athletes.map((at) => (
          <li key={at.id} className="flex flex-wrap items-center gap-2 p-3">
            {editing === at.id ? (
              <>
                <Input className="max-w-xs" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <Button size="sm" onClick={async () => {
                  const { error } = await supabase.from("athletes").update({ name: editName.trim() }).eq("id", at.id);
                  if (error) { err(error.message); return; }
                  setEditing(null); refresh();
                }}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              </>
            ) : (
              <>
                <span className={`flex-1 font-semibold ${at.active ? "" : "text-muted-foreground line-through"}`}>{at.name}</span>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(at.id); setEditName(at.name); }}>Editar</Button>
                <Button size="sm" variant={at.active ? "outline" : "secondary"} onClick={async () => {
                  const { error } = await supabase.from("athletes").update({ active: !at.active }).eq("id", at.id);
                  if (error) { err(error.message); return; }
                  refresh();
                }}>{at.active ? "Desativar" : "Reativar"}</Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Admins() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_admins");
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">A pessoa precisa ter uma conta criada (Cloud → Usuários → Adicionar usuário). Depois, informe o email aqui.</p>
      <form className="flex gap-2" onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await supabase.rpc("grant_admin", { _email: email });
        if (error) { toast.error(error.message); return; }
        setEmail(""); qc.invalidateQueries({ queryKey: ["admins"] }); toast.success("Administrador designado");
      }}>
        <Input type="email" placeholder="email@exemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit">Designar</Button>
      </form>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {data.map((r) => (
          <li key={r.user_id + r.role} className="flex items-center gap-2 p-3">
            <span className="flex-1">{r.email}</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{r.role === "owner" ? "Dono" : "Admin"}</span>
            {r.role === "admin" && (
              <Button size="sm" variant="ghost" onClick={async () => {
                const { error } = await supabase.rpc("revoke_admin", { _user_id: r.user_id });
                if (error) { toast.error(error.message); return; }
                qc.invalidateQueries({ queryKey: ["admins"] });
              }}>Remover</Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

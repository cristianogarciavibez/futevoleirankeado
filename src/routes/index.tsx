import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { currentSeason } from "@/lib/scoring";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ranking — Futevôlei Rankeado" },
      { name: "description", content: "Classificação dos atletas por temporada no Futevôlei Rankeado." },
      { property: "og:title", content: "Ranking — Futevôlei Rankeado" },
      { property: "og:description", content: "Classificação dos atletas por temporada." },
    ],
  }),
  component: RankingPage,
});

function RankingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ranking"],
    queryFn: async () => {
      const { data, error } = await supabase.from("season_ranking").select("*");
      if (error) throw error;
      return data;
    },
  });
  const seasons = useMemo(() => {
    const s = new Set((data ?? []).map((r) => r.season!));
    s.add(currentSeason());
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [data]);
  const [season, setSeason] = useState(currentSeason());
  useEffect(() => {
    if (data && !data.some((r) => r.season === season) && data.length) {
      const latest = [...new Set(data.map((r) => r.season!))].sort().at(-1);
      if (latest) setSeason(latest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const rows = (data ?? [])
    .filter((r) => r.season === season)
    .sort((a, b) => (b.points! - a.points!) || (b.wins! - a.wins!) || a.name!.localeCompare(b.name!));

  return (
    <section>
      <div className="season-banner mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Classificação</p>
          <h1 className="text-5xl sm:text-6xl">Temporada {season}</h1>
        </div>
        <Select value={season} onValueChange={setSeason}>
          <SelectTrigger aria-label="Selecionar temporada" className="w-40 bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            {seasons.map((s) => <SelectItem key={s} value={s}>Temporada {s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando…</p>}
      {error && <p className="text-destructive">Não foi possível carregar o ranking.</p>}
      {!isLoading && !error && rows.length === 0 && (
        <div className="stripe-court rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-3xl">Nenhuma partida registrada</p>
          <p className="mt-1 text-muted-foreground">O ranking desta temporada aparece assim que a primeira partida for lançada.</p>
        </div>
      )}
      {rows.length > 0 && (
        <ol className="space-y-2">
          {rows.map((r, i) => {
            const medal = i === 0 ? "text-gold" : i === 1 ? "text-silver" : i === 2 ? "text-bronze" : "text-muted-foreground";
            return (
              <li key={r.athlete_id} className={`flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 ${i === 0 ? "shadow-glow border-primary/50" : ""}`}>
                <span className={`font-display w-10 text-4xl ${medal}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.games} jogos · {r.wins} vitórias</p>
                </div>
                <span className={`font-display text-4xl ${r.points! < 0 ? "text-destructive" : "text-primary"}`}>{r.points}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

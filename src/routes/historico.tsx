import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — Futevôlei Rankeado" },
      { name: "description", content: "Campeões da Liga e da Copa e o Livro de Recordes do Futevôlei Rankeado." },
      { property: "og:title", content: "Histórico — Futevôlei Rankeado" },
      { property: "og:description", content: "Campeões da Liga, da Copa e Livro de Recordes." },
    ],
  }),
  component: Historico,
});

const liga = [["23.2", "Enzzo"], ["24.1", "Miguel"], ["24.2", "Sérgio"], ["25.1", "Lucola"], ["25.2", "Chaves"], ["26.1", "Adelino"]];
const copa = [["24.2", "Sérgio"], ["25.1", "Barra"], ["25.2", "Lucola"], ["26.1", "Alma"], ["26.2", "Adelino"]];
const recordes = [
  ["Maior sequência de vitórias em dupla", "Adelino e Sérgio", "8"],
  ["Mais pontos em uma temporada", "Lucola", "41"],
  ["Menor pontuação em um dia", "Sérgio", "-9"],
  ["Dia com menos interação no grupo", "—", "19/08/2025"],
  ["Mais menções ao Ranking em uma cerimônia de casamento", "Sérgio e Bruna", "3"],
  ["Áudio mais longo", "Marcinho", "6:04"],
];

function Champions({ title, list }: { title: string; list: string[][] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-3 text-3xl text-primary">{title}</h2>
      <ul className="divide-y divide-border">
        {[...list].reverse().map(([s, n]) => (
          <li key={s} className="flex items-center justify-between py-2">
            <span className="font-display text-xl text-muted-foreground">{s}</span>
            <span className="font-semibold">🏆 {n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Historico() {
  return (
    <section className="space-y-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Galeria</p>
        <h1 className="text-5xl sm:text-6xl">Campeões</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Champions title="Liga" list={liga} />
        <Champions title="Copa" list={copa} />
      </div>
      <div>
        <h2 className="mb-4 text-4xl">Livro de Recordes</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {recordes.map(([t, w, v]) => (
            <div key={t} className="stripe-court rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{t}</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="text-lg font-semibold">{w}</p>
                <p className="font-display text-4xl text-primary">{v}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

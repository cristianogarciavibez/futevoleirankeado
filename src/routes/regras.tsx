import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const DOC_ID = "1-QKZuS-wJENE9wcgo-QiaiCKxIBfoEH6m9tZwQ66bNY";

export const Route = createFileRoute("/regras")({
  head: () => ({
    meta: [
      { title: "Regras — Futevôlei Rankeado" },
      { name: "description", content: "Regulamento oficial e tabela de pontos do Futevôlei Rankeado." },
      { property: "og:title", content: "Regras — Futevôlei Rankeado" },
      { property: "og:description", content: "Regulamento oficial e tabela de pontos." },
    ],
  }),
  component: Regras,
});

const tabela = [
  ["Vitória", "+1", "+2"],
  ["Derrota fazendo 11 pontos ou mais", "−1", "−2"],
  ["Derrota fazendo 10 pontos ou menos", "−2", "−4"],
];

const artigos: [string, string][] = [
  ["I", "Perdeu sem passar de 10 perde 2 pontos"],
  ["II", "Uma pessoa que está negativa não pode chamar jogo apostado e uma dupla em que ambos estão com -2 não pode jogar apostado."],
  ["III", "Quem está com +10 não pode peidar pra jogo dobrado."],
  ["IV", "Desistiu do jogo, por motivo que não seja contusão séria, será computado um WO (18x0)."],
  ["V", "Deu PITI perde 1 ponto."],
  ["VI", "Caso um atleta não queira rankear uma partida que julgue ser injusta, deve falar em quadra antes do jogo começar ''eu peido rankear esse jogo''"],
  ["VII", "Todos os jogos com 4 integrantes do grupo devem ser rankeados."],
  ["VIII", "Não existe rankeado misto ou com jogadores muito abaixo"],
  ["VIV", "Jogo com mulher só vale se ela jogar nas regras do masculino e se a pessoa que estiver jogando com ela falar que está valendo"],
  ["X", "Todos os integrantes devem pagar um taxa mensal de R$30, universitários tem desconto de R$10 Pix: FTVRANKEADO@GMAIL.COM"],
  ["XI", "10% de todo valor ganho em jogos apostados deve ser pago ao Rankeado"],
  ["XII", "Primeiro o jogo, depois a família"],
  ["XIII", "Dobrado tem forra"],
];

function Regras() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Regulamento</p>
        <h1 className="text-5xl sm:text-6xl">Regras</h1>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <h2 className="px-5 pt-4 text-3xl text-primary">Tabela de pontos (por atleta)</h2>
        <table className="w-full text-left">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-5 py-2">Resultado</th><th className="px-3 py-2">Normal</th><th className="px-5 py-2">Dobrado</th></tr>
          </thead>
          <tbody>
            {tabela.map(([r, n, d]) => (
              <tr key={r} className="border-t border-border">
                <td className="px-5 py-3">{r}</td>
                <td className="font-display px-3 py-3 text-2xl">{n}</td>
                <td className="font-display px-5 py-3 text-2xl text-accent">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-5 pb-4 text-sm text-muted-foreground">Não existe empate. Partida Dobrada multiplica tudo por dois.</p>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl">Livro de Regras</h2>
          <Button asChild variant="outline">
            <a href={`https://docs.google.com/document/d/${DOC_ID}/edit?usp=drivesdk`} target="_blank" rel="noreferrer">Abrir no Google Docs ↗</a>
          </Button>
        </div>
        <ol className="space-y-3">
          {artigos.map(([n, t]) => (
            <li key={n} className="rounded-xl border border-border bg-card p-4">
              <p className="font-display text-xl text-primary">Artigo {n}</p>
              <p className="mt-1">{t}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

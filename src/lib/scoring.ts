/** Pontos por atleta numa partida. Espelha public.add_match no backend. */
export function matchPoints(scoreA: number, scoreB: number, doubled: boolean) {
  if (scoreA === scoreB) throw new Error("Não existe empate");
  const mult = doubled ? 2 : 1;
  const loser = Math.min(scoreA, scoreB);
  const win = 1 * mult;
  const lose = (loser >= 11 ? -1 : -2) * mult;
  return scoreA > scoreB ? { teamA: win, teamB: lose } : { teamA: lose, teamB: win };
}

/** Temporada "AA.1" (jan–jun) ou "AA.2" (jul–dez) a partir de "AAAA-MM-DD". */
export function seasonOf(isoDate: string) {
  const [y, m] = isoDate.split("-").map(Number);
  return `${String(y).slice(2)}.${(m ?? 1) <= 6 ? 1 : 2}`;
}

export function currentSeason(now = new Date()) {
  return seasonOf(now.toISOString().slice(0, 10));
}

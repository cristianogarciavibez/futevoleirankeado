import { describe, expect, it } from "vitest";
import { matchPoints, seasonOf } from "./scoring";

describe("pontuação", () => {
  it("vitória vale +1 por atleta", () => {
    expect(matchPoints(18, 12, false).teamA).toBe(1);
  });
  it("derrota fazendo 11 pontos vale -1", () => {
    expect(matchPoints(18, 11, false).teamB).toBe(-1);
  });
  it("derrota fazendo 10 pontos vale -2", () => {
    expect(matchPoints(18, 10, false).teamB).toBe(-2);
  });
  it("Dobrado multiplica vitória por dois", () => {
    expect(matchPoints(10, 18, true).teamB).toBe(2);
  });
  it("Dobrado com derrota de 11 vale -2", () => {
    expect(matchPoints(11, 18, true).teamA).toBe(-2);
  });
  it("Dobrado com derrota de 10 vale -4", () => {
    expect(matchPoints(10, 18, true).teamA).toBe(-4);
  });
  it("empate é recusado", () => {
    expect(() => matchPoints(15, 15, false)).toThrow();
  });
  it("temporada pelo semestre", () => {
    expect(seasonOf("2026-06-30")).toBe("26.1");
    expect(seasonOf("2026-07-01")).toBe("26.2");
  });
});

"""Gera src/data/scenes.json a partir da tabela de cenas do filme.

Cada linha é uma cena:  (início, fim, tipo, manchete, linha fina, carimbo)
O kicker (etiqueta vermelha) vem do capítulo em que a cena cai.
A imagem de cada cena é iNN.jpg, na mesma ordem das linhas.

Edite a lista CENAS e a lista CAPITULOS e rode:
    python gerar_cenas.py --projeto ../remotion
"""
import argparse, json, os

CAPITULOS = [
    (0.0, "ABERTURA"),
    (60.0, "O FATO"),
    (120.0, "O DESFECHO"),
]

# (início, fim, tipo, manchete, linha fina, carimbo)
# tipo: abertura | dossie | foto | documento | evidencia | citacao | fechamento
CENAS = [
    (0.0, 9.0, "abertura", "O TÍTULO QUE ABRE", "a promessa do filme", None),
    (9.0, 21.0, "foto", "O QUE ACONTECEU", "uma ideia por cena", "ARQUIVO"),
    (21.0, 32.0, "documento", "O DOCUMENTO", "papel oficial entra como documento", None),
    (32.0, 44.0, "evidencia", "O QUE NÃO FECHA", "cena escura com faixa amarela", "AMEAÇA"),
    (44.0, 56.0, "fechamento", "A FRASE FINAL", "o fecho", None),
]


def capitulo(t):
    nome = CAPITULOS[0][1]
    for inicio, n in CAPITULOS:
        if t >= inicio - 0.05:
            nome = n
    return nome


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--projeto", default=".", help="pasta do projeto Remotion (com src/data)")
    args = ap.parse_args()

    saida = []
    for i, (a, b, kind, head, line, stamp) in enumerate(CENAS):
        sc = dict(start=a, end=b, kind=kind, kicker=capitulo(a), head=head, line=line,
                  tone="bw" if kind in ("evidencia", "fechamento") else "sepia", a=f"i{i:02d}")
        if stamp:
            sc["stamp"] = stamp
        saida.append(sc)

    destino = os.path.join(args.projeto, "src", "data", "scenes.json")
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    json.dump(saida, open(destino, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(saida)} cenas, {saida[-1]['end']} s -> {destino}")


if __name__ == "__main__":
    main()

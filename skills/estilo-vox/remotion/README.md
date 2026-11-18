# Template Remotion do estilo VOX

Projeto pronto para montar o dossiê. Troque os dados (cenas, imagens, áudio) e edite só o que está marcado com
`EDITE AQUI`.

## 1. Instalar

```bash
npm install
```

## 2. Pastas de mídia (`public/`)

O projeto espera estas pastas — traga os arquivos que você já tem:

```
public/
  vox/     texturas de papel/jornal (v00.jpg ... v24.jpg)
  voxp/    as mesmas texturas já tratadas  -> gerado por scripts/preparar_imagens.py
  fx/      grao0.png ... grao5.png (grão de filme)
  img/     imagens do filme (i00.jpg, i01.jpg ...)
  imgp/    versões sepia (_s) e p&b (_b)   -> gerado por scripts/preparar_imagens.py
  audio/
    narracao/voz.mp3
    musicas/trilha_1.mp3, trilha_2.mp3 ...
    efeitos/whoosh_soft.mp3, whoosh.mp3, stamp.mp3, pin.mp3, impact.mp3, paper.mp3, riser.mp3, page.mp3, shutter.mp3
```

Texturas, grão e efeitos são sons e imagens de terceiros: use os seus (ou de licença aberta) e guarde a fonte.
O código funciona igual com qualquer textura no mesmo formato.

## 3. Dados

```bash
python ../scripts/preparar_imagens.py --projeto . --video base.mp4 --tempos "3.5,11,19,..."
python ../scripts/gerar_cenas.py --projeto .
```

`src/data/scenes.example.json` mostra todos os campos possíveis de uma cena.

## 4. Editar o topo do `Video.tsx`

- `TOTAL` — duração em segundos (fim da última cena).
- `CHAPTERS` — capítulos; o primeiro em 0, os outros ganham cartela.
- HUD — o texto do canto superior esquerdo.
- `<Music .../>` — trilha por bloco, com `vol` entre 0,12 e 0,18.

Em `vox.tsx`, `EndTitle` é o cartão final. Em `cenas.tsx`, os rótulos fixos ("ARQUIVO // DOCUMENTO",
"registro do arquivo", "FIM // ...") também são seus.

## 5. Preview e render

```bash
npx remotion studio src/index.ts
node_modules/.bin/remotion render src/index.ts Video out/final.mp4 --concurrency=4 --crf=19
```

`--concurrency` não pode passar do número de núcleos da máquina (o Remotion recusa).

## 6. Acabamento

Normalize o áudio em duas passadas para -16 LUFS (`loudnorm`) e entregue vídeo + miniatura + descrição + `.srt`.

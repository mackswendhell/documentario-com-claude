---
name: estilo-vox
description: Monta o vídeo no estilo dossiê VOX — papel envelhecido, fotos presas com fita e pino, manchetes em papel rasgado, carimbos vermelhos, faixas de "registro", filmstrip e câmera lenta sobre cada foto. Use quando o usuário pedir "estilo VOX", "dossiê", "cara de arquivo investigativo", "aquele estilo do documentário da Dawn", ou quando ele já tiver narração e imagens prontas e quiser a montagem nesse acabamento. Não use emojis de teclado (Telegram/WhatsApp) em nenhuma peça.
---

# Estilo VOX (dossiê de arquivo)

O filme inteiro parece um **dossiê aberto em cima de uma mesa**: fundo de papel velho e jornal, cada imagem entra
como uma fotografia impressa presa com fita crepe ou pino vermelho, cada ideia ganha uma manchete em papel rasgado,
e o que é prova ganha carimbo e faixa amarela de "REGISTRO". Nada de slide limpo, nada de emoji de celular.

## O que compõe o estilo

| Peça | Como aparece | Componente |
|---|---|---|
| Fundo | textura de papel/jornal envelhecido, escurecida nas bordas | `PaperBG` |
| Foto | impressão com moldura de papel, fita crepe, pino vermelho, leve rotação, zoom lento | `Photo` |
| Documento | papel claro com fita, marca-texto amarelo desenhando | `DocShot` |
| Manchete | faixa de papel rasgado com etiqueta vermelha (kicker) + título grande | `Headline` |
| Carimbo | palavra em vermelho, girada, com estalo de mola | `StampMark` |
| Prova | fundo escuro, foto em p&b, faixas amarelas "REGISTRO / EVIDÊNCIA" | `EvidenceTape` + `DarkBG` |
| Ritmo | filmstrip girando no rodapé, virada de papel entre planos, flash branco ocasional | `Filmstrip`, `PaperWipe` |
| Capítulo | cartela de papel com número gigante e título | `ChapterCard` |
| HUD | canto superior: `TEMA // CAP. 01 · NOME` e `DOC 001` | `Hud` |

Tipografia: Montserrat 900 para título e etiqueta, Playfair itálico para citação, Caveat para anotação à mão,
Special Elite para legenda de máquina de escrever. Vermelho do tema em `TEMA.cor` (`#E61D2B` no projeto original).

## Regras de leitura

1. **Uma ideia por cena.** O título da cena é a frase falada naquele tempo, não um resumo do capítulo.
2. **Manchete curta.** Até ~4 palavras; a linha fina (caption) explica em até 60 caracteres.
3. **Imagem certa, sempre.** Cada cena usa a imagem do momento exato da narração. Se a imagem não bate com a frase,
   troque o tempo de extração antes de montar — nunca deixe uma foto de outra coisa "parecida".
4. **Nada de imagem repetida entre cenas.** Se precisar de um segundo plano na mesma cena, use `detail`/`photo2`
   (mesma imagem em outro enquadramento), não uma imagem parecida de outro trecho.
5. **Sem emojis de teclado.** O acabamento é tipográfico: carimbo, papel, tinta. Emoji 3D de conversa não entra.
6. **Som:** narração sempre na frente; trilha em `vol` 0.12–0,18; carimbo, whoosh e pin nos momentos certos.

## Estrutura do projeto

```
remotion/
  package.json
  src/
    index.ts  Root.tsx  Video.tsx      # composição, capítulos, HUD, som
    vox.tsx   cenas.tsx  lib.tsx       # componentes do estilo
    data/
      scenes.json                      # a tabela de cenas (você escreve)
      assets.json                      # largura/altura/aspecto de cada imagem
  public/
    vox/       # texturas de papel (v00..v24.jpg)  <- use as suas ou as do projeto original
    voxp/      # texturas já tratadas (geradas pelo script)
    img/       # imagens como extraídas (i00.jpg, i01.jpg...)
    imgp/      # versões sepia (_s) e p&b (_b), geradas pelo script
    fx/        # grão de filme (grao0..5.png)
    audio/
      narracao/voz.mp3
      musicas/*.mp3
      efeitos/{whoosh_soft,whoosh,stamp,pin,impact,paper,riser,page,shutter}.mp3
```

## Passo a passo

1. **Copie o template** para `projetos/<tema>/vox` e rode `npm install`.
2. **Imagens.** Com a narração já transcrita (tempos de cada frase), rode
   `python scripts/preparar_imagens.py --video <video.mp4> --tempos "3.5,11,19,..."`.
   Ele extrai um quadro por cena em `public/img/` e gera as versões sepia/p&b em `public/imgp/` e o `assets.json`.
   Se as imagens vierem de uma pasta (fotos reais), use `--pasta <dir>`.
3. **Cenas.** Escreva `scenes.json` (ou gere com `scripts/gerar_cenas.py`):

   ```json
   {"start": 0.0, "end": 9.0, "kind": "abertura", "kicker": "O CASO",
    "head": "TÍTULO CURTO", "line": "linha fina", "tone": "sepia",
    "a": "i00", "stamp": "ARQUIVO", "note": "anotação à mão"}
   ```
   `kind` decide os planos internos da cena: `abertura`, `dossie`, `foto`, `documento`, `evidencia`,
   `citacao`, `fechamento`. Cena de 4–6 s gera 3 planos; 6,5–9 s gera 4; acima de 9 s gera 5.
   A duração da cena é `end - start` e precisa cobrir a narração sem buraco.
4. **Ajuste o topo do `Video.tsx`** (marcado com `EDITE AQUI`): `TOTAL`, `CHAPTERS`, HUD e trilha por bloco.
   Ajuste também `EndTitle` (em `vox.tsx`) e os rótulos fixos em `cenas.tsx`.
5. **Áudio.** `public/audio/narracao/voz.mp3` (narração inteira), músicas e efeitos.
6. **Preview:** `npx remotion studio src/index.ts`.
7. **Render:** `node_modules/.bin/remotion.cmd render src/index.ts Video out/final.mp4 --concurrency=4 --crf=19`
   (o Remotion recusa `--concurrency` maior que o número de núcleos).
8. **Acabamento:** normalizar o áudio em duas passadas para -16 LUFS e gerar miniatura, descrição e `.srt`.

## Armadilhas que já custaram tempo

- `Photo` lê o aspecto de `assets.json`; sem a entrada, a foto sai cortada. Sempre gere o arquivo.
- Imagem sem `_s.jpg` em `imgp/` = quadro vazio/estourado no render (o `photoSrc` procura sempre o preparado).
- `PaperWipe` cobre a tela no primeiro 0,4 s de cada plano: num frame de conferência pode parecer "tela em branco",
  não é defeito — confira 0,5 s depois do corte.
- O tipo `numero` imprime um número gigante a partir do título; só use com título que tenha número.
- `Filmstrip` referencia ids fixos de imagem (`i03`, `i31`...): se o projeto tiver menos imagens, troque a lista.
- Render longo não roda junto com outra tarefa pesada (ffmpeg, Whisper): os dois brigam por CPU.

## Conferência antes de entregar

Tire um quadro a cada ~7 s do render e olhe a folha inteira: cada imagem tem que corresponder à frase daquele
tempo, nenhum carimbo pode cobrir a manchete, e nenhuma cena pode repetir a foto da anterior.

# Pipeline: documentário com o Claude

O fluxo usado no vídeo, do vídeo de referência ao documentário pronto. Cada passo é um prompt em linguagem natural,
enviado no Claude Code (app do Claude, aba Code), com o modelo Fable 5.2 e esforço Alto, numa pasta vazia do projeto.
Troque o tema, as datas e o estilo pelos do seu documentário.

## 0. Referência de estilo (Watch)

```text
Use a skill watch para assistir este vídeo de referência: <link do vídeo>. Assista só o trecho onde está o
documentário. Transcreva a narração com o tempo de cada frase, tire os frames e me diga o estilo: o ritmo, quanto
tempo dura cada plano, como o texto entra na tela e como a narração conduz a história. Não mude nada no projeto.
```

## 1. Pesquisa, roteiro e material

```text
Quero fazer um minidocumentário cinematográfico sobre <tema>, de <começo> até <fim>. Antes de montar qualquer
coisa, prepare o material nesta pasta.
1) Pesquise na web os marcos principais (<lista de marcos>) e confira datas e frases em fontes confiáveis. Salve em
pesquisa.md com os links.
2) Escreva o roteiro da narração em português do Brasil, de 1 minuto e meio a 2 minutos, frases curtas, tom de
documentário, uma ideia por frase, com anos e números por extenso. Salve em roteiro.md.
3) Baixe para a pasta referencias/ fotos reais das pessoas e dos lugares e imagens dos documentos e recortes de
jornal da época, de preferência de domínio público (Wikimedia Commons, arquivos de universidades), e anote em
referencias/fontes.md de onde veio cada uma e a licença. Use a skill chrome-agent para navegar.
Ainda não monte o vídeo.
```

## 2. Conferência em fonte primária (Deep Research)

```text
Use a skill deep-research para conferir cada marco do roteiro.md em fontes primárias e salve o relatório em
pesquisa-profunda.md, com o grau de cada fato (lido no original, registro oficial ou fonte de terceiros) e o que o
roteiro simplificou demais. Depois use a skill chrome-agent para abrir na tela as páginas de onde saíram as fotos
de referencias/fontes.md.
```

## 3. Montagem no Remotion

```text
Agora monte o documentário com o Remotion, um editor de vídeo feito em código. Quero cara de documentário da
Netflix, construído só com código e com o material desta pasta, no estilo do vídeo de referência que você analisou.
Formato 1920x1080, 30 quadros por segundo.
O ESTILO: o vídeo inteiro é um único movimento de câmera contínuo sobre um mundo só, uma mesa de arquivo escura com
mapa, papéis e fotos, onde a câmera desliza, aproxima nos detalhes e se afasta para viajar até o próximo ano. Nada
de cortes nem de slides. Todo começo e fim de movimento é suave, com leve tremor de mão, desfoque nos movimentos
rápidos, granulação de filme, brilho suave e vinheta. As fotos e documentos reais de referencias/ entram como
objetos físicos: fotos impressas, papéis e recortes.
REGRAS DE LEITURA: uma ideia por frase da narração e um único destaque na tela por frase, o resto escurece. Anos e
palavras-chave em letras grandes, legíveis no celular em um segundo. Os momentos visuais caem na palavra falada:
um círculo desenhado quando o nome é dito, um carimbo na batida.
PROCESSO: antes de montar, escreva uma tabela de cenas (tempo, frase, destaque na tela, texto na tela) e siga sem
me perguntar. Antes do render final, confira quadros de cada cena e corrija o que estiver poluído, ilegível,
sobreposto ou travando.
```

## 4. Acabamento com a Higgsfield (MCP)

Conecte antes: Personalização → Conectores → Adicionar conector personalizado → `https://mcp.higgsfield.ai/mcp`.

```text
Use a Higgsfield para gerar a voz de um narrador de documentário em português do Brasil, grave, calma e
cinematográfica, as peças de época no mesmo estilo do filme (mesa de arquivo, papéis envelhecidos, mapas, fichas e
recortes) e uma trilha discreta com efeitos sonoros (máquina de escrever, papel, carimbo). Não passe nenhum rosto
real por modelo generativo. Meça os tempos de cada frase da voz nova e encaixe cada peça no documentário, mantendo
a câmera contínua e as regras de leitura. Me mostre o custo estimado antes de gerar. Quando estiver montado, abra o
Remotion Studio e pare antes do render final para eu revisar.
```

Quer ir além (o orçamento cresce): peça planos curtos em vídeo nos momentos mais fortes, ou gere imagens na
Higgsfield e peça ao Claude para animá-las em código.

## 5. Ajuste no Studio

Com o Studio aberto, aponte o quadro exato e peça só a mudança:

```text
No quadro <número>, <o que está errado>. <O que você quer>. Mude só isso.
```

O Studio recarrega sozinho. O projeto fica na pasta: qualquer ajuste depois é só pedir, sem refazer a edição.
Quando estiver bom: "Pode renderizar o vídeo final."

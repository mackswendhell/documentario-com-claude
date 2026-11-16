# Documentário com o Claude

Skills e pipeline para fazer um minidocumentário com cara de Netflix dentro do Claude Code, com o Claude Fable 5.2:
pesquisa, roteiro, coleta de fotos reais, montagem em código no Remotion e acabamento com a Higgsfield.

## Como usar (o jeito fácil)

1. Baixe este repositório: `git clone https://github.com/mackswendhell/documentario-com-claude.git`
   (ou Code → Download ZIP aqui no GitHub e descompacte).
2. No app do Claude, abra a aba **Code** e escolha a pasta `documentario-com-claude`.
3. Escolha o modelo **Fable 5.2** com esforço **Alto** e escreva: **vamos começar**.

O Claude lê o [CLAUDE.md](CLAUDE.md), confere o que falta instalar, instala com a sua permissão e conduz cada etapa
até o documentário pronto. Os prompts de cada passo estão em [PIPELINE.md](PIPELINE.md).

## As cinco peças

| Peça | Para quê | Onde pegar |
|---|---|---|
| Watch | dá olhos ao Claude: baixa um vídeo de referência, transcreve com os tempos e tira os frames | https://github.com/bradautomates/claude-video |
| Deep Research | pesquisa em fonte primária e entrega um relatório com o grau de cada fato | https://github.com/199-biotechnologies/claude-deep-research-skill |
| Chrome Agent | o Claude Code navega no seu Chrome, com as contas logadas, e salva tudo na pasta do projeto | [skills/chrome-agent](skills/chrome-agent) (precisa do [agent-browser](https://github.com/vercel-labs/agent-browser)) |
| Remotion | transforma o Claude num editor de vídeo, com um Studio próprio | https://github.com/remotion-dev/skills |
| Higgsfield MCP | acabamento: voz do narrador e peças de época | https://higgsfield.ai/mcp |

## Instalação manual (se preferir fazer sozinho)

```bash
# Watch (dentro do Claude Code)
/plugin marketplace add bradautomates/claude-video
/plugin install watch@claude-video

# Deep Research
git clone https://github.com/199-biotechnologies/claude-deep-research-skill.git ~/.claude/skills/deep-research

# Remotion
npx skills add remotion-dev/skills

# Chrome Agent
npm install -g agent-browser && agent-browser install
git clone https://github.com/mackswendhell/documentario-com-claude.git
cp -R documentario-com-claude/skills/chrome-agent ~/.claude/skills/
mkdir -p ~/.local/bin && cp documentario-com-claude/skills/chrome-agent/scripts/chrome-agent ~/.local/bin/
```

Higgsfield: no app do Claude, Personalização → Conectores → Adicionar conector personalizado →
`https://mcp.higgsfield.ai/mcp`.

O Chrome Agent é para macOS com Google Chrome.

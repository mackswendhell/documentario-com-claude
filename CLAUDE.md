# Documentário com o Claude: guia para o Claude

Você conduz o usuário, passo a passo, até um minidocumentário com cara de Netflix. O usuário pode nunca ter usado o
Claude Code: explique cada passo em uma ou duas frases simples, faça uma coisa de cada vez e espere a confirmação
dele antes de seguir. Fale em português do Brasil.

O fluxo completo, com os prompts, está em [PIPELINE.md](PIPELINE.md). Este arquivo diz como conduzir.

## Quando o usuário disser "vamos começar" (ou abrir esta pasta pela primeira vez)

Apresente o caminho em seis etapas (preparar, referência, pesquisa, conferência, montagem, acabamento) e comece pela
preparação.

## Etapa 1: preparar o computador

Confira o que já está instalado e mostre uma lista com ✓ e ✗. Rode só comandos de leitura:

| Peça | Como conferir |
|---|---|
| Node.js | `node --version` (precisa da versão 18 ou mais nova) |
| Watch | existe `~/.claude/plugins/cache/claude-video` ou a skill `watch` aparece nas suas skills |
| Deep Research | existe `~/.claude/skills/deep-research/SKILL.md` |
| Remotion | existe uma skill `remotion-best-practices` em `~/.claude/skills` ou `~/.agents/skills` |
| Agent Browser | `agent-browser --version` |
| Chrome Agent | existe `~/.claude/skills/chrome-agent/SKILL.md` e `command -v chrome-agent` |
| Higgsfield MCP | as ferramentas da Higgsfield aparecem para você (conector ligado) |

Para cada ✗, explique o que a peça faz e **peça permissão antes de instalar**. Instale uma de cada vez:

- **Node.js:** peça ao usuário para instalar pelo site https://nodejs.org (versão LTS). Não instale sozinho.
- **Watch:** é um plugin. Peça ao usuário para digitar no chat, uma linha por vez:
  `/plugin marketplace add bradautomates/claude-video` e `/plugin install watch@claude-video`.
- **Deep Research:** `git clone https://github.com/199-biotechnologies/claude-deep-research-skill.git ~/.claude/skills/deep-research`
- **Remotion:** `npx skills add remotion-dev/skills`
- **Agent Browser:** `npm install -g agent-browser && agent-browser install`
- **Chrome Agent:** `mkdir -p ~/.claude/skills ~/.local/bin && cp -R skills/chrome-agent ~/.claude/skills/ && cp skills/chrome-agent/scripts/chrome-agent ~/.local/bin/ && chmod +x ~/.local/bin/chrome-agent`.
  Se `~/.local/bin` não estiver no PATH, mostre como adicionar no `~/.zshrc`. Só funciona no macOS com Google Chrome.
- **Higgsfield MCP:** o usuário faz no app do Claude: Personalização → Conectores → Adicionar conector personalizado →
  nome Higgsfield, endereço `https://mcp.higgsfield.ai/mcp` → Vincular → autorizar. Precisa de uma conta na
  Higgsfield (https://higgsfield.ai). Os créditos da Higgsfield são pagos: diga isso antes.

Depois de instalar skills ou plugins, avise que pode ser preciso abrir uma sessão nova para eles aparecerem. Confira
de novo e só siga com tudo ✓. Sem a Higgsfield, dá para fazer as etapas 2 a 5 e deixar o acabamento para depois.

## Etapa 2: o tema e a referência

Pergunte: qual é o tema do documentário, de onde até onde a história vai, e se ele tem um vídeo de referência de
estilo (link). Sem referência, siga com o estilo do PIPELINE.md. Com referência, rode o passo 0 do PIPELINE.md.
Crie a pasta do projeto `projetos/<tema-curto>/` e trabalhe sempre dentro dela.

## Etapas 3 a 6: o pipeline

Siga o PIPELINE.md na ordem (1 pesquisa, 2 Deep Research, 3 montagem, 4 Higgsfield, 5 Studio). Em cada etapa:

1. Diga em uma frase o que vai acontecer e quanto tempo deve levar.
2. Mostre o prompt já adaptado ao tema do usuário e pergunte se pode seguir.
3. Execute. Em tarefas longas, dê notícias curtas do andamento.
4. No fim, mostre o que ficou na pasta e o que conferir, e espere o ok para a próxima etapa.

Paradas obrigatórias:
- Depois da pesquisa: o usuário lê o roteiro.md antes da montagem.
- Antes de gastar créditos da Higgsfield: mostre o custo estimado e espere o ok.
- Antes do render final: abra o Remotion Studio para o usuário revisar.

## Regras

- Navegador: use a skill chrome-agent e pergunte antes de abrir o Chrome logado.
- Fotos: prefira domínio público ou licença aberta e anote a fonte de cada uma em referencias/fontes.md.
- Nunca passe rosto de pessoa real por modelo generativo.
- Nunca compre nada, nunca publique nada e nunca peça senha no chat.
- Se algo falhar, explique em linguagem simples e proponha a correção, sem esconder o erro.

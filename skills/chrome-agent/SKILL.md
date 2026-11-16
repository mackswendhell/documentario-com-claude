---
name: chrome-agent
description: Navega com o Claude Code no seu próprio Chrome, com as contas já logadas, em vez de um navegador limpo. Abre uma cópia do seu perfil do Chrome com uma porta de controle (CDP 9222) e conecta o agent-browser nela, para pesquisar, abrir páginas, tirar prints e baixar arquivos direto para a pasta do projeto. Use quando a tarefa pedir navegador: "abre esse site", "tira um print", "baixa as imagens", "entra na minha conta e pega", "pesquisa e salva na pasta", ou qualquer página que precise de login.
---

# Chrome Agent

O Claude Code navega no **seu** Chrome, com os seus logins, e salva tudo na pasta do projeto em que está trabalhando.
Ferramentas de navegador costumam abrir uma instância limpa, sem conta nenhuma. Esta skill abre uma cópia do seu
perfil com uma porta de controle e liga o `agent-browser` nela.

## Instalação (uma vez)

1. Instale o agent-browser (Vercel): `npm install -g agent-browser && agent-browser install`
2. Copie o script desta skill para o PATH:
   `cp scripts/chrome-agent ~/.local/bin/ && chmod +x ~/.local/bin/chrome-agent`
   (crie `~/.local/bin` e ponha no PATH se ainda não existir.)
3. macOS com Google Chrome. O perfil padrão é `Default`; para outro, `chrome-agent --perfil "Profile 1"`.

## Como usar

Antes de qualquer ação no navegador, pergunte ao usuário se pode abrir o Chrome logado. Depois:

```bash
chrome-agent                 # abre o Chrome com a cópia do perfil e a porta 9222
agent-browser connect 9222   # liga o agent-browser nesse Chrome
agent-browser open <url>
agent-browser snapshot       # lê a página (ou: text, screenshot <arquivo.png>)
```

- **Login novo:** se o usuário acabou de entrar num site no Chrome dele, rode `chrome-agent --sync` (com o Chrome do
  agente fechado) para copiar o perfil de novo.
- **Prints:** `agent-browser set viewport 1920 1080` antes do primeiro screenshot. Confira o print: nada de e-mail,
  nome de usuário, saldo ou menu de conta aberto.
- **Arquivos:** salve na pasta do projeto atual (ex.: `referencias/`) e anote a origem de cada um.
- **Download grande:** baixe para uma pasta temporária, copie para o destino e confira o arquivo.
- Não use `agent-browser read <url>`: ele busca fora da sessão e volta deslogado. Use `open` + `snapshot`/`text`.

## Por que uma cópia do perfil

O Chrome 136 em diante não aceita a porta de controle no perfil padrão. A cópia fica em `~/.chrome-agent`, só no seu
computador, com os seus cookies: não compartilhe essa pasta nem a coloque no git.

## Regras

- Nunca compre, publique, envie mensagem ou mude configuração de conta sem o usuário pedir.
- Nunca peça senha no chat: se precisar de login, o usuário entra pelo próprio Chrome e você roda `--sync`.
- Página que bloqueia leitura automática: registre o bloqueio e siga com outra fonte.

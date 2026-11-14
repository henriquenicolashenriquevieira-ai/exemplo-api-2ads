# AGENTS.md — regras para o Codex neste repositório

Projeto: API REST didática "Armazém do Seu João" (`exemplo-api-2ads`) em **TypeScript + Node 20 + Express + SQLite (sqlite3) + Zod + tsx**, em arquitetura de camadas:
Routes → Controller → Service → Repository → SQLite.

O passo a passo está em `ETAPAS-CODEX.md`.

## Git: regra mais importante

**Nunca execute comandos que alteram o Git.** Isso inclui `git add`, `git commit`, `git push`, `git pull`, `git checkout`, `git switch`, `git branch`, `git merge`, `git rebase`, `git reset`, `git stash`, `git tag` e qualquer criação/alteração de branch ou remoto.

- Pode usar apenas comandos de leitura: `git status`, `git diff`, `git log`.
- **O usuário faz todos os commits, branches e PRs.** Ao fim de cada etapa, apenas informe os arquivos alterados e a mensagem de commit sugerida.
- Nunca versionar nem forçar `node_modules/`, `dist/`, `*.db` ou `.env` (já estão no `.gitignore`).

## Como trabalhar

1. Execute **uma etapa por vez**, somente quando o usuário pedir. Não adiante etapas futuras.
2. Copie o código do `ETAPAS-CODEX.md` **exatamente** como está (nomes, caminhos, regras de negócio e mensagens de erro em português). Não "melhore", refatore nem renomeie.
3. Só altere arquivos de etapas anteriores quando a etapa atual mandar (seção "Substituir").
4. Não instale dependências além das listadas na etapa 01.
5. Rode as verificações da etapa. Se algo falhar, mostre o erro e a causa provável; só corrija se for um erro de digitação/caminho evidente, e informe o que mudou. Não improvise soluções grandes.
6. Ao terminar, **pare** e reporte: arquivos criados/alterados, resultado das verificações, divergências e a mensagem de commit sugerida.
7. Se subir o servidor para testar, **encerre o processo** ao final.

## Convenções do código

- TypeScript com `strict: true`; não usar `any`.
- Camadas com responsabilidade única: SQL só em Repository; status HTTP só em Controller/middleware; regras de negócio só em Service (que lança `AppError`).
- Erros passam por `next(err)` e são tratados no `errorHandler`; ninguém além do middleware responde 500.
- Nomes de arquivos: `*.model.ts`, `*.repository.ts`, `*.service.ts`, `*.controller.ts`, `*.routes.ts`, `*.schema.ts`.
- Mensagens de erro e comentários em português.

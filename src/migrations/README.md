# Migrations TypeORM

## Migration inicial com base só nas entidades

Para o TypeORM **gerar uma migration que crie todo o schema a partir das suas entidades**:

1. **Banco vazio** – O `migration:generate` compara o banco atual com as entidades. Para sair uma migration com todo o CREATE TABLE, o banco precisa estar vazio (sem as tabelas do app).
   - Exemplo: subir só o Postgres, criar o DB `cinema` e **não** rodar a aplicação com `synchronize` antes.
   - Ou dropar as tabelas no dev e depois gerar.

2. **Gerar a migration:**
   ```bash
   pnpm run migration:generate -- ./src/migrations/InitialSchema
   ```
   Será criado um arquivo como `src/migrations/1234567890123-InitialSchema.ts` com o SQL gerado a partir das entidades.

3. **Rodar as migrations:**
   ```bash
   pnpm run migration:run
   ```

A partir daí, novas alterações nas entidades: altere o código, depois rode de novo `migration:generate` com outro nome (ex.: `AddUserEmail`); o TypeORM gera só o diff.

## Comandos

| Comando | Uso |
|--------|-----|
| `pnpm run migration:generate -- ./src/migrations/Nome` | Gera migration a partir das entidades (comparando com o banco atual). |
| `pnpm run migration:run` | Aplica migrations pendentes. |
| `pnpm run migration:revert` | Desfaz a última migration. |
| `pnpm run migration:create -- ./src/migrations/Nome` | Cria migration vazia (SQL manual). |

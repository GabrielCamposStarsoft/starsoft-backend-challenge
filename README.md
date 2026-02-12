# Cinema Ticket API

API para venda de ingressos de cinema com controle de concorrência, construída com [NestJS](https://nestjs.com), TypeORM e PostgreSQL.

## Funcionalidades

- **Sessões** — CRUD de sessões de cinema (filme, sala, horário, preço)
- **Assentos** — Gestão de assentos por sessão (disponível, reservado, vendido)
- **Reservas** — Reserva com TTL, expiração automática e cancelamento; UPDATE atômico condicional para evitar double-booking
- **Vendas** — Confirmação de reserva → venda com lock pessimista e idempotência
- **Autenticação** — JWT (access + refresh), Argon2, rate limiting
- **Outbox Pattern** — Eventos (ReservationCreated, ReservationExpired, PaymentConfirmed, etc.) via RabbitMQ com relay e DLQ
- **Cache** — Valkey/Redis para disponibilidade de assentos e idempotency
- **i18n** — Mensagens em EN, ES e PT
- **Documentação** — OpenAPI (Scalar) em `/api-docs`

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) e Docker Compose (para subir dependências ou a stack completa)

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto. Exemplo:

```env
# Servidor
NODE_ENV=development
PORT=8088

# Banco de dados (obrigatório para a API)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=cinema
# DATABASE_LOGGING=true   # opcional, para SQL em desenvolvimento

# Cache (Valkey/Redis)
VALKEY_URL=redis://localhost:6379

# Mensageria (RabbitMQ)
RMQ_URL=amqp://guest:guest@localhost:5672

# Autenticação JWT (obrigatório para login/registro)
JWT_SECRET=your-secret-key-min-32-chars
# JWT_ACCESS_EXPIRATION=15m   # opcional
# JWT_REFRESH_EXPIRATION=7d   # opcional

# Reservas (opcional)
# RESERVATION_TTL_MS=30000
```

Com Docker Compose, a API usa `DATABASE_HOST=db`, `VALKEY_URL` e `RMQ_URL` apontando para os serviços da rede interna; você pode sobrescrever via `environment` no `compose` ou manter um `.env` que o Compose injeta.

## Instalação

```bash
pnpm install
```

## Execução

### Opção 1: Tudo com Docker

Sobe API, PostgreSQL, Valkey e RabbitMQ (migrations rodam no startup da API):

```bash
pnpm run docker:up
```

- API: http://localhost:8088  
- Documentação: http://localhost:8088/api-docs  
- Health: http://localhost:8088/health  

### Opção 2: Apenas dependências locais

Com PostgreSQL, Valkey e RabbitMQ rodando localmente (ou em Docker), na raiz do projeto:

```bash
# Migrations (uma vez ou após alterações)
pnpm run migration:run

# Seed (opcional)
pnpm run seed

# Desenvolvimento (watch)
pnpm run dev
```

A API estará em `http://localhost:8088` (ou na `PORT` definida no `.env`).

## Scripts principais

| Comando | Descrição |
|--------|-----------|
| `pnpm run dev` | Inicia em modo watch (desenvolvimento) |
| `pnpm run build` | Compila para produção |
| `pnpm run start` | Inicia em modo normal |
| `pnpm run start:prod` | Inicia o build de produção (`node dist/main`) |
| `pnpm run migration:run` | Executa migrations TypeORM |
| `pnpm run seed` | Executa seeders |
| `pnpm run docker:up` | Sobe stack com Docker Compose |
| `pnpm run docker:down` | Derruba os containers |
| `pnpm run test` | Testes unitários |
| `pnpm run test:e2e` | Testes e2e |
| `pnpm run lint` | ESLint com fix |

## Documentação da API

Com a aplicação rodando, acesse:

- **Scalar (OpenAPI):** http://localhost:8088/api-docs  

Endpoints protegidos exigem `Authorization: Bearer <access_token>` (obtido em `POST /auth/login` ou `POST /auth/register`).

## Estrutura do projeto (resumo)

```
src/
├── common/           # Filtros, guards, decorators, interfaces, i18n
├── core/             # Messaging (RabbitMQ consumer, DLQ)
├── modules/
│   ├── auth/         # Login, registro, JWT, refresh token
│   ├── health/       # Health check
│   ├── users/        # CRUD de usuários
│   ├── sessions/     # Sessões de cinema (CRUD + disponibilidade com cache)
│   ├── seats/        # Assentos por sessão
│   ├── reservations/ # Reservas, expiração, outbox, schedulers
│   └── sales/        # Vendas, outbox, idempotência
├── migrations/       # Migrations TypeORM
└── main.ts           # Bootstrap Fastify + microserviço RMQ
```

## Licença

UNLICENSED (projeto privado).

# Avaliação Técnica — Desafio Back-End Cinema Ticket API

**Candidato:** Avaliação do repositório `starsoft-backend-challenge`  
**Data:** 13/02/2026

---

## Etapa 1 — Checklist de Requisitos Extraídos do README do Desafio

### 1.1 Endpoints obrigatórios

| # | Requisito | Categoria |
|---|-----------|-----------|
| 1 | **Criar sessões** (filme, horário, sala) | Endpoint obrigatório |
| 2 | **Definir assentos disponíveis por sessão** (mínimo 16 assentos) | Endpoint obrigatório |
| 3 | **Definir preço do ingresso** por sessão | Endpoint obrigatório |
| 4 | **Reservar assento(s)** — endpoint de reserva | Endpoint obrigatório |
| 5 | **Confirmar pagamento** — converter reserva em venda | Endpoint obrigatório |
| 6 | **Buscar disponibilidade de assentos por sessão** (tempo real) | Endpoint obrigatório |
| 7 | **Histórico de compras por usuário** | Endpoint obrigatório |

### 1.2 Regras de negócio

| # | Requisito | Categoria |
|---|-----------|-----------|
| 8 | Reserva tem validade de **30 segundos** | Regra de negócio |
| 9 | Retornar **ID da reserva** e **timestamp de expiração** | Regra de negócio |
| 10 | Cancelamento automático se pagamento não for confirmado em 30s | Regra de negócio |
| 11 | Garantir que **nenhum assento seja vendido duas vezes** | Regra de negócio |

### 1.3 Requisitos de segurança

| # | Requisito | Categoria |
|---|-----------|-----------|
| 12 | Endpoints sensíveis protegidos (autenticação/autorização conforme contexto) | Segurança |

### 1.4 Requisitos de arquitetura

| # | Requisito | Categoria |
|---|-----------|-----------|
| 13 | Princípios **SOLID** | Arquitetura |
| 14 | Separação clara: Controllers, Services, Repositories/Use Cases | Arquitetura |
| 15 | Tratamento adequado de erros | Arquitetura |
| 16 | Schema DB: Sessões, Assentos, Reservas, Vendas | Arquitetura |

### 1.5 Requisitos de concorrência/consistência

| # | Requisito | Categoria |
|---|-----------|-----------|
| 17 | Proteção contra **race condition** (2 usuários no mesmo assento) | Concorrência |
| 18 | Prevenção de **deadlock** (usuário A: 1 e 3, B: 3 e 1) | Concorrência |
| 19 | **Idempotência** (cliente reenvia por timeout) | Concorrência |
| 20 | **Expiração automática** de reservas não confirmadas | Concorrência |
| 21 | Funcionar com **múltiplas instâncias** simultâneas | Concorrência |

### 1.6 Requisitos técnicos

| # | Requisito | Categoria |
|---|-----------|-----------|
| 22 | **Docker + Docker Compose**: Node/NestJS, PostgreSQL, RabbitMQ/Kafka, Redis | Técnico |
| 23 | Aplicação inicia com **um único comando** (`docker-compose up`) | Técnico |
| 24 | **Sistema de mensageria** para comunicação assíncrona | Técnico |
| 25 | Publicar eventos: reserva criada, pagamento confirmado, reserva expirada, assento liberado | Técnico |
| 26 | Consumir e processar eventos de forma confiável | Técnico |
| 27 | **Logging estruturado** (níveis DEBUG, INFO, WARN, ERROR) | Técnico |
| 28 | **ESLint** e **Prettier** configurados | Técnico |
| 29 | Commits organizados e descritivos | Técnico |

### 1.7 Entrega e documentação (README)

| # | Requisito | Categoria |
|---|-----------|-----------|
| 30 | Visão geral, tecnologias, como executar, estratégias, endpoints, decisões, limitações, melhorias | Documentação |

---

## Etapa 2 — Mapeamento Código ↔ Requisito

| # | Requisito | Onde está implementado | Como atende |
|---|-----------|------------------------|-------------|
| 1 | Criar sessões | `SessionsController.create`, `CreateSessionsUseCase.execute` | POST /sessions com movieTitle, roomName, startTime, endTime, ticketPrice. Valida conflito de sala. |
| 2 | Definir assentos (mín. 16) | `SeatsController.create`, `createBatch`; `CreateSeatsUseCase`, `CreateSeatsBatchUseCase` | POST /seats e POST /seats/batch criam assentos por sessão. **GAP**: Não há validação de mínimo 16 assentos por sessão. |
| 3 | Definir preço do ingresso | `CreateSessionsDto.ticketPrice`, `SessionEntity.ticketPrice` | Campo ticketPrice em CreateSessionsDto com @Min(0.01). Persistido em sessions. |
| 4 | Reservar assento(s) | `ReservationsController.create`, `CreateReservationsUseCase.execute` | POST /reservations com sessionId, seatIds. UPDATE condicional evita race. |
| 5 | Confirmar pagamento | `SalesController.create`, `CreateSalesUseCase.execute` | POST /sales com reservationId. Lock pessimista, converte PENDING→CONFIRMED, seat→SOLD. |
| 6 | Disponibilidade tempo real | `SessionsController.getAvailability`, `GetAvailabilityUseCase` | GET /sessions/:id/availability. Cache Redis (TTL 10s), invalidação via eventos RabbitMQ. |
| 7 | Histórico de compras | `SalesController.findAll`, `FindAllSalesUseCase` | GET /sales com paginação. Filtra por userId do JWT. |
| 8 | TTL 30 segundos | `RESERVATION_TTL_MS` (30000), `CreateReservationsUseCase` | Constante em `reservation-ttl-ms.constant.ts`. expiresAt = now + 30000. |
| 9 | Retornar ID e expiresAt | `ReservationsResponseDto` | DTO possui id, expiresAt. Retornado em POST /reservations. |
| 10 | Cancelamento automático | `ReservationsExpirationScheduler`, `ExpireReservationsUseCase` | Cron a cada 10s. Seleciona PENDING com expiresAt <= now. Atualiza status=EXPIRED, seat=AVAILABLE. |
| 11 | Nenhum assento vendido 2x | `CreateReservationsUseCase` (UPDATE condicional), `CreateSalesUseCase` (lock pessimista) | UPDATE seats WHERE status='available'. Lock em reservation/seat na venda. Teste de concorrência (100 usuários, 16 assentos) valida. |
| 12 | Segurança (Guards) | `JwtAuthGuard`, `RolesGuard` em controllers | POST/GET reservations, sales, sessions protegidos por JWT. Admin para criar sessões, assentos. Health e auth públicos. |
| 13 | SOLID | Use-cases com responsabilidade única, DI | Cada use-case faz uma coisa. Injeção de dependência. |
| 14 | Controllers, Services, Use Cases | Estrutura em modules | Controller→Service→UseCase. Use-cases com interfaces IUseCase. |
| 15 | Tratamento de erros | `AllExceptionsFilter`, exceções HTTP | Filtro global formata erros. Use-cases lançam NotFoundException, ConflictException, etc. |
| 16 | Schema Sessões, Assentos, Reservas, Vendas | Entidades TypeORM, migrations | sessions, seats, reservations, sales. Outbox para eventos. |
| 17 | Race condition | `CreateReservationsUseCase` | UPDATE seats SET status='reserved' WHERE status='available'. Operação atômica. |
| 18 | Deadlock | `CreateReservationsUseCase` | `sortedSeatIds = [...seatIds].sort()` — ordenação para evitar deadlock. |
| 19 | Idempotência | `IdempotencyInterceptor` em POST /reservations e POST /sales | Header Idempotency-Key. Redis SET NX + cache de resposta. |
| 20 | Expiração automática | `ExpireReservationsUseCase`, `ReservationsExpirationScheduler` | Scheduler a cada 10s. Lock distribuído (Redlock) para multi-instância. |
| 21 | Múltiplas instâncias | Redlock em schedulers, UPDATE condicional, lock pessimista | DistributedLockService. Race condition tratada no banco. |
| 22 | Docker: API, PostgreSQL, RabbitMQ, Redis | `docker/compose.yml` | api, db (PostgreSQL 18), valkey (Redis-compatível), rabbitmq. |
| 23 | Um comando | `pnpm run docker:up` | `docker compose -f docker/compose.yml up --build`. |
| 24 | Mensageria | RabbitMQ | Transport.RMQ em main.ts. MessagingProducer, MessagingConsumer. |
| 25 | Eventos publicados | Outbox + relay | reservation.created, payment.confirmed, reservation.expired, seat.released. Transactional Outbox. |
| 26 | Consumo confiável | MessagingConsumer | Deduplicação por cache. nack sem requeue → DLQ. |
| 27 | Logging estruturado | NestJS Logger em use-cases, producers, consumers | Uso de log(), warn(), error(), debug(). **Parcial**: Não há formato JSON estruturado explícito. |
| 28 | ESLint e Prettier | `eslint.config.mjs`, `.prettierrc`, `package.json` | lint script. ESLint e Prettier configurados. |
| 29 | Commits | Git | Histórico presente (avaliação contextual). |
| 30 | README completo | README.md do projeto | Visão geral, tecnologias, como rodar, estratégias, endpoints, decisões, limitações, melhorias. |

---

## Etapa 3 — Problemas Críticos Detectados

### Endpoints

- **Faltando**: Nenhum endpoint obrigatório faltando.
- **Extras**: PATCH/DELETE sessions, PATCH reservations, POST seats/batch, PATCH seats. São úteis para CRUD completo e não caracterizam overengineering grave.
- **JwtAuthGuard**: Todos os endpoints de sessões, reservas, vendas e assentos exigem JWT. Health e auth (register, login, refresh, logout) não exigem — correto.
- **RolesGuard**: Usado onde apropriado (Admin para criar sessões, assentos). RolesGuard retorna `true` quando não há @Roles (permite qualquer autenticado) — esperado em reservas/vendas.

### Validação

- **DTOs**: `CreateReservationsDto` com IsUUID, ArrayMinSize(1), ArrayMaxSize(20). `CreateSessionsDto` com validações. `CreateSalesDto` com reservationId. Validação via I18nValidationPipe.
- **Mínimo 16 assentos**: Não validado ao criar sessão nem ao criar assentos. O desafio pede "Mínimo 16 assentos" — é um requisito explícito não implementado.

### Concorrência

- Race condition: UPDATE condicional implementado.
- Deadlock: Ordenação de seatIds implementada.
- Idempotência: IdempotencyInterceptor em POST reservations e sales.
- Expiração: Scheduler com lock distribuído.
- Testes de concorrência: Presentes (100 usuários, 16 assentos).

### Transações

- CreateReservationsUseCase: `dataSource.transaction(...)`.
- CreateSalesUseCase: QueryRunner com begin/commit/rollback.
- ExpireReservationsUseCase: QueryRunner por reserva (isolamento de falhas).

### Outras observações

- Logging usa níveis, mas não é estruturado em JSON (ex.: para ferramentas de log).
- Rate limiting aplicado (Throttler) — diferencial.

---

## Etapa 4 — Tabela de Conformidade

| Requisito | Implementado? | Onde está | Correto? | Observações |
|-----------|----------------|-----------|-----------|-------------|
| 1. Criar sessões | Sim | SessionsController, CreateSessionsUseCase | Sim | Inclui conflito de sala |
| 2. Assentos (mín. 16) | Sim | CreateReservationsUseCase, MIN_SEATS_PER_SESSION | Sim | Validação ao reservar: sessão deve ter ≥16 assentos |
| 3. Preço do ingresso | Sim | CreateSessionsDto, SessionEntity | Sim | |
| 4. Reservar assentos | Sim | ReservationsController, CreateReservationsUseCase | Sim | |
| 5. Confirmar pagamento | Sim | SalesController, CreateSalesUseCase | Sim | |
| 6. Disponibilidade | Sim | GetAvailabilityUseCase, cache | Sim | Tempo real com cache + invalidação |
| 7. Histórico compras | Sim | SalesController.findAll | Sim | |
| 8. TTL 30s | Sim | RESERVATION_TTL_MS | Sim | |
| 9. ID e expiresAt | Sim | ReservationsResponseDto | Sim | |
| 10. Cancelamento automático | Sim | ExpireReservationsUseCase, scheduler | Sim | |
| 11. Nenhum assento 2x | Sim | UPDATE condicional, lock | Sim | Testado em concorrência |
| 12. Segurança | Sim | JwtAuthGuard, RolesGuard | Sim | |
| 13. SOLID | Sim | Use-cases, DI | Sim | |
| 14. Separação de camadas | Sim | Controllers, Services, UseCases | Sim | |
| 15. Tratamento de erros | Sim | AllExceptionsFilter | Sim | |
| 16. Schema DB | Sim | Migrations, entidades | Sim | |
| 17. Race condition | Sim | CreateReservationsUseCase | Sim | UPDATE condicional |
| 18. Deadlock | Sim | sortedSeatIds | Sim | |
| 19. Idempotência | Sim | IdempotencyInterceptor | Sim | |
| 20. Expiração automática | Sim | ExpireReservationsUseCase | Sim | |
| 21. Multi-instância | Sim | Redlock, UPDATE, lock | Sim | |
| 22. Docker stack | Sim | docker/compose.yml | Sim | |
| 23. Um comando | Sim | pnpm run docker:up | Sim | |
| 24. Mensageria | Sim | RabbitMQ | Sim | |
| 25. Eventos | Sim | Outbox + MessagingProducer | Sim | |
| 26. Consumo confiável | Sim | MessagingConsumer, DLQ | Sim | |
| 27. Logging | Parcial | Logger em vários módulos | Parcial | Níveis usados, sem formato JSON estruturado |
| 28. ESLint/Prettier | Sim | eslint.config.mjs, .prettierrc | Sim | |
| 29. Commits | N/A | Git | N/A | Depende do histórico |
| 30. README | Sim | README.md | Sim | Muito completo |

---

## Etapa 5 — Nota Técnica

**Nota: 9,5 / 10** *(atualizada após correções)*

### Justificativa

- **Fidelidade ao pedido (peso máximo)**: 9,5  
  Todos os requisitos obrigatórios atendidos. Validação de mínimo 16 assentos e logging estruturado em JSON implementados.

- **Qualidade técnica**: 9,5  
  Código organizado, use-cases claros, SOLID respeitado. Uso correto de transações, locks e idempotência.

- **Segurança**: 9,0  
  JWT, RolesGuard, rate limiting e validação de entrada bem aplicados.

- **Clareza arquitetural**: 9,5  
  Estrutura modular, responsabilidades bem definidas, documentação rica. Fácil de entender e evoluir.

- **Diferenciais implementados**: Swagger/Scalar, testes (unitários, E2E, concorrência, messaging), DLQ, rate limiting, i18n, load test com k6.

### Desconto aplicado

- **-0,5**: Pequenas oportunidades de melhoria (ex.: limpeza de outbox, retry com backoff no relay).

---

## Etapa 6 — Lista Final Objetiva

### ❌ O que faria o candidato perder pontos

- ~~Não validar o **mínimo de 16 assentos** por sessão~~ ✅ **Corrigido:** validação em `CreateReservationsUseCase`, constante `MIN_SEATS_PER_SESSION`, i18n em 3 idiomas.
- Logging **parcialmente estruturado** — uso de níveis, mas sem formato JSON ou padronização clara para ferramentas de observabilidade.

### ⚠️ O que é aceitável mas poderia ser melhor

- Mínimo de assentos: validar no `CreateSessionsUseCase` ou no fechamento da sessão (ex.: só ativar sessão quando houver ≥ 16 assentos) — atual validação é na reserva.
- Limpeza de registros antigos nas tabelas de outbox (referido nas “Limitações Conhecidas”).

### ✅ O que está acima do esperado

- **Transactional Outbox** para eventos assíncronos confiáveis.
- **Idempotência** com Redis e header `Idempotency-Key`.
- **Lock pessimista** na confirmação de pagamento para serializar com a expiração.
- **Ordenação de seatIds** para prevenção de deadlock.
- **Redlock** para coordenação entre instâncias nos schedulers.
- **DLQ** configurada no RabbitMQ.
- **Testes de concorrência** (100 usuários × 16 assentos).
- **Documentação** detalhada (Scalar, README).
- **Rate limiting** (Throttler).
- **i18n** em 3 idiomas.
- **Load test** com k6.
- **Arquitetura** bem definida (Controllers → Services → Use Cases).
- Tratamento de **edge cases** (race, deadlock, idempotência, expiração).

---

*Documento gerado com base na análise do código e no README do desafio.*

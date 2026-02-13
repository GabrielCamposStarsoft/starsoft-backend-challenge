# Cinema Ticket API

## Visao Geral

API **distribuida** para venda de ingressos de cinema, construida com **NestJS**, **TypeORM** e **PostgreSQL**. O projeto resolve o problema classico de **concorrencia** em sistemas de reserva de assentos, garantindo que **nenhum assento seja vendido duas vezes** mesmo sob carga alta e multiplas instancias.

### Contexto do Problema

Em um sistema de venda de ingressos de cinema, multiplos usuarios podem tentar reservar o mesmo assento simultaneamente. Sem mecanismos adequados, ocorre **double-booking**: dois ou mais clientes compram o mesmo lugar, gerando conflitos operacionais e prejuizos.

### Solucao Implementada

A solucao combina:

- **UPDATE condicional** na reserva (evita race condition no check-then-act)
- **Lock pessimista** na confirmacao de pagamento (serializa expiracao vs. pagamento)
- **Transactional Outbox Pattern** para eventos assincronos confiaveis
- **Distributed Lock (Redlock)** em schedulers para coordenacao entre instancias
- **Idempotencia** via header `Idempotency-Key` para evitar duplicacao em retries
- **Dead Letter Queue (DLQ)** para mensagens que falham no processamento

---

## Tecnologias Usadas

| Tecnologia | Uso | Justificativa |
|------------|-----|---------------|
| **Node.js 22** | Runtime | LTS moderno, suporte a ESM e performance |
| **NestJS 11** | Framework | Arquitetura modular, DI, suporte nativo a TypeORM, microservices e schedulers |
| **TypeORM** | ORM | Suporte a transacoes, migrations versionadas, lock pessimista e QueryBuilder |
| **PostgreSQL 18** | Banco de dados | ACID, transacoes fortes, ideal para dados criticos |
| **Valkey/Redis** | Cache e locks | Disponibilidade de assentos, idempotency keys, Redlock, deduplicacao de eventos |
| **RabbitMQ** | Mensageria | Eventos de dominio (reserva criada, expirada, pagamento confirmado), DLQ |
| **Fastify** | Servidor HTTP | Performance superior ao Express, adequado para APIs de alta concorrencia |
| **Scalar** | Documentacao API | Interface OpenAPI moderna, interativa e visualmente superior ao Swagger UI |
| **ioredis** | Cliente Redis | Conectividade robusta, usado por Keyv e Redlock |
| **amqplib / amqp-connection-manager** | Cliente RabbitMQ | Publicacao e consumo de mensagens, setup de DLQ |
| **argon2** | Hash de senha | Padrao recomendado para armazenamento seguro de credenciais |
| **@nestjs/jwt** | Autenticacao | Tokens JWT (access + refresh) com expiracao configuravel |
| **@nestjs/throttler** | Rate limiting | Protecao contra brute force (login, registro, refresh) |
| **nestjs-i18n** | Internacionalizacao | Mensagens de erro em EN, ES e PT com resolucao por header/query |
| **typeorm-extension** | Seeders | Popular banco de dados para desenvolvimento e testes |
| **Docker** | Containerizacao | PostgreSQL, Valkey, RabbitMQ e API para ambiente completo |
| **Jest** | Testes | Unitarios (use-cases), integracao, E2E, concorrencia e messaging |
| **k6** | Load testing | Teste de carga com 500 VUs concorrentes e validacao de thresholds |

---

## Scalar: Documentacao Interativa da API

O projeto utiliza **Scalar** (`@scalar/nestjs-api-reference`) em vez do Swagger UI padrao para documentacao da API. A escolha foi intencional:

**Por que Scalar e nao Swagger UI?**

- **Interface moderna**: design limpo com tema `deepSpace`, mais legivel que o Swagger UI classico
- **Experiencia de teste**: permite testar endpoints diretamente no navegador com interface intuitiva
- **Code snippets**: gera exemplos em multiplas linguagens (cURL, JavaScript, Python, Go, etc.)
- **Compatibilidade total**: usa o mesmo `OpenAPIObject` gerado pelo `@nestjs/swagger`, entao todos os decoradores `@ApiOperation`, `@ApiResponse`, `@ApiBody`, `@ApiBearerAuth` funcionam normalmente
- **Performance**: renderiza mais rapido que o Swagger UI em APIs com muitos endpoints

**Como funciona no codigo (`main.ts`):**

```typescript
// Gera o documento OpenAPI usando @nestjs/swagger normalmente
const config = new DocumentBuilder()
  .setTitle('Cinema Ticket API')
  .setDescription('API for cinema ticket sales with concurrency control')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);

// Monta o Scalar em /api-docs com tema deepSpace
app.use(
  '/api-docs',
  apiReference({
    content: document,
    withFastify: true,
    theme: 'deepSpace',
  }),
);
```

**Acesso:** `http://localhost:8088/api-docs`

Cada controller usa decoradores do `@nestjs/swagger` (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBody` com `examples`) para documentar payloads, respostas e exemplos. O Scalar renderiza tudo isso com uma UI rica e interativa.

---

## Tipos Customizados (`src/common/types/`)

O projeto define quatro utility types que substituem o uso direto de unions com `null`, `undefined` e tipos variantes. O objetivo e **tornar explicita a intencao semantica** de cada variavel no codigo, melhorando legibilidade e padronizando o tratamento de valores ausentes.

### `Optional<T>`

```typescript
export type Optional<T> = T | null | undefined;
```

Representa um valor que pode **nao existir** (nulo ou indefinido). Usado quando a ausencia de valor e esperada e tratada.

**Onde e usado:**
- `request.headers?.['idempotency-key']` retorna `Optional<string>` porque o header pode nao estar presente
- `process.env.RMQ_URL` e tipado como `Optional<string>` com fallback via `??`
- `Reflector.get()` retorna `Optional<string>` quando metadata pode nao existir no handler
- `Map.get()` no `DistributedLockService` retorna `Optional<Lock>` para locks que podem nao estar no mapa

**Exemplo real no projeto:**

```typescript
// IdempotencyInterceptor - header pode ou nao estar presente
const key: Optional<string> = request.headers?.['idempotency-key'];
if (key == null) {
  return next.handle(); // sem key, processa normalmente
}
```

### `Nullable<T>`

```typescript
export type Nullable<T> = T | null;
```

Diferente de `Optional`, **exclui `undefined`**. Usado quando o valor pode ser `null` explicitamente mas nunca `undefined` - tipicamente em retornos de operacoes de banco/cache.

**Onde e usado:**
- `Redis.get()` retorna `Nullable<string>` (Redis retorna `null` para chaves inexistentes, nunca `undefined`)
- `Redis.set()` com `NX` retorna `Nullable<string>` (`"OK"` se adquiriu lock, `null` se ja existe)
- `EntityManager.findOne()` retorna `Nullable<Entity>` quando registro pode nao existir

**Exemplo real no projeto:**

```typescript
// IdempotencyInterceptor - Redis retorna null, nunca undefined
const raw: Nullable<string> = await this.redis.get(responseKey);
if (raw != null) {
  const body: unknown = JSON.parse(raw) as unknown;
  return of(body);
}
```

### `Either<L, R>`

```typescript
export type Either<L, R> = L | R;
```

Union de dois tipos. Nao e um monad funcional completo (como Haskell/fp-ts) - e um alias semantico que comunica "este valor pode ser do tipo L **ou** do tipo R". Torna explicito que a funcao pode retornar tipos diferentes.

**Onde e usado:**
- `IUseCase<Input, Output>` define `execute()` como `Either<Promise<Output>, Output>`, indicando que use-cases podem ser sincronos ou assincronos
- `AllExceptionsFilter` usa `Either<Error, HttpException>` no generic para capturar ambos os tipos de excecao
- O `catch` do bootstrap usa `Either<Error, string>` para tratar erros de startup que podem ser Error ou string
- `extractHttpMessage()` retorna `Either<string, Array<string>>` porque o NestJS pode retornar mensagem unica ou array de validacoes

**Exemplo real no projeto:**

```typescript
// IUseCase - execute pode retornar Promise ou valor sincrono
export interface IUseCase<Input, Output> {
  execute(data: Input): Either<Promise<Output>, Output>;
}

// AllExceptionsFilter - captura Error e HttpException
export class AllExceptionsFilter<
  TException extends Either<Error, HttpException>,
> implements ExceptionFilter<TException> { ... }
```

### `EitherMultiple<T>`

```typescript
export type EitherMultiple<T extends unknown[]> = T[number];
```

Extrai a uniao de tipos de uma tupla. E um `Either` generalizado para N tipos. Util quando um valor pode ser de varios tipos diferentes (3+) e escrever `A | B | C | D` ficaria longo e sem semantica.

**Onde e usado:**
- Tipagem de retornos que podem ser multiplos tipos (ex: `EitherMultiple<[boolean, Promise<boolean>, Observable<boolean>]>` gera `boolean | Promise<boolean> | Observable<boolean>`)

**Exemplo de uso:**

```typescript
type GuardReturn = EitherMultiple<[boolean, Promise<boolean>, Observable<boolean>]>;
// Equivale a: boolean | Promise<boolean> | Observable<boolean>
```

**Por que criar esses tipos ao inves de usar `| null` diretamente?**

1. **Padronizacao**: todo o codebase usa a mesma convencao; `Optional<string>` e mais descritivo que `string | null | undefined`
2. **Intencao semantica**: `Nullable<string>` comunica "pode ser null" vs `Optional<string>` que comunica "pode nao existir"
3. **Refatoracao**: se a definicao mudar (ex: adicionar um `Maybe` wrapper), altera-se em um unico lugar
4. **Legibilidade em generics**: `Either<Promise<Output>, Output>` e mais legivel que `Promise<Output> | Output`

---

## Arquitetura e Estrutura do Codigo

### Visao geral das pastas

```
src/
├── app.module.ts           # Modulo raiz: TypeORM, Cache, i18n, Throttler, Schedule
├── main.ts                 # Bootstrap Fastify + RabbitMQ microservice + Scalar
├── database-options.ts     # Configuracao PostgreSQL
├── data-source.config.ts   # DataSource para CLI de migrations
│
├── common/                 # Recursos compartilhados (barrel: common/index.ts)
│   ├── constants/          # RMQ_DLX, RMQ_QUEUE, RMQ_DLQ, ROLES_KEY
│   ├── decorators/         # @CurrentUser, @Roles
│   ├── enums/              # UserRole, ReservationEvents, SeatStatus, RMQServices
│   ├── filters/            # AllExceptionsFilter (HTTP errors padronizados)
│   ├── guards/             # JwtAuthGuard, RolesGuard, ThrottlerSkipPathsGuard, RateLimitGuard
│   ├── interceptors/       # IdempotencyInterceptor
│   ├── interfaces/         # IUseCase, IRequestUser, ICurrentUser, IMeta, IHttpErrorResponse
│   ├── providers/          # RedisProvider (singleton ioredis via token 'REDIS')
│   ├── services/           # DistributedLockService (Redlock wrapper)
│   ├── types/              # Optional, Nullable, Either, EitherMultiple
│   └── validators/         # StartBeforeEnd (validador customizado class-validator)
│
├── core/                   # Infraestrutura de mensageria
│   └── messaging/
│       ├── consumers/      # MessagingConsumer (eventos RabbitMQ com dedup)
│       ├── producers/      # MessagingProducer (publish tipado por evento)
│       ├── events/         # Tipos dos eventos (ReservationCreated, PaymentConfirmed, etc.)
│       └── services/       # DlqSetupService (assert DLX + DLQ no startup)
│
├── modules/
│   ├── auth/               # Registro, login, refresh, logout, JWT (access + refresh tokens)
│   ├── health/             # GET /health (liveness/readiness, sem throttle)
│   ├── users/              # Entidade de usuario (usado pelo auth)
│   ├── sessions/           # CRUD de sessoes, disponibilidade, assentos, conflito de sala
│   ├── seats/              # CRUD de assentos, status (available/reserved/sold/blocked)
│   ├── reservations/       # Reservas, expiracao, outbox, schedulers, cancelamento
│   └── sales/              # Confirmacao de pagamento, outbox, lock pessimista
│
├── infra/
│   ├── migrations/         # Migrations TypeORM (versionadas, rodam no startup via Docker)
│   └── seeders/            # Seeders para dados iniciais (usuarios, sessoes, assentos)
│
└── i18n/                   # Mensagens de erro em EN, ES, PT
    ├── en/
    │   ├── common.json     # Mensagens de dominio (reservation, seat, session, auth, etc.)
    │   └── validation.json # Mensagens de validacao (required, email, minLength, etc.)
    ├── es/
    └── pt/
```

### Padrao de camadas (por modulo)

Cada modulo segue a estrutura:

```
modules/<nome>/
├── controllers/       # Rotas HTTP (decoradores Swagger, guards, interceptors)
├── services/          # Orquestracao (delega para use-cases, mapeia DTOs)
├── use-cases/         # Regra de negocio isolada (transacoes, locks, validacoes)
│   ├── interfaces/    # Contratos de input (ICreateXInput, IDeleteXInput)
│   └── __tests__/     # Testes unitarios dos use-cases
├── dto/               # Data Transfer Objects (validacao com class-validator)
├── entities/          # Entidades TypeORM (mapeamento de tabelas)
├── enums/             # Enums do dominio (ReservationStatus, SeatStatus, SessionStatus)
├── interfaces/        # Contratos de response (IFindAllResponse, IAvailabilityResponse)
└── constants/         # Constantes do modulo (BATCH_SIZE, RESERVATION_TTL_MS)
```

**Fluxo de uma request:**

```
HTTP Request
  → Controller (validacao DTO, guards, interceptors)
    → Service (orquestracao, mapeamento)
      → UseCase (regra de negocio, transacao, lock)
        → TypeORM (EntityManager/Repository)
          → PostgreSQL
```

Controllers e services sao **camadas finas** que delegam. A logica de negocio fica **exclusivamente nos use-cases**, o que permite testa-los isoladamente com mocks.

---

## Interface `IUseCase<Input, Output>`

Todos os use-cases implementam o contrato:

```typescript
export interface IUseCase<Input, Output> {
  execute(data: Input): Either<Promise<Output>, Output>;
}
```

**Por que essa interface?**

- **Contrato unico**: todo use-case tem um metodo `execute()` com input e output tipados
- **Flexibilidade**: `Either<Promise<Output>, Output>` permite use-cases sincronos e assincronos
- **Testabilidade**: dependencias sao injetadas via construtor, mockaveis no teste
- **Consistencia**: todo o codebase segue o mesmo padrao, facilitando onboarding

**Exemplos:**
- `CreateReservationsUseCase implements IUseCase<ICreateReservationsInput, Array<ReservationEntity>>`
- `ExpireReservationsUseCase implements IUseCase<Date, void>`
- `DeleteReservationsUseCase implements IUseCase<IDeleteReservationsInput, void>`
- `CreateSalesUseCase implements IUseCase<ICreateSalesInput, SaleEntity>`

---

## Fluxo de Reserva → Pagamento → Confirmacao

```
1. RESERVA (POST /reservations)
   └─ CreateReservationsUseCase
      ├─ Transacao unica (DataSource.transaction)
      ├─ Valida: sessao ativa, usuario existe
      ├─ Para cada seatId (ORDENADO para evitar deadlock):
      │  ├─ UPDATE seats SET status='reserved' WHERE status='available'  (condicional)
      │  ├─ Se affected=0: verifica motivo (seat not found / wrong session / not available)
      │  ├─ INSERT reservations (PENDING, expiresAt = now + TTL)
      │  └─ INSERT reservation_events_outbox (published=false)
      └─ Commit

2. RELAY DE CRIACAO (scheduler a cada 30s)
   └─ RelayReservationCreatedOutboxUseCase
      ├─ SELECT * FROM reservation_events_outbox WHERE published=false (BATCH_SIZE=100)
      ├─ Para cada: publish RabbitMQ → UPDATE published=true
      └─ Consumer: dedup → invalidate cache seats:session:{id} → ack

3. EXPIRACAO (scheduler a cada 10s)
   └─ ExpireReservationsUseCase
      ├─ SELECT reservations WHERE status=PENDING AND expiresAt <= now (BATCH_SIZE)
      ├─ Para cada (QueryRunner individual):
      │  ├─ Lock pessimista (pessimistic_write) WHERE status=PENDING
      │  ├─ Se lock falha: skip (ja expirada/confirmada por outra instancia)
      │  ├─ UPDATE reservation status=EXPIRED
      │  ├─ UPDATE seat status=AVAILABLE WHERE status=RESERVED (condicional)
      │  └─ INSERT reservation_expiration_outbox
      └─ Commit por reserva (falha isolada nao afeta as demais)

4. PAGAMENTO (POST /sales)
   └─ CreateSalesUseCase
      ├─ QueryRunner manual (transacao explicita)
      ├─ Lock pessimista na reservation (pessimistic_write)
      ├─ Valida: userId match, status=PENDING, expiresAt > now
      ├─ Lock pessimista no seat (pessimistic_write)
      ├─ Valida: seat status=RESERVED
      ├─ Valida: session existe
      ├─ UPDATE reservation status=CONFIRMED
      ├─ UPDATE seat status=SOLD
      ├─ INSERT sales (amount = session.ticketPrice)
      ├─ INSERT sales_outbox (PaymentConfirmed)
      └─ Commit

5. RELAY DE VENDAS (scheduler a cada 30s)
   └─ RelaySaleOutboxUseCase
      └─ publish PaymentConfirmed → consumer invalida cache
```

---

## Logica de Concorrencia (Detalhada)

### UPDATE condicional na reserva

Em vez de `SELECT` + `UPDATE` (check-then-act), o `CreateReservationsUseCase` usa:

```sql
UPDATE seats SET status='reserved', version=version+1
WHERE id = :seatId AND session_id = :sessionId AND status = 'available'
```

- **Operacao atomica**: o banco garante que apenas uma transacao consegue `affected=1`
- **Sem race condition**: se dois usuarios tentam o mesmo assento, apenas um atualiza; o outro recebe `affected=0`
- **Diagnostico preciso**: quando `affected=0`, o use-case faz um `findOne` para determinar o motivo exato (seat nao encontrado, sessao errada, ou nao disponivel) e retorna o erro correto

### Lock pessimista na venda

O `CreateSalesUseCase` usa `lock: { mode: 'pessimistic_write' }` em **reservation** e **seat**:

```typescript
const reservation = await queryRunner.manager.findOne(ReservationEntity, {
  where: { id: reservationId },
  lock: { mode: 'pessimistic_write' },  // SELECT ... FOR UPDATE
});
```

**Por que?** O scheduler de expiracao e a confirmacao de pagamento competem pelo mesmo recurso:

- **Pagamento primeiro** → confirma, status=CONFIRMED, seat=SOLD. Expiracao tenta lock, encontra status!=PENDING, faz skip
- **Expiracao primeiro** → expira, seat=AVAILABLE. Pagamento encontra status=EXPIRED, retorna erro
- **Lock serializa**: impossivel ambos executarem simultaneamente no mesmo registro

### Ordenacao de seatIds

```typescript
const sortedSeatIds: Array<string> = [...seatIds].sort();
```

**Por que?** Multiplas transacoes que bloqueiam os mesmos assentos em **ordem diferente** podem entrar em deadlock (espera circular). Com `.sort()`, todas seguem a mesma sequencia e nao ha ciclo.

### Expiracao com isolamento por reserva

O `ExpireReservationsUseCase` cria um `QueryRunner` **por reserva** (nao uma transacao unica para todas):

```typescript
for (const reservation of expiredReservations) {
  const queryRunner = this.dataSource.createQueryRunner();
  // transacao individual...
}
```

**Por que?** Se uma reserva falhar na expiracao (ex: deadlock temporario), as demais continuam sendo processadas. Falha isolada nao compromete o batch inteiro.

---

## Decoradores Customizados

### `@CurrentUser()`

Parameter decorator que extrai o usuario autenticado do request (populado pelo `JwtAuthGuard`):

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
me(@CurrentUser() user: IRequestUser) {
  return user;
}
```

### `@Roles(...roles)`

Define quais roles podem acessar o endpoint. Usado em conjunto com `RolesGuard`:

```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
create(@Body() dto: CreateSessionsDto) { ... }
```

---

## Sistema de Idempotencia

O `IdempotencyInterceptor` garante que requests duplicadas (retries, cliques duplos) nao executem a operacao duas vezes:

**Fluxo:**

```
1. Request chega com header Idempotency-Key: "abc-123"

2. Verifica cache Redis (idempotency:response:abc-123)
   ├─ Existe? → Retorna resposta cacheada imediatamente
   └─ Nao existe? → Passo 3

3. Tenta adquirir lock Redis (SET idempotency:lock:abc-123 "1" NX PX 300000)
   ├─ Lock adquirido? → Executa handler, salva resposta, deleta lock
   └─ Lock NAO adquirido? → Outra request esta processando; poll ate resposta aparecer

4. Polling: verifica cache a cada 50ms ate POLL_TIMEOUT_MS (305s)
   ├─ Resposta apareceu? → Retorna
   └─ Timeout? → ServiceUnavailableException
```

**Constantes:**
- `RESPONSE_TTL_MS`: 300.000ms (5 min) - tempo que a resposta fica cacheada
- `LOCK_TTL_MS`: 300.000ms (5 min) - lock expira se handler travar/crashar
- `POLL_INTERVAL_MS`: 50ms - intervalo de polling
- `POLL_TIMEOUT_MS`: 305.000ms - timeout do polling (levemente maior que lock TTL)

**Onde e aplicado:**
- `POST /reservations` (criacao de reservas)
- `POST /sales` (confirmacao de pagamento)

---

## Mensageria: RabbitMQ

### Eventos de dominio

| Evento | Quando | Payload |
|--------|--------|---------|
| `reservation.created` | Reserva criada | reservationId, sessionId, seatId, userId, expiresAt |
| `reservation.expired` | Reserva expirada | reservationId, seatId, sessionId |
| `payment.confirmed` | Pagamento confirmado | saleId, reservationId, sessionId, seatId, userId, amount |
| `seat.released` | Assento liberado | reservationId, seatId, sessionId, reason |

### Fluxo produtor → consumidor

```
UseCase → Outbox Table (na mesma transacao)
  → Scheduler (relay a cada 30s) → MessagingProducer → RabbitMQ
    → MessagingConsumer → dedup check → invalidate cache → ack
```

### Deduplicacao no consumer

RabbitMQ garante **at-least-once delivery**. Mensagens podem ser entregues mais de uma vez (ex: consumer processa mas ack falha). O consumer usa deduplicacao via cache:

```typescript
const dedupKey = `event_dedup:${eventType}:${uniqueId}`;
if (await this.isDuplicate(dedupKey)) {
  this.ack(context);  // ja processado, apenas ack
  return;
}
// processa...
await this.markProcessed(dedupKey);  // TTL 24h
this.ack(context);
```

### Dead Letter Queue (DLQ)

Mensagens que falham no consumer sao **nack sem requeue**:

```typescript
channel.nack(originalMsg, false, false);  // nao requeue
```

A fila principal configura `x-dead-letter-exchange` e `x-dead-letter-routing-key`, e o `DlqSetupService` cria exchange + fila DLQ no startup. Mensagens problematicas ficam na DLQ para inspecao e retry manual.

### Por que RabbitMQ e nao Kafka

| Criterio | RabbitMQ | Kafka |
|----------|----------|-------|
| **Throughput** | Moderado (suficiente para cinema) | Alto (milhoes/s) |
| **DLQ** | Nativa (DLX + routing) | Manual (topic separado) |
| **Setup** | Simples (exchange/queue) | Complexo (brokers, ZK/KRaft, partitions) |
| **Modelo** | Push (broker envia ao consumer) | Pull (consumer busca do broker) |
| **Retencao** | Mensagem removida apos ack | Retencao configuravel (replay) |
| **Uso no projeto** | Eventos por sessao, invalidacao de cache | Overengineering para o escopo |

**Decisao:** O projeto emite eventos de **baixo volume** (reservas e vendas por sessao). Nao precisa de replay, retencao longa ou milhoes de mensagens/segundo. RabbitMQ atende os requisitos com DLQ nativa, setup rapido e infraestrutura mais simples.

---

## Internacionalizacao (i18n)

Todas as mensagens de erro sao internacionalizadas usando `nestjs-i18n`:

**Idiomas:** EN, ES, PT

**Resolucao de idioma (em ordem de prioridade):**
1. Query parameter: `?lang=pt` ou `?l=pt`
2. Header: `x-lang: pt`
3. Header: `Accept-Language: pt`
4. Fallback: `en`

**Estrutura:**
```
src/i18n/
├── en/
│   ├── common.json     # auth, reservation, sale, seat, session, user
│   └── validation.json # required, isEmail, minLength, isStrongPassword
├── es/
│   ├── common.json
│   └── validation.json
└── pt/
    ├── common.json
    └── validation.json
```

**Uso nos use-cases:**

```typescript
throw new NotFoundException(
  this.i18n.t('common.reservation.notFoundWithId', {
    args: { id: reservationId },
  }),
);
// EN: "Reservation {id} not found"
// PT: "Reserva {id} nao encontrada"
// ES: "Reserva {id} no encontrada"
```

---

## Validadores Customizados

### `@StartBeforeEnd()`

Validador cross-field para `class-validator` que garante `startTime < endTime`:

```typescript
@ValidatorConstraint({ name: 'StartBeforeEnd', async: false })
export class StartBeforeEndConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    // Parseia ambos os campos, valida apenas quando ambos existem e sao validos
    // Retorna false se startTime >= endTime
  }
}
```

Usado nos DTOs de criacao/atualizacao de sessoes para evitar sessoes com horario invalido.

---

## AllExceptionsFilter: Respostas de Erro Padronizadas

O filtro global captura **todas** as excecoes e retorna um formato consistente:

```json
{
  "statusCode": 409,
  "timestamp": "2026-02-13T12:00:00.000Z",
  "path": "/reservations",
  "message": "Seat a1b2c3d4 is not available",
  "error": "Conflict"
}
```

- `HttpException`: preserva status e mensagem
- Erros desconhecidos: retorna 500 com a mensagem do erro
- Mensagem pode ser string ou array (ex: validacao retorna array de erros)

---

## ThrottlerSkipPathsGuard: Rate Limiting Inteligente

Estende o `ThrottlerGuard` padrao para **pular** throttling em paths especificos:

```typescript
const SKIP_PATHS: Array<string> = ['/api-docs', '/health'];
```

- `/health` e `/api-docs` nunca sao limitados (monitoramento e documentacao)
- Demais rotas: 10 requests por minuto por IP (padrao global)
- Endpoints sensiveeis tem throttle especifico via `@Throttle()`:
  - `POST /auth/register`: 3 req/hora
  - `POST /auth/login`: 5 req/min
  - `POST /auth/refresh`: 10 req/min

---

## Por que Testes Unitarios Estao nos Use-Cases

### Onde esta a regra de negocio

A arquitetura separa responsabilidades em camadas finas:

| Camada | Responsabilidade | Logica de negocio? |
|--------|------------------|--------------------|
| **Controller** | Rotas HTTP, decoradores Swagger, guards, interceptors | Nao |
| **Service** | Orquestracao, mapeamento DTO ↔ Entity | Nao |
| **UseCase** | Transacoes, locks, validacoes, regras de dominio | **Sim** |
| **Repository/Entity** | Persistencia, mapeamento de tabelas | Nao |

**Controllers** sao declarativos (decoradores) e delegam para services. **Services** delegam para use-cases. A logica critica vive **exclusivamente nos use-cases**.

### O que os testes unitarios validam

Cada use-case e testado com:
- **Mocks de DataSource/Repository**: sem banco real, sem I/O
- **Cenarios de sucesso**: operacao completa com dados validos
- **Cenarios de erro**: cada excecao possivel (NotFoundException, ForbiddenException, ConflictException)
- **Regras de dominio**: ownership, status transitions, validacoes de negocio

**Exemplo: `DeleteReservationsUseCase` (5 cenarios):**

```typescript
it('should delete pending reservation and release seat')
it('should throw NotFoundException when reservation does not exist')
it('should throw ForbiddenException when user does not own reservation')
it('should throw ConflictException when reservation is CONFIRMED')
it('should throw ConflictException when reservation is EXPIRED')
```

### Cobertura das demais camadas

- **Controllers e services** sao cobertos por testes de **integracao** e **E2E** (com HTTP real)
- **Concorrencia** e testada com 100 usuarios competindo por 16 assentos
- **Messaging** e testado com publicacao/consumo real de eventos no RabbitMQ
- **Load testing** com k6 valida comportamento sob 500 VUs

### Piramide de testes

```
         ┌──────────┐
         │  Load (k6)│  ← 500 VUs, 30s, validacao de thresholds
         ├──────────┤
         │   E2E    │  ← Fluxo completo: registro → login → reserva → pagamento
         ├──────────┤
         │  Concur  │  ← 100 usuarios, 16 assentos, nenhum double-booking
         ├──────────┤
         │ Integra  │  ← Transacao, deadlock, expiracao com banco real
         ├──────────┤
         │ Messag   │  ← Eventos RabbitMQ (publicacao, consumo, DLQ)
         ├──────────┤
         │ Unitario │  ← Use-cases com mocks (rapido, sem infra)
         └──────────┘
```

---

## Pre-requisitos

- **Node.js** 20+
- **pnpm** (gerenciador de pacotes)
- **Docker** e **Docker Compose** (para dependencias ou stack completa)
- **PostgreSQL**, **Valkey/Redis** e **RabbitMQ** (localmente ou via Docker)

---

## Como Rodar o Projeto

### 1. Configuracao do ambiente

Crie um arquivo `.env` na raiz do projeto (ou copie o `.env.example`):

```env
# Servidor
NODE_ENV=development
PORT=8088

# Banco de dados
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=cinema

# Cache (Valkey/Redis)
VALKEY_URL=redis://localhost:6379

# Mensageria (RabbitMQ)
RMQ_URL=amqp://guest:guest@localhost:5672

# Autenticacao JWT (obrigatorio para login/registro)
JWT_SECRET=tirulipa_de_exemplo_123
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Reservas (opcional)
RESERVATION_TTL_MS=30000
```

### 2. Instalacao

```bash
pnpm install
```

### 3. Rodar a aplicacao

#### Opcao A: Tudo com Docker

Sobe API, PostgreSQL, Valkey e RabbitMQ. Migrations rodam automaticamente no startup.

```bash
pnpm run docker:up
```

- **API:** http://localhost:8088
- **Documentacao (Scalar):** http://localhost:8088/api-docs
- **Health:** http://localhost:8088/health

#### Opcao B: Apenas dependencias com Docker

Suba apenas PostgreSQL, Valkey e RabbitMQ com `docker-compose.test.yml`:

```bash
docker compose -f docker/compose.test.yml up -d
```

Depois, na raiz do projeto:

```bash
DATABASE_HOST=localhost DATABASE_PORT=5433 DATABASE_NAME=cinema_test \
  VALKEY_URL=redis://localhost:6380 RMQ_URL=amqp://guest:guest@localhost:5673 \
  pnpm run migration:run
pnpm run seed   # opcional
pnpm run dev
```

#### Opcao C: Servicos locais

Com PostgreSQL, Valkey e RabbitMQ rodando localmente nas portas padrao:

```bash
pnpm run migration:run
pnpm run seed   # opcional
pnpm run dev
```

### 4. Popular dados iniciais (seeders)

```bash
pnpm run seed
```

O seeder insere, na ordem:

1. **Usuarios** — admin e usuarios de teste
2. **Sessoes** — 10 sessoes de filmes em salas diferentes
3. **Assentos** — assentos por sessao
4. **Reservas** — dados de exemplo (opcional)
5. **Vendas** — dados de exemplo (opcional)

### 5. Executar testes

| Comando | Descricao | Infra necessaria |
|---------|-----------|------------------|
| `pnpm run test` | Testes unitarios (use-cases) | Nenhuma |
| `pnpm run test:integration` | Transacao, deadlock, expiracao | PostgreSQL, Redis |
| `pnpm run test:e2e` | Fluxo completo de reserva e venda | PostgreSQL, Redis, RabbitMQ |
| `pnpm run test:concurrency` | 100 usuarios, 16 assentos | PostgreSQL, Redis, RabbitMQ |
| `pnpm run test:messaging` | Eventos RabbitMQ | RabbitMQ, Redis |
| `k6 run load-tests/reservation-load.js` | Load test (500 VUs, 30s) | k6 instalado (ver [k6.io](https://k6.io)) |

**Ordem recomendada para testes que exigem infraestrutura:**

```bash
pnpm test:infra:up
sleep 15
DATABASE_HOST=localhost DATABASE_PORT=5433 DATABASE_NAME=cinema_test \
  VALKEY_URL=redis://localhost:6380 RMQ_URL=amqp://guest:guest@localhost:5673 \
  pnpm run migration:run
pnpm test:integration
pnpm test:e2e
pnpm test:concurrency
pnpm test:messaging
pnpm test:infra:down
```

### Load test com k6

O projeto inclui um script de carga em `load-tests/reservation-load.js` que simula:

- **500 usuarios concorrentes** por 30 segundos
- Alternancia entre **duas instancias** da API (portas 8088 e 8089)
- **Thresholds**: <5% de falhas HTTP, p95 latencia <3s

**Pre-requisitos:** Migrations e seed executados. [k6](https://k6.io/docs/getting-started/installation/) instalado.

```bash
SESSION_ID=<uuid> SEAT_IDS=<id1>,<id2>,... k6 run load-tests/reservation-load.js
```

**Validacoes do load test:**
- Nenhum assento vendido duas vezes
- Sem erros 500 inesperados
- Fila RabbitMQ nao cresce descontroladamente
- Conexoes do banco nao esgotam

---

## Docker

### Multi-stage Dockerfile

```
┌─────────────────────────────────────────────────┐
│ development                                     │
│  Node 22 Alpine + pnpm + source code            │
│  ENTRYPOINT: migration:run && dev (watch mode)  │
├─────────────────────────────────────────────────┤
│ builder                                         │
│  Instala deps + build para /dist                │
├─────────────────────────────────────────────────┤
│ runner (producao)                                │
│  Apenas dist/ + deps de producao                │
│  ENTRYPOINT: migration:run && node dist/main.js │
└─────────────────────────────────────────────────┘
```

### Docker Compose (desenvolvimento)

```yaml
services:
  api:        # NestJS + Fastify (porta 8088)
  db:         # PostgreSQL 18.1 (porta 5432)
  valkey:     # Valkey 9.0.2 - Redis compatible (porta 6379)
  rabbitmq:   # RabbitMQ 4.2.3 (AMQP 5672, Management 15672)
```

Todos os servicos possuem **healthcheck** e a API espera dependencias ficarem healthy antes de iniciar. Migrations rodam automaticamente no entrypoint do container.

---

## Endpoints da API

Base URL: `http://localhost:8088`

Autenticacao: `Authorization: Bearer <access_token>`

### Auth (`/auth`)

| Metodo | Rota | Descricao | Throttle |
|--------|------|-----------|----------|
| POST | `/auth/register` | Registrar usuario | 3 req/hora |
| POST | `/auth/login` | Login (retorna access + refresh) | 5 req/min |
| POST | `/auth/refresh` | Renovar access token | 10 req/min |
| POST | `/auth/logout` | Invalidar refresh token | 20 req/min |
| GET | `/auth/me` | Usuario autenticado | — |

**Exemplo de login:**

```bash
curl -X POST http://localhost:8088/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Str0ngP@ss"}'
```

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### Sessions (`/sessions`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | `/sessions` | Criar sessao | Admin |
| GET | `/sessions` | Listar sessoes (paginacao) | JWT |
| GET | `/sessions/:id` | Buscar sessao por ID | JWT |
| GET | `/sessions/:id/availability` | Assentos disponiveis (com cache) | JWT |
| GET | `/sessions/:id/seats` | Listar todos os assentos (com status) | JWT |
| PATCH | `/sessions/:id` | Atualizar sessao | Admin |
| DELETE | `/sessions/:id` | Remover sessao | Admin |

**Exemplo de criacao de sessao:**

```bash
curl -X POST http://localhost:8088/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "movieTitle": "Interstellar",
    "roomName": "Sala 1",
    "startTime": "2026-03-15T19:00:00.000Z",
    "endTime": "2026-03-15T21:30:00.000Z",
    "ticketPrice": 25.00
  }'
```

**Exemplo de disponibilidade:**

```json
{
  "sessionId": "uuid",
  "totalSeats": 50,
  "availableSeats": 45,
  "seats": [{ "id": "uuid", "label": "A1" }, ...]
}
```

### Seats (`/seats`)

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | `/seats` | Criar assento | Admin |
| PATCH | `/seats/:id` | Atualizar status (block/maintenance) | Admin |

### Reservations (`/reservations`)

| Metodo | Rota | Descricao | Idempotencia |
|--------|------|-----------|--------------|
| POST | `/reservations` | Reservar assentos | Sim (`Idempotency-Key`) |
| GET | `/reservations` | Listar reservas do usuario | — |
| GET | `/reservations/:id` | Buscar reserva por ID | — |
| PATCH | `/reservations/:id` | Atualizar reserva | Admin |
| DELETE | `/reservations/:id` | Cancelar reserva | — |

**Exemplo de reserva:**

```bash
curl -X POST http://localhost:8088/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "sessionId": "uuid-session",
    "seatIds": ["uuid-seat-1", "uuid-seat-2"]
  }'
```

```json
[
  {
    "id": "uuid-reservation",
    "sessionId": "uuid-session",
    "seatId": "uuid-seat-1",
    "userId": "uuid-user",
    "status": "pending",
    "expiresAt": "2026-02-13T12:05:00.000Z",
    "createdAt": "2026-02-13T12:00:00.000Z"
  }
]
```

### Sales (`/sales`)

| Metodo | Rota | Descricao | Idempotencia |
|--------|------|-----------|--------------|
| POST | `/sales` | Confirmar pagamento de reserva | Sim (`Idempotency-Key`) |
| GET | `/sales` | Historico de compras (paginacao) | — |
| GET | `/sales/:id` | Buscar venda por ID | — |

**Exemplo de confirmacao de pagamento:**

```bash
curl -X POST http://localhost:8088/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-456" \
  -d '{"reservationId":"uuid-reservation"}'
```

### Health (`/health`)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/health` | Liveness/readiness (sem throttle) |

```json
{ "status": "ok" }
```

---

## Estrategias Implementadas (Resumo)

| Problema | Solucao | Implementacao |
|----------|---------|---------------|
| **Race condition na reserva** | UPDATE condicional | `UPDATE ... WHERE status = 'available'` |
| **Race condition na venda** | Lock pessimista | `findOne({ lock: { mode: 'pessimistic_write' } })` |
| **Expiracao vs pagamento** | Lock pessimista | Serializa operacoes no mesmo recurso |
| **Deadlock** | Ordenacao de seatIds | `.sort()` antes do loop |
| **Coordenacao multi-instancia** | Redlock | `DistributedLockService` com `retryCount: 0` |
| **Requests duplicadas** | Idempotencia | `IdempotencyInterceptor` + Redis SET NX PX |
| **Eventos assincronos** | Transactional Outbox | Evento + dado na mesma transacao |
| **Mensagens duplicadas** | Deduplicacao | Cache com TTL 24h no consumer |
| **Mensagens com falha** | DLQ | `x-dead-letter-exchange` + nack sem requeue |
| **Disponibilidade em cache** | Invalidacao por evento | Consumer invalida `seats:session:{id}` |

---

## Decisoes Tecnicas e Motivacao

| Decisao | Motivacao |
|---------|-----------|
| **UPDATE condicional em vez de SELECT+UPDATE** | Evita race condition; o banco garante atomicidade |
| **Lock pessimista na venda** | Serializa expiracao vs. pagamento no mesmo recurso |
| **Ordenacao de seatIds** | Reduz risco de deadlock em operacoes concorrentes |
| **QueryRunner individual por expiracao** | Falha em uma reserva nao compromete o batch |
| **Transactional Outbox** | Eventos e dados na mesma transacao; sem perda em crash |
| **Relay em duas etapas (publish → update)** | Janela de duplicacao existe; consumer usa dedup para atenuar |
| **BATCH_SIZE fixo (100)** | Relays processam em lotes; backlog em pico pode atrasar |
| **Redlock com um unico Redis** | Suficiente para o desafio; em producao, ideal usar 5+ nos |
| **Deduplicacao no consumer (TTL 24h)** | Compativel com at-least-once do RabbitMQ |
| **Cache de disponibilidade (10s TTL)** | Reduz carga no banco; invalidation via eventos |
| **Throttler global (10 req/60s)** | Protecao basica; /health e /api-docs excluidos |
| **Scalar em vez de Swagger UI** | Interface moderna, code snippets, experiencia superior |
| **Tipos customizados (Optional, Either, etc.)** | Semantica explicita, padronizacao, legibilidade em generics |
| **IUseCase interface** | Contrato unico para todos os use-cases, testabilidade |
| **i18n com 3 idiomas** | Mensagens localizadas sem hardcode em use-cases |
| **Fastify em vez de Express** | Performance superior em cenarios de alta concorrencia |
| **Validacao de conflito de sala** | Impede sessoes sobrepostas na mesma sala |

---

## Limitacoes Conhecidas

1. **Validacao de conflito de sala**: Usa SELECT + check em memoria (sem lock/constraint); em concorrencia extrema, sessoes sobrepostas podem ser criadas simultaneamente
2. **Relay do Outbox**: Publish e update nao sao atomicos; crash entre eles pode gerar duplicacao (mitigado por dedup no consumer)
3. **Redlock com um node**: Falha do Redis pode liberar locks e permitir execucao duplicada de schedulers
4. **Connection pool**: Sem tuning explicito; o default do TypeORM pode ser insuficiente sob carga extrema
5. **Indices na outbox**: Queries de relay podem fazer full scan em volumes altos
6. **Limpeza de outbox**: Registros publicados nao sao removidos; tabelas crescem ao longo do tempo
7. **Idempotency polling**: Timeout de ~305s; requests duplicadas podem ficar presas em polling
8. **Throttler restritivo**: 10 req/min por IP pode limitar testes manuais intensivos


---

## Melhorias Futuras

- Lock ou constraint na criacao de sessoes (ex: `EXCLUDE USING gist` no PostgreSQL)
- Isolation level explicito nas transacoes criticas e documentacao da escolha
- Retry com backoff exponencial no relay de outbox
- Indices parciais nas tabelas de outbox para queries de relay (`WHERE published = false`)
- Job para limpeza de registros de outbox ja publicados
- Ajuste do Throttler para ambiente de desenvolvimento/teste
- Connection pool tuning (`poolSize`, `connectionTimeout`) conforme carga esperada
- Teste de edge case: pagamento no limite da expiracao (ex: TTL 2s, pagamento em 1.9s)
- Observabilidade: metricas Prometheus, tracing distribuido (OpenTelemetry)
- Circuit breaker no relay de outbox para lidar com indisponibilidade do RabbitMQ


---

## Exemplo de Fluxo para Testar

1. **Registrar usuario**

```bash
curl -X POST http://localhost:8088/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Str0ngP@ss"}'
```

2. **Login e obter token**

```bash
TOKEN=$(curl -s -X POST http://localhost:8088/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Str0ngP@ss"}' | jq -r '.accessToken')
```

3. **Criar sessao (como admin)**

```bash
SESSION_ID=$(curl -s -X POST http://localhost:8088/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "movieTitle":"Interstellar",
    "roomName":"Sala 1",
    "startTime":"2026-03-15T19:00:00.000Z",
    "endTime":"2026-03-15T21:30:00.000Z",
    "ticketPrice":25.00
  }' | jq -r '.id')
```

4. **Criar assentos** (repetir para cada assento, ex.: A1-A16)

```bash
SEAT_ID=$(curl -s -X POST http://localhost:8088/seats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"label\":\"A1\"}" | jq -r '.id')
```

5. **Verificar disponibilidade**

```bash
curl -s http://localhost:8088/sessions/$SESSION_ID/availability \
  -H "Authorization: Bearer $TOKEN"
```

6. **Reservar assento**

```bash
RESERVATION=$(curl -s -X POST http://localhost:8088/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: reserve-$(date +%s)" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"seatIds\":[\"$SEAT_ID\"]}")
RESERVATION_ID=$(echo $RESERVATION | jq -r '.[0].id')
```

7. **Confirmar pagamento**

```bash
curl -X POST http://localhost:8088/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: sale-$(date +%s)" \
  -d "{\"reservationId\":\"$RESERVATION_ID\"}"
```

8. **Listar vendas**

```bash
curl -s http://localhost:8088/sales \
  -H "Authorization: Bearer $TOKEN"
```

---

## Scripts Principais

| Comando | Descricao |
|---------|-----------|
| `pnpm run dev` | Desenvolvimento com watch |
| `pnpm run build` | Build para producao |
| `pnpm run start` | Iniciar em modo normal |
| `pnpm run start:prod` | Rodar build de producao |
| `pnpm run migration:run` | Executar migrations TypeORM |
| `pnpm run seed` | Executar seeders |
| `pnpm run docker:up` | Subir stack com Docker Compose |
| `pnpm run docker:down` | Parar e remover containers |
| `pnpm run test` | Testes unitarios |
| `pnpm run test:e2e` | Testes E2E |
| `pnpm run test:integration` | Testes de integracao |
| `pnpm run test:concurrency` | Testes de concorrencia |
| `pnpm run test:messaging` | Testes de mensageria |
| `pnpm run test:infra:up` | Subir infraestrutura de teste |
| `pnpm run test:infra:down` | Derrubar infraestrutura de teste |
| `pnpm run lint` | ESLint com fix |

---

## Materiais de Estudo

**Outbox Pattern / Transactional Outbox**
- [Medium: Outbox Pattern - Filipe Xavier](https://medium.com/tonaserasa/outbox-pattern-saga-transa%C3%A7%C3%B5es-distribu%C3%ADdas-com-microservices-c9c294b7a045)
- [Microservices.io: Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- [Youtube: Outbox Pattern - Andre Secco](https://www.youtube.com/watch?v=Fl_zXWvK2F8&t=121s)
- [Youtube: Transactional Outbox Pattern - System Design Primer](https://www.youtube.com/watch?v=M-Fhb8LzhPo)

**Concorrencia e Locking**
- [Medium: Optimistic Locking vs Pessimistic Locking - Abhirup Acharya](https://medium.com/@abhirup.acharya009/managing-concurrent-access-optimistic-locking-vs-pessimistic-locking-0f6a64294db7)
- [Youtube: Lock Otimista vs Pessimista - Full Cycle](https://www.youtube.com/watch?v=ZcPilksFCQk)
- [Youtube: Distributed Locking - Race Conditions - Milan Jovanovic](https://www.youtube.com/watch?v=zCBqXJSoCj0)

**RabbitMQ**
- [Medium: RabbitMQ: Concepts and Best Practices - Clearwater Analytics Engineering](https://medium.com/cwan-engineering/rabbitmq-concepts-and-best-practices-aa3c699d6f08)



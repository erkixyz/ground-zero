# Ground Zero

Full-stack web application with a highly available, load-balanced container infrastructure.

**Stack:** Next.js (frontend) · NestJS (API) · PostgreSQL · Redis · MinIO · RabbitMQ · Ollama (local AI)

---

## Architecture

```text
                              ┌──────────────────┐
                              │     BROWSER      │
                              └────────┬─────────┘
                                       │
                              :3000    │    :3001
                         ┌────────────┴────────────┐
                         │       app-lb (nginx)     │
                         │   HTTP load balancer     │
                         │   stats  →  :8080        │
                         └─────────┬────────────────┘
                                   │
                   ┌───────────────┴────────────────┐
                   │ round-robin                     │ round-robin
                   ▼                                 ▼
        ┌──────────────────┐             ┌──────────────────┐
        │    WEB LAYER     │             │    API LAYER     │
        │                  │             │                  │
        │  ┌────────────┐  │             │  ┌────────────┐  │
        │  │    web     │  │             │  │    api     │  │
        │  │  Next.js   │  │             │  │  NestJS    │  │
        │  │   :3000    │  │             │  │   :3001    │  │
        │  └────────────┘  │             │  └────────────┘  │
        │  ┌────────────┐  │             │  ┌────────────┐  │
        │  │   web-2    │  │             │  │   api-2    │  │
        │  │  Next.js   │  │             │  │  NestJS    │  │
        │  │   :3000    │  │             │  │   :3001    │  │
        │  └────────────┘  │             │  └────────────┘  │
        └──────────────────┘             └────────┬─────────┘
                                                  │
                               ┌──────────────────┴──────────────────┐
                               │         ollama-lb (nginx)            │
                               │         round-robin  :11434          │
                               └────────┬──────────────────┬──────────┘
                                        │                  │
                               ┌────────▼──────┐  ┌────────▼──────┐
                               │   ollama-1    │  │   ollama-2    │
                               │ llama3.2:3b   │  │ llama3.2:3b   │
                               │   :11434      │  │   :11434      │
                               └───────────────┘  └───────────────┘
                                        │
                                   ┌──────────────┴──────────────┐
                                   │       RabbitMQ fanout        │
                                   │   exchange: notes_events     │
                                   │   :5672  mgmt → :15672       │
                                   │  api ◄──────────────► api-2  │
                                   └──────────────┬──────────────┘
                                                  │
                          ┌───────────────────────┼──────────────────────┐
                          │                       │                      │
                          ▼                       ▼                      ▼
           ┌──────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐
           │   redis-lb (haproxy) │  │     db-primary       │  │    minio-lb (nginx)  │
           │   active/passive     │  │    PostgreSQL 17      │  │   round-robin        │
           │   role:master check  │  │    write endpoint     │  │   :9000  :9001       │
           │   stats → :8405      │  │    :5432              │  └──────────┬───────────┘
           └──────────┬───────────┘  └──────────┬───────────┘             │
                                                                  ┌────────┴────────┐
                                                                  │                 │
                                                         ┌────────▼──────┐  ┌───────▼───────┐
                                                         │   minio-1     │  │   minio-2     │
                                                         │  data1+data2  │  │  data1+data2  │
                                                         └───────────────┘  └───────────────┘
                                                         ◄─── distributed mode, EC:2 ────────►
                      │                         │ streaming replication
              ┌───────┴───────┐        ┌────────┴─────────────────┐
              │               │        │                           │
              ▼               ▼        ▼                           ▼
   ┌─────────────────┐  ┌──────────────────┐         ┌────────────────────────┐
   │  redis-primary  │  │  db-secondary    │         │     db-secondary-2     │
   │    (master)     │  │  (replica) :5433 │         │     (replica)  :5434   │
   │    R/W          │  └──────────────────┘         └────────────────────────┘
   └────────┬────────┘             └──────────────────────────┘
            │ replication                             │
            ▼                           ┌─────────────▼──────────────┐
   ┌─────────────────┐                  │    db-read-lb (haproxy)    │
   │  redis-replica  │                  │    round-robin reads       │
   │    (replica)    │                  │    read endpoint  :5435    │
   │    R only       │                  │    stats → :8404           │
   └─────────────────┘                  └────────────────────────────┘
            │
   ┌────────┴──────────────────────────────────┐
   │           Redis Sentinel  (×3)            │
   │                                           │
   │   sentinel-1 · sentinel-2 · sentinel-3    │
   │                                           │
   │   quorum: 2 / 3                           │
   │   down-after: 5 s                         │
   │   auto-promotes replica on failure        │
   └───────────────────────────────────────────┘
```

---

## Services

| Container | Image | Role | Exposed port(s) |
| --- | --- | --- | --- |
| `app-lb` | nginx:alpine | HTTP load balancer (web + api) | 3000, 3001, 8080 |
| `web` | ground-zero-web | Next.js frontend (instance 1) | — |
| `web-2` | ground-zero-web | Next.js frontend (instance 2) | — |
| `api` | ground-zero-api | NestJS API (instance 1) | — |
| `api-2` | ground-zero-api | NestJS API (instance 2) | — |
| `rabbitmq` | rabbitmq:4-management-alpine | Message broker (fanout exchange) | 5672, 15672 |
| `redis-lb` | haproxy:3.0 | Redis active/passive LB | 6379, 8405 |
| `redis-primary` | redis:8-alpine | Redis master (R/W) | — |
| `redis-replica` | redis:8-alpine | Redis replica (R only) | — |
| `redis-sentinel-1/2/3` | redis:8-alpine | Sentinel, quorum 2/3 | — |
| `db-primary` | postgres:17 | PostgreSQL primary (writes) | 5432 |
| `db-secondary` | postgres:17 | PostgreSQL replica 1 (reads) | 5433 |
| `db-secondary-2` | postgres:17 | PostgreSQL replica 2 (reads) | 5434 |
| `db-read-lb` | haproxy:3.0 | PostgreSQL read load balancer | 5435, 8404 |
| `minio-lb` | nginx:alpine | MinIO round-robin load balancer | 9000, 9001 |
| `minio-1` | minio/minio | MinIO node 1 (distributed, 2 drives) | — |
| `minio-2` | minio/minio | MinIO node 2 (distributed, 2 drives) | — |
| `pgadmin` | dpage/pgadmin4 | PostgreSQL web UI | 5050 |
| `prometheus` | prom/prometheus | Metrics collection & storage | 9090 |
| `grafana` | grafana/grafana-oss | Metrics dashboards | 3002 |
| `postgres-exporter` | prometheuscommunity/postgres-exporter | PostgreSQL metrics exporter | — |
| `redis-exporter` | oliver006/redis_exporter | Redis metrics exporter | — |
| `nginx-exporter` | nginx/nginx-prometheus-exporter | nginx metrics exporter | — |
| `ollama-1` | ollama/ollama | Local LLM inference node 1 (llama3.2:3b) | — |
| `ollama-2` | ollama/ollama | Local LLM inference node 2 (llama3.2:3b) | — |
| `ollama-lb` | nginx:alpine | Ollama round-robin load balancer | 11434 |
| `ollama-setup` | ollama/ollama | One-time model pull (exits after completion) | — |

---

## Startup order

```text
redis-primary  db-primary  minio-1  minio-2  rabbitmq   ollama-1  ollama-2
      │              │          └────┘           │              └────┘
      ▼              ▼          minio-lb          │            ollama-lb
redis-replica   db-secondary                     │           ollama-setup
      │         db-secondary-2                   │                │
      ▼              │                           │                │ (model pull, exits)
redis-sentinel ×3    ▼                           │
      │          db-read-lb                      │
      ▼              │                           │
  redis-lb           │                           │
      └──────┬────────┴──────┬────────────────────┘
             ▼             minio-lb
          api  api-2
             │
          web  web-2
             │
          app-lb
```

---

## Endpoints

| URL | Description |
| --- | --- |
| <http://localhost:3000> | Frontend (via nginx LB) |
| <http://localhost:3001> | API (via nginx LB) |
| <http://localhost:3001/docs> | Interactive API docs (Swagger UI) |
| <http://localhost:8080/nginx-status> | nginx load balancer stats |
| <http://localhost:8404> | HAProxy stats — PostgreSQL read LB |
| <http://localhost:8405> | HAProxy stats — Redis LB |
| <http://localhost:9000> | MinIO S3 API (via nginx LB) |
| <http://localhost:9001> | MinIO Console (via nginx LB) |
| <http://localhost:5050> | pgAdmin — PostgreSQL web UI |
| `localhost:5432` | PostgreSQL primary (writes) |
| `localhost:5433` | PostgreSQL replica 1 |
| `localhost:5434` | PostgreSQL replica 2 |
| `localhost:5435` | PostgreSQL reads via LB |
| `localhost:6379` | Redis via LB |
| <http://localhost:15672> | RabbitMQ Management UI |
| <http://localhost:9090> | Prometheus |
| <http://localhost:3002> | Grafana dashboards |
| <http://localhost:3001/metrics> | NestJS Prometheus metrics |
| <http://localhost:11434> | Ollama API (via nginx LB) |

---

## Default credentials

| Service | URL | Username | Password |
| --- | --- | --- | --- |
| Grafana | <http://localhost:3002> | `admin` | `admin` |
| RabbitMQ | <http://localhost:15672> | `guest` | `guest` |
| MinIO | <http://localhost:9001> | `minioadmin` | `minioadmin123` |
| pgAdmin | <http://localhost:5050> | `admin@admin.com` | `admin` |
| PostgreSQL | `localhost:5432` | `postgres` | `postgres` |
| Redis | `localhost:6379` | — | *(no auth)* |

---

## Usage

### Start / Stop

```bash
# Mac / Linux
./start-mac.sh
./stop-mac.sh

# Windows
start-win.bat
stop-win.bat
```

Skriptid käivitavad alati `docker-compose.dev.yml` overlay'ga (hot reload, volume mounts). GPU tuvastatakse automaatselt — kui `nvidia-smi` on kättesaadav ja töötab, lisatakse `docker-compose.gpu.yml` override (Ollama GPU kiirendus). Ilma NVIDIA GPU-ta käib Ollama CPU peal.

### Rebuild (force fresh images)

Rebuilds all images from scratch (`--no-cache`) — use this when `node_modules`, Dockerfiles, or base images change and cached layers would produce a stale result.

```bash
# Mac / Linux
./rebuild-mac.sh

# Windows
rebuild-win.bat
```

### Logs

```bash
docker compose logs -f               # all services
docker compose logs -f api api-2     # API only
docker compose logs -f app-lb        # nginx LB
```

---

## Testing

Projektil on kaks eraldi testistrateegiat: **unit testid** (ilma väliste sõltuvusteta) ja **E2E testid** (päris Docker stacki vastu).

---

### Unit testid — Backend (Jest)

Backend unit testid kasutavad [Jest](https://jestjs.io) + `@nestjs/testing` raamistikku. Kõik välised sõltuvused (andmebaas, RabbitMQ, MinIO, e-post) on mockitud — testid töötavad ilma Docker stackita.

#### Jest käivitamine

```bash
cd backend
npm test                # käivita kõik testid ühe korra
npm run test:watch      # watch-režiim (jookseb uuesti muutustel)
npm run test:coverage   # testid + katvusraport (backend/coverage/)
```

#### Testide struktuur

```text
backend/src/
  notes/
    notes.service.spec.ts      # NotesService — findAll, findOne, create, remove, sendByEmail
    notes.controller.spec.ts   # NotesController — create (sessioon), sendByEmail, remove
  users/
    users.service.spec.ts      # UsersService — CRUD, verify email, resend verification, parool
    users.controller.spec.ts   # UsersController — create, update, remove (self-delete kaitse), verify redirect
  search/
    search.service.spec.ts     # SearchService — tühi päring, tulemustest, väljad
  files/
    files.service.spec.ts      # FilesService — upload, remove, removeAllForNote, withUrls
  mail/
    mail.service.spec.ts       # MailService — kõik meilimallid ja manused
  chat/
    chat.service.spec.ts       # ChatService — tööriistade dispatcher, stream, Ollama mock
  messaging/
    messaging.service.spec.ts  # MessagingService — publish, sõnumite tarbimine, toast vs notesChanged
```

---

### Unit testid — Frontend (Vitest)

Frontend unit testid kasutavad [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) raamistikku. Next.js spetsiifilised moodulid (`next/navigation`, `next/cache` jne) on mockitud — testid töötavad ilma Next.js serverita.

#### Vitest käivitamine

```bash
# projekti juurkataloogist
npm run test:unit           # käivita kõik unit testid ühe korra
npm run test:unit:watch     # watch-režiim
npm run test:unit:coverage  # testid + katvusraport (coverage/)
```

#### Frontend testide struktuur

```text
src/__tests__/
  setup.ts                            # @testing-library/jest-dom seadistus
  i18n/
    translations.test.ts              # Translations — struktuuri, keeled, kategooriad, locale koodid
  context/
    LanguageContext.test.tsx          # LanguageProvider — default locale, setLocale, localStorage persist
  components/
    DeleteButton.test.tsx             # DeleteButton — render, click → deleteNote, toast
    NoteCard.test.tsx                 # NoteCard — pealkiri, sisu, autor, kategooria, failid
    LoginDialog.test.tsx              # LoginDialog — login/register vaated, validatsioon, submit
    GlobalSearch.utils.test.ts        # GlobalSearch puhased utiliidid: escapeRegExp, getSnippet
  actions.test.ts                     # Server actions — createNote (validatsioon), sendNote, error handling
```

---

### E2E testid — Playwright

End-to-end testid jooksevad [Playwright](https://playwright.dev) abil päris Docker stacki vastu (`http://localhost:3000`).

#### Eeldused

Docker stack peab olema käivitatud enne E2E testide jooksutamist:

```bash
# Windows
start-win.bat

# Mac / Linux
./start-mac.sh
```

#### Playwright käivitamine

| Käsk | Kirjeldus |
| --- | --- |
| `npm test` | Jookseb kõik E2E testid terminalis |
| `npm run test:ui` | Interaktiivne Playwright UI aken (testi valimine, trace, screenshots) |
| `npm run test:report` | Jookseb testid + avab HTML raporti brauseris (`localhost:9323`) |
| `npx playwright show-report` | Avab viimase raporti brauseris ilma teste uuesti jooksutamata |

#### E2E testide struktuur

```text
tests/
  helpers.ts          # API abifunktsioonid (createTestUser, deleteTestUser)
  home.spec.ts        # Avaleht — märkmete CRUD, kategooria, pinnitud
  navigation.spec.ts  # TopBar, navigatsioon, hamburgermenüü, README drawer
  auth.spec.ts        # Login/logout, vale parool, dialoog
  users.spec.ts       # Kasutajate haldus, kustutamise kinnitamine
```

Testid loovad ja koristavad testikasutaja (`playwright@test.local`) automaatselt `beforeAll`/`afterAll` haakides.

---

## High Availability

### Redis — Sentinel failover

Three Sentinel instances monitor `redis-primary`. If the primary becomes unreachable for **5 seconds**, a majority vote (2 of 3) triggers automatic failover:

1. Sentinel promotes `redis-replica` → new master
2. HAProxy detects the role change via `INFO` → `role:master` health check (within ~4 s)
3. All traffic routes to the promoted node — no application changes needed
4. When the old primary recovers, Sentinel re-attaches it as a replica

### PostgreSQL — streaming replication

`db-primary` streams WAL to two replicas. Reads are distributed round-robin across both replicas via `db-read-lb`. Writes always go to the primary. Replica lag is near-zero under normal load.

### MinIO — distributed mode

Two MinIO nodes run in distributed mode with 2 drives each (4 drives total), satisfying the minimum erasure coding requirement (EC:2). Data is striped and parity-protected across all drives:

- Any single node or drive can fail without data loss
- Both nodes serve read and write requests; `minio-lb` (nginx) distributes traffic round-robin
- If one node is unavailable, the other continues to serve all data

### Web & API — horizontal scaling

`app-lb` (nginx) distributes HTTP requests round-robin across two instances of each service. Both tiers are stateless:

- **Web (Next.js):** browser-side API calls load-balance via `app-lb:3001`; server-side calls go directly to `api`
- **API (NestJS):** sessions stored in Redis, so any instance handles any request

### WebSocket & RabbitMQ

Both API instances subscribe to the `notes_events` fanout exchange on startup (each with its own exclusive, auto-delete queue). When any instance publishes an event, RabbitMQ delivers the message to every subscriber. Each instance then broadcasts the event to its own connected WebSocket clients — ensuring all browser clients receive real-time updates regardless of which API instance handled the mutation.

**Event types** (JSON payload published to the fanout exchange):

| `type` | Payload | Browser effect |
| --- | --- | --- |
| *(any non-JSON / legacy)* | raw string | `notes:changed` → page refresh |
| `notes:changed` | `{ type }` | page refresh |
| `toast` | `{ type, message, severity }` | MUI Snackbar toast |

Toasts can also be pushed directly without RabbitMQ by calling `EventsGateway.notifyToast()` on any API instance — this reaches only the clients connected to that instance. For cross-instance broadcast use `MessagingService.publish()`.

### Observability — Prometheus & Grafana

Every service exposes metrics which Prometheus scrapes every 15 seconds and retains for 7 days. Grafana (port 3002) auto-provisions a "Ground Zero" dashboard on first start.

**Metrics sources:**

| Exporter | Source | Scrape target |
| --- | --- | --- |
| NestJS `prom-client` | HTTP request rate & latency, Node.js heap | `api:3001/metrics`, `api-2:3001/metrics` |
| `postgres-exporter` | PostgreSQL connections, query stats | `postgres-exporter:9187` |
| `redis-exporter` | Redis memory, hit rate, connected clients | `redis-exporter:9121` |
| RabbitMQ built-in | Queue depth, message rates | `rabbitmq:15692/metrics` |
| `nginx-exporter` | nginx active connections, request rate | `nginx-exporter:9113` |

The NestJS `/metrics` endpoint is a raw Express route registered before the `/api` global prefix, so it is reachable at `http://localhost:3001/metrics` without an `/api` prefix.

---

## Authentication

Authentication is handled by [Better Auth](https://www.better-auth.com) (`v1.6.20`), mounted as Express middleware before NestJS routing at `/api/auth/*`.

**Methods:**

| Method | Description |
| --- | --- |
| Email / password | Registration and login via `POST /api/auth/sign-in/email` |
| Google OAuth | Social sign-in via `GET /api/auth/sign-in/social?provider=google` |
| Password reset | Email link sent by `POST /api/auth/request-password-reset`; token redeemed at `/reset-password` |

**Google OAuth setup:**

1. Create OAuth 2.0 credentials in [Google Cloud Console](https://console.cloud.google.com)
2. Add authorized redirect URI: `http://localhost:3001/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the root `.env` file (Docker) and/or `backend/.env` (local dev)

Google provider is activated conditionally — if either variable is absent, only email/password is available.

**Sessions** are cookie-based (`gz.session_token`), stored in PostgreSQL via the Prisma adapter. Secure cookies are enabled in production (`NODE_ENV=production`).

### User Roles

Every user account has a role: `USER` (Tavakasutaja) or `ADMIN` (Admin).

| Rule | Detail |
| --- | --- |
| Self-registration | Always creates a `USER` — role cannot be chosen during registration |
| First user | If the system has **no users yet**, the first registration automatically receives `ADMIN` and the role is locked |
| Admin creates user | Admins can set the role to `USER` or `ADMIN` when creating a user via the Users admin panel |
| Changing roles | Only an `ADMIN` can change another user's role (`PATCH /api/users/:id/role`) |
| Self-role change | Admins cannot change their **own** role |
| Last admin protection | Demoting the only remaining admin to `USER` is blocked |
| Frontend access | The `/users` page and all user-management actions are restricted to admins; non-admins see a warning |

---

## Backend

### NestJS modules

| Module | Controllers | Services | Responsibility |
| --- | --- | --- | --- |
| **AppModule** | `AppController` | — | Root module; registers all feature modules; configures Winston logging, global validation pipe, Prometheus interceptor |
| **PrismaModule** *(global)* | — | `PrismaService` | PostgreSQL ORM; exposes `read` (replica via `DATABASE_REPLICA_URL`) and `write` (primary via `DATABASE_URL`) clients |
| **AuthModule** | — (middleware) | — | Mounts [Better Auth](https://www.better-auth.com) at `/api/auth/*`; email/password + Google OAuth; Prisma session adapter |
| **UsersModule** | `UsersController` | `UsersService` | User CRUD, email verification flow, profile & chat history updates; role management (`USER`/`ADMIN`) |
| **NotesModule** | `NotesController` | `NotesService` | Notes CRUD with category and pinning; email delivery of notes; broadcasts mutations via RabbitMQ |
| **FilesModule** | `FilesController` | `FilesService` | Multipart file upload/download/delete; max 10 MB; files stored in MinIO; signed URLs for downloads |
| **ChatModule** | `ChatController` | `ChatService` | Streaming LLM chat via Ollama; RAG context injection; tool-calling loop (max 6 iterations) |
| **SearchModule** | `SearchController` | `SearchService` | Full-text search across notes (title, content) and users (name, email) |
| **StorageModule** *(global)* | — | `StorageService` | S3-compatible MinIO wrapper; bucket initialisation; presigned URL generation |
| **MessagingModule** *(global)* | — | `MessagingService` | RabbitMQ `notes_events` fanout exchange; publishes and consumes cross-instance events |
| **EventsModule** *(global)* | — | `EventsGateway` | Socket.io WebSocket gateway; emits `notesChanged` and `toast` events to connected clients |
| **MailModule** *(global)* | — | `MailService` | Nodemailer + Handlebars templates; SMTP / Mailpit depending on environment |

### API routes

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/hello` | Health check (returns status + timestamp) |
| `GET` | `/api/notes` | List all notes (includes signed file URLs) |
| `GET` | `/api/notes/:id` | Fetch single note |
| `POST` | `/api/notes` | Create note |
| `PATCH` | `/api/notes/:id` | Update note |
| `DELETE` | `/api/notes/:id` | Delete note (cascades to files) |
| `POST` | `/api/notes/:id/send` | Email note content + attachments to recipient |
| `POST` | `/api/notes/:noteId/files` | Upload file to note (multipart, max 10 MB) |
| `DELETE` | `/api/notes/:noteId/files/:fileId` | Delete note file |
| `GET` | `/api/users` | List all users |
| `GET` | `/api/users/:id` | Fetch user profile (includes `chatInputHistory`) |
| `POST` | `/api/users` | Create user (admin can set `role`; first user is always `ADMIN`) |
| `PATCH` | `/api/users/:id` | Update user (profile fields + `chatInputHistory`) |
| `PATCH` | `/api/users/:id/role` | Update user role — admin only; cannot change own role; last admin protected |
| `DELETE` | `/api/users/:id` | Delete user (forbidden if self) |
| `POST` | `/api/users/resend-verification` | Resend email verification link |
| `GET` | `/api/users/verify-email` | Email verification redirect |
| `POST` | `/api/chat` | Streaming LLM chat with tool-calling |
| `GET` | `/api/search?q=` | Full-text search across notes and users |
| `GET` | `/metrics` | Prometheus metrics (HTTP request counts and latencies) |
| `*` | `/api/auth/*` | Better Auth — sign-in, sign-up, session, OAuth callback |
| `GET` | `/docs` | Swagger UI — interactive API documentation |

### Key backend packages

| Package | Version | Purpose |
| --- | --- | --- |
| `@nestjs/core` | ^11 | Framework runtime |
| `@nestjs/platform-express` | ^11 | Express HTTP adapter |
| `@nestjs/websockets` + `@nestjs/platform-socket.io` | ^11 | WebSocket / Socket.io |
| `@nestjs/swagger` | ^11 | OpenAPI docs generation |
| `prisma` + `@prisma/client` | ^7.8 | PostgreSQL ORM with read/write splitting |
| `better-auth` | ^1.6 | Auth (email/password + Google OAuth, session management) |
| `connect-redis` + `redis` | ^9 / ^6 | Redis session store |
| `amqplib` | ^2 | RabbitMQ AMQP client |
| `socket.io` | ^4.8 | WebSocket server |
| `@aws-sdk/client-s3` | ^3 | MinIO S3-compatible client |
| `@nestjs-modules/mailer` + `nodemailer` | ^2.3 / ^9 | Email sending with Handlebars templates |
| `nest-winston` + `winston` | ^1.10 / ^3 | Structured logging |
| `prom-client` | ^15 | Prometheus metrics |
| `class-validator` + `class-transformer` | ^0.15 | DTO validation |

---

## Frontend features

### Pages

| Route | Description |
| --- | --- |
| `/` | Notes list with create form |
| `/notes/[id]` | Note detail view |
| `/users` | User management — **admin only** |
| `/users/[id]` | User detail view |
| `/chat` | AI chat with RAG context, tool-calling, and session input history |
| `/profile` | Authenticated user's profile (read-only) |
| `/reset-password` | Password reset (token from email) |

### Global search

A full-text search dialog searches across both notes and users simultaneously.

- Open with the **search icon** in the top bar
- Results are grouped by type (Notes / Users) and limited to 5 per group
- Matching text is highlighted inline; note snippets show context around the match
- Navigate results with **↑ / ↓** arrow keys and confirm with **Enter**
- Clicking a note navigates to `/notes/[id]`; clicking a user navigates to `/users/[id]`

**API endpoint:** `GET /api/search?q=<query>` — returns `{ notes: [...], users: [...] }`. Notes are matched against `title` and `content`; users against `firstName`, `lastName`, and `email` (all case-insensitive).

### Toast notifications

MUI `Snackbar` + `Alert` toast system via `ToastProvider` context.

**Client-side** (immediate feedback after user actions):

| Action | Toast |
| --- | --- |
| Note created | "Märge salvestatud" (success, green) |
| Note deleted | "Märge kustutatud" (error, red) |
| File deleted | "Fail kustutatud" (error, red) |

**Server-side push** (via WebSocket, see [WebSocket & RabbitMQ](#websocket--rabbitmq) above):

```typescript
// Direct (single instance, all its connected clients)
this.events.notifyToast("Teade", "warning");

// Via RabbitMQ (all instances → all connected clients)
this.messaging.publish(JSON.stringify({
  type: "toast",
  message: "Teade kõigile",
  severity: "info",   // success | error | info | warning
}));
```

---

## AI Chat

The `/chat` page connects to a local LLM running in Docker — no external API keys required. The AI has live read access to the database and can create, update, and delete both notes and users.

### Chat arhitektuur

```text
Browser → POST /api/chat (NestJS)
               │
               ├─ 1. Build system prompt (live DB snapshot)
               │
               ▼
        ollama-lb (nginx, :11434)          stream: false (tool detection)
         round-robin
        ┌──────┴──────┐
        ▼             ▼
    ollama-1      ollama-2
  llama3.2:3b   llama3.2:3b

        if tool_calls in response:
               │
               ├─ execute tool (Prisma write DB)
               ├─ rebuild system prompt (fresh DB snapshot)
               └─ loop (max 6 iterations)

        else: stream plain text response to browser
```

### RAG context injection

Before every request NestJS fetches all notes and users from the database and injects them as a system prompt. This gives the model an accurate, up-to-date view of the data without any vector search or embeddings.

```text
NOTES — exactly N total:
  [id:1] "Title" — Author Name (category, pinned)
  Content preview (first 300 chars)…

USERS — exactly N total:
  [id:abc] First Last <email@example.com> joined 2025-01-01
```

The system prompt also instructs the model to answer only from this data (no hallucination), to match the user's language, and to use tools when mutations are requested.

### Tool-calling

The model can call six tools to mutate data. Tool execution is handled entirely server-side — the browser only sees the final text response.

| Tool | Description | Required arguments |
| --- | --- | --- |
| `create_note` | Create a new note | `title`, `content` |
| `update_note` | Update an existing note (partial) | `id` |
| `delete_note` | Permanently delete a note | `id` |
| `create_user` | Create a user with a generated temp password | `firstName`, `lastName`, `email` |
| `update_user` | Update an existing user (partial) | `id` |
| `delete_user` | Permanently delete a user | `id` |

**Request/response cycle (tool path):**

1. NestJS sends `{ model, system, messages, tools, stream: false }` to Ollama
2. Ollama returns a message with `tool_calls` instead of plain text
3. NestJS executes each tool call against the write database via Prisma
4. The tool result is appended to the message history as `role: "tool"`
5. The system prompt is rebuilt to reflect the updated data
6. NestJS loops back to step 1 — up to **6 iterations** per request
7. Once Ollama returns a plain text response (no `tool_calls`), it is written to the HTTP response and the connection is closed

**Example conversation:**

> **User:** Lisa uus märge pealkirjaga "Koosolek" ja sisuga "Arutada Q3 plaane"
>
> **AI (internally):** calls `create_note({ title: "Koosolek", content: "Arutada Q3 plaane" })`
>
> **AI (to user):** Märge "Koosolek" on edukalt loodud (id: 42).

### Input history

The chat input field keeps a persistent per-user history of sent messages (up to 50 entries), stored in the database and loaded on sign-in.

| Interaction | Behaviour |
| --- | --- |
| **↑** (cursor at start) | Fill input with the previous message |
| **↑** (repeatedly) | Walk further back through history |
| **↓** | Walk forward; restores the draft on reaching the end |
| **Click a chip** | The last 12 entries are shown as clickable chips above the input — click any to pre-fill it |
| Typing after navigation | Exits history navigation; chip list stays visible |

History is saved server-side (`PATCH /api/users/:id` → `chatInputHistory` column) and survives page reloads, browser restarts, and multiple devices.

### Model

Default model: `llama3.2:3b` (~2 GB). Runs on CPU; GPU-accelerated if available. Replace with any tool-calling-capable model from [ollama.com/library](https://ollama.com/library) by changing `OLLAMA_MODEL` in `docker-compose.yml` and re-running `ollama-setup`.

```bash
# Pull a different model manually
docker exec ground-zero-ollama-1-1 ollama pull <model>
docker exec ground-zero-ollama-2-1 ollama pull <model>
```

> **Note:** Tool-calling requires a model that supports the Ollama `tools` API (e.g. `llama3.2`, `mistral-nemo`, `qwen2.5`). Smaller models like `qwen2:0.5b` do not support tool-calling.

### Environment variables (AI)

| Variable | Default | Description |
| --- | --- | --- |
| `OLLAMA_URL` | `http://ollama-lb:11434` | Ollama endpoint (API containers) |
| `OLLAMA_MODEL` | `llama3.2:3b` | Default model used when none is specified in the request |
| `NEXT_PUBLIC_OLLAMA_MODEL` | `llama3.2:3b` | Model name shown in the chat UI |

---

## Frontend stack

| Package | Version | Purpose |
| --- | --- | --- |
| `next` | 16.2.9 | React framework (App Router, SSR) |
| `react` | 19.2.4 | UI runtime |
| `@mui/material` + `@mui/icons-material` | ^9.1 | Material Design component library |
| `@emotion/react` + `@emotion/styled` | ^11 | CSS-in-JS (MUI peer dep) |
| `tailwindcss` | ^4 | Utility-first CSS |
| `better-auth` | ^1.6 | Auth client (pairs with backend session) |
| `socket.io-client` | ^4.8 | WebSocket client for real-time note events |
| `react-markdown` + `remark-gfm` | ^10 / ^4 | Markdown rendering |
| `@playwright/test` | ^1.61 | End-to-end testing |

---

## Development notes

In `--dev` mode (`docker-compose.dev.yml` overlay):

- Source directories are mounted as volumes — changes take effect without rebuild
- `web` and `web-2` run with `Dockerfile.dev` (Next.js dev server with hot reload)
- `api` and `api-2` run with `Dockerfile.dev` (NestJS with watch mode)
- PostgreSQL has verbose query logging enabled (`log_statement=all`)

---

## Environment variables (API)

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://...@db-primary:5432/groundzero` | Write connection |
| `DATABASE_REPLICA_URL` | `postgresql://...@db-read-lb:5432/groundzero` | Read connection |
| `REDIS_URL` | `redis://redis-lb:6379` | Redis via load balancer |
| `MINIO_ENDPOINT` | `http://minio-lb:9000` | Object storage (via LB) |
| `SESSION_SECRET` | `change-me-in-production` | **Change before deploying** |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `RABBITMQ_URL` | `amqp://guest:guest@rabbitmq:5672` | RabbitMQ connection URL |
| `APP_URL` | `http://localhost:3000` | Frontend base URL (used in password reset emails) |
| `BETTER_AUTH_URL` | *(derived from `APP_URL`)* | Override for Better Auth base URL |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID (optional; enables Google sign-in) |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth client secret |
| `MAIL_HOST` | `localhost` | SMTP server host |
| `MAIL_PORT` | `1025` | SMTP server port (1025 = Mailpit in dev) |
| `MAIL_SECURE` | `false` | Use TLS (`true`/`false`) |
| `MAIL_USER` | — | SMTP username (optional) |
| `MAIL_PASS` | — | SMTP password (optional) |
| `MAIL_FROM` | `noreply@localhost` | From address for outgoing emails |
| `OLLAMA_URL` | `http://ollama-lb:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `llama3.2:3b` | Default LLM model |

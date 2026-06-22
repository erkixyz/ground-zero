# Ground Zero

Full-stack web application with a highly available, load-balanced container infrastructure.

**Stack:** Next.js (frontend) · NestJS (API) · PostgreSQL · Redis · MinIO · RabbitMQ

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

---

## Startup order

```text
redis-primary  db-primary  minio-1  minio-2  rabbitmq
      │              │          └────┘           │
      ▼              ▼          minio-lb          │
redis-replica   db-secondary                     │
      │         db-secondary-2                   │
      ▼              │                           │
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

### Production

```bash
# Mac / Linux
./start-mac.sh
./stop-mac.sh

# Windows
start-win.bat
stop-win.bat
```

### Development

```bash
# Mac / Linux — mounts source into containers, enables hot reload
./start-mac.sh --dev
./stop-mac.sh

# Windows
start-win.bat --dev
stop-win.bat
```

### Logs

```bash
docker compose logs -f               # all services
docker compose logs -f api api-2     # API only
docker compose logs -f app-lb        # nginx LB
```

---

## Testing

End-to-end tests run with [Playwright](https://playwright.dev) against the running Docker stack (`http://localhost:3000`).

### Käivitamine

| Käsk | Kirjeldus |
| --- | --- |
| `npm test` | Jookseb kõik testid terminalis, genereerib HTML raporti |
| `npm run test:ui` | Interaktiivne Playwright UI aken (testi valimine, trace, screenshots) |
| `npm run test:report` | Jookseb testid + avab HTML raporti brauseris (`localhost:9323`) |
| `npx playwright show-report` | Avab viimase raporti brauseris ilma teste uuesti jooksutamata |

### Testide struktuur

```text
tests/
  helpers.ts          # API abifunktsioonid (createTestNote, createTestUser, …)
  home.spec.ts        # Avaleht — märkmete CRUD, kategooria, pinnitud
  navigation.spec.ts  # TopBar, navigatsioon, hamburgermenüü, README drawer
  auth.spec.ts        # Login/logout, vale parool, dialoog
  users.spec.ts       # Kasutajate haldus, kustutamise kinnitamine
```

### Eeldused

Docker stack peab olema käivitatud (`start-win.bat` / `start-mac.sh`) enne testide jooksutamist. Testid loovad ja koristasid testikasutaja (`playwright@test.local`) automaatselt `beforeAll`/`afterAll` haakides.

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

---

## Frontend features

### Pages

| Route | Description |
| --- | --- |
| `/` | Notes list with create form |
| `/users` | User management |
| `/profile` | Authenticated user's profile (read-only) |
| `/reset-password` | Password reset (token from email) |

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
| `MAIL_PORT` | `1025` | SMTP server port (1025 = MailHog in dev) |
| `MAIL_SECURE` | `false` | Use TLS (`true`/`false`) |
| `MAIL_USER` | — | SMTP username (optional) |
| `MAIL_PASS` | — | SMTP password (optional) |
| `MAIL_FROM` | `noreply@localhost` | From address for outgoing emails |

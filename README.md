# ListedWheels 🚗 🏍️ 🚲

> Trust-focused marketplace for verified used cars, bikes, and cycles across India.

---

## 🏗️ Architecture Overview

The system follows a strict 3-tier backend architecture:
- **API Routes**: HTTP layer, request/response validation with Pydantic schemas, dependency-based authentication and role enforcement.
- **Services**: Business rules, pricing calculations in integer paise, promo code logic, status transitions, external API integrations (Razorpay, S3, SES).
- **Repositories**: SQL queries using SQLAlchemy Core / asyncpg, parameterised queries.

---

## 📁 Project Structure

```
listedwheels/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entrypoint, lifespan, CORS, error handlers
│   │   ├── core/                    # config.py, security.py, errors.py, logging.py
│   │   ├── api/                     # deps.py, routes/ (auth, users, listings, media, payments, promos, reviews, reports, admin)
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── services/                # Domain business logic
│   │   ├── repositories/            # SQL query repositories
│   │   ├── clients/                 # External service clients (razorpay, s3, email, google_auth)
│   │   └── db/                      # session.py, migrations/
│   ├── tests/
│   │   ├── unit/                    # Fast unit tests
│   │   └── integration/             # Database & route integration tests
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── app/                         # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   ├── components/
│   │   ├── ui/                      # Reusable UI design system components
│   │   └── domain/                  # Vehicle listing, filters, checkout domain components
│   ├── lib/                         # Utilities (utils.ts, api.ts)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts           # Design tokens (ink-900, accent-500 saffron, paper, etc.)
│   └── .env.example
├── docker-compose.yml               # Local PostgreSQL 16 service
├── .gitignore
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### 1. Start Local Database (PostgreSQL 16)
```bash
docker compose up -d
```

### 2. Run FastAPI Backend
```bash
cd backend
# Optional: create & activate virtual environment
# python -m venv .venv && .venv\Scripts\activate

uvicorn app.main:app --reload --port 8000
```
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)
- Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- OpenAPI Spec: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

### 3. Run Next.js Frontend
```bash
cd frontend
npm run dev
```
- Web App: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing Backend
```bash
cd backend
python -m pytest tests/unit/test_health.py -v
```

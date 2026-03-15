# BlockCred

**BlockCred** is a cost-efficient credential management system for educational institutions. It provides **tamper-evident, verifiable certificates** using **cryptographic signatures**, an **append-only transparency log (Merkle tree)**, and **IPFS** for decentralized file storage—without requiring live blockchain infrastructure.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Features & Functionality](#features--functionality)
- [User Roles & Permissions](#user-roles--permissions)
- [Certificate Types](#certificate-types)
- [Application Flows](#application-flows)
- [API Reference](#api-reference)
- [Frontend Routes](#frontend-routes)
- [Project Structure](#project-structure)
- [Setup & Configuration](#setup--configuration)
- [Quick Start](#quick-start)
- [Security](#security)
- [Documentation](#documentation)

---

## Overview

BlockCred allows:

- **Students** to register, get approved, and view/share their digital certificates.
- **Issuing authorities** (COE, Faculty, Club coordinators) to issue marksheets, degree certificates, Bonafide, NOC, and participation certificates.
- **Admins** to manage users, roles, departments, credential types, and approve students.
- **Student verifiers** to approve students and manage student-facing verification workflows.
- **External verifiers** and anyone with a certificate ID to verify authenticity via cryptographic proofs and Merkle verification.
- **Bulk data**: upload courses and result details via Excel for use in issuance.

Certificates are **signed by the issuer**, appended to a **transparency log**, and stored on **IPFS**; verification uses signature check + Merkle proof—no blockchain in the active code path.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Go 1.21+, Gorilla Mux, MongoDB (with in-memory fallback) |
| **Auth** | JWT (HS256), bcrypt password hashing |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| **Storage** | MongoDB (metadata + proofs), IPFS via Pinata (files + signed documents) |
| **Integrity** | Ed25519/ECDSA signatures, SHA-256 hashes, Merkle tree (transparency log) |
| **Tools** | Biome (lint/format), Air (backend hot-reload), Lucide React, react-dropzone, xlsx, qrcode.react |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js 15)                       │
│  Role-based dashboards, verification UI, Excel upload        │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (JWT where required)
┌──────────────────────────▼──────────────────────────────────┐
│                    BACKEND (Go)                              │
│  Auth · Users · Certificates · Credentials · Dashboard       │
│  RBAC (roles, departments, credential-types) · Courses       │
│  CryptographicService · TransparencyLogService · IPFSService  │
└──────┬──────────────────┬──────────────────┬────────────────┘
       │                  │                  │
┌──────▼──────┐   ┌───────▼───────┐   ┌──────▼──────┐
│  MongoDB    │   │  IPFS (Pinata)│   │ (Optional   │
│  Users,     │   │  PDFs, signed │   │  blockchain │
│  Certs,     │   │  documents    │   │  anchor)    │
│  RBAC data  │   │               │   │  not wired  │
└─────────────┘   └───────────────┘   └─────────────┘
```

- **Certificate issuance**: Validate issuer/student → hash file & metadata → upload to IPFS → sign document → append to transparency log → store certificate (with signatures, Merkle path, IPFS URLs) in MongoDB.
- **Verification**: Load certificate → verify issuer signature → verify Merkle proof against current log root → return result (valid/revoked/invalid).

---

## Features & Functionality

### Authentication & Users

- **Login**: Email/username + password → JWT; redirect by role using `dashboard_route` (e.g. `/admin`, `/coe`, `/student`).
- **Student registration**: Self-service or admin-created; optional photo and 12th marksheet; KYC-style fields (name, DOB, father name, Aadhar, 10th/12th school & marks, cutoff, department). New students are inactive until approved.
- **Admin onboarding**: Create COE, department faculty, club coordinators (and other roles) with role, department/institution/club as needed.
- **User management**: List, approve, update, delete users (admin); list filtered by role, department, search.

### Role-Based Access Control (RBAC)

- **Roles**: CRUD for roles (name, permissions, `dashboard_route`). Roles define who can onboard, issue which credential types, approve students, manage users, etc.
- **Departments**: CRUD for departments (used for filtering students and for faculty/club scope).
- **Credential types**: CRUD for credential-type configs (used by issuance UI and permissions).
- **Public endpoints**: `/api/public/departments`, `/api/public/credential-types` for dropdowns without auth.
- **Issuer config**: Issuers can list allowed credential types for their role.

### Certificates (DApp Model)

- **Issue**: Upload PDF + metadata (student, cert type, course/semester/CGPA, etc.) → backend hashes file, uploads to IPFS, signs document, appends to transparency log, stores full record in MongoDB.
- **List**: All certificates (admin), by student ID, by current issuer.
- **Verify**: Public endpoint by `cert_id`; returns validity, signature status, Merkle proof status, IPFS links, revocation.
- **Revoke / Delete**: Revoke or delete certificate (admin/authorized).
- **Public student profile**: `/api/public/student/{student_id}` for share page and wallet view.

### Legacy Credentials

- **Issue / List**: Simpler credential issue and list endpoints (no crypto/Merkle); still available for backward compatibility.

### Dashboard & Data

- **Dashboard stats**: Counts for users, students, pending approvals, credentials (for admin overview).
- **Student detail**: Get student + certificates; get student credentials aggregate.
- **Courses & results**: Upload courses (course code, title, semester, credit) and result details via Excel (`/api/courses`, `/api/result-details`) for use in issuance.

### Frontend-Specific

- **Add Result**: Page to upload Excel for courses and result details (parses sheets, preview, submit).
- **Student Verifier dashboard**: Approve students, view/edit/delete users, filters (department, approval, active, student ID, semester, graduation year).
- **Share & verify**: Public share URL by `student_id`; public verify page by `cert_id` or QR; wallet-style shareable profile with QR.

---

## User Roles & Permissions

| Role | Description | Typical dashboard_route | Key permissions |
|------|-------------|-------------------------|------------------|
| **ssn_main_admin** | Full system control | `/admin` | Onboard, manage users, roles, departments, credential types, approve students, view all credentials, issue all cert types |
| **coe** | Controller of Examinations | `/coe` | Issue marksheet, degree; verify; view credentials |
| **department_faculty** | Department faculty | `/faculty` | Issue Bonafide, NOC; verify |
| **club_coordinator** | Club coordinator | `/club` | Issue participation certificates; verify |
| **external_verifier** | External verifier | `/verifier` | Verify credentials only |
| **student_verifier** | Student verifier | `/student-verifier` | Approve students, read-only |
| **student** | Student | `/student` | View own profile and certificates |

Redirect after login uses the role’s `dashboard_route` from the backend; if unset, users land on `/dashboard`, which can redirect to the configured route.

---

## Certificate Types

- **marksheet** – Semester marksheets (COE)
- **degree** – Degree certificates (COE)
- **bonafide** – Bonafide certificates (Faculty)
- **noc** – No Objection Certificates (Faculty)
- **participation_cert** – Event participation (Club)
- **nft_certificate** – NFT-style certificate (if enabled)

Issuer permissions determine which types each role can issue.

---

## Application Flows

### 1. Student registration

1. Student opens `/register`, fills form (optional photo/marksheet).
2. Frontend sends `POST /api/register` (multipart or JSON).
3. Backend creates user with role `student`, `is_approved=false`, generates `student_id`.
4. Admin/student_verifier approves via `POST /api/users/{id}/approve`; student can then log in.

### 2. Admin onboarding

1. Admin logs in → redirected to `/admin` (or configured route).
2. Creates COE/Faculty/Club (or other) via “Create user” → `POST /api/admin/onboard` with role, department/club, etc.
3. New user is active and can log in and access their dashboard.

### 3. Certificate issuance (DApp)

1. Issuer (COE/Faculty/Club) logs in and opens their dashboard.
2. Fills issuance form (student, cert type, file, metadata) and submits.
3. Frontend sends `POST /api/certificates/issue` (multipart with file).
4. Backend: validate student & issuer → hash file & metadata → upload to IPFS → generate cert ID → sign document → append to transparency log → store certificate in MongoDB.
5. Frontend refreshes lists; certificate appears with IPFS link and verification info.

### 4. Certificate verification & sharing

1. Anyone can open `/verify` and enter `cert_id`, or scan QR to a verification/share URL.
2. Frontend calls `GET /api/certificates/verify/{cert_id}` (or uses public student profile).
3. Backend loads certificate, verifies signature and Merkle proof, checks revocation.
4. Frontend shows result (valid/revoked/invalid), IPFS link, issuer, timestamps, proof status.

### 5. Courses & result upload

1. Authorized user opens `/add-result`.
2. Uploads Excel: one sheet for courses (course code, title, semester, credit), one for result details.
3. Frontend parses and sends `POST /api/courses` and `POST /api/result-details`.
4. Data is stored for use in certificate issuance (e.g. course list, grades).

---

## API Reference

Base path: `/api`. Auth: `Authorization: Bearer <token>` unless noted.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | No | Login; returns JWT and user (including `dashboard_route`) |
| POST | `/register` | No | Student registration (JSON or multipart) |

### User management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Yes | List users (filters by role, department, etc.) |
| POST | `/admin/onboard` | Yes | Create issuing authority / user |
| POST | `/users/{id}/approve` | Yes | Approve pending student |
| PUT | `/admin/users/{id}` | Yes | Update user (admin) |
| DELETE | `/admin/users/{id}` | Yes | Delete user (admin) |

### RBAC

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/public/departments` | No | List departments (public) |
| GET | `/public/credential-types` | No | List credential types (public) |
| GET | `/admin/roles` | Yes | List roles |
| POST | `/admin/roles` | Yes | Create role |
| PUT | `/admin/roles/{id}` | Yes | Update role |
| DELETE | `/admin/roles/{id}` | Yes | Delete role |
| GET | `/admin/departments` | Yes | List departments |
| POST | `/admin/departments` | Yes | Create department |
| PUT | `/admin/departments/{id}` | Yes | Update department |
| DELETE | `/admin/departments/{id}` | Yes | Delete department |
| GET | `/admin/credential-types` | Yes | List credential types |
| POST | `/admin/credential-types` | Yes | Create credential type |
| PUT | `/admin/credential-types/{id}` | Yes | Update credential type |
| DELETE | `/admin/credential-types/{id}` | Yes | Delete credential type |
| GET | `/issuer/credential-types` | Yes | List credential types allowed for current issuer |

### Certificates

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/certificates/issue` | Yes | Issue certificate (multipart: file + metadata) |
| GET | `/certificates` | Yes | List all certificates |
| GET | `/certificates/student/{student_id}` | Yes | List by student |
| GET | `/certificates/issuer` | Yes | List by current issuer |
| GET | `/certificates/verify/{cert_id}` | No | Verify certificate (public) |
| POST | `/certificates/{cert_id}/revoke` | Yes | Revoke certificate |
| DELETE | `/certificates/{cert_id}` | Yes | Delete certificate |
| GET | `/certificates/test-ipfs` | No | IPFS connectivity check |
| GET | `/public/student/{student_id}` | No | Public student profile + certificates |

### Credentials (legacy)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/credentials` | Yes | List credentials |
| POST | `/credentials/issue` | Yes | Issue legacy credential |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/stats` | Yes | Dashboard counts (users, students, pending, credentials) |
| GET | `/dashboard/students/{id}` | Yes | Student detail + certs |
| GET | `/dashboard/students/{student_id}/credentials` | Yes | Student credentials aggregate |

### Bulk data

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/courses` | Yes | Upload courses (from Excel) |
| POST | `/result-details` | Yes | Upload result details (from Excel) |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Server health (no `/api` prefix) |

---

## Frontend Routes

| Path | Description | Auth |
|------|-------------|------|
| `/` | Landing; redirects to login | No |
| `/login` | Login (all roles) | No |
| `/register` | Student registration | No |
| `/dashboard` | Generic dashboard; redirects to role route if set | Yes |
| `/admin` | Admin dashboard (users, authorities, students, credentials, RBAC) | Yes (admin) |
| `/coe` | COE dashboard (issue marksheets, degrees; students, certs) | Yes (COE) |
| `/faculty` | Faculty dashboard (issue Bonafide, NOC) | Yes (Faculty) |
| `/club` | Club dashboard (issue participation certs) | Yes (Club) |
| `/verifier` | External verifier (verify credentials) | Yes (Verifier) |
| `/student-verifier` | Student verifier (approve students, filters) | Yes (Student verifier) |
| `/student` | Student dashboard (overview, certificates) | Yes (Student) |
| `/student-wallet` | Shareable student wallet (profile + certs, QR) | Yes (Student) |
| `/share/[studentId]` | Public student portfolio (certificates, verification links) | No |
| `/verify` | Public verification (enter cert_id or QR) | No |
| `/add-result` | Upload courses and result details (Excel) | Yes |

---

## Project Structure

```
BlockCred/
├── backend/
│   ├── main.go                    # Entry: load config, start server
│   ├── go.mod, go.sum
│   ├── .air.toml                  # Hot-reload
│   ├── internal/
│   │   ├── config/config.go       # Env: PORT, JWT_SECRET, MONGO_*, PINATA_*, etc.
│   │   ├── models/                # user, certificate, credential, types, rbac
│   │   ├── store/                 # Store interface, mongodb, memory
│   │   ├── services/              # auth, user, certificate, credentials, ipfs,
│   │   │                           # cryptographic, transparency_log, dashboard,
│   │   │                           # rbac, courses, issuer config
│   │   ├── http/
│   │   │   ├── handlers/          # auth, users, certificates, credentials,
│   │   │   │                       # dashboard, rbac, courses
│   │   │   ├── middleware/auth.go # JWT RequireAuth
│   │   │   └── response.go        # JSON response helpers
│   │   └── router/router.go       # Route registration, CORS, service init
│   ├── contracts/                # Solidity (reference/legacy)
│   ├── blockchain/               # Besu scripts (reference/legacy)
│   └── scripts/                  # add-student, etc.
├── frontend/
│   ├── src/
│   │   ├── app/                   # App Router: page.tsx per route
│   │   ├── components/            # admin, coe, faculty, club, student, shared
│   │   ├── hooks/                 # useAuth, useApi, role-specific
│   │   ├── lib/                   # auth, api, utils, roleTheme
│   │   ├── services/              # adminService, coeService, facultyService,
│   │   │                           # clubService, addResultService
│   │   └── types/                 # auth, dashboard
│   ├── package.json
│   ├── next.config.ts, postcss.config.mjs, biome.json
│   └── public/
├── PROJECT_STRUCTURE.md           # Code-level structure and flows
└── README.md                     # This file
```

---

## Setup & Configuration

### Backend environment

Create `backend/.env` or set environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `8080` |
| `JWT_SECRET` | JWT signing secret | `dev-secret` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGO_DATABASE` | Database name | `blockcred` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated; `*` = allow all) | `*` |
| `PINATA_API_KEY` | Pinata API key (IPFS) | — |
| `PINATA_API_SECRET` | Pinata API secret | — |
| `PINATA_GATEWAY_URL` | IPFS gateway base URL | `https://gateway.pinata.cloud/ipfs/` |
| `BLOCKCHAIN_RPC_URL` | Optional; Besu / GoEth RPC URL for private chain anchoring | `http://127.0.0.1:8545` |
| `CONTRACT_ADDRESS` | Optional; certificate contract address on Besu / GoEth | — |
| `PRIVATE_KEY` | Optional; private key for on-chain signing (future use) | — |

> If `BLOCKCHAIN_RPC_URL` and `CONTRACT_ADDRESS` are valid and the node is reachable, the backend will automatically enable the **private blockchain path** (Hyperledger Besu preferred, GoEth fallback). If not, the system runs purely in DApp mode (IPFS + signatures + transparency log) with no on-chain writes.

---

## Full Local Setup (Backend + Frontend + Besu)

This is the recommended way to run everything locally with **optional** private blockchain anchoring.

### 1. Prerequisites

- Go 1.21+
- Node.js 18+
- MongoDB (local or Atlas)
- Pinata (for IPFS), or update IPFS config to your own node
- Hyperledger Besu (for private chain, optional but recommended)

### 2. Start MongoDB

Either:

- Local MongoDB at `mongodb://localhost:27017`, or  
- Update `MONGO_URI` to point to Atlas / another instance.

The backend automatically falls back to an **in-memory store** if MongoDB is not reachable (good for quick demos, not for real data).

### 3. (Optional but recommended) Start Hyperledger Besu

You can reuse the Besu scripts from the legacy repo (`Blockcred_cert`) or from `backend/blockchain/scripts` if you’ve copied them here.

On Windows (PowerShell), from the blockchain scripts folder:

```powershell
cd D:\Projects\FYP\BlockCred\Blockcred_cert\backend\blockchain\scripts\setup
.\start-besu.bat
```

This typically starts:

- A Clique PoA private network
- JSON‑RPC endpoint at `http://127.0.0.1:8545`

Quick health check:

```powershell
curl http://127.0.0.1:8545 `
  -H "Content-Type: application/json" `
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

You should see a `result` like `"0x1a"` (block number in hex).  
If you’re running on a different host/port, adjust the URL and keep it in sync with `BLOCKCHAIN_RPC_URL`.

#### 3.1 Deploy the certificate contract

Use the same deployment flow you had in `Blockcred_cert` (Hardhat, Remix, Truffle, etc.), but point it at the Besu RPC URL you just started.

You need the deployed **contract address**, e.g.:

```text
0xAbCdEf1234567890abcdef1234567890AbCdEf12
```

You’ll plug this into `CONTRACT_ADDRESS` for the backend.

> If `CONTRACT_ADDRESS` is left empty, the Besu service will initialize but will fall back to **mock transactions** (no real on-chain writes, but everything else still works).

### Frontend environment

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base (e.g. `http://localhost:8080/api`) | `http://localhost:8080/api` |

Used in verify and share pages; other frontend code may use a hardcoded base URL—ensure it matches the backend.

---

## Quick Start

### Prerequisites

- Go 1.21+
- Node.js 18+
- MongoDB (local or Atlas)
- Pinata account (for IPFS)

### 4. Backend (Go)

From `backend/`:

```bash
cd backend
go mod tidy
```

Create `backend/.env` (or set env vars in your shell) with at least:

```env
PORT=8080

MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=blockcred

JWT_SECRET=dev-secret
ALLOWED_ORIGINS=http://localhost:3000

PINATA_API_KEY=your_pinata_key
PINATA_API_SECRET=your_pinata_secret
PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/

# Optional: private blockchain (Besu / GoEth)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0xYourDeployedContractAddressHere
PRIVATE_KEY=0xOptionalIfYouWireRealSigning
```

Run the backend (with Air or plain `go run`):

```bash
air
# or
go run ./main.go
```

Backend will log which blockchain mode is active:

- `✅ Using Besu blockchain service` → Besu node reachable, on-chain path enabled.
- `✅ Using GoEth blockchain service` → GoEth reachable, using that instead.
- `⚠️ Using mock blockchain service` or `Certificate issuance will use pure DApp architecture` → no real blockchain, IPFS + crypto + transparency log only.

Health check:

```bash
curl http://localhost:8080/health
```

Blockchain status (when enabled):

```bash
curl http://localhost:8080/api/blockchain/status
```

### 5. Frontend (Next.js)

From `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local` if needed:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

Then open:

- App: `http://localhost:3000`
- Login: `http://localhost:3000/login`
- Register: `http://localhost:3000/register`
- Verify: `http://localhost:3000/verify`

### First steps (end‑to‑end)

1. **Start services**  
   - MongoDB  
   - (Optional) Besu private chain  
   - Backend at `http://localhost:8080`  
   - Frontend at `http://localhost:3000`

2. **Bootstrap users & RBAC**  
   - Register a student at `/register` or insert an admin directly in MongoDB.  
   - Log in as admin, create roles/departments/credential types as needed.  
   - Onboard COE/Faculty/Club via `/admin` → `POST /api/admin/onboard`.

3. **Approve student & log in**  
   - Approve the student via `/admin` or student verifier dashboard.  
   - Log in as the student → check `/student` dashboard and `/student-wallet`.

4. **Issue a certificate**  
   - Log in as COE / Faculty / Club.  
   - Use issuance UI to upload a PDF + metadata.  
   - Backend will:
     - Upload to IPFS
     - Sign document + append to transparency log
     - **If Besu/GoEth enabled**: also call `IssueCertificateOnChain` to anchor on the private blockchain.

5. **Verify**  
   - Copy the `cert_id` from the issuance response or dashboard.  
   - Go to `/verify` and enter the `cert_id`, or use the share link / QR.  
   - Optionally check on‑chain status via `GET /api/blockchain/certificate?cert_id=...` when blockchain is enabled.

---

## Security

- **Authentication**: JWT (HS256); token in `Authorization: Bearer`.
- **Passwords**: bcrypt hashing.
- **Authorization**: Role and permission checks in backend (e.g. who can issue which cert type, approve students, manage users).
- **CORS**: Configurable via `ALLOWED_ORIGINS`.
- **Certificate integrity**: Issuer signature + Merkle proof + optional file hash check; revocation stored and checked on verify.

---

## Documentation

- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** – Code-level layout, services, handlers, and data flows.
- **[DAPP_ARCHITECTURE.md](DAPP_ARCHITECTURE.md)** – DApp design, cost comparison, optional blockchain anchoring (if present).
- **backend/README.md** – Backend-specific notes.
- **frontend/README.md** – Frontend-specific notes.
- **backend/blockchain/README.md** – Legacy blockchain/Besu (reference only; not used in current build).

---
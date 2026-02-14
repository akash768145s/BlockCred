## BlockCred – Project Structure & Functionalities

This document gives a concrete, code-level overview of the BlockCred project: directory layout, core services, data flows, and frontend pages.

---

## 1. Top-Level Layout

- **`backend/`**: Go 1.21+ HTTP API, MongoDB persistence, IPFS integration, cryptographic + transparency log services, optional/legacy blockchain integration.
- **`frontend/`**: Next.js 15 (App Router) + React 19 UI, Tailwind 4 styling, role-based dashboards and verification flows.
- **`README.md`**: High-level architecture (DApp + legacy blockchain), quick start, API overview.

---

## 2. Backend

### 2.1. Entry Point & Configuration

- **`backend/main.go`**
  - Loads `.env` (if present) via `godotenv`.
  - `config.Load()` → builds `config.Config`.
  - `router.New(cfg)` → returns an `http.Handler`.
  - `http.ListenAndServe(":"+cfg.Port, r)` starts the API server.

- **`backend/internal/config/config.go`**
  - `Config` fields:
    - `Port`, `AllowedOrigins`, `JWTSecret`
    - `MongoURI`, `MongoDatabase`
    - `PinataAPIKey`, `PinataAPISecret`, `PinataGatewayURL`
    - `BlockchainRPCURL`, `ContractAddress`, `PrivateKey` (legacy/optional)
  - `Load()` reads env with defaults (Mongo localhost, port 8080, etc.).

### 2.2. Data Models (`backend/internal/models/`)

- **`user.go`**
  - `User`:
    - Identity: `id`, `name`, `email`, `phone`, `student_id`.
    - Role: `role` (`admin`, `coe`, `department_faculty`, `club_coordinator`, `verifier`, `student`).
    - Student info: `dob`, `school_name`, `father_name`, `aadhar_number`, `tenth_school`, `tenth_marks`, `twelfth_school`, `twelfth_marks`, `cutoff`, `department`, `institution`, `club_name`.
    - Status: `is_active`, `is_approved`, `node_assigned`, `created_at`, `updated_at`.
    - `Permissions` struct for fine-grained rights.

- **`types.go`**
  - Enums and metadata:
    - `UserRole`, `CredentialType`, `CertificateStatus`.
    - Dashboard menu entries and permission-backed actions.

- **`certificate.go`**
  - **`Certificate`** – canonical off-chain certificate record:
    - Core: `CertID`, `StudentID`, `IssuerID`, `CertType`, `FileHash`, `IPFSCID`, `IPFSURL`.
    - **DApp (cryptographic) fields**:
      - `IssuerSignature`, `IssuerPublicKey`
      - `SignedDocument`, `SignedDocumentCID`, `SignedDocumentURL`
      - `MerkleRoot`, `MerklePath`, `TransparencyLogIndex`
    - **Optional public anchor**:
      - `AnchorTxHash`, `AnchorBlockNumber`, `AnchorTimestamp`
    - **Legacy blockchain fields**:
      - `TxHash`, `BlockNumber`
    - Lifecycle: `Status`, `IssuedAt`, `VerifiedAt`, `RevokedAt`, `RevokeReason`.
    - Rich `CertificateMetadata` (student, issuer, course, semester, CGPA, validity window, description, `AdditionalData`).
  - DTOs:
    - `IssueCertificateRequest`, `VerifyCertificateRequest`.
    - `CertificateVerificationResult` (includes crypto + Merkle + optional anchor info).
    - `PublicCertificate`, `PublicStudentProfile` for public/QR views.

- **`credential.go`**
  - Older `Credential` model (non-cryptographic), with optional `BlockchainTx` for legacy on-chain tx IDs.

### 2.3. Store Layer (`backend/internal/store/`)

- **`interface.go`** – `Store` interface:
  - User: create, update, delete, find by ID/email/student id, list with filters.
  - Certificates: create, get by `cert_id`, list by student/issuer, list all, revoke/delete.
  - Legacy credentials, dashboard stats, and course/result uploads.

- **`mongodb.go`** – MongoDB implementation:
  - Uses official `mongo-driver`.
  - Collection per model type; handles ObjectIDs, indexes, basic queries.

- **`memory.go`** – In-memory implementation:
  - Used when MongoDB is unavailable.
  - Simple maps in Go for quick dev/test.

### 2.4. Services (`backend/internal/services/`)

#### 2.4.1. Auth & Users

- **`auth.go`**
  - Validates credentials against the store.
  - Uses bcrypt for password hashing/comparison.
  - Issues JWT tokens (HS256) with `JWT_SECRET`.

- **`user.go`**
  - `Onboard(in OnboardInput)`:
    - Creates authorities (COE, faculty, club coordinator) with appropriate role + permissions.
    - Immediately active & approved.
  - `RegisterStudent(in RegisterStudentInput)`:
    - Self-service or admin-driven student registration.
    - Derives `school_name` if not provided.
    - Initializes role `student`, sets `is_active=false`, `is_approved=false`.
  - `ApproveStudent`, `UpdateUser`, and various getters/listers.

#### 2.4.2. Certificates & Legacy Credentials

- **`certificate.go`** (core of the new DApp architecture)

  - `NewCertificateService(store, ipfsService, blockchainService)`:
    - In current router, `blockchainService` is passed as `nil` (blockchain is disabled).
    - Always initializes:
      - `CryptographicService` (local keypair, signature generation/verification).
      - `TransparencyLogService` (Merkle tree for append-only log).

  - `IssueCertificate(req IssueCertificateRequest, issuerID string)`:
    1. Validate student & issuer via `store`.
    2. Check issuer role is allowed to issue `req.CertType`.
    3. Compute `fileHash` (SHA-256 over file bytes).
    4. Build metadata map (student, issuer, cert type, timestamps + extra fields).
    5. Compute `metadataHash` (SHA-256 of metadata JSON).
    6. Upload original file to IPFS via `IPFSService.UploadFile` → `ipfsCID`, `IPFSURL`.
    7. Compute deterministic `certID = "0x" + SHA256(fileHash + studentID + issuedAt)`.
    8. Use `CryptographicService.CreateSignedDocument(...)`:
       - Produces a signed JSON document and an `IssuerSignature`.
       - Tracks issuer public keys.
    9. Upload signed doc JSON to IPFS (optional but attempted) → `signedDocCID`, `signedDocURL`.
    10. Append entry to `TransparencyLogService`:
        - Maintains a Merkle tree of all cert events.
        - Returns `logEntry.Index` and updated root.
    11. Generate Merkle proof for the new leaf (`GenerateProof(certID)`).
    12. **Optional (legacy/disabled now):**
        - If `blockchainService != nil`, build `OnChainCertificateData` and call `IssueCertificateOnChain`.
        - Records `TxHash`, `BlockNumber` if successful.
    13. Compose `models.Certificate` with all of the above and persist to `store.CreateCertificate`.

  - `VerifyCertificate(certID string)`:
    - Loads certificate by `cert_id`.
    - Verifies:
      - Signature against `IssuerPublicKey`.
      - Merkle proof against current transparency log root.
      - Optional anchor (if `AnchorTxHash`/`AnchorBlockNumber` set and an anchor service is later wired).
    - Returns `CertificateVerificationResult` that is consumed by the frontend.

- **`credentials.go`**
  - Legacy, simpler credential issuance and listing (does not use the DApp cryptographic layer).

#### 2.4.3. IPFS / Crypto / Transparency

- **`ipfs.go`**
  - Configured via `PinataAPIKey`, `PinataAPISecret`, `PinataGatewayURL`.
  - `UploadFile(data, name, metadata)` returns CID.
  - `GetFileURL(cid)` builds a gateway URL.

- **`cryptographic.go`**
  - Manages a signing keypair (Ed25519/ECDSA).
  - `CreateSignedDocument(...)` bundles certificate details into a JSON payload and signs it.
  - `VerifySignature(...)` used during verification.

- **`transparency_log.go`**
  - Maintains an append-only log of certificate issuances.
  - Builds & updates a Merkle tree, supports:
    - `AppendEntry(...)` – returns index and root.
    - `GenerateProof(certID)` – returns Merkle path for a given cert.
    - `VerifyProof(...)` – used in `VerifyCertificate`.

#### 2.4.4. Dashboard & Blockchain (Legacy)

- **`dashboard.go`**
  - Aggregates counts and simple metrics for admin dashboard.

- **`blockchain_interface.go`, `blockchain_besu.go`, `blockchain_goeth.go`, `blockchain.go`**
  - Provide a unified `BlockchainServiceInterface` for:
    - On-chain issuance (`IssueCertificateOnChain`).
    - On-chain verification, student wallet mapping, etc.
  - `blockchain_besu.go` + `CertificateManager.sol` show precisely what would be written on-chain:
    - `certId`, `studentId`, `certType`, `ipfsCID`, `fileHash`, `metadataHash`, `issuedAt`, `issuer`, `studentWallet`, revocation info.
  - Already **not wired** in `router` (service passed as `nil`), so currently purely reference/legacy.

### 2.5. HTTP Layer (`backend/internal/http/`)

- **`response.go`**
  - Unified JSON response helper: `{ success, message, data }`.

- **`middleware/auth.go`**
  - JWT authentication:
    - Extracts `Authorization: Bearer <token>`.
    - Validates token; loads user from store; attaches to context.

- **Handlers**
  - **`handlers/auth.go`**
    - `POST /api/login` → `AuthService.Login`.
  - **`handlers/users.go`**
    - `POST /api/register`:
      - Supports JSON or multipart (for file uploads).
      - Maps to `RegisterStudentInput` and `UserService.RegisterStudent`.
    - `POST /api/admin/onboard` – admin creates authorities.
    - `GET /api/users` – list users.
    - `POST /api/users/{id}/approve` – approve student.
    - `PUT /api/admin/users/{id}` – update (admin).
    - `DELETE /api/admin/users/{id}` – delete (admin).
  - **`handlers/certificates.go`**
    - `POST /api/certificates/issue` – issue cert (multipart with file).
    - `GET /api/certificates/verify/{cert_id}` – verify cert.
    - `GET /api/certificates` – list all (auth required).
    - `GET /api/certificates/student/{student_id}` – list by student.
    - `GET /api/certificates/issuer` – list by issuer.
    - `POST /api/certificates/{cert_id}/revoke` – revoke.
    - `DELETE /api/certificates/{cert_id}` – delete.
    - `GET /api/certificates/test-ipfs` – simple health check for IPFS.
    - `GET /api/public/student/{student_id}` – public profile + certs (for `/share/[studentId]` and wallet).
  - **`handlers/dashboard.go`**
    - `GET /api/dashboard/stats` – counts for dashboard cards.
    - `GET /api/dashboard/students/{id}` – student + certs for detail view.
    - `GET /api/dashboard/students/{student_id}/credentials` – similar aggregate.
  - **`handlers/blockchain.go`**
    - Contains blockchain-related HTTP endpoints (status, register issuer, chain-level verification).
    - File has `//go:build ignore` → **excluded from build**, so no current `/api/blockchain/*` paths.

### 2.6. Router (`backend/internal/router/router.go`)

- Initializes:
  - `store.Store` – MongoDB or in-memory fallback.
  - `AuthService`, `UserService`, `CredentialService`, `DashboardService`.
  - `IPFSService`.
  - `CertificateService` with `blockchainService = nil`.
  - `AuthMiddleware` with store.
- Registers all `/api/*` routes and wraps with CORS:
  - If `AllowedOrigins == ["*"]` or empty → allow all.
  - Else restricts to configured origins.

---

## 3. Frontend

### 3.1. Overview

- Next.js 15 App Router with TypeScript.
- Tailwind CSS 4 for styling (`postcss.config.mjs`, `globals.css`).
- Uses `lucide-react` for icons.
- Biome for lint/format.

### 3.2. Libs & Services

- **`src/lib/auth.ts` (AuthService)**
  - `login(credentials)` → `POST /api/login`.
  - `register(data: RegisterData)`:
    - Builds `FormData` (supports `photo` and `twelfth_marksheet`).
    - `POST /api/register`.
  - `createUser(data: CreateUserData)` → `POST /api/admin/onboard`.
  - Session utilities:
    - `storeUserSession(user, token)` in `localStorage`.
    - `getStoredUser()`, `getStoredToken()`, `clearUserSession()`.
    - `getRoleRedirectPath(role)` → `/admin`, `/coe`, `/faculty`, `/club`, `/student`, `/verifier`, etc.

- **`src/lib/api.ts` (ApiService)**
  - Uses `API_BASE_URL = "http://localhost:8080/api"`.
  - Injects `Authorization: Bearer <token>` from `localStorage`.
  - Core methods:
    - `fetchUsers()` → `/users`.
    - `fetchCredentials()` → `/certificates` (fallback `/credentials`).
    - `fetchStudentCredentials(studentId)` → `/dashboard/students/{studentId}/credentials`.
    - `fetchStudentData(userId)` → `/dashboard/students/{id}`.
    - `approveUser(userId)` → `/users/{id}/approve`.
    - `getDashboardStats()` → `/dashboard/stats`.

- **`src/lib/utils.ts`**
  - Date formatting, role labels, minor helpers.

### 3.3. Hooks (`src/hooks/`)

- **`useAuth.ts`**
  - Holds `user` and `loading` state; loads from `AuthService` on mount.
  - Exposes:
    - `login(credentials)`
    - `register(data)`
    - `createUser(data)`
    - `logout()`
    - `isAuthenticated()`, `hasRole(role)`, `hasPermission(perm)`.

- **`useApi.ts`**
  - `useUsers()`, `useCredentials()`, `useDashboardStats()` – SWR-like data fetching with loading/error states.

- **Role/feature hooks**
  - `useStudentWallet`, `useClub`, `useCOE`, `useFaculty` – thin adapters around ApiService for specific components/pages.

### 3.4. Types (`src/types/`)

- **`auth.ts`**
  - `UserRole` enum (mirrors backend).
  - `User`, `LoginResponse`, `Credential`, etc.
  - Some legacy fields like `blockchain_tx?: string` still present for compatibility.

- **`dashboard.ts`**
  - `DashboardStats` used in admin overview UI.

### 3.5. Components & Pages

#### 3.5.1. Layout & Global

- **`src/app/layout.tsx`**
  - Root layout, font & theme setup.

- **`src/app/page.tsx`**
  - Landing page:
    - Explains BlockCred concept.
    - CTAs to login/register.

#### 3.5.2. Auth & Registration

- **`src/app/login/page.tsx`**
  - Unified login form (email/username + password).
  - On success, calls `useAuth().login` and redirects based on role via `AuthService.getRoleRedirectPath`.

- **`src/app/register/page.tsx`**
  - Full student registration:
    - Fields for name, email, phone, password, DOB, father name, Aadhar, department, 10th/12th school and marks, cutoff, photo + twelfth marksheet (optional).
  - Uses `useAuth().register` (FormData → `/api/register`).
  - Shows success message including assigned `Student ID` and explains pending admin approval.

#### 3.5.3. Admin Dashboard (`src/app/admin/page.tsx`)

Uses components from `src/components/admin/`:

- State:
  - `activeTab`: `'overview' | 'authorities' | 'students' | 'credentials'`.
  - Modals:
    - `showCreateUser` – Create issuing authority.
    - `showCreateStudent` – Create student (admin-side).
    - `editingUser`, `viewingUser`, `deletingUser`.
  - Filters: `searchTerm`, `filterRole`, `filterDepartment`.
  - Data from hooks: `useUsers`, `useCredentials`, `useDashboardStats`.

- Tabs:
  - **OverviewTab**
    - Cards for total users, issuers, students, pending approvals, total credentials.
    - Quick-action buttons: "Create COE", "Create Faculty", "Create Club" → `onCreateUser()` → `CreateUserModal`.
  - **AuthoritiesTab**
    - Filterable table of non-student users (COE/faculty/club).
    - Actions: approve, view, edit, delete.
  - **StudentsTab**
    - Department pill-nav.
    - Search bar and "Create Student" button.
    - Filtered table of student users.
    - Actions: approve, view, edit, delete.
    - "Create Student" → `onCreateStudent` → `CreateStudentModal`.
  - **CredentialsTab**
    - List of certificates with delete option (admin-only).

- Modals:
  - **CreateUserModal**
    - Creates issuers (COE/department faculty/club coordinator).
    - Fields: name, email, phone, password, role, department (for faculty/club), club_name (for club).
    - POST `/api/admin/onboard`.
  - **CreateStudentModal**
    - Admin-side student registration shortcut.
    - Restricted to student KYC fields; POST `/api/register` with JSON.
  - **EditUserModal**, **ViewUserDetailsModal**, **DeleteConfirmationModal**:
    - CRUD UI around `/api/admin/users/{id}` and `/api/users/{id}/approve`.

#### 3.5.4. Role Dashboards

Each dashboard is built as an App Router page that mainly composes shared components and hooks.

- **`src/app/coe/page.tsx`**
  - CoE (Controller of Examinations) dashboard:
    - Issue marksheets and degree certs.
    - Lists students and issued certificates.
    - Uses `IssueCredentialModal`, `OverviewTab`, `StudentsTab` from `components/coe`.

- **`src/app/faculty/page.tsx`**
  - Faculty dashboard:
    - Issue Bonafide and NOC certificates.
    - Similar to CoE but with faculty-specific credential types.

- **`src/app/club/page.tsx`**
  - Club coordinator dashboard:
    - Issue participation certificates.

- **`src/app/student/page.tsx`**
  - Student’s private dashboard:
    - Fetches student profile + certificates via dashboard endpoints.
    - Tabs:
      - Overview: summary of certs and academic profile.
      - Certificates: list view with `CertificateDisplay` and `VerificationModal` integration.

- **`src/app/student-wallet/page.tsx`**
  - Public-facing "wallet" page:
    - Shows student profile and certificates in a shareable view.
    - Supports QR-based deep links to verification / certificate display.
    - For legacy credentials may display `blockchain_tx` and link out to a block explorer (if present).

- **`src/app/share/[studentId]/page.tsx`**
  - Public student portfolio:
    - Hits `/api/public/student/{student_id}`.
    - Lists `PublicCertificate` entries (includes IPFS and crypto/Merkle proofs).
    - Used for "share profile" flows.

- **`src/app/verify/page.tsx`**
  - Public verification console:
    - Accepts a `cert_id` or QR deep link.
    - Calls `/api/certificates/verify/{cert_id}`.
    - Shows validity, IPFS link, cryptographic + Merkle proof status.
    - Copy still references "blockchain" but verification is handled via DApp cryptography and transparency log in the current architecture.

#### 3.5.5. Shared Components

- **`src/components/CertificateDisplay.tsx`**
  - Renders a full-page certificate layout (institution header, student details, grade info, issuance/verification metadata).
  - Attempts to fetch legacy on-chain data via `GET /api/blockchain/certificate?cert_id=...` (this endpoint is not currently wired; safe to ignore or adapt).

- **`src/components/RoleBasedDashboard.tsx`**
  - Maps `UserRole` to the correct dashboard path/component for redirects after login.

- **`src/components/student/VerificationModal.tsx`**
  - Modal for detailed verification results:
    - Uses fields from `CertificateVerificationResult` (signature status, Merkle proof validity, timestamps, etc.).
    - UI copy mentions blockchain but data is sourced from the backend DApp verification endpoint.

---

## 4. Functional Flows (End-to-End)

### 4.1. Student Registration

1. Student visits `/register`.
2. Frontend posts form data to `AuthService.register` → `POST /api/register`.
3. Backend `UserHandler.Register`:
   - Parses JSON or multipart.
   - Builds `RegisterStudentInput` and calls `UserService.RegisterStudent`.
4. Store writes new `User` with role `student`, `is_active=false`, `is_approved=false`.
5. Response includes `user_id` and `student_id`; frontend shows success message.

### 4.2. Admin Onboarding of Authorities

1. Admin logs in (`/login`) and is redirected to `/admin`.
2. `OverviewTab` or `AuthoritiesTab` → "Create COE/Faculty/Club" → `CreateUserModal`.
3. `CreateUserModal` posts to `/api/admin/onboard`.
4. Backend `UserService.Onboard`:
   - Creates a `User` with appropriate role, department/club, and default permissions.
   - Marks user active and approved.

### 4.3. Certificate Issuance (DApp Architecture)

1. Issuer (CoE/Faculty/Club) logs in and goes to their dashboard.
2. They use issuance UI (e.g. `IssueCredentialModal`) to upload a PDF and metadata.
3. Frontend sends multipart request to `POST /api/certificates/issue`.
4. Backend `CertificateService.IssueCertificate` runs the full chain:
   - Validates issuer + student, checks role permissions.
   - Hashes file + metadata.
   - Uploads file to IPFS.
   - Generates `certID`.
   - Signs a certificate document & stores signature + signed JSON.
   - Appends to transparency log (Merkle tree).
   - Stores the resulting `Certificate` in MongoDB.
5. Frontend refreshes lists and shows the new certificate.

### 4.4. Certificate Verification & Sharing

1. Verifier/student/employer can:
   - Use `/verify` and enter `cert_id`.
   - Scan a QR that points at `/share/[studentId]` or a specific cert verification URL.
2. Frontend calls `GET /api/certificates/verify/{cert_id}` (or `/api/public/student/{student_id}`).
3. Backend:
   - Loads certificate from store.
   - Verifies signature and Merkle proof.
   - Optionally checks anchor (future) and legacy blockchain fields (if populated).
4. Frontend renders result in `VerificationModal` and/or `CertificateDisplay`:
   - Shows validity, IPFS links, issuer, timestamps, cryptographic proofs.

---

## 5. Blockchain vs DApp Architecture (Practical View)

- **Live code path (router)**:
  - `CertificateService` is instantiated with `blockchainService = nil`.
  - `handlers/blockchain.go` is build-ignored; no `/api/blockchain/*` routes.
  - Verification endpoints rely entirely on:
    - Signature verification (`CryptographicService`).
    - Merkle proof verification (`TransparencyLogService`).
    - IPFS file integrity (if hash comparison is requested).

- **Legacy/optional blockchain code**:
  - Solidity contracts (`CertificateManager.sol`, `CredentialManager.sol`, `RoleManager.sol`) define what would be on-chain.
  - `blockchain_besu.go` and `blockchain_goeth.go` show precisely how hashes, IDs, and IPFS CIDs would be written and read.
  - These are unused in the current configured app but kept in-repo for reference or future re-enablement.

This file is the authoritative, code-level overview of the current BlockCred implementation and should stay in sync with the codebase as it evolves.


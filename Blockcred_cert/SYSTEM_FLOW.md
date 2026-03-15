# BlockCred System Architecture & Complete Flow

## Overview

BlockCred is a blockchain-based credential management system that issues, stores, and verifies academic certificates using a hybrid on-chain/off-chain architecture. The system uses **Hyperledger Besu** (private PoA blockchain), **MongoDB** (off-chain database), **IPFS** (decentralized file storage), and **Go backend** with **Next.js frontend**.

---

## System Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  - Admin Dashboard, COE Dashboard, Student Dashboard        │
│  - Certificate Issuance UI, Verification UI                 │
│  - Public Profile Pages with QR Codes                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST API
┌──────────────────────▼──────────────────────────────────────┐
│                    BACKEND (Go)                              │
│  - Certificate Service (orchestrates issuance)              │
│  - IPFS Service (Pinata integration)                        │
│  - Blockchain Service (Besu JSON-RPC)                        │
│  - User Service, Auth Service                               │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────┐
│  MongoDB   │ │   IPFS     │ │ Hyperledger    │
│  (Off-chain│ │  (Pinata)  │ │    Besu        │
│  Database) │ │  (File     │ │  (On-chain)    │
│            │ │  Storage)  │ │  (PoA Chain)   │
└────────────┘ └────────────┘ └────────────────┘
```

---

## Complete Certificate Issuance Flow

### Step-by-Step Process

#### 1. **Frontend: User Initiates Certificate Issuance**

**Location:** `frontend/src/app/coe-dashboard/page.tsx`

- COE user fills out the "Issue Academic Credential" form:
  - Selects student
  - Chooses certificate type (marksheet, degree, etc.)
  - Enters semester, CGPA, academic year
  - Adds subjects (code, name, marks, grade, credits)
- Frontend generates a sample PDF (in production, this would be a real PDF upload)
- Frontend converts PDF to Base64
- Frontend constructs request payload:

```typescript
{
  student_id: "SIS202585MW",
  cert_type: "marksheet",
  file_data: "base64_encoded_pdf_content",
  file_name: "marksheet_SIS202585MW_1234567890.pdf",
  metadata: {
    student_name: "Morgan Wilson",
    student_email: "morgan@student.ssn.edu.in",
    issuer_name: "COE Office",
    issuer_role: "coe",
    institution: "SSN College of Engineering",
    course: "Computer Science",
    semester: "3",
    academic_year: "2024-25",
    cgpa: 8.5,
    valid_from: "2025-01-01T00:00:00Z",
    valid_until: "2026-01-01T00:00:00Z",
    subjects: [
      { subject_code: "CS101", subject_name: "Data Structures", marks: 100, grade: "A+", credits: 3 }
    ]
  }
}
```

- Frontend sends POST request to: `http://localhost:8080/api/certificates/issue`

---

#### 2. **Backend: Certificate Service Orchestration**

**Location:** `backend/internal/services/certificate.go` → `IssueCertificate()`

The backend orchestrates the entire issuance process:

**2.1. Validation Phase**
- Validates student exists in MongoDB
- Validates issuer exists and has permission to issue this certificate type
- Checks role-based permissions (COE can issue marksheets/degrees, etc.)

**2.2. Hash Computation**
- **Credential Hash (File Hash):** `SHA256(fileData)` → `0xabc123...`
  - This hash uniquely identifies the certificate file content
  - Used for tamper detection
- **Metadata Hash:** `SHA256(metadataJSON)` → `0xdef456...`
  - This hash ensures metadata integrity
  - Prevents unauthorized edits to certificate details

**2.3. IPFS Upload**
- **Service:** `backend/internal/services/ipfs.go`
- Uploads the PDF file to IPFS via Pinata API
- Returns **IPFS CID** (Content Identifier): `QmXyZ123...`
- IPFS URL: `https://gateway.pinata.cloud/ipfs/QmXyZ123...`
- **What's stored on IPFS:**
  - The actual PDF certificate file
  - Metadata embedded in Pinata (student name, issuer, etc.)

**2.4. Wallet Generation**
- **Student Wallet:** Deterministic address generated from `SHA256("student_wallet_" + studentID)`
  - Format: `0x` + 40 hex characters
  - Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0`
  - This wallet is registered on-chain (if contract supports it)
- **Issuer Wallet:** Deterministic address from `SHA256("issuer_wallet_" + issuerID)`
  - Represents the COE/Faculty issuing authority

**2.5. Certificate ID Generation**
- **Formula:** `SHA256(fileHash + studentID + issuedAtRFC3339)`
- Format: `0x` + 64 hex characters
- Example: `0x440f52ec40a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d`
- This is the **unique on-chain identifier** for the certificate

**2.6. On-Chain Data Preparation**

```go
OnChainCertificateData {
    CertID:         "0x440f52ec40...",      // Unique certificate ID
    StudentID:      "SIS202585MW",          // Student identifier
    StudentWallet:  "0x742d35Cc6634...",    // Student's blockchain address
    CredentialHash: "0xabc123...",          // SHA256 of PDF file
    MetadataHash:   "0xdef456...",          // SHA256 of metadata JSON
    IssuerAddress:  "0xissuer123...",        // COE/Faculty wallet
    CertType:       "marksheet",             // Certificate type
    Timestamp:      1704067200,              // Unix timestamp
}
```

---

#### 3. **Blockchain: Hyperledger Besu Transaction**

**Location:** `backend/internal/services/blockchain_besu.go` → `IssueCertificateOnChain()`

**3.1. Connection Check**
- Backend connects to Besu via JSON-RPC at `http://127.0.0.1:8545`
- Health check: `eth_blockNumber` to verify node is running
- If Besu is down, falls back to GoEth or mock service

**3.2. Smart Contract Interaction**
- **Contract Address:** Configured in `CONTRACT_ADDRESS` env var
- **Function:** `issueCertificate(string _certId, string _studentId, string _certType, string _ipfsCID, string _fileHash, string _metadataHash, address _studentWallet)`
- **ABI Encoding:** Uses `github.com/ethereum/go-ethereum/accounts/abi` to encode function call

**3.3. Transaction Construction**
```go
tx := {
    from:     issuerWallet,           // COE wallet address
    to:       contractAddress,        // Smart contract address
    data:     "0x" + encodedFunctionCall,  // ABI-encoded function + params
    gas:      "0x30d40",              // 200,000 gas
    gasPrice: currentGasPrice,        // From eth_gasPrice
    nonce:    issuerNonce,            // From eth_getTransactionCount
    value:    "0x0"                    // No ETH transfer
}
```

**3.4. Transaction Submission**
- Sends transaction via `eth_sendTransaction`
- Returns transaction hash: `0xd5b5949146a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c`
- Waits for transaction receipt (up to 60 seconds, checking every 5 seconds)
- Gets block number from receipt

**3.5. What Gets Stored ON-CHAIN (Besu Blockchain)**
```
Smart Contract Storage:
├── certId → Certificate Record {
│   ├── _certId: "0x440f52ec40..."
│   ├── _studentId: "SIS202585MW"
│   ├── _certType: "marksheet"
│   ├── _ipfsCID: "QmXyZ123..."
│   ├── _fileHash: "0xabc123..."      ← Tamper-proof file hash
│   ├── _metadataHash: "0xdef456..."   ← Metadata integrity hash
│   ├── _studentWallet: "0x742d35..."
│   ├── _issuerAddress: "0xissuer123..."
│   ├── _timestamp: 1704067200
│   └── _revoked: false
└── studentWallet → studentId mapping
```

**Transaction Receipt:**
- **Tx Hash:** `0xd5b5949146...` (immutable proof)
- **Block Number:** `12345` (block where transaction was mined)
- **Gas Used:** `200,000`
- **Status:** `0x1` (success)

---

#### 4. **Database: MongoDB Record Creation**

**Location:** `backend/internal/services/certificate.go` → After blockchain transaction

**4.1. Certificate Document Structure**

```javascript
{
  _id: ObjectId("..."),
  cert_id: "0x440f52ec40...",              // Same as on-chain CertID
  student_id: "SIS202585MW",
  issuer_id: "issuer_mongodb_id",
  cert_type: "marksheet",
  file_hash: "0xabc123...",                // Credential hash
  ipfs_cid: "QmXyZ123...",                 // IPFS Content ID
  ipfs_url: "https://gateway.pinata.cloud/ipfs/QmXyZ123...",
  tx_hash: "0xd5b5949146...",              // Blockchain transaction hash
  block_number: 12345,                     // Block where tx was mined
  status: "issued",                        // issued | verified | revoked
  issued_at: ISODate("2025-01-01T00:00:00Z"),
  metadata: {
    student_name: "Morgan Wilson",
    student_email: "morgan@student.ssn.edu.in",
    issuer_name: "COE Office",
    issuer_role: "coe",
    institution: "SSN College of Engineering",
    course: "Computer Science",
    semester: "3",
    academic_year: "2024-25",
    cgpa: 8.5,
    valid_from: ISODate("2025-01-01T00:00:00Z"),
    valid_until: ISODate("2026-01-01T00:00:00Z"),
    subjects: [
      {
        subject_code: "CS101",
        subject_name: "Data Structures",
        marks: 100,
        grade: "A+",
        credits: 3
      }
    ],
    additional_data: {
      metadata_hash: "0xdef456...",        // Metadata hash
      student_wallet: "0x742d35...",       // Student wallet address
      issuer_wallet: "0xissuer123..."      // Issuer wallet address
    }
  },
  created_at: ISODate("2025-01-01T00:00:00Z"),
  updated_at: ISODate("2025-01-01T00:00:00Z")
}
```

**4.2. What Gets Stored OFF-CHAIN (MongoDB)**
- **Full certificate metadata** (student name, email, subjects, grades, CGPA, etc.)
- **IPFS URL** for accessing the PDF file
- **Blockchain references** (tx_hash, block_number, cert_id)
- **Status tracking** (issued, verified, revoked)
- **Timestamps** (issued_at, verified_at, revoked_at)
- **Revocation reason** (if revoked)

**Why Off-Chain?**
- Blockchain storage is expensive (gas costs)
- Rich metadata (subjects, grades) would be too costly to store on-chain
- MongoDB provides fast queries and full-text search
- IPFS stores the actual PDF file (too large for blockchain)

---

#### 5. **Response to Frontend**

Backend returns:
```json
{
  "success": true,
  "message": "certificate issued successfully",
  "data": {
    "certificate_id": "mongodb_object_id",
    "cert_id": "0x440f52ec40...",
    "ipfs_url": "https://gateway.pinata.cloud/ipfs/QmXyZ123...",
    "tx_hash": "0xd5b5949146...",
    "block_number": 12345
  }
}
```

Frontend displays success message and updates the certificate list.

---

## Certificate Verification Flow

### Public Verification (No Authentication Required)

**Location:** `frontend/src/app/verify/page.tsx` and `backend/internal/services/certificate.go` → `VerifyCertificate()`

#### Step 1: User Accesses Verification Page
- URL: `/verify?certId=0x440f52ec40...`
- Or user manually enters certificate ID

#### Step 2: Backend Verification Process

**2.1. Database Lookup**
- Queries MongoDB for certificate with `cert_id = "0x440f52ec40..."`
- If not found → returns `is_valid: false, error: "Certificate not found"`

**2.2. Blockchain Verification**
- Calls `blockchainService.VerifyCertificate(certID)`
- Makes `eth_call` to smart contract: `verifyCertificate(certID)`
- Contract checks if certificate exists and is not revoked
- Returns boolean: `true` if valid, `false` if revoked/not found

**2.3. Status Check**
- Checks MongoDB `status` field
- If `status === "revoked"` → returns invalid

**2.4. Verification Result**

```json
{
  "is_valid": true,
  "cert_id": "0x440f52ec40...",
  "student_id": "SIS202585MW",
  "issuer_id": "issuer_id",
  "cert_type": "marksheet",
  "status": "issued",
  "issued_at": "2025-01-01T00:00:00Z",
  "ipfs_url": "https://gateway.pinata.cloud/ipfs/QmXyZ123...",
  "tx_hash": "0xd5b5949146...",
  "block_number": 12345,
  "metadata": {
    "student_name": "Morgan Wilson",
    "semester": "3",
    "cgpa": 8.5,
    "subjects": [...]
  }
}
```

#### Step 3: Frontend Display
- Shows certificate details
- Displays blockchain proof (tx_hash, block_number)
- Shows IPFS link to download PDF
- Displays academic snapshot (subjects, grades, CGPA)

---

## Public Student Profile Flow

### Shareable Profile with QR Codes

**Location:** `frontend/src/app/share/[studentId]/page.tsx`

#### Step 1: Student Shares Profile Link
- URL: `/share/SIS202585MW`
- Public endpoint (no authentication required)

#### Step 2: Backend Fetches Public Profile
- **Endpoint:** `GET /api/public/student/{student_id}`
- **Handler:** `backend/internal/http/handlers/certificates.go` → `GetPublicStudentProfile()`
- **Service:** `backend/internal/services/certificate.go` → `GetPublicStudentProfile()`

**Process:**
1. Fetches student from MongoDB
2. Fetches all certificates for that student
3. Sanitizes data (removes sensitive info)
4. Returns `PublicStudentProfile`:

```json
{
  "student_id": "SIS202585MW",
  "name": "Morgan Wilson",
  "department": "Computer Science",
  "institution": "SSN College of Engineering",
  "course": "Computer Science",
  "wallet_address": "0x742d35Cc6634...",
  "certificates": [
    {
      "cert_id": "0x440f52ec40...",
      "cert_type": "marksheet",
      "status": "issued",
      "issued_at": "2025-01-01T00:00:00Z",
      "ipfs_url": "https://gateway.pinata.cloud/ipfs/QmXyZ123...",
      "tx_hash": "0xd5b5949146...",
      "block_number": 12345,
      "metadata": { ... }
    }
  ]
}
```

#### Step 3: Frontend Generates QR Codes
- For each certificate, generates QR code
- QR code contains: `https://yourdomain.com/verify?certId=0x440f52ec40...`
- Employer scans QR → redirects to verification page

---

## Data Storage Summary

### ON-CHAIN (Hyperledger Besu)

**What's Stored:**
- ✅ Certificate ID (unique identifier)
- ✅ Student ID
- ✅ Student Wallet Address
- ✅ Credential Hash (SHA256 of PDF file) → **Tamper Detection**
- ✅ Metadata Hash (SHA256 of metadata) → **Integrity Check**
- ✅ IPFS CID (pointer to file)
- ✅ Issuer Address
- ✅ Certificate Type
- ✅ Timestamp (immutable proof of issuance time)
- ✅ Revocation Status (boolean)

**What's NOT Stored:**
- ❌ Full PDF file (too large, stored on IPFS)
- ❌ Detailed metadata (subjects, grades, CGPA) → stored in MongoDB
- ❌ Student personal info (name, email) → stored in MongoDB

**Why On-Chain?**
- **Immutability:** Once written, cannot be altered
- **Tamper Detection:** File hash ensures certificate hasn't been modified
- **Trust:** Anyone can verify without relying on a central authority
- **Audit Trail:** Permanent record of all issuances and revocations

---

### OFF-CHAIN (MongoDB)

**What's Stored:**
- ✅ Full certificate metadata (student name, email, subjects, grades, CGPA, semester, academic year)
- ✅ IPFS URL (link to PDF file)
- ✅ Blockchain references (tx_hash, block_number, cert_id)
- ✅ Status tracking (issued, verified, revoked)
- ✅ Timestamps (issued_at, verified_at, revoked_at)
- ✅ Revocation reason (if revoked)
- ✅ Issuer information

**Why Off-Chain?**
- **Cost Efficiency:** Storing rich metadata on-chain would be expensive
- **Query Performance:** Fast searches and filtering
- **Flexibility:** Easy to update status, add fields
- **Full-Text Search:** Can search by student name, email, etc.

---

### IPFS (Pinata Gateway)

**What's Stored:**
- ✅ Actual PDF certificate file
- ✅ Embedded metadata in Pinata (for indexing)

**Why IPFS?**
- **Decentralized Storage:** File is distributed across IPFS network
- **Content Addressing:** File is identified by its hash (CID)
- **Permanence:** File remains accessible as long as it's pinned
- **Cost Effective:** Cheaper than storing large files on blockchain

---

## Component Responsibilities

### Frontend (Next.js)
- **UI/UX:** Certificate issuance forms, dashboards, verification pages
- **Data Presentation:** Displays certificates, blockchain proofs, QR codes
- **User Interaction:** Form validation, file uploads, QR code generation
- **API Communication:** Sends requests to backend, handles responses

### Backend (Go)
- **Business Logic:** Certificate issuance orchestration, validation, verification
- **Service Integration:** Coordinates IPFS, blockchain, and database operations
- **Authentication/Authorization:** JWT validation, role-based access control
- **API Endpoints:** RESTful API for frontend communication

### MongoDB
- **Data Persistence:** Stores all certificate records with full metadata
- **Fast Queries:** Enables searching by student ID, issuer, certificate type
- **Status Management:** Tracks certificate lifecycle (issued → verified → revoked)

### Hyperledger Besu
- **Immutable Ledger:** Stores certificate hashes and metadata hashes
- **Smart Contract:** Enforces certificate issuance rules, handles verification
- **Proof of Authenticity:** Provides cryptographic proof that certificate was issued
- **Revocation Tracking:** Records when certificates are revoked

### IPFS (Pinata)
- **File Storage:** Stores actual PDF certificate files
- **Content Distribution:** Makes files accessible via gateway URLs
- **Pinning Service:** Ensures files remain available (Pinata handles pinning)

---

## Security & Trust Model

### Trust Assumptions
1. **Hyperledger Besu Network:** Trusted validators (PoA consensus)
2. **IPFS/Pinata:** Trusted pinning service (could be decentralized in production)
3. **MongoDB:** Trusted database (could use encrypted storage)
4. **Backend:** Trusted service (JWT authentication, role-based access)

### Tamper Detection
- **File Hash:** If PDF is modified, hash changes → verification fails
- **Metadata Hash:** If metadata is altered, hash changes → verification fails
- **Blockchain Immutability:** On-chain data cannot be modified after mining

### Verification Process
1. **On-Chain Check:** Verify certificate exists on blockchain
2. **Hash Verification:** Compare file hash from blockchain with computed hash
3. **Status Check:** Verify certificate is not revoked
4. **IPFS Validation:** Verify IPFS file matches the hash

---

## Example: Complete Certificate Lifecycle

### 1. Issuance (COE Dashboard)
```
COE User → Fills Form → Frontend → Backend → IPFS Upload → Blockchain TX → MongoDB Save → Success
```

### 2. Viewing (Student Dashboard)
```
Student → Dashboard → Backend → MongoDB Query → Display Certificates (non-BC info)
Student → Clicks "Verify" → Backend → Blockchain Query → Display BC Info (tx_hash, block_number)
```

### 3. Sharing (Public Profile)
```
Student → Shares Link → Public Profile Page → Backend → MongoDB Query → Display Certificates + QR Codes
```

### 4. Verification (Public Verifier)
```
Employer → Scans QR Code → Verification Page → Backend → MongoDB + Blockchain Query → Display Full Verification Result
```

### 5. Revocation (Admin Dashboard)
```
Admin → Revokes Certificate → Backend → MongoDB Update (status: revoked) → Blockchain TX (if contract supports) → Certificate Invalid
```

---

## Key Design Decisions

1. **Hybrid Architecture:** On-chain for trust, off-chain for efficiency
2. **Deterministic Wallets:** Students don't need to manage private keys
3. **IPFS for Files:** Large PDFs stored off-chain, hash stored on-chain
4. **Metadata Separation:** Rich data in MongoDB, hashes on blockchain
5. **Public Verification:** No authentication required for certificate verification
6. **QR Code Integration:** Easy sharing and verification for employers

---

This architecture provides a balance between **security** (blockchain immutability), **efficiency** (off-chain storage), and **usability** (fast queries, easy verification).


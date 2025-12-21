# BlockCred System Architecture & Complete Flow

## Overview

BlockCred is a **cost-efficient DApp credential management system** that issues, stores, and verifies academic certificates using **cryptographic signatures, Merkle trees, and transparency logs**. The system uses **MongoDB** (off-chain database), **IPFS** (decentralized file storage), **cryptographic services** (Ed25519 signatures), and **Go backend** with **Next.js frontend**.

**Key Innovation:** Eliminates blockchain infrastructure costs while maintaining equivalent security guarantees through cryptographic primitives.

---

## System Architecture

### Three-Tier DApp Architecture

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
│  - Cryptographic Service (Ed25519 signatures)              │
│  - Transparency Log Service (Merkle trees)                  │
│  - IPFS Service (Pinata integration)                        │
│  - User Service, Auth Service                               │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────────┐
│  MongoDB   │ │   IPFS     │ │ Optional: Public    │
│  (Metadata │ │  (Pinata)  │ │  Blockchain        │
│  + Proofs) │ │  (Files +  │ │  (Ethereum/Polygon)│
│            │ │  Signatures)│ │  (Periodic Anchor) │
└────────────┘ └────────────┘ └────────────────────┘
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

**2.4. Certificate ID Generation**
- **Formula:** `SHA256(fileHash + studentID + issuedAtRFC3339)`
- Format: `0x` + 64 hex characters
- Example: `0x440f52ec40a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d`
- This is the **unique identifier** for the certificate

**2.5. Cryptographic Signing** ← **NEW (DApp Architecture)**

**Service:** `backend/internal/services/cryptographic.go`

```go
// Create signed certificate document
certificateDocument := {
    cert_id:       "0x440f52ec40...",
    student_id:    "SIS202585MW",
    file_hash:     "0xabc123...",
    metadata_hash: "0xdef456...",
    ipfs_cid:      "QmXyZ123...",
    cert_type:     "marksheet",
    issued_at:     1704067200,
    issuer_id:     "issuer_mongodb_id",
    revoked:       false
}

// Sign with issuer's Ed25519 private key
signature := Ed25519.Sign(issuerPrivateKey, certificateDocumentJSON)
certificateDocument.signature = signature
certificateDocument.issuer_public_key = issuerPublicKey
certificateDocument.signature_algorithm = "Ed25519"
```

**Process:**
1. Get or generate Ed25519 key pair for issuer
2. Marshal certificate document to JSON
3. Sign document with issuer's private key
4. Add signature and public key to document

**2.6. Store Signed Document in IPFS** ← **NEW**

```go
// Upload signed certificate document to IPFS
signedDocumentJSON := json.Marshal(certificateDocument)
signedDocCID := ipfsService.UploadFile(signedDocumentJSON, "certificate_0x440f52ec40.json")
signedDocURL := "https://gateway.pinata.cloud/ipfs/" + signedDocCID
```

**What's stored:**
- Full signed certificate JSON document
- Includes signature, public key, and all certificate data
- Publicly accessible via IPFS gateway

**2.7. Append to Transparency Log** ← **NEW**

**Service:** `backend/internal/services/transparency_log.go`

```go
// Append certificate to append-only transparency log
logEntry := transparencyLog.Append(certID, signedDocumentJSON)

// Entry structure:
TransparencyLogEntry {
    Index:     12345,
    CertID:    "0x440f52ec40...",
    Timestamp: 1704067200,
    Hash:      "0xmerkle789..."  // Hash of certID + signedDocument
}
```

**2.8. Generate Merkle Proof** ← **NEW**

```go
// Generate Merkle proof for certificate
merkleProof := transparencyLog.GenerateProof(certID)

// Proof structure:
MerkleProof {
    Root:      "0xmerkleRoot123...",  // Current Merkle root
    Path:      ["0xhash1", "0xhash2", ...],  // Merkle path
    LeafIndex: 12345  // Position in log
}
```

**Merkle Tree Structure:**
```
                    Merkle Root
                   /           \
              Hash(0-1)      Hash(2-3)
              /      \        /      \
         Hash(0)  Hash(1)  Hash(2)  Hash(3)
           |        |        |        |
        Entry[0] Entry[1] Entry[2] Entry[3]
```

**2.9. Certificate Record Creation**

```go
certificate := models.Certificate{
    CertID:              "0x440f52ec40...",
    StudentID:           "SIS202585MW",
    IssuerID:            "issuer_mongodb_id",
    CertType:            "marksheet",
    FileHash:            "0xabc123...",
    IPFSCID:             "QmXyZ123...",
    IPFSURL:             "https://gateway.pinata.cloud/ipfs/QmXyZ123...",
    
    // NEW: Cryptographic proofs (DApp architecture)
    IssuerSignature:     "0xsignature123...",
    IssuerPublicKey:      "0xpublickey456...",
    SignedDocument:       string(signedDocumentJSON),
    SignedDocumentCID:    signedDocCID,
    SignedDocumentURL:    signedDocURL,
    MerkleRoot:           merkleProof.Root,
    MerklePath:           merkleProof.Path,
    TransparencyLogIndex: logEntry.Index,
    
    Status:               "issued",
    IssuedAt:             time.Now(),
    Metadata:             req.Metadata,
    CreatedAt:            time.Now(),
    UpdatedAt:            time.Now(),
}
```

---

#### 3. **Database: MongoDB Record Creation**

**Location:** `backend/internal/services/certificate.go` → After cryptographic operations

**3.1. Certificate Document Structure**

```javascript
{
  _id: ObjectId("..."),
  cert_id: "0x440f52ec40...",              // Unique certificate ID
  student_id: "SIS202585MW",
  issuer_id: "issuer_mongodb_id",
  cert_type: "marksheet",
  file_hash: "0xabc123...",                // Credential hash
  ipfs_cid: "QmXyZ123...",                 // IPFS Content ID
  ipfs_url: "https://gateway.pinata.cloud/ipfs/QmXyZ123...",
  
  // NEW: Cryptographic proofs (DApp architecture)
  issuer_signature: "0xsignature123...",   // Ed25519 signature
  issuer_public_key: "0xpublickey456...",  // Issuer public key
  signed_document: "{ ... }",              // Full signed JSON document
  signed_document_cid: "QmSignedDoc...",   // IPFS CID of signed document
  signed_document_url: "https://gateway.pinata.cloud/ipfs/QmSignedDoc...",
  merkle_root: "0xmerkle789...",           // Merkle tree root hash
  merkle_path: ["0xhash1", "0xhash2", ...], // Merkle proof path
  transparency_log_index: 12345,            // Position in transparency log
  
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
      metadata_hash: "0xdef456..."  // Metadata hash
    }
  },
  created_at: ISODate("2025-01-01T00:00:00Z"),
  updated_at: ISODate("2025-01-01T00:00:00Z")
}
```

**3.2. What Gets Stored in MongoDB**
- **Full certificate metadata** (student name, email, subjects, grades, CGPA, etc.)
- **IPFS URLs** (PDF file, signed document)
- **Cryptographic proofs** (signatures, Merkle paths, transparency log index)
- **Issuer public keys** (for verification)
- **Status tracking** (issued, verified, revoked)
- **Timestamps** (issued_at, verified_at, revoked_at)
- **Revocation reason** (if revoked)

**Why MongoDB?**
- Fast queries and indexing
- Rich metadata storage
- Cost-effective for large datasets
- Easy to update revocation status

---

#### 4. **Response to Frontend**

Backend returns:
```json
{
  "success": true,
  "message": "certificate issued successfully",
  "data": {
    "certificate_id": "mongodb_object_id",
    "cert_id": "0x440f52ec40...",
    "ipfs_url": "https://gateway.pinata.cloud/ipfs/QmXyZ123...",
    "signed_document_url": "https://gateway.pinata.cloud/ipfs/QmSignedDoc...",
    "issuer_signature": "0xsignature123...",
    "issuer_public_key": "0xpublickey456...",
    "merkle_root": "0xmerkle789...",
    "transparency_log_index": 12345
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
- Or scans QR code

#### Step 2: Backend Verification Process

**2.1. Database Lookup**
- Queries MongoDB for certificate with `cert_id = "0x440f52ec40..."`
- If not found → returns `is_valid: false, error: "Certificate not found"`

**2.2. Cryptographic Signature Verification** ← **NEW (DApp Architecture)**

**Service:** `backend/internal/services/cryptographic.go`

```go
// Verify issuer signature
isSignatureValid := Ed25519.Verify(
    issuerPublicKey,
    signedDocumentJSON,
    issuerSignature
)
```

**Process:**
1. Extract signature and public key from certificate
2. Get signed document (from MongoDB or IPFS)
3. Verify signature using Ed25519 verification algorithm
4. Returns `true` if signature is valid, `false` otherwise

**2.3. Issuer Public Key Trust Check** ← **NEW**

```go
// Verify issuer public key is registered and trusted
// (In production, this would check against issuer registry)
isIssuerTrusted := issuerRegistry.IsTrustedIssuer(issuerPublicKey)
```

**2.4. Merkle Proof Verification** ← **NEW**

**Service:** `backend/internal/services/transparency_log.go`

```go
// Verify certificate is in transparency log
isInLog := transparencyLog.VerifyProof(
    transparencyLogIndex,
    merklePath,
    merkleRoot
)
```

**Process:**
1. Get Merkle proof from certificate (path, root, index)
2. Recompute Merkle root using proof path
3. Compare computed root with stored root
4. Returns `true` if proof is valid, `false` otherwise

**2.5. Revocation Check**

```go
// Check revocation status
if certificate.Status == "revoked" {
    return invalid
}

// Check revocation log (if implemented)
isRevoked := revocationLog.IsRevoked(certID)
```

**2.6. File Integrity Check**

```go
// Download file from IPFS and verify hash
downloadedFile := ipfsService.DownloadFile(ipfsURL)
computedHash := SHA256(downloadedFile)

if computedHash != certificate.FileHash {
    return invalid  // File has been tampered with
}
```

**2.7. Verification Result**

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
  "signed_document_url": "https://gateway.pinata.cloud/ipfs/QmSignedDoc...",
  
  // NEW: Cryptographic proofs
  "issuer_signature": "0xsignature123...",
  "issuer_public_key": "0xpublickey456...",
  "signature_verified": true,
  "merkle_root": "0xmerkle789...",
  "merkle_proof_valid": true,
  "transparency_log_index": 12345,
  
  "file_integrity_ok": true,
  "tamper_detected": false,
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
- Displays cryptographic proofs (signature, Merkle root, transparency log index)
- Shows signature verification status
- Shows Merkle proof validation status
- Shows IPFS link to download PDF
- Shows signed document link
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
  "certificates": [
    {
      "cert_id": "0x440f52ec40...",
      "cert_type": "marksheet",
      "status": "issued",
      "issued_at": "2025-01-01T00:00:00Z",
      "ipfs_url": "https://gateway.pinata.cloud/ipfs/QmXyZ123...",
      "signed_document_url": "https://gateway.pinata.cloud/ipfs/QmSignedDoc...",
      "issuer_signature": "0xsignature123...",
      "merkle_root": "0xmerkle789...",
      "transparency_log_index": 12345,
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

### MongoDB (Off-Chain Metadata + Proofs)

**What's Stored:**
- ✅ Full certificate metadata (student name, email, subjects, grades, CGPA, semester, academic year)
- ✅ IPFS URLs (PDF file, signed document)
- ✅ **Cryptographic proofs** (signatures, Merkle paths, transparency log index)
- ✅ **Issuer public keys** (for verification)
- ✅ Status tracking (issued, verified, revoked)
- ✅ Timestamps (issued_at, verified_at, revoked_at)
- ✅ Revocation reason (if revoked)
- ✅ Issuer information

**Why MongoDB?**
- **Fast Queries:** Indexed searches by student ID, issuer, certificate type
- **Rich Metadata:** Store complex data structures (subjects, grades)
- **Cost Effective:** Cheaper than blockchain storage
- **Flexibility:** Easy to update status, add fields
- **Full-Text Search:** Can search by student name, email, etc.

---

### IPFS (Pinata Gateway)

**What's Stored:**
- ✅ **PDF certificate files** (original)
- ✅ **Signed certificate documents** (JSON with signature)
- ✅ **Merkle tree data** (for batch verification)

**Why IPFS?**
- **Decentralized Storage:** File is distributed across IPFS network
- **Content Addressing:** File is identified by its hash (CID)
- **Permanence:** File remains accessible as long as it's pinned
- **Cost Effective:** Cheaper than storing large files on blockchain
- **Public Access:** Anyone can access files via gateway URL

---

### Transparency Log (Append-Only)

**What's Stored:**
- ✅ **Merkle tree** of all certificate issuances
- ✅ **Root hash** (published periodically)
- ✅ **Revocation log** (append-only list of revoked certificates)

**Implementation:**
- In-memory Merkle tree (can be persisted to MongoDB or file)
- Root hash recomputed on each append
- Merkle proofs generated for each certificate

**Why Transparency Log?**
- **Tamper Detection:** Any modification changes Merkle root
- **Auditability:** Complete history of all issuances
- **No Blockchain Required:** Provides immutability without blockchain infrastructure
- **Public Verification:** Anyone can verify Merkle proof

---

### Optional: Public Blockchain (Ethereum/Polygon)

**What's Stored:**
- ✅ **Merkle root hash** (periodic anchor, e.g., monthly)
- ✅ **Timestamp** (block timestamp)
- ✅ **Anchor transaction hash** (proof of anchoring)

**Anchoring Strategy:**
- **Batch anchoring:** Anchor all certificates issued in a month with single transaction
- **Cost:** ~$0.01-0.10 per anchor (vs $0.50+ per certificate)
- **Frequency:** Monthly or weekly (configurable)

**Why Optional?**
- Provides global timestamping
- Adds extra layer of immutability
- Not required for verification (signatures are sufficient)
- Can be added later without architectural changes

---

## Component Responsibilities

### Frontend (Next.js)
- **UI/UX:** Certificate issuance forms, dashboards, verification pages
- **Data Presentation:** Displays certificates, cryptographic proofs, QR codes
- **User Interaction:** Form validation, file uploads, QR code generation
- **API Communication:** Sends requests to backend, handles responses

### Backend (Go)
- **Business Logic:** Certificate issuance orchestration, validation, verification
- **Service Integration:** Coordinates IPFS, cryptographic services, and database operations
- **Authentication/Authorization:** JWT validation, role-based access control
- **API Endpoints:** RESTful API for frontend communication

### Cryptographic Service
- **Key Management:** Generate and manage Ed25519 key pairs for issuers
- **Signing:** Sign certificate documents with issuer private keys
- **Verification:** Verify signatures using issuer public keys
- **Document Creation:** Create signed certificate documents

### Transparency Log Service
- **Log Management:** Append-only log of all certificate issuances
- **Merkle Tree:** Compute and maintain Merkle tree
- **Proof Generation:** Generate Merkle proofs for certificates
- **Proof Verification:** Verify Merkle proofs

### MongoDB
- **Data Persistence:** Stores all certificate records with full metadata
- **Fast Queries:** Enables searching by student ID, issuer, certificate type
- **Status Management:** Tracks certificate lifecycle (issued → verified → revoked)

### IPFS (Pinata)
- **File Storage:** Stores actual PDF certificate files
- **Signed Document Storage:** Stores signed certificate JSON documents
- **Content Distribution:** Makes files accessible via gateway URLs
- **Pinning Service:** Ensures files remain available (Pinata handles pinning)

---

## Security & Trust Model

### Trust Assumptions
1. **Issuer Public Keys:** Trusted issuer public keys (PKI model)
2. **IPFS/Pinata:** Trusted pinning service (could be decentralized in production)
3. **MongoDB:** Trusted database (could use encrypted storage)
4. **Backend:** Trusted service (JWT authentication, role-based access)
5. **Transparency Log:** Append-only log provides immutability

### Tamper Detection
- **File Hash:** If PDF is modified, hash changes → verification fails
- **Metadata Hash:** If metadata is altered, hash changes → verification fails
- **Cryptographic Signature:** If document is modified, signature verification fails
- **Merkle Proof:** If log is tampered, Merkle proof verification fails

### Verification Process
1. **Signature Verification:** Verify issuer signature on certificate document
2. **Public Key Trust:** Verify issuer public key is registered and trusted
3. **Merkle Proof Verification:** Verify certificate is in transparency log
4. **Revocation Check:** Verify certificate is not revoked
5. **File Integrity Check:** Verify IPFS file matches stored hash

---

## Example: Complete Certificate Lifecycle

### 1. Issuance (COE Dashboard)
```
COE User → Fills Form → Frontend → Backend → IPFS Upload → Cryptographic Signing → 
Transparency Log Append → Merkle Proof Generation → MongoDB Save → Success
```

### 2. Viewing (Student Dashboard)
```
Student → Dashboard → Backend → MongoDB Query → Display Certificates
Student → Clicks "Verify" → Backend → Signature Verification + Merkle Proof → Display Verification Result
```

### 3. Sharing (Public Profile)
```
Student → Shares Link → Public Profile Page → Backend → MongoDB Query → Display Certificates + QR Codes
```

### 4. Verification (Public Verifier)
```
Employer → Scans QR Code → Verification Page → Backend → 
Signature Verification + Merkle Proof + File Integrity → Display Full Verification Result
```

### 5. Revocation (Admin Dashboard)
```
Admin → Revokes Certificate → Backend → MongoDB Update (status: revoked) → 
Revocation Log Append → Certificate Invalid
```

---

## Key Design Decisions

1. **DApp Architecture:** Cryptographic signatures replace blockchain immutability
2. **Transparency Log:** Merkle trees provide tamper detection without blockchain
3. **IPFS for Files:** Large PDFs stored off-chain, hash stored cryptographically
4. **Metadata Separation:** Rich data in MongoDB, cryptographic proofs for integrity
5. **Public Verification:** No authentication required for certificate verification
6. **QR Code Integration:** Easy sharing and verification for employers
7. **Cost Efficiency:** Eliminates blockchain infrastructure costs (59-81% savings)

---

## Cost Comparison

### Before (Blockchain Architecture)
- Validator nodes: $50-200/month
- Gas fees: $0.50+ per certificate
- **Total (1000 certs/month):** $550-700/month

### After (DApp Architecture)
- MongoDB: $25-100/month (same)
- IPFS/Pinata: $10-50/month (same)
- Optional anchor: $0.01-0.10/month
- **Total (1000 certs/month):** $35-150/month

### Savings: **59-81%**

---

This architecture provides a balance between **security** (cryptographic signatures and Merkle proofs), **efficiency** (off-chain storage), **cost-effectiveness** (no blockchain infrastructure), and **usability** (fast queries, easy verification).

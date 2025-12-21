# Certificate Verification Status Guide

This document explains how BlockCred determines if a certificate is verified or not.

## Overview

A certificate is considered **VERIFIED** (`is_valid: true`) when all required checks pass. The verification process checks multiple cryptographic proofs and integrity measures.

## Verification Criteria

### For New DApp Certificates (with cryptographic proofs)

A certificate is **VERIFIED** when **ALL** of the following are true:

1. ✅ **Signature Verification** (`signature_verified: true`)
   - The issuer's cryptographic signature must be valid
   - Verified using Ed25519 signature algorithm
   - This is the **primary proof** of authenticity

2. ✅ **Certificate Status** (`status != "revoked"`)
   - Certificate must not be revoked
   - Status must be `"issued"` or `"verified"`

3. ✅ **File Integrity** (`file_integrity_ok: true` AND `tamper_detected: false`)
   - The file hash from IPFS must match the stored hash
   - No tampering detected

**Optional (Non-blocking):**
- ⚠️ **Merkle Proof** (`merkle_proof_valid`)
  - If available, validates inclusion in transparency log
  - **NOT required** for verification (graceful degradation if transparency log was reset)

### For Legacy Certificates (blockchain-based)

A certificate is **VERIFIED** when **ALL** of the following are true:

1. ✅ **Certificate Status** (`status != "revoked"`)
   - Certificate must not be revoked

2. ✅ **File Integrity** (`file_integrity_ok: true` AND `tamper_detected: false`)
   - The file hash from IPFS must match the stored hash

## Verification Result Structure

The API returns a `CertificateVerificationResult` with the following key fields:

```typescript
{
  is_valid: boolean,              // PRIMARY INDICATOR: true = verified, false = failed
  signature_verified?: boolean,    // Cryptographic signature check
  merkle_proof_valid?: boolean,   // Merkle proof check (optional)
  file_integrity_ok?: boolean,    // File hash integrity check
  tamper_detected?: boolean,       // Tampering detection
  status: string,                 // Certificate status: "issued" | "verified" | "revoked"
  error_message?: string          // Error message if verification failed
}
```

## Backend Verification Logic

**Location:** `backend/internal/services/certificate.go`

```go
// For new certificates:
isValid = signatureVerified && 
          cert.Status != models.CertStatusRevoked && 
          isFileIntact

// For legacy certificates:
isValid = cert.Status != models.CertStatusRevoked && 
          isFileIntact
```

## Frontend Display

**Location:** `frontend/src/app/verify/page.tsx`

The frontend displays verification status using:

1. **Main Status Badge:**
   - ✅ **"VALID CERTIFICATE"** (green) when `is_valid === true`
   - ❌ **"FAILED VERIFICATION"** (red) when `is_valid === false`

2. **Individual Proof Badges:**
   - ✅ **"SIGNATURE VERIFIED"** / ❌ **"INVALID SIGNATURE"**
   - ✅ **"MERKLE PROOF VALID"** / ❌ **"INVALID MERKLE PROOF"** (if available)
   - ✅ **"FILE INTEGRITY OK"** / ⚠️ **"FILE TAMPERED"** / ⚠️ **"INTEGRITY CHECK UNAVAILABLE"**

## Common Verification Failure Reasons

1. **Invalid Signature**
   - Error: `"Invalid issuer signature"`
   - Cause: Signature doesn't match the certificate document
   - Fix: Certificate may have been tampered with or issuer key mismatch

2. **File Tampering**
   - Error: `"Certificate file has been tampered with"`
   - Cause: IPFS file hash doesn't match stored hash
   - Fix: File was modified after issuance

3. **Certificate Revoked**
   - Error: `"Certificate has been revoked"`
   - Cause: Certificate was revoked by issuer
   - Fix: Cannot be fixed - certificate is permanently invalid

4. **Certificate Not Found**
   - Error: `"Certificate not found in database"`
   - Cause: Certificate ID doesn't exist
   - Fix: Verify the certificate ID is correct

## Verification Flow

```
1. Certificate ID provided
   ↓
2. Lookup certificate in database
   ↓
3. Check certificate status (revoked?)
   ↓
4. Verify cryptographic signature (if DApp certificate)
   ↓
5. Verify Merkle proof (optional, if available)
   ↓
6. Verify file integrity (download from IPFS, check hash)
   ↓
7. Return verification result with is_valid flag
```

## Example Verification Responses

### ✅ Successful Verification

```json
{
  "is_valid": true,
  "cert_id": "0x...",
  "signature_verified": true,
  "merkle_proof_valid": true,
  "file_integrity_ok": true,
  "tamper_detected": false,
  "status": "issued"
}
```

### ❌ Failed Verification (Invalid Signature)

```json
{
  "is_valid": false,
  "cert_id": "0x...",
  "signature_verified": false,
  "file_integrity_ok": true,
  "tamper_detected": false,
  "status": "issued",
  "error_message": "Invalid issuer signature"
}
```

### ❌ Failed Verification (File Tampered)

```json
{
  "is_valid": false,
  "cert_id": "0x...",
  "signature_verified": true,
  "file_integrity_ok": false,
  "tamper_detected": true,
  "status": "issued",
  "error_message": "Certificate file has been tampered with. Stored hash: abc..., Computed hash: xyz..."
}
```

## Summary

**To check if a certificate is verified:**

1. **Primary Check:** Look at `is_valid` field
   - `true` = ✅ Verified
   - `false` = ❌ Failed

2. **Detailed Checks:** Review individual proof fields
   - `signature_verified`: Must be `true` for DApp certificates
   - `file_integrity_ok`: Must be `true` (or `null` if check unavailable)
   - `tamper_detected`: Must be `false`
   - `status`: Must not be `"revoked"`

3. **Error Details:** Check `error_message` for specific failure reason

The `is_valid` field is the **single source of truth** for verification status.


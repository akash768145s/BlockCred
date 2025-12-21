package services

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"time"
)

// TransparencyLogEntry represents an entry in the transparency log
type TransparencyLogEntry struct {
	Index     int64  `json:"index"`
	CertID    string `json:"cert_id"`
	Timestamp int64  `json:"timestamp"`
	Hash      string `json:"hash"`
}

// MerkleProof represents a Merkle proof for a certificate
type MerkleProof struct {
	Root      string   `json:"root"`
	Path      []string `json:"path"`
	LeafIndex int64    `json:"leaf_index"`
}

// TransparencyLogService manages the append-only transparency log
type TransparencyLogService struct {
	entries   []TransparencyLogEntry
	merkleRoot string
	mu        sync.RWMutex
}

// NewTransparencyLogService creates a new transparency log service
func NewTransparencyLogService() *TransparencyLogService {
	return &TransparencyLogService{
		entries:   make([]TransparencyLogEntry, 0),
		merkleRoot: "",
	}
}

// Append adds a new entry to the transparency log
func (t *TransparencyLogService) Append(certID string, data []byte) (*TransparencyLogEntry, error) {
	t.mu.Lock()
	defer t.mu.Unlock()

	index := int64(len(t.entries))
	timestamp := time.Now().Unix()

	// Compute hash of entry (certID + data)
	hashInput := append([]byte(certID), data...)
	hash := sha256.Sum256(hashInput)
	hashHex := hex.EncodeToString(hash[:])

	entry := TransparencyLogEntry{
		Index:     index,
		CertID:    certID,
		Timestamp: timestamp,
		Hash:      hashHex,
	}

	t.entries = append(t.entries, entry)

	// Recompute Merkle root
	t.updateMerkleRoot()

	return &entry, nil
}

// GetMerkleRoot returns the current Merkle root
func (t *TransparencyLogService) GetMerkleRoot() string {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.merkleRoot
}

// GetEntry returns an entry by index
func (t *TransparencyLogService) GetEntry(index int64) (*TransparencyLogEntry, error) {
	t.mu.RLock()
	defer t.mu.RUnlock()

	if index < 0 || index >= int64(len(t.entries)) {
		return nil, fmt.Errorf("entry not found at index %d", index)
	}
	return &t.entries[index], nil
}

// GetEntryByCertID returns an entry by certificate ID
func (t *TransparencyLogService) GetEntryByCertID(certID string) (*TransparencyLogEntry, error) {
	t.mu.RLock()
	defer t.mu.RUnlock()

	for i := range t.entries {
		if t.entries[i].CertID == certID {
			return &t.entries[i], nil
		}
	}
	return nil, fmt.Errorf("entry not found for certID %s", certID)
}

// GenerateProof generates a Merkle proof for a certificate
func (t *TransparencyLogService) GenerateProof(certID string) (*MerkleProof, error) {
	t.mu.RLock()
	defer t.mu.RUnlock()

	// Find the entry
	var entryIndex int64 = -1
	for i, entry := range t.entries {
		if entry.CertID == certID {
			entryIndex = int64(i)
			break
		}
	}

	if entryIndex == -1 {
		return nil, fmt.Errorf("certificate not found in transparency log")
	}

	// Generate Merkle path
	path := t.generateMerklePath(entryIndex)

	return &MerkleProof{
		Root:      t.merkleRoot,
		Path:      path,
		LeafIndex: entryIndex,
	}, nil
}

// VerifyProof verifies a Merkle proof
func (t *TransparencyLogService) VerifyProof(entryIndex int64, merklePath []string, merkleRoot string) (bool, error) {
	t.mu.RLock()
	defer t.mu.RUnlock()

	if entryIndex < 0 || entryIndex >= int64(len(t.entries)) {
		return false, fmt.Errorf("invalid entry index")
	}

	// Get the entry hash
	entryHash := t.entries[entryIndex].Hash
	entryHashBytes, err := hex.DecodeString(entryHash)
	if err != nil {
		return false, fmt.Errorf("invalid entry hash: %w", err)
	}

	// Recompute root using the path
	computedRoot := t.computeRootFromPath(entryHashBytes, entryIndex, merklePath)

	return computedRoot == merkleRoot, nil
}

// updateMerkleRoot recomputes the Merkle root from all entries
func (t *TransparencyLogService) updateMerkleRoot() {
	if len(t.entries) == 0 {
		t.merkleRoot = ""
		return
	}

	// Collect all entry hashes
	hashes := make([][]byte, len(t.entries))
	for i, entry := range t.entries {
		hashBytes, _ := hex.DecodeString(entry.Hash)
		hashes[i] = hashBytes
	}

	// Compute root hash
	rootHash := t.computeMerkleRoot(hashes)
	t.merkleRoot = hex.EncodeToString(rootHash)
}

// computeMerkleRoot computes Merkle root from leaf hashes
func (t *TransparencyLogService) computeMerkleRoot(hashes [][]byte) []byte {
	if len(hashes) == 1 {
		return hashes[0]
	}

	// Pair-wise hashing
	nextLevel := make([][]byte, 0)
	for i := 0; i < len(hashes); i += 2 {
		if i+1 < len(hashes) {
			combined := append(hashes[i], hashes[i+1]...)
			hash := sha256.Sum256(combined)
			nextLevel = append(nextLevel, hash[:])
		} else {
			// Odd number of hashes, duplicate the last one
			combined := append(hashes[i], hashes[i]...)
			hash := sha256.Sum256(combined)
			nextLevel = append(nextLevel, hash[:])
		}
	}

	return t.computeMerkleRoot(nextLevel)
}

// generateMerklePath generates the Merkle path for a given leaf index
func (t *TransparencyLogService) generateMerklePath(leafIndex int64) []string {
	if len(t.entries) == 0 {
		return []string{}
	}

	path := make([]string, 0)
	currentLevel := make([][]byte, len(t.entries))
	for i, entry := range t.entries {
		hashBytes, _ := hex.DecodeString(entry.Hash)
		currentLevel[i] = hashBytes
	}

	currentIndex := leafIndex
	for len(currentLevel) > 1 {
		nextLevel := make([][]byte, 0)
		siblingIndex := currentIndex ^ 1 // XOR with 1 to get sibling

		// Add sibling to path if it exists
		if int(siblingIndex) < len(currentLevel) {
			path = append(path, hex.EncodeToString(currentLevel[siblingIndex]))
		} else {
			// No sibling, duplicate current node
			path = append(path, hex.EncodeToString(currentLevel[currentIndex]))
		}

		// Build next level
		for i := 0; i < len(currentLevel); i += 2 {
			if i+1 < len(currentLevel) {
				combined := append(currentLevel[i], currentLevel[i+1]...)
				hash := sha256.Sum256(combined)
				nextLevel = append(nextLevel, hash[:])
			} else {
				combined := append(currentLevel[i], currentLevel[i]...)
				hash := sha256.Sum256(combined)
				nextLevel = append(nextLevel, hash[:])
			}
		}

		currentLevel = nextLevel
		currentIndex = currentIndex / 2
	}

	return path
}

// computeRootFromPath computes the Merkle root from a leaf hash and path
func (t *TransparencyLogService) computeRootFromPath(leafHash []byte, leafIndex int64, path []string) string {
	currentHash := leafHash
	currentIndex := leafIndex

	for _, siblingHex := range path {
		siblingHash, err := hex.DecodeString(siblingHex)
		if err != nil {
			return ""
		}

		var combined []byte
		if currentIndex%2 == 0 {
			// Current is left child
			combined = append(currentHash, siblingHash...)
		} else {
			// Current is right child
			combined = append(siblingHash, currentHash...)
		}

		hash := sha256.Sum256(combined)
		currentHash = hash[:]
		currentIndex = currentIndex / 2
	}

	return hex.EncodeToString(currentHash)
}

// GetLatestEntry returns the latest entry in the log
func (t *TransparencyLogService) GetLatestEntry() *TransparencyLogEntry {
	t.mu.RLock()
	defer t.mu.RUnlock()

	if len(t.entries) == 0 {
		return nil
	}
	return &t.entries[len(t.entries)-1]
}

// GetEntryCount returns the number of entries in the log
func (t *TransparencyLogService) GetEntryCount() int64 {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return int64(len(t.entries))
}


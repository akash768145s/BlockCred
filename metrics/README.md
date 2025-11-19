# BlockCred - System Metrics & Performance Documentation

## Overview

This document outlines the metrics, performance indicators, and analytics tracked by the BlockCred system. These metrics help monitor system health, user activity, blockchain operations, and overall system performance.

## Table of Contents

1. [System Performance Metrics](#system-performance-metrics)
2. [User Activity Metrics](#user-activity-metrics)
3. [Blockchain Metrics](#blockchain-metrics)
4. [API Performance Metrics](#api-performance-metrics)
5. [Database Metrics](#database-metrics)
6. [Business Metrics](#business-metrics)
7. [Security Metrics](#security-metrics)
8. [Implementation Guide](#implementation-guide)

---

## System Performance Metrics

### Server Metrics

| Metric | Description | Target | Measurement |
|--------|-------------|--------|-------------|
| **Response Time** | Average API response time | < 200ms | Milliseconds |
| **Throughput** | Requests per second | > 100 req/s | Requests/second |
| **Error Rate** | Percentage of failed requests | < 1% | Percentage |
| **Uptime** | System availability | > 99.9% | Percentage |
| **CPU Usage** | Server CPU utilization | < 70% | Percentage |
| **Memory Usage** | Server RAM utilization | < 80% | Percentage |
| **Disk I/O** | Database and file operations | < 1000 IOPS | IOPS |

### Application Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Go Routine Count** | Active goroutines | < 1000 |
| **Garbage Collection** | GC pause time | < 10ms |
| **Connection Pool** | Database connections | < 50 active |
| **Cache Hit Rate** | Cache effectiveness | > 80% |

---

## User Activity Metrics

### User Engagement

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Total Users** | Total registered users | Count of all users |
| **Active Users (DAU)** | Daily active users | Unique logins per day |
| **Active Users (MAU)** | Monthly active users | Unique logins per month |
| **User Growth Rate** | New user registration rate | New users / time period |
| **User Retention Rate** | Returning users | (Returning users / Total users) × 100 |

### Role Distribution

| Metric | Description |
|--------|-------------|
| **Admin Count** | Number of admin users |
| **COE Count** | Number of COE users |
| **Faculty Count** | Number of faculty users |
| **Club Coordinator Count** | Number of club coordinators |
| **Student Count** | Number of student users |
| **Verifier Count** | Number of external verifiers |
| **Pending Approvals** | Students awaiting approval |

### User Actions

| Metric | Description |
|--------|-------------|
| **Login Count** | Total login attempts |
| **Failed Login Attempts** | Authentication failures |
| **Password Reset Requests** | Password reset operations |
| **Profile Updates** | User profile modifications |
| **Dashboard Views** | Page views per role |

---

## Blockchain Metrics

### Network Performance

| Metric | Description | Target |
|--------|-------------|--------|
| **Block Time** | Average time to mine a block | ~5 seconds (PoA) |
| **Transaction Confirmation Time** | Time to confirm transaction | < 10 seconds |
| **Transaction Throughput** | Transactions per second | > 10 TPS |
| **Network Latency** | RPC call response time | < 100ms |
| **Block Height** | Current blockchain height | Continuous growth |

### Certificate Operations

| Metric | Description |
|--------|-------------|
| **Total Certificates Issued** | Cumulative certificates on-chain |
| **Certificates Issued Today** | Daily issuance count |
| **Certificates Verified** | Total verification requests |
| **Certificates Revoked** | Total revoked certificates |
| **Active Certificates** | Non-revoked certificates |
| **Average Certificate Size** | Average IPFS file size |

### Smart Contract Metrics

| Metric | Description |
|--------|-------------|
| **Contract Deployments** | Number of contract deployments |
| **Contract Calls** | Total function calls |
| **Gas Usage** | Total gas consumed |
| **Failed Transactions** | Transaction failures |
| **Pending Transactions** | Unconfirmed transactions |

### On-Chain Data

| Metric | Description |
|--------|-------------|
| **Total On-Chain Storage** | Bytes stored on blockchain |
| **Certificate Hash Storage** | Total certificate hashes |
| **Metadata Hash Storage** | Total metadata hashes |
| **Issuer Registrations** | Registered issuer addresses |
| **Student Wallet Mappings** | Student-to-wallet mappings |

---

## API Performance Metrics

### Endpoint Performance

| Endpoint | Method | Avg Response Time | Target | Success Rate |
|----------|--------|-------------------|--------|--------------|
| `/api/login` | POST | < 100ms | < 150ms | > 99% |
| `/api/register` | POST | < 200ms | < 300ms | > 95% |
| `/api/users` | GET | < 150ms | < 200ms | > 99% |
| `/api/certificates/issue` | POST | < 2000ms | < 3000ms | > 98% |
| `/api/certificates/verify/{id}` | GET | < 500ms | < 1000ms | > 99% |
| `/api/blockchain/status` | GET | < 300ms | < 500ms | > 99% |
| `/api/blockchain/verify-certificate` | GET | < 1000ms | < 2000ms | > 98% |

### API Usage Statistics

| Metric | Description |
|--------|-------------|
| **Total API Calls** | Cumulative API requests |
| **API Calls per Hour** | Request rate |
| **Most Used Endpoint** | Highest traffic endpoint |
| **Error Rate by Endpoint** | Failure rate per endpoint |
| **Authentication Failures** | 401/403 responses |
| **Rate Limit Hits** | Throttled requests |

---

## Database Metrics

### MongoDB Performance

| Metric | Description | Target |
|--------|-------------|--------|
| **Query Response Time** | Average query time | < 50ms |
| **Write Latency** | Document write time | < 100ms |
| **Index Usage** | Index hit rate | > 90% |
| **Connection Count** | Active connections | < 50 |
| **Collection Sizes** | Data size per collection | Monitor growth |

### Data Statistics

| Metric | Description |
|--------|-------------|
| **Total Users** | Users collection size |
| **Total Certificates** | Certificates collection size |
| **Total Credentials** | Credentials collection size |
| **Database Size** | Total database storage |
| **Document Growth Rate** | New documents per day |

### Collection Metrics

| Collection | Document Count | Size | Indexes |
|------------|----------------|------|---------|
| `users` | Varies | Varies | `email`, `student_id`, `role` |
| `certificates` | Varies | Varies | `cert_id`, `student_id`, `issuer_id` |
| `credentials` | Varies | Varies | `student_id`, `type` |

---

## Business Metrics

### Credential Issuance

| Metric | Description |
|--------|-------------|
| **Total Credentials Issued** | All-time credential count |
| **Credentials by Type** | Breakdown by credential type |
| **Credentials by Issuer** | Issuance per role |
| **Daily Issuance Rate** | Credentials issued per day |
| **Average Issuance Time** | Time to issue credential |

### Credential Types Distribution

| Credential Type | Count | Percentage |
|-----------------|-------|------------|
| Semester Marksheet | - | - |
| Degree Certificate | - | - |
| NOC Certificate | - | - |
| Bonafide Certificate | - | - |
| Participation Certificate | - | - |

### Verification Metrics

| Metric | Description |
|--------|-------------|
| **Total Verifications** | All-time verification count |
| **Verification Success Rate** | Valid certificates / Total |
| **Verification Failures** | Invalid/revoked certificates |
| **Average Verification Time** | Time to verify credential |
| **Verifications by Verifier** | External verifier activity |

### Student Metrics

| Metric | Description |
|--------|-------------|
| **Students with Credentials** | Students who have credentials |
| **Average Credentials per Student** | Credential distribution |
| **Students by Department** | Department-wise distribution |
| **Approval Rate** | Approved / Total registrations |
| **Approval Time** | Average time to approval |

---

## Security Metrics

### Authentication & Authorization

| Metric | Description | Target |
|--------|-------------|--------|
| **Failed Login Attempts** | Authentication failures | Monitor for attacks |
| **JWT Token Expiration Rate** | Token renewals | Normal operation |
| **Unauthorized Access Attempts** | 403 responses | < 0.1% |
| **Password Reset Requests** | Reset operations | Monitor for abuse |

### Blockchain Security

| Metric | Description |
|--------|-------------|
| **Tamper Detection Events** | Hash mismatches |
| **Revoked Certificates** | Invalidated credentials |
| **Failed Blockchain Transactions** | On-chain failures |
| **Smart Contract Errors** | Contract execution errors |

### Data Integrity

| Metric | Description |
|--------|-------------|
| **Hash Verification Success Rate** | Valid hash checks |
| **IPFS Upload Success Rate** | Successful file uploads |
| **Data Consistency Checks** | On-chain vs off-chain sync |

---

## Implementation Guide

### Current Metrics Collection

The BlockCred system currently tracks basic metrics through:

1. **Backend Logging**: Go log statements for operations
2. **Database Queries**: Count operations for statistics
3. **API Response Times**: Implicit through HTTP handlers
4. **Blockchain RPC**: Direct queries to Besu node

### Recommended Metrics Implementation

#### 1. Add Metrics Middleware

Create a metrics middleware to track API performance:

```go
// backend/internal/http/middleware/metrics.go
package middleware

import (
    "net/http"
    "time"
    "github.com/prometheus/client_golang/prometheus"
)

var (
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )
    
    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "http_request_duration_seconds",
            Help: "HTTP request duration in seconds",
        },
        []string{"method", "endpoint"},
    )
)

func MetricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        // Wrap response writer to capture status code
        rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
        
        next.ServeHTTP(rw, r)
        
        duration := time.Since(start).Seconds()
        
        httpRequestsTotal.WithLabelValues(
            r.Method,
            r.URL.Path,
            http.StatusText(rw.statusCode),
        ).Inc()
        
        httpRequestDuration.WithLabelValues(
            r.Method,
            r.URL.Path,
        ).Observe(duration)
    })
}
```

#### 2. Add Database Metrics

Track database operations:

```go
// backend/internal/store/metrics.go
var (
    dbOperationsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "db_operations_total",
            Help: "Total database operations",
        },
        []string{"operation", "collection"},
    )
    
    dbOperationDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "db_operation_duration_seconds",
            Help: "Database operation duration",
        },
        []string{"operation", "collection"},
    )
)
```

#### 3. Add Blockchain Metrics

Track blockchain operations:

```go
// backend/internal/services/blockchain_metrics.go
var (
    blockchainTransactionsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "blockchain_transactions_total",
            Help: "Total blockchain transactions",
        },
        []string{"type", "status"},
    )
    
    blockchainTransactionDuration = prometheus.HistogramVec(
        prometheus.HistogramOpts{
            Name: "blockchain_transaction_duration_seconds",
            Help: "Blockchain transaction duration",
        },
        []string{"type"},
    )
)
```

#### 4. Add Dashboard Statistics Endpoint

Create an endpoint to serve metrics:

```go
// backend/internal/http/handlers/metrics.go
func (h *MetricsHandler) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
    stats := map[string]interface{}{
        "total_users": h.getTotalUsers(),
        "total_certificates": h.getTotalCertificates(),
        "active_users_today": h.getActiveUsersToday(),
        "certificates_issued_today": h.getCertificatesIssuedToday(),
        "blockchain_status": h.getBlockchainStatus(),
        "system_health": h.getSystemHealth(),
    }
    
    httpx.JSON(w, http.StatusOK, true, "metrics retrieved", stats)
}
```

#### 5. Add Real-time Monitoring

Integrate with monitoring tools:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **ELK Stack**: Log aggregation and analysis
- **New Relic / Datadog**: APM (Application Performance Monitoring)

### Metrics Dashboard

Create a metrics dashboard page in the frontend:

```typescript
// frontend/src/app/metrics-dashboard/page.tsx
// Real-time metrics visualization
// - System health indicators
// - User activity charts
// - API performance graphs
// - Blockchain statistics
// - Credential issuance trends
```

---

## Sample Metrics Queries

### MongoDB Queries

```javascript
// Total users by role
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])

// Certificates issued today
db.certificates.countDocuments({
  created_at: { $gte: new Date(new Date().setHours(0,0,0,0)) }
})

// Average credentials per student
db.certificates.aggregate([
  { $group: { _id: "$student_id", count: { $sum: 1 } } },
  { $group: { _id: null, avg: { $avg: "$count" } } }
])
```

### Blockchain Queries

```bash
# Get current block number
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Get transaction count
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["0x...","latest"],"id":1}'
```

---

## Performance Benchmarks

### Expected Performance

| Operation | Expected Time | Measured Time |
|-----------|---------------|---------------|
| User Login | < 100ms | - |
| User Registration | < 200ms | - |
| Certificate Issuance | < 3s | - |
| Certificate Verification | < 1s | - |
| Blockchain Transaction | < 10s | - |
| IPFS Upload | < 2s | - |
| Database Query | < 50ms | - |

### Load Testing

Recommended load testing scenarios:

1. **Baseline**: 10 concurrent users
2. **Normal Load**: 50 concurrent users
3. **Peak Load**: 200 concurrent users
4. **Stress Test**: 500+ concurrent users

Tools: Apache JMeter, k6, or Go's `net/http/httptest`

---

## Monitoring Alerts

### Critical Alerts

| Condition | Alert | Action |
|-----------|-------|--------|
| Error Rate > 5% | High error rate | Investigate immediately |
| Response Time > 1s | Slow API | Check database/blockchain |
| Blockchain Down | Node unreachable | Restart Besu node |
| Database Connection Failed | DB unavailable | Check MongoDB |
| Disk Space < 10% | Low storage | Clean up logs/data |

### Warning Alerts

| Condition | Alert | Action |
|-----------|-------|--------|
| CPU Usage > 80% | High CPU | Scale horizontally |
| Memory Usage > 85% | High memory | Optimize or scale |
| Failed Logins > 100/hour | Security concern | Review access logs |
| Certificate Issuance Failures > 10% | High failure rate | Check blockchain/IPFS |

---

## Reporting

### Daily Reports

- User registrations
- Certificates issued
- System uptime
- Error summary
- Performance summary

### Weekly Reports

- User growth trends
- Credential issuance trends
- System performance trends
- Security incidents
- Infrastructure costs

### Monthly Reports

- Business metrics summary
- User engagement analysis
- System scalability assessment
- Security audit results
- Roadmap progress

---

## Tools & Integrations

### Recommended Tools

1. **Prometheus** - Metrics collection
2. **Grafana** - Visualization
3. **ELK Stack** - Log management
4. **Sentry** - Error tracking
5. **New Relic / Datadog** - APM
6. **Uptime Robot** - Availability monitoring

### Integration Points

- Backend: Prometheus metrics endpoint
- Frontend: Error tracking (Sentry)
- Database: MongoDB monitoring
- Blockchain: Besu metrics API
- Infrastructure: Server monitoring (CPU, RAM, Disk)

---

## Future Enhancements

1. **Real-time Metrics Dashboard** - Live system monitoring
2. **Predictive Analytics** - ML-based predictions
3. **Automated Alerts** - Smart alerting system
4. **Performance Optimization** - AI-driven optimization
5. **Cost Analysis** - Infrastructure cost tracking
6. **User Behavior Analytics** - Advanced user insights

---

## Conclusion

This metrics framework provides comprehensive visibility into the BlockCred system's performance, health, and usage patterns. Regular monitoring and analysis of these metrics enable proactive issue detection, performance optimization, and data-driven decision making.

For implementation details, refer to the codebase documentation and monitoring tool setup guides.


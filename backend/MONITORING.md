# BlockCred Monitoring with Prometheus & Grafana

Complete monitoring solution for the BlockCred blockchain credential management system.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Windows
start-monitoring.bat

# Linux/Mac
chmod +x start-monitoring.sh
./start-monitoring.sh
```

### Option 2: Manual Setup
```bash
# 1. Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# 2. Start BlockCred backend
go run main.go
```

## 📊 Monitoring Stack

### Services
- **Prometheus**: Metrics collection and storage (Port 9090)
- **Grafana**: Visualization and dashboards (Port 3001)
- **Node Exporter**: System metrics (Port 9100)
- **BlockCred Backend**: Application metrics (Port 8080)

### Access URLs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin123)
- **BlockCred API**: http://localhost:8080
- **Metrics Endpoint**: http://localhost:8080/metrics

## 📈 Metrics Collected

### Application Metrics
- `blockcred_http_requests_total` - HTTP request count by method, endpoint, status
- `blockcred_http_request_duration_seconds` - Request duration histogram
- `blockcred_users_total` - User count by status (approved/pending)
- `blockcred_blockchain_nodes_active` - Active blockchain nodes
- `blockcred_certificates_issued_total` - Certificates issued by type and institution
- `blockcred_login_attempts_total` - Login attempts by user type and status
- `blockcred_registration_attempts_total` - Registration attempts by status

### System Metrics
- CPU usage, memory usage, disk I/O
- Network traffic and connections
- File system usage

## 🎯 Key Features

### Real-time Monitoring
- **Live metrics** in admin dashboard
- **Prometheus queries** for detailed analysis
- **Grafana dashboards** for visualization
- **Alert rules** for proactive monitoring

### Blockchain-Specific Metrics
- **Node assignment tracking**
- **Certificate issuance monitoring**
- **User approval workflow metrics**
- **System performance indicators**

### Alerting Rules
- High error rate detection
- Slow response time alerts
- No active blockchain nodes
- Failed login attempt monitoring
- Pending user approval notifications

## 🔧 Configuration Files

### Prometheus (`prometheus.yml`)
- Scrape configuration for all services
- 5-second scrape intervals for real-time monitoring
- Alert rule definitions

### Grafana Dashboard (`blockcred-dashboard.json`)
- System overview with key metrics
- Blockchain node monitoring
- HTTP request rate tracking
- Response time analysis
- Login attempt monitoring
- Certificate issuance tracking

### Alert Rules (`blockcred_rules.yml`)
- Error rate thresholds
- Response time limits
- Blockchain node availability
- Security monitoring

## 📱 Admin Dashboard Integration

The admin dashboard now includes:
- **Real-time metrics display**
- **Direct links to Prometheus and Grafana**
- **Refresh metrics functionality**
- **System health indicators**

## 🛠️ Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Start Docker Desktop
   # Or install Docker if not present
   ```

2. **Port conflicts**
   ```bash
   # Check if ports are available
   netstat -an | findstr :9090
   netstat -an | findstr :3001
   netstat -an | findstr :8080
   ```

3. **Metrics not showing**
   ```bash
   # Check backend is running
   curl http://localhost:8080/metrics
   
   # Check Prometheus targets
   # Visit http://localhost:9090/targets
   ```

### Useful Commands

```bash
# View logs
docker-compose -f docker-compose.monitoring.yml logs

# Restart services
docker-compose -f docker-compose.monitoring.yml restart

# Stop monitoring stack
docker-compose -f docker-compose.monitoring.yml down

# Clean up volumes
docker-compose -f docker-compose.monitoring.yml down -v
```

## 📊 Sample Queries

### Prometheus Queries
```promql
# Request rate
rate(blockcred_http_requests_total[5m])

# Response time
histogram_quantile(0.95, rate(blockcred_http_request_duration_seconds_bucket[5m]))

# Active users
blockcred_users_total{status="approved"}

# Certificate issuance rate
rate(blockcred_certificates_issued_total[1h])

# Error rate
rate(blockcred_http_requests_total{status=~"4..|5.."}[5m])
```

## 🎨 Grafana Dashboard Features

- **System Overview**: Key metrics at a glance
- **Blockchain Monitoring**: Node status and activity
- **Performance Metrics**: Response times and throughput
- **Security Monitoring**: Login attempts and failures
- **Business Metrics**: User registrations and certificate issuance

## 🔄 Maintenance

### Regular Tasks
- Monitor disk usage for Prometheus data
- Review alert rules and thresholds
- Update dashboard configurations
- Clean up old metrics data

### Scaling Considerations
- Increase Prometheus retention for longer history
- Add more exporters for detailed system monitoring
- Configure external alerting (Slack, email)
- Set up log aggregation (ELK stack)

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Client Go](https://github.com/prometheus/client_golang)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

**🎯 Your BlockCred system now has enterprise-grade monitoring!**

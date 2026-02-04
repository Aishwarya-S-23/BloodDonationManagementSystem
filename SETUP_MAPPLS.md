# 🚀 Mappls API Setup Guide

## Prerequisites

1. **Mappls Account**: Sign up at [https://apis.mappls.com/console/](https://apis.mappls.com/console/)
2. **Static API Key**: Generate a REST API Key (not SDK key)
3. **Node.js Environment**: Version 14+ recommended

## Configuration Steps

### 1. Environment Setup

Create/update your `backend/.env` file:

```bash
# Copy from backend/env.example and add:
MAPPLS_API_KEY=your_actual_mappls_static_key_here

# Example (replace with your real key):
MAPPLS_API_KEY=abcd1234-5678-90ef-ghij-klmnopqrstuv
```

### 2. API Key Validation

Your Mappls API key should:
- ✅ Be a **REST API Key** (not SDK key)
- ✅ Have access to all required APIs
- ✅ Be properly activated in your Mappls console
- ✅ Have sufficient quota for production use

### 3. API Permissions Required

Ensure your API key has access to:

```json
{
  "apis": [
    "geocode",
    "rev_geocode",
    "nearby_search",
    "distance_matrix_eta",
    "place_detail"
  ]
}
```

## Testing the Integration

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

### 2. Test API Endpoints

#### Test Geocoding
```bash
curl -X POST http://localhost:5001/api/hospitals/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bloodGroup": "A+",
    "component": "whole",
    "units": 2,
    "urgency": "high",
    "deadline": "2024-01-25T10:00:00Z",
    "address": "AIIMS Hospital, New Delhi"
  }'
```

#### Test Place Details
```bash
curl http://localhost:5001/api/hospitals/place-details/PLACE_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Verify Logs

Check backend console for:
```
✅ Mappls API connected successfully
✅ Geocoding: AIIMS Hospital, New Delhi → [28.5672, 77.2100]
✅ Nearby search completed: 5 blood banks found within 5km
✅ ETA calculation: Hospital → Blood Bank A = 15 minutes
```

## Troubleshooting

### Common Issues

#### 1. **API Key Invalid**
```
Error: Mappls API authentication failed
```
**Solution**: Verify your API key in Mappls console and ensure it's a REST API key

#### 2. **Quota Exceeded**
```
Error: Mappls API quota exceeded, falling back to OpenStreetMap
```
**Solution**: Upgrade your Mappls plan or wait for quota reset

#### 3. **Geocoding Failed**
```
Error: Unable to locate the provided address
```
**Solution**: Provide more specific address or use coordinates directly

#### 4. **Rate Limiting**
```
Error: Too many requests
```
**Solution**: The system automatically queues requests. Reduce request frequency.

### Fallback Behavior

When Mappls API is unavailable, the system automatically falls back to:

- **OpenStreetMap Nominatim**: For geocoding/reverse geocoding
- **Overpass API**: For nearby facility search
- **Haversine Distance**: For ETA estimation

## API Quota Management

### Free Tier Limits
- **Geocode API**: 5,000 requests/day
- **Nearby API**: 10,000 requests/day
- **Distance Matrix**: 2,500 requests/day

### Production Recommendations
- **Monitor Usage**: Set up alerts at 80% quota usage
- **Caching**: Implement Redis for frequently accessed locations
- **Load Balancing**: Distribute requests across multiple API keys if needed

## Performance Optimization

### Caching Strategy
```javascript
// Automatic caching in MapplsService
this.cache = new Map();
this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
```

### Request Optimization
- **Batching**: Multiple destinations in single Distance Matrix call
- **Filtering**: Pre-filter blood banks before ETA calculation
- **Queuing**: Rate-limited request processing

## Security Considerations

### API Key Protection
- ✅ Never expose in frontend code
- ✅ Store only in backend environment variables
- ✅ Rotate keys regularly in production
- ✅ Use IP restrictions in Mappls console

### Data Privacy
- ✅ Location data anonymized after processing
- ✅ No personal data sent to external APIs
- ✅ Compliance with healthcare data regulations

## Monitoring & Analytics

### Health Check Endpoint
```bash
curl http://localhost:5001/health
```

### Service Status
```javascript
const status = mapplsService.getHealthStatus();
// Returns: { mapplsConfigured: true, activeRequests: 2, queueLength: 0 }
```

### Monitoring Dashboard
- **API Response Times**: Track Mappls API performance
- **Fallback Usage**: Monitor OpenStreetMap dependency
- **Geocoding Success Rate**: Address resolution accuracy
- **ETA Accuracy**: Compare estimated vs. actual times

## Production Deployment

### Environment Variables
```bash
# Production environment
NODE_ENV=production
MAPPLS_API_KEY=your_production_key
REDIS_URL=redis://your-redis-instance
MONGO_URI=mongodb://your-prod-db
```

### Scaling Considerations
- **Multiple API Keys**: Rotate between keys for higher quotas
- **Geographic Sharding**: Different keys for different regions
- **Caching Layer**: Redis cluster for high availability

## Support & Resources

### Mappls Documentation
- **API Console**: https://apis.mappls.com/console/
- **Developer Docs**: https://apis.mappls.com/playground/
- **Support**: support@mappls.com

### System Documentation
- **README_MAPPLS_SYSTEM.md**: Complete technical implementation
- **API Endpoints**: `/api/hospitals/requests` (with location)
- **Monitoring**: `/health` endpoint for service status

---

## 🎯 Quick Start Checklist

- [ ] Sign up for Mappls account
- [ ] Generate REST API key
- [ ] Add `MAPPLS_API_KEY` to `backend/.env`
- [ ] Test geocoding with sample address
- [ ] Verify nearby search functionality
- [ ] Confirm ETA calculations work
- [ ] Test fallback to OpenStreetMap
- [ ] Deploy to production with monitoring

**Your blood donation system is now powered by intelligent, traffic-aware location intelligence! 🚀**


# Shared API Specification

## Overview
Shared API connecting **0g App Builder** and **Vibecoin Cards** marketplace.

**Base URL:** `https://vibecoin-cards.vercel.app/api/v1`

## Authentication
All write operations require a signed message from the creator's wallet.

```typescript
// Headers
{
  "x-wallet-address": "0x1234...",
  "x-signature": "0xabc...",  // Sign: "vibecoin-{timestamp}"
  "x-timestamp": "1705123456"
}
```

---

## Endpoints

### 1. Register App (from App Builder)
**POST** `/api/v1/apps`

Called when a developer finishes building an app in 0g App Builder.

```typescript
// Request
{
  "name": "MyAwesomeApp",
  "symbol": "MAA",           // 3-5 chars, uppercase
  "category": "AI",          // AI | DeFi | Gaming | Creator
  "description": "An AI-powered chat app built on 0G",
  "logo": "https://...",     // URL to app logo
  "appUrl": "https://...",   // Deployed app URL
  "sourceUrl": "https://...", // Optional: GitHub/source
  "creatorAddress": "0x1234..."
}

// Response
{
  "success": true,
  "token": {
    "id": "uuid-here",
    "name": "MyAwesomeApp",
    "symbol": "MAA",
    "category": "AI",
    "score": 10,
    "price": 0.01,
    "marketCap": 10000,
    "createdAt": "2024-01-18T...",
    "marketplaceUrl": "https://vibecoin-cards.vercel.app/marketplace/uuid-here"
  }
}
```

### 2. List All Apps/Tokens
**GET** `/api/v1/apps`

```typescript
// Query params
?category=AI           // Filter by category
&creator=0x1234...     // Filter by creator
&sortBy=score          // score | price | volume | holders
&limit=20
&offset=0

// Response
{
  "apps": [
    {
      "id": "uuid",
      "name": "NeuroAI",
      "symbol": "NEUR",
      "category": "AI",
      "description": "...",
      "logo": "/logos/neuroai.svg",
      "appUrl": "https://neuroai.app",
      "score": 92,
      "price": 2.45,
      "priceChange24h": 12.5,
      "volume24h": 1250000,
      "holders": 4500,
      "marketCap": 24500000,
      "creatorAddress": "0x1234...",
      "createdAt": "2024-01-15"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 3. Get Single App/Token
**GET** `/api/v1/apps/:id`

```typescript
// Response
{
  "app": {
    "id": "uuid",
    "name": "NeuroAI",
    "symbol": "NEUR",
    // ... all fields
    "priceHistory": [
      { "timestamp": "2024-01-17", "price": 2.30, "volume": 500000 },
      { "timestamp": "2024-01-18", "price": 2.45, "volume": 750000 }
    ]
  }
}
```

### 4. Update App Metrics (webhook)
**PATCH** `/api/v1/apps/:id`

Called by App Builder to update app metrics (usage, etc.)

```typescript
// Request
{
  "metrics": {
    "dailyActiveUsers": 1500,
    "totalUsers": 15000,
    "revenue": 5000  // USD
  }
}

// Response
{
  "success": true,
  "newScore": 85  // Recalculated based on metrics
}
```

### 5. Get Creator Portfolio
**GET** `/api/v1/creators/:address`

```typescript
// Response
{
  "creator": {
    "address": "0x1234...",
    "appsCreated": 3,
    "totalEarnings": 15000,
    "apps": [
      { "id": "...", "name": "App1", "symbol": "AP1", "score": 85 },
      { "id": "...", "name": "App2", "symbol": "AP2", "score": 72 }
    ]
  }
}
```

---

## Integration Flow

### App Builder → Vibecoin (New App)
```
1. User builds app in 0g App Builder
2. User clicks "Launch Token"
3. App Builder calls POST /api/v1/apps
4. Vibecoin creates token, returns marketplace URL
5. App Builder shows "View on Marketplace" link
```

### Vibecoin → App Builder (Fork/Build)
```
1. User views token on Vibecoin marketplace
2. User clicks "Build Similar App"
3. Redirects to: 0g-vibe.pages.dev/?fork={appId}&category={category}
4. App Builder loads template based on category
```

---

## CORS Configuration
```typescript
// Allowed origins
const ALLOWED_ORIGINS = [
  'https://0g-vibe.pages.dev',
  'https://vibecoin-cards.vercel.app',
  'http://localhost:3000',
  'http://localhost:3002'
];
```

---

## Webhook Events (Future)
App Builder can subscribe to events:
- `token.traded` - When someone buys/sells
- `token.graduated` - When token hits $69k market cap
- `token.ranked_up` - When card rank increases

---

## Quick Start for 0g App Builder

```typescript
// Add "Launch Token" button
async function launchToken(appData) {
  const response = await fetch('https://vibecoin-cards.vercel.app/api/v1/apps', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wallet-address': walletAddress,
      'x-signature': await signMessage(`vibecoin-${Date.now()}`),
      'x-timestamp': Date.now().toString()
    },
    body: JSON.stringify({
      name: appData.name,
      symbol: appData.symbol,
      category: appData.category,
      description: appData.description,
      logo: appData.logoUrl,
      appUrl: appData.deployedUrl,
      creatorAddress: walletAddress
    })
  });

  const { token } = await response.json();

  // Redirect to marketplace
  window.open(token.marketplaceUrl, '_blank');
}
```

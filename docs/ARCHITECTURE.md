# Technical Architecture & System Design: NOVA PULSE

## 1. Architectural Philosophy
NOVA PULSE is engineered according to the principles of **high developer maintainability, zero unnecessary complexity, and free-tier compatibility**:
- No cumbersome Kubernetes, distributed Redis clusters, or bloated microservices.
- Clean separation of concerns between client UI, RESTful API layer, relational persistent storage, and AI processing copilot.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NOVA PULSE WEB CLIENT                           │
│  ┌──────────────────────┬──────────────────────┬────────────────────┐  │
│  │  Shopper & Bundles   │   Merchant Copilot   │ Support & ROI Desk │  │
│  │   (Tailwind/React)   │   (Voice & 1-Tap)    │   (Auto-Refunds)   │  │
│  └──────────┬───────────┴──────────┬───────────┴──────────┬─────────┘  │
└─────────────┼──────────────────────┼──────────────────────┼────────────┘
              │                      │                      │             
              ▼                      ▼                      ▼             
┌────────────────────────────────────────────────────────────────────────┐
│                         FLASK REST API SERVICE                         │
│  ├── /api/stores        (SCI Score Calculation & Inventory Toggles)    │
│  ├── /api/orders        (Multi-Store Basket Checkout & Route Clust.)   │
│  ├── /api/retention     (3-Order Ladder Progress Tracker)              │
│  ├── /api/support       (Autonomous Dispute Triage & Instant UPI)      │
│  └── /api/analytics     (Live Turnaround Metrics & ROI Simulator)      │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │                    
                   ▼                                 ▼                    
     ┌───────────────────────────┐     ┌───────────────────────────┐      
     │   SQLite Database Layer   │     │   Google Gemini API       │      
     │  (Stores, Products,       │     │   (Voice Inventory Parser │      
     │   Orders, Tickets)        │     │    & Dispute Auto-Triage) │      
     └───────────────────────────┘     └───────────────────────────┘      
```

---

## 2. Component Directory Structure
```
PromptWars/
├── backend/
│   ├── app.py                 # Application factory registering modular blueprints
│   ├── config.py              # Environment configuration (secrets, db path, ports)
│   ├── database.py            # SQLite schema initialization & realistic seed data
│   ├── routes/
│   │   ├── stores.py          # Store & inventory management routes
│   │   ├── orders.py          # Bundles, orders, and checkout routes
│   │   ├── retention.py       # Customer 3-order ladder progression routes
│   │   ├── support.py         # Autonomous instant refund & dispute routes
│   │   └── analytics.py       # Turnaround metrics & ROI simulation routes
│   ├── services/
│   │   ├── inventory_service.py # Stock Confidence Index (SCI) algorithm
│   │   ├── retention_service.py # 3-order funnel tracker (31% -> 54% -> 72%)
│   │   └── gemini_service.py    # Gemini API voice parser with fallback
│   ├── tests/
│   │   └── test_api.py        # Automated test suite (8/8 passing)
│   ├── requirements.txt       # Production dependencies
│   └── run.py                 # Server runner
│
├── frontend/
│   ├── index.html             # Application entry point with metadata
│   ├── vite.config.js         # Vite configuration with backend proxy
│   ├── tailwind.config.js     # Responsive utility framework
│   └── src/
│       ├── main.jsx           # Root DOM renderer
│       ├── App.jsx            # Portal switcher & state coordinator
│       ├── components/        # Reusable UI widgets (Navbar, Badges, Cards)
│       ├── pages/             # 4 Portals (Shopper, Merchant, Support, ROI)
│       └── services/api.js    # API service client
│
├── presentation/
│   ├── generate_pitch_deck.py # Automated 16:9 PPTX generator
│   └── NOVA_PULSE_Pitch_Deck.pptx # Editable PowerPoint deck
│
└── docs/                      # Architectural, business, and diagnostic documentation
```

---

## 3. Stock Confidence Index (SCI) Algorithm
The Stock Confidence Index evaluates live inventory freshness to guarantee zero phantom inventory cancellations:
$$\text{SCI} = \begin{cases} 
99 - (1.5 \times \Delta h) & \text{if } \Delta h \le 2\text{ hrs} \\
95 - (2.0 \times (\Delta h - 2)) & \text{if } 2 < \Delta h \le 6\text{ hrs} \\
87 - (1.0 \times (\Delta h - 6)) & \text{if } 6 < \Delta h \le 24\text{ hrs} \\
\max(30, 69 - (0.5 \times (\Delta h - 24))) & \text{if } \Delta h > 24\text{ hrs}
\end{cases}$$
When stores utilize the 1-Tap Toggle or Gemini AI Voice Sync, $\Delta h$ resets to 0, immediately boosting the store's SCI to 99% and raising its placement priority in multi-store bundle deliveries.

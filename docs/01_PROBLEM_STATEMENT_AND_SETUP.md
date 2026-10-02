# NOVA PULSE — Original Problem Statement, Technology Stack and Local Setup Guide

> **Project Name:** NOVA PULSE — Local Commerce Rescue & Customer Retention Platform  
> **Challenge:** PromptWars Business Rescue Challenge (NOVA CART)  
> **Target GitHub Repository:** [https://github.com/JyothiSriLakshmi-1305/Nova-Pulse](https://github.com/JyothiSriLakshmi-1305/Nova-Pulse)  
> **Live Production URL:** [https://nova-pluse.onrender.com/](https://nova-pluse.onrender.com/)  
> **Documentation Version:** 1.0.0 (Post Phase 1–3 Improvement & Audit)

---

## Table of Contents
1. [Part A: Original Problem Statement](#part-a-original-problem-statement)
   - [1. Business Background: The NOVA CART Reality](#1-business-background-the-nova-cart-reality)
   - [2. The "Leaky Bucket" Crisis Metrics](#2-the-leaky-bucket-crisis-metrics)
   - [3. Customer Survey Findings & Unit Economics](#3-customer-survey-findings--unit-economics)
   - [4. The Three Critical Fault Lines](#4-the-three-critical-fault-lines)
   - [5. Hackathon Challenge Constraints & Budget Cap](#5-hackathon-challenge-constraints--budget-cap)
2. [Part B: Verified Technology Stack](#part-b-verified-technology-stack)
   - [1. Core Technologies & Verified Versions](#1-core-technologies--verified-versions)
   - [2. Architectural Rationale](#2-architectural-rationale)
3. [Part C: Prerequisites](#part-c-prerequisites)
4. [Part D: Beginner-Friendly Local Setup Guide (VS Code)](#part-d-beginner-friendly-local-setup-guide-vs-code)
   - [Step 1: Clone the Repository](#step-1-clone-the-repository)
   - [Step 2: Open in Visual Studio Code](#step-2-open-in-visual-studio-code)
   - [Step 3: Set Up Python Virtual Environment](#step-3-set-up-python-virtual-environment)
   - [Step 4: Install Backend Dependencies](#step-4-install-backend-dependencies)
   - [Step 5: Install Frontend Dependencies](#step-5-install-frontend-dependencies)
   - [Step 6: Configure Environment Variables](#step-6-configure-environment-variables)
   - [Step 7: Initialize Database & Seed Records](#step-7-initialize-database--seed-records)
   - [Step 8: Run the Application (Dual Terminal)](#step-8-run-the-application-dual-terminal)
   - [Step 9: Access and Verify in Browser](#step-9-access-and-verify-in-browser)
   - [Step 10: How to Safely Stop the Servers](#step-10-how-to-safely-stop-the-servers)
5. [Part E: Troubleshooting Common Local Issues](#part-e-troubleshooting-common-local-issues)

---

## Part A: Original Problem Statement

### 1. Business Background: The NOVA CART Reality
NOVA CART is a hyper-local quick-commerce and neighborhood store aggregator operating across **3 tier-1 and tier-2 Indian metropolitan cities**. The platform connects local customers with **620 registered independent merchants**, including corner grocery stores (kiranas), neighborhood bakeries, organic fresh produce markets, dairy booths, and local pharmacies.

On the surface, top-line platform growth metrics appear promising over the preceding six months:
- **Registered User Base:** Grew from 82,000 to **1,20,000 users** (+46.3%).
- **Monthly Order Volume:** Increased from 31,200 to **38,500 orders/month** (+23.4%).
- **Monthly Gross Revenue:** Rose from ₹21.8 Lakh to **₹26.1 Lakh** (+19.7%).
- **Average Order Value (AOV):** ₹486 across all categories.

### 2. The "Leaky Bucket" Crisis Metrics
Despite healthy headline user acquisition, an operational and financial audit reveals that NOVA CART is suffering from an acute **"Leaky Bucket" syndrome**. The business is expanding its top-line while destroying its bottom-line unit economics:

```
┌───────────────────────────────────────┬───────────────────┬───────────────────┬───────────────────┐
│ Metric                                │ 6 Months Prior    │ Current Crisis    │ Variance / Trend  │
├───────────────────────────────────────┼───────────────────┼───────────────────┼───────────────────┤
│ Registered Users                      │ 82,000            │ 1,20,000          │ +46.3% (Growth)   │
│ Monthly Orders                        │ 31,200            │ 38,500            │ +23.4% (Growth)   │
│ Gross Revenue (Monthly)               │ ₹21.8 Lakh        │ ₹26.1 Lakh        │ +19.7% (Growth)   │
│ Repeat Purchase Rate (30-Day)         │ 41.0%             │ 27.0%             │ -34.1% (CRASH)    │
│ Order Cancellation Rate               │ 6.0%              │ 11.0%             │ +83.3% (DOUBLED)  │
│ Cancelled Orders per Month            │ ~1,872            │ ~4,235 orders     │ +126% Lost Orders │
│ Average Delivery Turnaround           │ 29 minutes        │ 37 minutes        │ +27.6% (Slower)   │
│ Support Tickets Raised / Month        │ 3,100             │ 5,900 tickets     │ +90.3% (Surge)    │
│ Average Support Resolution Time       │ 2.4 hours         │ 9.2 hours         │ +283% (Paralyzed) │
│ Monthly Promotional / Marketing Burn  │ ₹9.5 Lakh         │ ₹17.0 Lakh        │ +78.9% (65% Rev!) │
│ Unredeemed / Wasted Coupon Spend      │ 22.0%             │ 44.0%             │ +100% Ineffective │
│ Churned Customers with ≥ 4★ Rating    │ N/A               │ 61.0%             │ Churn Paradox     │
└───────────────────────────────────────┴───────────────────┴───────────────────┴───────────────────┘
```

### 3. Customer Survey Findings & Unit Economics
A deep-dive investigation into 1,200 churned and active customers revealed the following key qualitative and behavioral insights:
- **The Churn Paradox:** **61% of customers who ceased ordering had given NOVA CART a 4-star or 5-star rating** on their initial orders. Customers genuinely loved supporting local neighborhood stores, but abandoned the platform due to unpredictable order cancellations and agonizing customer support.
- **Support Paralyzation:** Support requests exploded to 5,900/month. Because support executives were toggling between 3 disconnected internal dashboards (telephony, manual spreadsheets, and bank refund consoles), average dispute resolution dragged to **9.2 hours**.
- **Marketing Waste:** ₹17.0 Lakh/month is burned on blanket marketing promotions (representing 65.1% of gross platform revenue). Crucially, **58% of this promotional spend was dedicated to acquiring single-order discount-hunters** who immediately uninstalled the app after redeeming a subsidized introductory voucher.

### 4. The Three Critical Fault Lines
Forensic failure analysis categorized 94% of operational breakdowns into three core structural fault lines:

#### Fault Line 1: Phantom Inventory (35% of All Order Cancellations)
- Independent kirana merchants and local bakers manually maintain physical shop inventory while serving in-person walk-in customers.
- Merchants updated their online stock catalogs on average only once every 1 to 3 days.
- When an online customer ordered items marked "In Stock", the merchant frequently discovered the shelf was empty due to walk-in foot traffic.
- This triggered **post-checkout order cancellations** or forced substitutions, devastating customer trust.

#### Fault Line 2: The 3-Order Retention Cliff
Platform retention data revealed a distinct behavioral threshold:
- **54%** of new app visitors placed Order #1 (driven by promotional coupons).
- Only **31%** placed Order #2 within 30 days.
- **The Golden Inflection Point:** Customers who reached and completed **Order #3 demonstrated a 72% repeat probability** in subsequent months.
- NOVA CART lacked any structured gamification or habit-formation mechanism to bridge new customers across the critical chasm between Order 1 and Order 3.

#### Fault Line 3: Partner Merchant Friction (18% of Cancellations)
Interviews with 100 partner kiranas, bakers, and grocers identified severe merchant dissatisfaction:
- **39% of merchants** reported that maintaining an online digital catalog took too much manual effort.
- **23% of merchants** actively rejected or cancelled incoming online orders during peak evening walk-in hours because they were overwhelmed and had no throttling mechanism.
- **18% of partner stores** were actively evaluating leaving the NOVA CART network.

### 5. Hackathon Challenge Constraints & Budget Cap
The PromptWars Business Rescue Challenge established strict operating boundaries:
1. **Implementation Budget Cap:** Maximum 6-month budget of **₹25.0 Lakh**. Solutions exceeding this cap are disqualified.
2. **Asset-Light Architecture:** No capital expenditure on company-owned dark stores, large vehicle fleets, or heavy hardware.
3. **Repository Submission Limits:** Git repository must remain strictly **under 10 MB** (no committed virtual environments, large binaries, or bulky media).
4. **Git Discipline:** Must be maintained on a single public branch (`main`) with no broken workflows or secret leaks.
5. **Preservation of Stakeholder Workflows:** Real-world solutions must support the triad of local commerce: the **Customer**, the **Merchant**, and the **Operations Admin**.

---

## Part B: Verified Technology Stack

The NOVA PULSE platform was purposefully architected to deliver high performance, deterministic reliability, and free-tier deployment compatibility without expensive cloud subscriptions or bloated dependencies.

### 1. Core Technologies & Verified Versions

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   NOVA PULSE TECH STACK                                │
├───────────────────────┬───────────────────────────┬────────────────────────────────────┤
│ Layer                 │ Technology & Version      │ Exact Role in NOVA PULSE           │
├───────────────────────┼───────────────────────────┼────────────────────────────────────┤
│ Frontend Framework    │ React 18.3.1              │ Component tree, state management   │
│ Build Tool & DevServer│ Vite 5.4.2                │ Fast HMR, ESM bundling, API proxy  │
│ CSS / UI Design       │ Tailwind CSS 3.4.10       │ Responsive modern UI utility classes│
│ Iconography           │ Lucide React 0.344.0      │ Lightweight, accessible vector icons│
│ Gamification UI       │ Canvas-Confetti 1.9.2     │ Visual celebration on ladder unlock│
│ Code Splitting        │ React.lazy & Suspense     │ Lazy-loading pages to optimize LCP │
├───────────────────────┼───────────────────────────┼────────────────────────────────────┤
│ Backend Framework     │ Python 3.10+ (Flask 3.0.0)│ Modular RESTful API controller     │
│ CORS Middleware       │ Flask-CORS 4.0.0          │ Cross-origin security for /api/*   │
│ HTTP Client           │ Requests 2.32.5           │ Google Gemini REST API integrations│
│ Environment Mgmt      │ Python-Dotenv 1.0.1       │ Zero-leak environment variable load│
│ Production WSGI       │ Gunicorn 21.2.0           │ Production WSGI server (Render)    │
│ Slide Deck Generator  │ Python-PPTX 1.0.2         │ Programmatic hackathon deck output │
├───────────────────────┼───────────────────────────┼────────────────────────────────────┤
│ Relational Database   │ SQLite 3 (novapulse.db)   │ Persistent storage with foreign keys│
│ Database Indexing     │ 5 Custom B-Tree Indexes   │ Eliminates full table scans        │
│ Query Optimization    │ Batched IN (...) Queries  │ Eliminates N+1 query overhead      │
├───────────────────────┼───────────────────────────┼────────────────────────────────────┤
│ AI Intelligence       │ Google Gemini 1.5 Flash   │ Natural language voice stock parser│
│ AI Fallback Engine    │ Deterministic Regex Parser│ 100% offline & key-free fallback   │
└───────────────────────┴───────────────────────────┴────────────────────────────────────┘
```

### 2. Architectural Rationale
- **Why Flask + SQLite?** For a localized commerce platform operating across hundreds of stores, a centralized microservices mesh introduces unnecessary latency, distributed transaction failures, and cloud hosting bills. Flask with an indexed SQLite instance delivers sub-15 millisecond response times locally and runs within Render's free tier.
- **Why React 18 + Vite?** Instant compilation, native ES modules, and sub-1-second hot module replacement ensure exceptional developer efficiency. Route-level code splitting via `React.lazy()` ensures initial JavaScript payloads remain small.
- **Why Gemini 1.5 Flash with Deterministic Fallback?** Gemini 1.5 Flash provides sub-second natural language interpretation for non-tech-savvy merchants speaking colloquial phrases (e.g., *"We just got 10 packets of curd and milk is finished"*). The built-in deterministic fallback ensures that even during network partitions or when API quotas expire, zero merchant workflows break.

---

## Part C: Prerequisites

Before setting up NOVA PULSE on your local machine, ensure you have the following installed:

1. **Git:** Version 2.30+ installed (`git --version`).
2. **Python:** Version 3.10, 3.11, 3.12, or 3.13 installed (`python --version` or `python3 --version`).
3. **Node.js & npm:** Node.js version 18.x or 20.x LTS with npm (`node -v` and `npm -v`).
4. **Code Editor:** Visual Studio Code (VS Code recommended) or any modern editor.
5. **Modern Browser:** Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave.

---

## Part D: Beginner-Friendly Local Setup Guide (VS Code)

Follow this step-by-step procedure to set up and run NOVA PULSE on your local workstation. Both Windows PowerShell and macOS/Linux terminal commands are provided.

### Step 1: Clone the Repository
Open your terminal (or Command Prompt) and clone the repository:

**Windows PowerShell:**
```powershell
git clone https://github.com/JyothiSriLakshmi-1305/Nova-Pulse.git
cd Nova-Pulse
```

**macOS / Linux:**
```bash
git clone https://github.com/JyothiSriLakshmi-1305/Nova-Pulse.git
cd Nova-Pulse
```

---

### Step 2: Open in Visual Studio Code
Launch VS Code directly in the project directory:

```bash
code .
```

---

### Step 3: Set Up Python Virtual Environment
Creating an isolated virtual environment prevents conflicts with existing Python packages on your computer.

**Windows PowerShell:**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(If you see an execution policy error on Windows, see [Troubleshooting Common Errors](#part-e-troubleshooting-common-errors)).*

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

When activated, you will see `(venv)` prepended to your terminal prompt.

---

### Step 4: Install Backend Dependencies
With your virtual environment active, install the Python dependencies:

```bash
pip install -r backend/requirements.txt
```

This installs Flask, Flask-CORS, requests, python-dotenv, gunicorn, and python-pptx.

---

### Step 5: Install Frontend Dependencies
Navigate into the `frontend` folder and install the Node.js packages:

```bash
cd frontend
npm install
cd ..
```

---

### Step 6: Configure Environment Variables
Copy the provided `.env.example` file to create your active `.env` file in the project root:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

**Understanding `.env` Variables:**
Open the newly created `.env` file in VS Code. It contains:
```ini
# Flask Server Configuration
PORT=5000
DEBUG=True
SECRET_KEY=nova-pulse-hackathon-rescue-2026

# Google Gemini API Key (Optional)
# Leave blank to use the deterministic offline fallback parser!
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

> [!NOTE]
> **Is a Gemini API Key mandatory?**  
> **No.** NOVA PULSE features a built-in deterministic fallback engine. If `GEMINI_API_KEY` is omitted or empty, the application gracefully routes all natural-language inventory updates and dispute resolutions through its local keyword/regex parser.

---

### Step 7: Initialize Database & Seed Records
Initialize the SQLite database schema and load realistic seed data (including 4 partner stores, curated multi-store bundles, categorized products, customer profiles, and initial support tickets):

**Windows / macOS / Linux:**
```bash
python backend/database.py
```

**Expected Console Output:**
```
Database initialized and seeded with realistic demo data at D:\PromptWars\backend\novapulse.db
```

---

### Step 8: Run the Application (Dual Terminal)

You will need **two terminal tabs** in VS Code (or two command prompt windows):

#### Terminal 1 — Backend API Service (Port 5000):
Ensure `(venv)` is activated:
```bash
python backend/app.py
```
*Output: Backend running on `http://127.0.0.1:5000`.*

#### Terminal 2 — Frontend Development Server (Port 3000):
Open a new terminal tab in VS Code:
```bash
cd frontend
npm run dev
```
*Output: Local server running on `http://localhost:3000/`.*

---

### Step 9: Access and Verify in Browser
Open your browser and navigate to:
```
http://localhost:3000
```

1. **Customer View:** Browse stores, add items to cart, place single-store or multi-store bundle orders, check the SCI badges, and track live order status.
2. **Merchant View:** Use the top-bar role switcher to switch to **Merchant (Green Valley Organics)**. Test the 1-tap stock toggles, toggle **Rush Mode**, or update order fulfillment from *Placed* to *Preparing* and *Ready*.
3. **Admin Console:** Switch to **Admin Console** to inspect the **Platform Live Orders Feed**, test the 6-month **ROI Simulator**, and monitor the autonomous dispute resolution desk.

---

### Step 10: How to Safely Stop the Servers
When you are finished testing:
1. In Terminal 1 (Backend), press `Ctrl + C`.
2. In Terminal 2 (Frontend), press `Ctrl + C`.
3. To deactivate the Python virtual environment:
   ```bash
   deactivate
   ```

---

## Part E: Troubleshooting Common Errors

### 1. Windows PowerShell: "Execution of scripts is disabled on this system"
- **Cause:** Windows default security policy restricts running PowerShell scripts (`Activate.ps1`).
- **Resolution:** Open PowerShell as Administrator or run this command in your current VS Code terminal session:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\venv\Scripts\Activate.ps1
  ```

### 2. Port 5000 or Port 3000 Already in Use
- **Cause:** Another background process or previous terminal session is holding port 5000 (Flask) or port 3000 (Vite).
- **Resolution (Windows):**
  ```powershell
  # Find PID using port 5000
  netstat -ano | findstr :5000
  # Kill the process by PID (e.g., PID 12344)
  taskkill /PID 12344 /F
  ```
- **Resolution (macOS / Linux):**
  ```bash
  lsof -ti :5000 | xargs kill -9
  ```

### 3. Missing Gemini API Key Warnings
- **Cause:** `GEMINI_API_KEY` was not supplied in `.env`.
- **Resolution:** This is completely normal and intentional. The server logs will display:  
  `[INFO] gemini_service: GEMINI_API_KEY not configured. Running in deterministic fallback mode.`  
  All merchant inventory parsing and autonomous customer dispute triage will execute smoothly through the local regex/keyword parser.

### 4. SQLite Database "OperationalError: database is locked"
- **Cause:** Multiple concurrent processes attempting uncommitted write transactions simultaneously.
- **Resolution:** The database connection in `backend/database.py` uses connection timeouts. If this occurs during aggressive manual stress-testing, restart the backend server (`Ctrl + C` followed by `python backend/app.py`).

### 5. Frontend Fails to Fetch from Backend (Network Error / CORS)
- **Cause:** Backend server is not running on port 5000, or `frontend/vite.config.js` proxy cannot connect to `http://127.0.0.1:5000`.
- **Resolution:** Ensure Terminal 1 is running `python backend/app.py` before making requests from the frontend. Verify `http://127.0.0.1:5000/api/health` returns `{"status": "healthy"}` directly in your browser.

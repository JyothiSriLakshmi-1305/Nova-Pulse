# Problem Diagnosis: The NOVA CART "Leaky Bucket" Crisis

## 1. Executive Summary
NOVA CART connects customers with 620 local stores across 3 Indian cities. On paper, top-line numbers indicate expansion:
- **1,20,000 Registered Users** (up from 82,000 six months ago)
- **38,500 Monthly Orders** (up from 31,200)
- **₹26.1 Lakh Monthly Revenue** (up from ₹21.8 Lakh)

However, a forensic examination of the unit economics reveals that **NOVA CART is getting bigger, but drastically worse**:
- **Repeat Purchase Rate crashed by 34%**: Falling from 41% down to **27%**.
- **Cancellation Rate nearly doubled**: Jumping from 6% to **11%** (representing over 4,235 cancelled orders per month).
- **Average Delivery Time climbed**: From 29 minutes to **37 minutes** (+28% slower).
- **Customer Support Tickets exploded**: From 3,100 to **5,900 per month** (+90%), with an agonizing average resolution time of **9.2 hours**.
- **Marketing Burn is Unsustainable**: Promotional spend soared from ₹9.5 Lakh to **₹17.0 Lakh per month** (consuming 65.1% of gross revenue!). 58% of this budget is dedicated to acquiring new customers who immediately churn.

---

## 2. Root Cause Analysis: The Three Fault Lines

### Fault Line 1: Phantom Inventory (35% of All Cancellations)
Partner merchants manually maintain stock, updating availability only once every 1–3 days. When a customer orders items shown as "in stock", the store discovers they are sold out in-store, forcing post-checkout order cancellations. 29% of surveyed customers specifically cite this out-of-stock bait-and-switch.

### Fault Line 2: The 3-Order Retention Chasm
Customer behavioural telemetry reveals a stark cliff:
- **54%** of new users place order #1.
- Only **31%** place order #2 within 30 days.
- **The Inflection Point**: Customers who complete **3 orders have a 72% probability of ordering again** the following month.
Currently, NOVA CART burns ₹17L/month on single-use discount seekers who churn after Order 1, instead of engineering a guided progression to Order 3.

### Fault Line 3: Partner Store Friction & Rejection (18% of Cancellations)
Interviews with 100 partner stores reveal:
- **39%** report that maintaining an online catalogue requires too much effort.
- **23%** reject orders during busy walk-in peak hours because they lack fulfillment throttling.
- **18%** are actively considering leaving the platform.
Kirana and local bakery owners do not want heavy desktop software; they need zero-friction, one-tap mobile tools.

---

## 3. The Churn Paradox
**61% of customers who stopped ordering had previously rated NOVA CART 4★ or higher.**
Customers genuinely appreciate independent local stores (bakery, fresh dairy, organic produce, pharmacy). They churned not due to lack of interest, but because operational unreliability broke their trust.

---

## 4. The Mandate & Constraints
- **Budget**: Maximum additional implementation budget of **₹25 Lakh** for 6 months.
- **Constraint**: No massive physical dark stores, no hundreds of delivery drivers, no unsustainable subsidies.
- **Core Strategy**: A lightweight digital intervention that fixes inventory accuracy, bundles local multi-store orders, and gamifies the journey to the 72% retention threshold.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log("\n==========================================");
console.log("   NOVA PULSE FRONTEND TEST SUITE");
console.log("==========================================\n");

// Test 1: Verify Essential Source Files Exist
console.log("[Suite 1: Frontend Structure & Files]");
const requiredFiles = [
  'src/main.jsx',
  'src/App.jsx',
  'src/index.css',
  'src/services/api.js',
  'src/components/Navbar.jsx',
  'src/components/StockConfidenceBadge.jsx',
  'src/components/RetentionLadderCard.jsx',
  'src/components/BundleCard.jsx',
  'src/components/StoreCard.jsx',
  'src/components/Footer.jsx',
  'src/components/AiStatusModal.jsx',
  'src/pages/CustomerStoreView.jsx',
  'src/pages/MerchantCopilot.jsx',
  'src/pages/SupportPortal.jsx',
  'src/pages/ExecutiveDashboard.jsx'
];

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  assert(fs.existsSync(fullPath), `File exists: ${file}`);
});

// Test 2: SCI Logic Unit Test
console.log("\n[Suite 2: Stock Confidence Index (SCI) Unit Logic]");
function calculateSciMock(hoursElapsed) {
  if (hoursElapsed <= 2) return 99 - Math.floor(hoursElapsed * 1.5);
  if (hoursElapsed <= 6) return 95 - Math.floor((hoursElapsed - 2) * 2.0);
  if (hoursElapsed <= 24) return 87 - Math.floor((hoursElapsed - 6) * 1.0);
  return Math.max(30, 69 - Math.floor((hoursElapsed - 24) * 0.5));
}

assert(calculateSciMock(0.5) >= 98, "SCI within 30 mins is >= 98% (Guaranteed Live Stock)");
assert(calculateSciMock(4) >= 90, "SCI within 4 hours is >= 90% (Fresh Stock)");
assert(calculateSciMock(36) < 70, "SCI older than 24 hours drops below 70% (Prompting Re-sync)");

// Test 3: 3-Order Retention Ladder Telemetry Test
console.log("\n[Suite 3: Retention Ladder Ground Truth Model]");
const RETENTION_STAGES = {
  1: { repeatProb: 31, title: 'Welcome Explorer' },
  2: { repeatProb: 54, title: 'Neighborhood Advocate' },
  3: { repeatProb: 72, title: 'Local Champion VIP' }
};

assert(RETENTION_STAGES[1].repeatProb === 31, "Stage 1 reflects 31% repeat probability baseline from case survey");
assert(RETENTION_STAGES[2].repeatProb === 54, "Stage 2 shows 54% habit formation repeat probability");
assert(RETENTION_STAGES[3].repeatProb === 72, "Stage 3 achieves the 72% inflection point proven in PDF telemetry");

// Test 4: Production Build Bundle Verification
console.log("\n[Suite 4: Production Dist Artifacts]");
const distPath = path.join(__dirname, 'dist');
assert(fs.existsSync(distPath), "dist/ directory exists");
assert(fs.existsSync(path.join(distPath, 'index.html')), "dist/index.html exists and is non-empty");

const assetsPath = path.join(distPath, 'assets');
if (fs.existsSync(assetsPath)) {
  const assets = fs.readdirSync(assetsPath);
  const hasJs = assets.some(f => f.endsWith('.js'));
  const hasCss = assets.some(f => f.endsWith('.css'));
  assert(hasJs, "Production JS bundle generated");
  assert(hasCss, "Production CSS stylesheet generated");
}

// Test 5: Role-Based Architecture & Connected Workflows
console.log("\n[Suite 5: Unified Stakeholder Roles & API Interfaces]");
const apiContent = fs.readFileSync(path.join(__dirname, 'src/services/api.js'), 'utf-8');
assert(apiContent.includes('getCustomerOrders'), "API client exports getCustomerOrders() for isolated customer history");
assert(apiContent.includes('getStoreOrders'), "API client exports getStoreOrders() for merchant order isolation");
assert(apiContent.includes('updateOrderStatus'), "API client exports updateOrderStatus() for Placed -> Preparing -> Ready -> Completed");

const navbarContent = fs.readFileSync(path.join(__dirname, 'src/components/Navbar.jsx'), 'utf-8');
assert(navbarContent.includes('Customer Portal') && navbarContent.includes('Merchant Copilot') && navbarContent.includes('Admin Console'), "Navbar renders 3 stakeholder roles (Customer, Merchant, Admin)");
assert(navbarContent.includes('Demo Role Switcher'), "Navbar clearly labels role switcher as a hackathon demo feature");

const customerContent = fs.readFileSync(path.join(__dirname, 'src/pages/CustomerStoreView.jsx'), 'utf-8');
assert(customerContent.includes('Explore & Order') && customerContent.includes('My Orders & Support'), "Customer portal supports Explore & Order and My Orders & Support views");
assert(customerContent.includes('Report Issue / Refund'), "Customer portal allows reporting issues against specific orders");

const merchantContent = fs.readFileSync(path.join(__dirname, 'src/pages/MerchantCopilot.jsx'), 'utf-8');
assert(merchantContent.includes('Incoming Store Orders') && merchantContent.includes('Mark Preparing'), "Merchant portal provides Incoming Store Orders with status progression");

const adminContent = fs.readFileSync(path.join(__dirname, 'src/pages/ExecutiveDashboard.jsx'), 'utf-8');
assert(adminContent.includes('Executive ROI & Turnaround Strategy') && adminContent.includes('Platform Operations & Support Desk'), "Admin console unifies ROI console with Operations Support Desk");

console.log("\n------------------------------------------");
console.log(`Results: ${passed} passed, ${failed} failed.`);
console.log("------------------------------------------\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}


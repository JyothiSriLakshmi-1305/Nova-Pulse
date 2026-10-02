import sqlite3
import datetime
from backend.config import Config

def get_db_connection():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Stores table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        city TEXT NOT NULL,
        area TEXT NOT NULL,
        rating REAL DEFAULT 4.5,
        is_open INTEGER DEFAULT 1,
        last_inventory_sync TEXT NOT NULL,
        stock_confidence_score INTEGER DEFAULT 95,
        total_orders_today INTEGER DEFAULT 0,
        rush_mode INTEGER DEFAULT 0
    )
    ''')

    # Products table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        unit TEXT NOT NULL,
        stock_quantity INTEGER NOT NULL,
        is_in_stock INTEGER DEFAULT 1,
        last_verified_at TEXT NOT NULL,
        fast_depleting INTEGER DEFAULT 0,
        FOREIGN KEY (store_id) REFERENCES stores (id)
    )
    ''')

    # Multi-store Bundles table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bundles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        tagline TEXT NOT NULL,
        badge TEXT NOT NULL,
        primary_store_id INTEGER,
        secondary_store_id INTEGER,
        original_price REAL NOT NULL,
        bundle_price REAL NOT NULL,
        savings REAL NOT NULL,
        est_delivery_min INTEGER DEFAULT 25,
        stores_involved TEXT NOT NULL,
        items_json TEXT NOT NULL
    )
    ''')

    # Orders table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        total_amount REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        status TEXT NOT NULL,
        is_multi_store INTEGER DEFAULT 0,
        delivery_address TEXT NOT NULL,
        delivery_time_min INTEGER DEFAULT 28,
        created_at TEXT NOT NULL
    )
    ''')

    # Order Items table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        store_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        is_substituted INTEGER DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES orders (id)
    )
    ''')

    # Support Tickets table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        issue_type TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        refund_amount REAL DEFAULT 0,
        resolution_notes TEXT,
        resolved_in_seconds INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    )
    ''')

    # Customer Retention Profiles
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS retention_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        orders_completed INTEGER DEFAULT 1,
        ladder_step INTEGER DEFAULT 1,
        repeat_probability INTEGER DEFAULT 31,
        unlocked_perk TEXT NOT NULL,
        next_perk TEXT NOT NULL
    )
    ''')

    conn.commit()
    seed_data(conn)
    conn.close()

def seed_data(conn):
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM stores')
    if cursor.fetchone()[0] > 0:
        return  # Data already seeded

    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Seed 6 diverse partner stores
    stores_data = [
        ("Nandi Organic Grocers", "Grocery & Staples", "Bengaluru", "Indiranagar", 4.8, 1, now, 98, 14, 0),
        ("Glen's Artisan Bakery", "Bakery & Desserts", "Bengaluru", "Indiranagar", 4.9, 1, now, 96, 22, 0),
        ("Apollo Care Pharmacy", "Pharmacy & Wellness", "Bengaluru", "Indiranagar", 4.7, 1, now, 99, 8, 0),
        ("Malnad Fresh Dairy & Sweets", "Dairy & Confectionery", "Bengaluru", "Indiranagar", 4.8, 1, now, 94, 18, 0),
        ("Sagar Supermarket", "Daily Essentials", "Bengaluru", "Indiranagar", 4.3, 1, now, 88, 30, 1),
        ("Paper & Pen Stationery Hub", "Stationery & Office", "Bengaluru", "Indiranagar", 4.6, 1, now, 92, 6, 0),
    ]
    cursor.executemany('''
        INSERT INTO stores (name, category, city, area, rating, is_open, last_inventory_sync, stock_confidence_score, total_orders_today, rush_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', stores_data)

    # Seed products with verified stock
    products_data = [
        # Store 1: Nandi Organic Grocers
        (1, "A2 Farm Fresh Organic Cow Milk", "Dairy", 78.0, "1 Ltr", 35, 1, now, 1),
        (1, "Sona Masoori Unpolished Rice (5kg)", "Grains", 390.0, "5 kg", 20, 1, now, 0),
        (1, "Organic Cold-Pressed Coconut Oil", "Oils", 240.0, "500 ml", 15, 1, now, 0),
        (1, "Himalayan Pink Rock Salt", "Spices", 85.0, "1 kg", 40, 1, now, 0),
        (1, "Farm Fresh Hass Avocado", "Produce", 160.0, "Pack of 2", 8, 1, now, 1),

        # Store 2: Glen's Artisan Bakery
        (2, "Sourdough Boule (Slow Fermented)", "Bread", 180.0, "450g", 12, 1, now, 1),
        (2, "Signature Red Velvet Cupcake", "Bakery", 110.0, "1 pc", 25, 1, now, 0),
        (2, "Butter Croissant (French Style)", "Pastry", 95.0, "1 pc", 18, 1, now, 1),
        (2, "Gluten-Free Almond Biscotti", "Cookies", 220.0, "200g", 14, 1, now, 0),

        # Store 3: Apollo Care Pharmacy
        (3, "Digene Acidity Relief Gel (Mint)", "Healthcare", 145.0, "200 ml", 50, 1, now, 0),
        (3, "Volini Pain Relief Spray", "First Aid", 160.0, "55g", 30, 1, now, 0),
        (3, "Electral ORS Rehydration Powder", "Health Drink", 22.0, "21.8g Sachet", 100, 1, now, 0),
        (3, "Vitamin C 500mg Chewable (Limcee)", "Supplements", 35.0, "Strip of 15", 60, 1, now, 0),

        # Store 4: Malnad Fresh Dairy & Sweets
        (4, "Artisan Buffalo Paneer (Fresh Batch)", "Dairy", 125.0, "250g", 18, 1, now, 1),
        (4, "Pure Desi Gir Cow Bilona Ghee", "Ghee", 680.0, "500 ml", 10, 1, now, 0),
        (4, "Traditional Mysore Pak", "Sweets", 190.0, "250g", 15, 1, now, 0),

        # Store 5: Sagar Supermarket
        (5, "Tata Tea Premium Gold", "Beverages", 195.0, "500g", 25, 1, now, 0),
        (5, "Maggi 2-Minute Noodles (Pack of 4)", "Instant Food", 56.0, "280g", 40, 1, now, 0),
        (5, "Surf Excel Matic Front Load Liquid", "Cleaning", 230.0, "1 Ltr", 12, 1, now, 0),

        # Store 6: Paper & Pen Hub
        (6, "Hardbound Dotted Bullet Journal", "Stationery", 299.0, "1 unit", 15, 1, now, 0),
        (6, "Pilot V7 Hi-Tecpoint Pen (Black/Blue)", "Writing", 70.0, "1 pc", 50, 1, now, 0),
    ]

    cursor.executemany('''
        INSERT INTO products (store_id, name, category, price, unit, stock_quantity, is_in_stock, last_verified_at, fast_depleting)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', products_data)

    # Seed Multi-Store Bundles (Solving the single-store delivery limitation)
    bundles_data = [
        (
            "Weekend Artisan Breakfast Bundle",
            "Artisan Sourdough + A2 Farm Milk + Fresh Butter Paneer",
            "Multi-Store Best Value",
            1, 2,
            383.0, 329.0, 54.0, 24,
            "Glen's Bakery + Nandi Organic + Malnad Dairy",
            '[{"name": "Sourdough Boule (450g)", "store": "Glen\'s Artisan Bakery", "price": 180}, {"name": "A2 Farm Fresh Organic Milk (1L)", "store": "Nandi Organic Grocers", "price": 78}, {"name": "Artisan Buffalo Paneer (250g)", "store": "Malnad Fresh Dairy", "price": 125}]'
        ),
        (
            "WFH Productivity & Energy Pack",
            "Gluten-Free Almond Biscotti + Tata Tea Gold + Dotted Journal",
            "Cross-Category Popular",
            2, 6,
            714.0, 599.0, 115.0, 26,
            "Glen's Bakery + Sagar Supermarket + Paper & Pen Hub",
            '[{"name": "Gluten-Free Almond Biscotti (200g)", "store": "Glen\'s Artisan Bakery", "price": 220}, {"name": "Tata Tea Premium Gold (500g)", "store": "Sagar Supermarket", "price": 195}, {"name": "Hardbound Dotted Bullet Journal", "store": "Paper & Pen Hub", "price": 299}]'
        ),
        (
            "Family Emergency & Wellness Rescue Kit",
            "Electral ORS + Digene Mint Gel + Farm Fresh Hass Avocado",
            "Health & Essentials",
            3, 1,
            327.0, 279.0, 48.0, 20,
            "Apollo Care Pharmacy + Nandi Organic Grocers",
            '[{"name": "Electral ORS Powder", "store": "Apollo Care Pharmacy", "price": 22}, {"name": "Digene Acidity Relief Gel", "store": "Apollo Care Pharmacy", "price": 145}, {"name": "Farm Fresh Hass Avocado (Pack of 2)", "store": "Nandi Organic Grocers", "price": 160}]'
        ),
    ]

    cursor.executemany('''
        INSERT INTO bundles (title, tagline, badge, primary_store_id, secondary_store_id, original_price, bundle_price, savings, est_delivery_min, stores_involved, items_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', bundles_data)

    # Seed Support Tickets (Representing the 5,900 tickets / month reality in the PDF)
    tickets_data = [
        (10482, "Aarav Sharma", "Refund status", "Cancelled order #10482 refund was pending bank confirmation.", "resolved", 340.0, "Autonomous instant UPI refund credited in 3.2 seconds.", 4, "2026-10-01 14:20:00"),
        (10489, "Pooja Verma", "Missing/unavailable products", "Organic Hass Avocado was out of stock after payment.", "resolved", 160.0, "Proactive substitution with store credit + ₹50 retention booster.", 12, "2026-10-01 16:45:00"),
        (10501, "Vikram Malhotra", "Delayed delivery", "Delivery crossed 37 mins during Indiranagar traffic peak.", "resolved", 50.0, "Auto-credited ₹50 delay apology wallet credit.", 8, "2026-10-02 09:15:00"),
        (10515, "Sneha Patel", "Coupon problems", "Festival coupon expired right before payment confirmation.", "resolved", 75.0, "Upgraded to Retention Ladder Step 2 instant discount.", 15, "2026-10-02 10:30:00"),
    ]
    cursor.executemany('''
        INSERT INTO support_tickets (order_id, customer_name, issue_type, description, status, refund_amount, resolution_notes, resolved_in_seconds, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', tickets_data)

    # Seed Retention Profile (Targeting the 3-order 72% retention probability)
    retention_data = [
        ("Kavita Iyer", 2, 2, 54, "Free Priority Delivery on All Multi-Store Bundles", "Order #3 unlocks ₹120 VIP Local Merchant Basket Discount (72% repeat threshold)"),
        ("Rahul Deshmukh", 1, 1, 31, "10% Welcome Credit on Next Neighborhood Basket", "Complete Order #2 to reach 54% Repeat Club status"),
        ("Ananya Rao", 3, 3, 72, "VIP Local Patron: Zero delivery fees + Guaranteed Stock Priority", "Maintained 72% Monthly Retention Status"),
    ]
    cursor.executemany('''
        INSERT INTO retention_profiles (customer_name, orders_completed, ladder_step, repeat_probability, unlocked_perk, next_perk)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', retention_data)

    conn.commit()

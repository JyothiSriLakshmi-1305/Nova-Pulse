import unittest
import json
import os
from pathlib import Path
from backend.app import create_app
from backend.config import Config

TEST_DB_PATH = str(Path(__file__).resolve().parent / "test_novapulse.db")

class NovaPulseApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if os.path.exists(TEST_DB_PATH):
            try:
                os.remove(TEST_DB_PATH)
            except Exception:
                pass
            
        Config.DATABASE_PATH = TEST_DB_PATH
        cls.app = create_app()
        cls.client = cls.app.test_client()

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(TEST_DB_PATH):
            try:
                os.remove(TEST_DB_PATH)
            except Exception:
                pass

    def test_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['challenge'], 'PromptWars 2026')

    def test_security_headers(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(res.headers.get('X-Frame-Options'), 'DENY')
        self.assertIn('Content-Security-Policy', res.headers)

    def test_get_stores(self):
        res = self.client.get('/api/stores')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreaterEqual(len(data['stores']), 1)
        self.assertIn('computed_sci', data['stores'][0])

    def test_get_store_products(self):
        res = self.client.get('/api/stores/1/products')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreaterEqual(len(data['products']), 1)

    def test_store_not_found(self):
        res = self.client.get('/api/stores/9999/products')
        self.assertEqual(res.status_code, 404)
        data = res.get_json()
        self.assertFalse(data['success'])

    def test_toggle_product_stock(self):
        res = self.client.post('/api/stores/1/products/1/toggle-stock', 
                               json={'is_in_stock': False, 'stock_quantity': 0})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertFalse(data['is_in_stock'])

        # Restore stock for clean isolation across test suite
        res_restore = self.client.post('/api/stores/1/products/1/toggle-stock',
                                       json={'is_in_stock': True, 'stock_quantity': 35})
        self.assertEqual(res_restore.status_code, 200)

    def test_get_bundles(self):
        res = self.client.get('/api/bundles')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreaterEqual(len(data['bundles']), 1)
        self.assertIn('items', data['bundles'][0])

    def test_create_order_and_retention_progression(self):
        order_payload = {
            "customer_name": "Test Patron",
            "customer_phone": "+91 99999 88888",
            "delivery_address": "Test Street, Bengaluru",
            "items": [
                {"product_id": 2, "store_id": 1, "product_name": "Test Item", "store_name": "Test Store", "quantity": 1, "price": 150}
            ],
            "discount_amount": 20
        }
        res = self.client.post('/api/orders', json=order_payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['final_amount'], 130)
        self.assertIn('retention_profile', data)

    def test_create_empty_order_rejected(self):
        res = self.client.post('/api/orders', json={"items": []})
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data['success'])

    def test_file_support_ticket(self):
        res = self.client.post('/api/support/tickets', json={
            "order_id": 10599,
            "customer_name": "Test Customer",
            "issue_type": "Delayed delivery",
            "description": "Delivery was 20 minutes late",
            "refund_amount": 50.0
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['status'], 'open')
        self.assertIn('ticket_id', data)

    def test_support_instant_resolve(self):
        res = self.client.post('/api/support/instant-resolve', json={
            "issue_type": "Refund status",
            "order_amount": 300.0,
            "description": "Item was missing"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertTrue(data['triage']['auto_approved'])
        self.assertGreaterEqual(data['triage']['refund_amount'], 300)

    def test_analytics_metrics(self):
        res = self.client.get('/api/analytics/rescue-metrics')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['current_crisis']['cancellation_rate'], 11)
        self.assertEqual(data['nova_pulse_projected']['cancellation_rate'], 3.8)

    def test_ai_copilot_status_and_prompt(self):
        res_status = self.client.get('/api/ai/status')
        self.assertEqual(res_status.status_code, 200)
        data_status = res_status.get_json()
        self.assertTrue(data_status['success'])
        self.assertIn("Google Gemini", data_status['service'])

        res_test = self.client.post('/api/ai/test-prompt', json={
            "prompt": "We received 20 packets of milk and sourdough is sold out"
        })
        self.assertEqual(res_test.status_code, 200)
        data_test = res_test.get_json()
        self.assertTrue(data_test['success'])
    def test_get_customer_orders_isolated(self):
        # Create order for Alice
        self.client.post('/api/orders', json={
            "customer_name": "Alice Customer",
            "items": [{"product_id": 1, "store_id": 1, "product_name": "Item A", "store_name": "Store 1", "quantity": 1, "price": 100}]
        })
        # Create order for Bob
        self.client.post('/api/orders', json={
            "customer_name": "Bob Customer",
            "items": [{"product_id": 2, "store_id": 1, "product_name": "Item B", "store_name": "Store 1", "quantity": 1, "price": 120}]
        })

        # Query Alice only
        res_alice = self.client.get('/api/orders?customer_name=Alice%20Customer')
        self.assertEqual(res_alice.status_code, 200)
        alice_orders = res_alice.get_json()['orders']
        self.assertTrue(all(o['customer_name'] == "Alice Customer" for o in alice_orders))
        self.assertFalse(any(o['customer_name'] == "Bob Customer" for o in alice_orders))

    def test_get_store_orders_multi_store_filtering(self):
        # Create a multi-store order with items from Store 1 and Store 2
        order_res = self.client.post('/api/orders', json={
            "customer_name": "Multi Store Shopper",
            "is_multi_store": 1,
            "items": [
                {"product_id": 1, "store_id": 1, "product_name": "Milk", "store_name": "Nandi Organic Grocers", "quantity": 2, "price": 78},
                {"product_id": 6, "store_id": 2, "product_name": "Sourdough", "store_name": "Glen's Artisan Bakery", "quantity": 1, "price": 180}
            ]
        })
        self.assertEqual(order_res.status_code, 200)
        order_id = order_res.get_json()['order_id']

        # Store 1 should only see its own item (Milk)
        res_s1 = self.client.get('/api/stores/1/orders')
        self.assertEqual(res_s1.status_code, 200)
        s1_orders = [o for o in res_s1.get_json()['orders'] if o['id'] == order_id]
        self.assertEqual(len(s1_orders), 1)
        self.assertEqual(len(s1_orders[0]['items']), 1)
        self.assertEqual(s1_orders[0]['items'][0]['product_name'], "Milk")

        # Store 2 should only see its own item (Sourdough)
        res_s2 = self.client.get('/api/stores/2/orders')
        self.assertEqual(res_s2.status_code, 200)
        s2_orders = [o for o in res_s2.get_json()['orders'] if o['id'] == order_id]
        self.assertEqual(len(s2_orders), 1)
        self.assertEqual(len(s2_orders[0]['items']), 1)
        self.assertEqual(s2_orders[0]['items'][0]['product_name'], "Sourdough")

    def test_update_order_status_progression(self):
        order_res = self.client.post('/api/orders', json={
            "customer_name": "Progress Customer",
            "items": [{"product_id": 1, "store_id": 1, "product_name": "Milk", "store_name": "Store 1", "quantity": 1, "price": 78}]
        })
        order_id = order_res.get_json()['order_id']

        # Placed -> Preparing
        res_prep = self.client.post(f'/api/orders/{order_id}/status', json={"status": "preparing"})
        self.assertEqual(res_prep.status_code, 200)
        self.assertEqual(res_prep.get_json()['status'], 'preparing')

        # Preparing -> Ready
        res_ready = self.client.post(f'/api/orders/{order_id}/status', json={"status": "ready"})
        self.assertEqual(res_ready.status_code, 200)
        self.assertEqual(res_ready.get_json()['status'], 'ready')

        # Ready -> Completed
        res_comp = self.client.post(f'/api/orders/{order_id}/status', json={"status": "completed"})
        self.assertEqual(res_comp.status_code, 200)
        self.assertEqual(res_comp.get_json()['status'], 'completed')

        # Invalid status should return 400
        res_bad = self.client.post(f'/api/orders/{order_id}/status', json={"status": "flying"})
        self.assertEqual(res_bad.status_code, 400)

    def test_bundle_items_have_store_and_product_ids(self):
        res = self.client.get('/api/bundles')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        bundles = data['bundles']
        self.assertGreaterEqual(len(bundles), 1)
        for b in bundles:
            self.assertGreaterEqual(len(b['items']), 1)
            for item in b['items']:
                self.assertIn('store_id', item)
                self.assertIn('product_id', item)
                self.assertIsInstance(item['store_id'], int)
                self.assertIsInstance(item['product_id'], int)

    def test_multi_store_bundle_order_merchants_receive_only_their_own_items(self):
        res_bundles = self.client.get('/api/bundles')
        bundle = res_bundles.get_json()['bundles'][0]
        
        items_payload = [
            {
                "product_id": it['product_id'],
                "store_id": it['store_id'],
                "product_name": it['name'],
                "store_name": it['store'],
                "quantity": 1,
                "price": it['price']
            }
            for it in bundle['items']
        ]

        order_res = self.client.post('/api/orders', json={
            "customer_name": "Bundle Patron",
            "is_multi_store": 1,
            "items": items_payload,
            "discount_amount": bundle['savings']
        })
        self.assertEqual(order_res.status_code, 200)
        order_id = order_res.get_json()['order_id']

        store_ids_in_bundle = list(set(it['store_id'] for it in items_payload))
        self.assertGreaterEqual(len(store_ids_in_bundle), 2, "Bundle must span at least 2 distinct stores")

        for s_id in store_ids_in_bundle:
            s_res = self.client.get(f'/api/stores/{s_id}/orders')
            self.assertEqual(s_res.status_code, 200)
            matching = [o for o in s_res.get_json()['orders'] if o['id'] == order_id]
            self.assertEqual(len(matching), 1, f"Store {s_id} should see order #{order_id}")
            store_order = matching[0]
            expected_store_items = [x for x in items_payload if x['store_id'] == s_id]
            self.assertEqual(len(store_order['items']), len(expected_store_items))
            self.assertTrue(all(it['product_name'] in [x['product_name'] for x in expected_store_items] for it in store_order['items']))

    def test_independent_merchant_fulfillment_and_composite_order_status(self):
        order_res = self.client.post('/api/orders', json={
            "customer_name": "Multi Fulfillment Tester",
            "is_multi_store": 1,
            "items": [
                {"product_id": 1, "store_id": 1, "product_name": "Organic Milk", "store_name": "Nandi Grocers", "quantity": 1, "price": 78},
                {"product_id": 6, "store_id": 2, "product_name": "Sourdough", "store_name": "Glen's Bakery", "quantity": 1, "price": 180}
            ]
        })
        self.assertEqual(order_res.status_code, 200)
        order_id = order_res.get_json()['order_id']

        # Initial state: both stores should see status 'placed'
        s1_res0 = self.client.get('/api/stores/1/orders')
        s1_order0 = next(o for o in s1_res0.get_json()['orders'] if o['id'] == order_id)
        self.assertEqual(s1_order0['status'], 'placed')

        s2_res0 = self.client.get('/api/stores/2/orders')
        s2_order0 = next(o for o in s2_res0.get_json()['orders'] if o['id'] == order_id)
        self.assertEqual(s2_order0['status'], 'placed')

        # Store 1 updates its items to 'ready'
        upd_s1 = self.client.post(f'/api/orders/{order_id}/status', json={"status": "ready", "store_id": 1})
        self.assertEqual(upd_s1.status_code, 200)
        self.assertEqual(upd_s1.get_json()['store_status'], 'ready')
        # Composite order status must be 'preparing' because Store 2 is still 'placed'
        self.assertEqual(upd_s1.get_json()['order_status'], 'preparing')

        # Verify Store 1 sees status 'ready'
        s1_res1 = self.client.get('/api/stores/1/orders')
        s1_order1 = next(o for o in s1_res1.get_json()['orders'] if o['id'] == order_id)
        self.assertEqual(s1_order1['status'], 'ready')
        self.assertEqual(s1_order1['overall_status'], 'preparing')

        # Verify Store 2 STILL sees status 'placed' (Store 1 updating to Ready does NOT change Store 2)
        s2_res1 = self.client.get('/api/stores/2/orders')
        s2_order1 = next(o for o in s2_res1.get_json()['orders'] if o['id'] == order_id)
        self.assertEqual(s2_order1['status'], 'placed')
        self.assertEqual(s2_order1['overall_status'], 'preparing')

        # Now Store 2 updates its items to 'ready'
        upd_s2 = self.client.post(f'/api/orders/{order_id}/status', json={"status": "ready", "store_id": 2})
        self.assertEqual(upd_s2.status_code, 200)
        self.assertEqual(upd_s2.get_json()['store_status'], 'ready')
        # Now BOTH stores are ready, so composite status transitions to 'ready'!
        self.assertEqual(upd_s2.get_json()['order_status'], 'ready')

        # Verify Store 2 now sees 'ready'
        s2_res2 = self.client.get('/api/stores/2/orders')
        s2_order2 = next(o for o in s2_res2.get_json()['orders'] if o['id'] == order_id)
        self.assertEqual(s2_order2['status'], 'ready')
        self.assertEqual(s2_order2['overall_status'], 'ready')

        # Both stores complete
        self.client.post(f'/api/orders/{order_id}/status', json={"status": "completed", "store_id": 1})
        upd_s2_comp = self.client.post(f'/api/orders/{order_id}/status', json={"status": "completed", "store_id": 2})
        self.assertEqual(upd_s2_comp.get_json()['order_status'], 'completed')

    def test_store_order_status_update_foreign_store_rejected(self):
        order_res = self.client.post('/api/orders', json={
            "customer_name": "Store 1 Only Customer",
            "items": [{"product_id": 1, "store_id": 1, "product_name": "Milk", "store_name": "Store 1", "quantity": 1, "price": 78}]
        })
        order_id = order_res.get_json()['order_id']

        res_foreign = self.client.post(f'/api/orders/{order_id}/status', json={"status": "ready", "store_id": 999})
        self.assertEqual(res_foreign.status_code, 404)
        self.assertFalse(res_foreign.get_json()['success'])

    def test_database_performance_indexes_created(self):
        from backend.database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type = 'index'")
        indexes = [row[0] for row in cursor.fetchall()]
        conn.close()

        expected_indexes = [
            'idx_order_items_order_id',
            'idx_order_items_store_id',
            'idx_support_tickets_order_id',
            'idx_products_store_id',
            'idx_orders_customer_name'
        ]
        for idx in expected_indexes:
            self.assertIn(idx, indexes, f"Database index {idx} should be created in schema")

    def test_batch_query_optimization_order_retrieval(self):
        # Create multiple orders to test batch query retrieval without N+1
        for i in range(3):
            self.client.post('/api/orders', json={
                "customer_name": f"Batch Customer {i}",
                "items": [
                    {"product_id": 1, "store_id": 1, "product_name": "Milk", "store_name": "Store 1", "quantity": 1, "price": 78},
                    {"product_id": 6, "store_id": 2, "product_name": "Sourdough", "store_name": "Store 2", "quantity": 1, "price": 180}
                ]
            })

        res = self.client.get('/api/orders')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        orders = data['orders']
        self.assertGreaterEqual(len(orders), 3)
        for ord_entry in orders[:3]:
            self.assertIn('items', ord_entry)
            self.assertIn('support_tickets', ord_entry)
            self.assertIsInstance(ord_entry['items'], list)
            self.assertIsInstance(ord_entry['support_tickets'], list)

    def test_backend_live_inventory_revalidation_insufficient_stock(self):
        # Toggle product 4 to out of stock / 0 qty
        self.client.post('/api/stores/1/products/4/toggle-stock', json={"is_in_stock": False, "stock_quantity": 0})

        # Attempt to order product 4
        order_res = self.client.post('/api/orders', json={
            "customer_name": "Stock Tester",
            "items": [
                {"product_id": 4, "store_id": 1, "product_name": "Himalayan Pink Rock Salt", "store_name": "Nandi Grocers", "quantity": 1, "price": 85}
            ]
        })
        self.assertEqual(order_res.status_code, 400)
        data = order_res.get_json()
        self.assertFalse(data['success'])
        self.assertIn("insufficient stock", data['error'].lower())

        # Restore product 4 stock
        self.client.post('/api/stores/1/products/4/toggle-stock', json={"is_in_stock": True, "stock_quantity": 40})

    def test_backend_live_inventory_revalidation_excessive_quantity(self):
        # Product 2 has 20 in stock, attempt to order 500
        order_res = self.client.post('/api/orders', json={
            "customer_name": "Greedy Shopper",
            "items": [
                {"product_id": 2, "store_id": 1, "product_name": "Sona Masoori Rice", "store_name": "Nandi Grocers", "quantity": 500, "price": 390}
            ]
        })
        self.assertEqual(order_res.status_code, 400)
        data = order_res.get_json()
        self.assertFalse(data['success'])
        self.assertIn("insufficient stock", data['error'].lower())

if __name__ == '__main__':
    unittest.main()


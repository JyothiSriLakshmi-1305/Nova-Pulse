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

if __name__ == '__main__':
    unittest.main()


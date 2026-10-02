import json
import datetime
import logging
from flask import Blueprint, jsonify, request
from backend.database import get_db_connection
from backend.services.retention_service import RetentionService
from backend.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

orders_bp = Blueprint('orders', __name__, url_prefix='/api')

@orders_bp.route('/bundles', methods=['GET'])
def get_bundles():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM bundles')
    rows = cursor.fetchall()
    bundles = []
    for r in rows:
        b_dict = dict(r)
        try:
            b_dict['items'] = json.loads(b_dict['items_json'])
        except Exception:
            b_dict['items'] = []
        bundles.append(b_dict)
    conn.close()
    return jsonify({"success": True, "bundles": bundles})

@orders_bp.route('/orders', methods=['GET'])
def get_orders():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    customer_name = request.args.get('customer_name')
    if customer_name:
        cursor.execute('SELECT * FROM orders WHERE customer_name = ? ORDER BY id DESC', (customer_name,))
    else:
        cursor.execute('SELECT * FROM orders ORDER BY id DESC LIMIT 50')
        
    order_rows = cursor.fetchall()
    if not order_rows:
        conn.close()
        return jsonify({"success": True, "orders": []})
        
    order_ids = [r['id'] for r in order_rows]
    placeholders = ','.join('?' for _ in order_ids)
    
    # Batch fetch order items in 1 query instead of N per-order queries
    cursor.execute(f'SELECT * FROM order_items WHERE order_id IN ({placeholders})', order_ids)
    items_by_order = {}
    for it in cursor.fetchall():
        items_by_order.setdefault(it['order_id'], []).append(dict(it))
        
    # Batch fetch active support tickets in 1 query instead of N per-order queries
    cursor.execute(f'SELECT id, order_id, issue_type, status, refund_amount, resolution_notes FROM support_tickets WHERE order_id IN ({placeholders}) ORDER BY id DESC', order_ids)
    tickets_by_order = {}
    for t in cursor.fetchall():
        tickets_by_order.setdefault(t['order_id'], []).append(dict(t))
        
    conn.close()
    
    orders = []
    for o in order_rows:
        ord_dict = dict(o)
        ord_dict['items'] = items_by_order.get(ord_dict['id'], [])
        ord_dict['support_tickets'] = tickets_by_order.get(ord_dict['id'], [])
        orders.append(ord_dict)
        
    return jsonify({"success": True, "orders": orders})

def calculate_composite_order_status(item_statuses):
    """
    Computes overall composite order status from list of item status strings.
    - If all items are 'cancelled' -> 'cancelled'
    - If all active items are 'completed' -> 'completed'
    - If all active items are 'ready' or 'completed' -> 'ready'
    - If any active item is 'preparing' or 'ready' or 'completed' -> 'preparing'
    - Otherwise -> 'placed'
    """
    if not item_statuses:
        return 'placed'
    
    statuses = [str(s).lower() for s in item_statuses]
    active = [s for s in statuses if s != 'cancelled']
    if not active:
        return 'cancelled'
    
    if all(s == 'completed' for s in active):
        return 'completed'
    if all(s in ('ready', 'completed') for s in active):
        return 'ready'
    if any(s in ('preparing', 'ready', 'completed') for s in active):
        return 'preparing'
    return 'placed'

@orders_bp.route('/orders/<int:order_id>/status', methods=['POST', 'PATCH'])
def update_order_status(order_id):
    data = request.get_json() or {}
    new_status = str(data.get('status', '')).strip().lower()
    store_id = data.get('store_id')
    if store_id is not None:
        try:
            store_id = int(store_id)
        except (ValueError, TypeError):
            store_id = None
    
    valid_statuses = ['placed', 'preparing', 'ready', 'completed', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({
            "success": False, 
            "error": f"Invalid status '{new_status}'. Allowed: {', '.join(valid_statuses)}"
        }), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        return jsonify({"success": False, "error": f"Order #{order_id} not found"}), 404
        
    if store_id is not None:
        cursor.execute('SELECT COUNT(*) FROM order_items WHERE order_id = ? AND store_id = ?', (order_id, store_id))
        count = cursor.fetchone()[0]
        if count == 0:
            conn.close()
            return jsonify({"success": False, "error": f"Store #{store_id} has no items in Order #{order_id}"}), 404
            
        # Update only this store's line items
        cursor.execute('UPDATE order_items SET status = ? WHERE order_id = ? AND store_id = ?', (new_status, order_id, store_id))
        
        # Calculate composite status across all order items
        cursor.execute('SELECT status FROM order_items WHERE order_id = ?', (order_id,))
        all_item_statuses = [row['status'] for row in cursor.fetchall()]
        composite_status = calculate_composite_order_status(all_item_statuses)
        
        cursor.execute('UPDATE orders SET status = ? WHERE id = ?', (composite_status, order_id))
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True, 
            "order_id": order_id, 
            "store_id": store_id,
            "store_status": new_status,
            "order_status": composite_status,
            "status": new_status,
            "message": f"Store #{store_id} item status updated to '{new_status}' (Composite order status: '{composite_status}')"
        })
    else:
        cursor.execute('UPDATE orders SET status = ? WHERE id = ?', (new_status, order_id))
        cursor.execute('UPDATE order_items SET status = ? WHERE order_id = ?', (new_status, order_id))
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True, 
            "order_id": order_id, 
            "status": new_status,
            "order_status": new_status,
            "message": f"Order #{order_id} status updated to '{new_status}'"
        })


@orders_bp.route('/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Request body must be valid JSON"}), 400

    items = data.get('items')
    if not items or not isinstance(items, list):
        return jsonify({"success": False, "error": "Order must contain at least one item in a valid list"}), 400

    customer_name = str(data.get('customer_name', 'Kavita Iyer')).strip()[:100]
    customer_phone = str(data.get('customer_phone', '+91 98450 12345')).strip()[:20]
    delivery_address = str(data.get('delivery_address', 'Flat 402, Palm Heights, 12th Main Indiranagar, Bengaluru')).strip()[:250]
    is_multi_store = 1 if data.get('is_multi_store') else 0

    # Validate items and calculate totals safely
    total_amount = 0.0
    sanitized_items = []
    for item in items:
        try:
            qty = max(1, int(item.get('quantity', 1)))
            price = max(0.0, float(item.get('price', 0)))
            p_id = int(item.get('product_id', 1))
            s_id = int(item.get('store_id', 1))
            p_name = str(item.get('product_name', 'Local Item')).strip()[:100]
            s_name = str(item.get('store_name', 'Partner Store')).strip()[:100]
            
            total_amount += (price * qty)
            sanitized_items.append({
                "product_id": p_id,
                "store_id": s_id,
                "product_name": p_name,
                "store_name": s_name,
                "quantity": qty,
                "price": price
            })
        except (ValueError, TypeError) as e:
            return jsonify({"success": False, "error": f"Invalid item specification: {e}"}), 400

    discount_amount = max(0.0, float(data.get('discount_amount', 0)))
    final_amount = max(0.0, total_amount - discount_amount)
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Live backend inventory verification before accepting order
    for it in sanitized_items:
        cursor.execute('SELECT name, stock_quantity, is_in_stock FROM products WHERE id = ?', (it['product_id'],))
        prod = cursor.fetchone()
        if prod:
            if not prod['is_in_stock'] or prod['stock_quantity'] < it['quantity']:
                available_qty = prod['stock_quantity'] if prod['is_in_stock'] else 0
                conn.close()
                return jsonify({
                    "success": False,
                    "error": f"Item '{prod['name']}' has insufficient stock (Requested: {it['quantity']}, Available: {available_qty})"
                }), 400

    try:
        cursor.execute('''
            INSERT INTO orders (customer_name, customer_phone, total_amount, discount_amount, status, is_multi_store, delivery_address, delivery_time_min, created_at)
            VALUES (?, ?, ?, ?, 'placed', ?, ?, 24, ?)
        ''', (customer_name, customer_phone, final_amount, discount_amount, is_multi_store, delivery_address, now))
        
        order_id = cursor.lastrowid

        for it in sanitized_items:
            cursor.execute('''
                INSERT INTO order_items (order_id, product_id, store_id, product_name, store_name, quantity, price, is_substituted, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'placed')
            ''', (order_id, it['product_id'], it['store_id'], it['product_name'], it['store_name'], it['quantity'], it['price']))

            # Safely decrement inventory stock
            cursor.execute('''
                UPDATE products 
                SET stock_quantity = MAX(0, stock_quantity - ?) 
                WHERE id = ?
            ''', (it['quantity'], it['product_id']))

        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        logger.error(f"Transaction failed during order creation: {e}")
        return jsonify({"success": False, "error": "Order could not be processed"}), 500
        
    conn.close()

    # Progress retention ladder toward the 3-order / 72% milestone
    updated_profile = RetentionService.increment_order_progress(customer_name)

    return jsonify({
        "success": True,
        "order_id": order_id,
        "final_amount": final_amount,
        "est_delivery_min": 24,
        "status": "placed",
        "retention_profile": updated_profile
    })

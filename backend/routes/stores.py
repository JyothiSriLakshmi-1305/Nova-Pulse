import logging
from flask import Blueprint, jsonify, request
from backend.database import get_db_connection
from backend.services.inventory_service import InventoryService
from backend.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

stores_bp = Blueprint('stores', __name__, url_prefix='/api/stores')

@stores_bp.route('', methods=['GET'])
def get_stores():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM stores')
    rows = cursor.fetchall()
    
    stores = []
    for r in rows:
        store_dict = dict(r)
        # Recalculate dynamic SCI from timestamp
        store_dict['computed_sci'] = InventoryService.calculate_sci(store_dict['last_inventory_sync'])
        stores.append(store_dict)
        
    conn.close()
    return jsonify({"success": True, "stores": stores})

@stores_bp.route('/<int:store_id>/products', methods=['GET'])
def get_store_products(store_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM stores WHERE id = ?', (store_id,))
    store = cursor.fetchone()
    
    if not store:
        conn.close()
        return jsonify({"success": False, "error": f"Store #{store_id} not found"}), 404

    cursor.execute('SELECT * FROM products WHERE store_id = ?', (store_id,))
    products = [dict(p) for p in cursor.fetchall()]
    
    store_dict = dict(store)
    store_dict['computed_sci'] = InventoryService.calculate_sci(store_dict['last_inventory_sync'])
        
    conn.close()
    return jsonify({"success": True, "store": store_dict, "products": products})

@stores_bp.route('/<int:store_id>/products/<int:product_id>/toggle-stock', methods=['POST'])
def toggle_stock(store_id, product_id):
    data = request.get_json() or {}
    is_in_stock = bool(data.get('is_in_stock', True))
    stock_qty = data.get('stock_quantity')
    
    if stock_qty is not None:
        try:
            stock_qty = max(0, int(stock_qty))
        except (ValueError, TypeError):
            stock_qty = 15 if is_in_stock else 0
            
    success = InventoryService.update_product_stock(product_id, is_in_stock, stock_qty)
    return jsonify({
        "success": success, 
        "message": f"Product #{product_id} stock updated to {'In Stock' if is_in_stock else 'Sold Out'}",
        "is_in_stock": is_in_stock
    })

@stores_bp.route('/<int:store_id>/rush-mode', methods=['POST'])
def toggle_rush(store_id):
    data = request.get_json() or {}
    rush_mode = bool(data.get('rush_mode', False))
    success = InventoryService.toggle_rush_mode(store_id, rush_mode)
    return jsonify({"success": success, "rush_mode": rush_mode})

@stores_bp.route('/<int:store_id>/ai-voice-sync', methods=['POST'])
def ai_voice_sync(store_id):
    data = request.get_json() or {}
    note_text = str(data.get('note', '')).strip()[:500]
    
    if not note_text:
        return jsonify({"success": False, "error": "No voice/text note provided"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM products WHERE store_id = ?', (store_id,))
    catalog = [dict(p) for p in cursor.fetchall()]
    conn.close()
    
    if not catalog:
        return jsonify({"success": False, "error": f"Store #{store_id} has no catalog items"}), 404
    
    # Run through Gemini / deterministic AI parser
    extracted_updates = GeminiService.parse_inventory_note(note_text, catalog)
    
    applied = []
    for upd in extracted_updates:
        p_id = upd.get('product_id')
        in_stock = upd.get('is_in_stock', True)
        qty = upd.get('stock_quantity')
        if p_id:
            InventoryService.update_product_stock(p_id, in_stock, qty)
            applied.append(upd)
            
    return jsonify({
        "success": True,
        "raw_note": note_text,
        "extracted_updates": extracted_updates,
        "applied_count": len(applied)
    })

@stores_bp.route('/<int:store_id>/orders', methods=['GET'])
def get_store_orders(store_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM stores WHERE id = ?', (store_id,))
    store = cursor.fetchone()
    if not store:
        conn.close()
        return jsonify({"success": False, "error": f"Store #{store_id} not found"}), 404
        
    cursor.execute('''
        SELECT DISTINCT o.id, o.customer_name, o.customer_phone, o.status, 
               o.is_multi_store, o.delivery_address, o.delivery_time_min, o.created_at
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE oi.store_id = ?
        ORDER BY o.id DESC
    ''', (store_id,))
    
    order_rows = cursor.fetchall()
    if not order_rows:
        conn.close()
        return jsonify({
            "success": True, 
            "store_id": store_id, 
            "store_name": store['name'],
            "orders": [],
            "total_store_orders": 0
        })

    order_ids = [r['id'] for r in order_rows]
    placeholders = ','.join('?' for _ in order_ids)
    
    # Batch fetch order items for this store in a single query
    cursor.execute(f'''
        SELECT order_id, product_id, product_name, quantity, price, is_substituted, status 
        FROM order_items 
        WHERE store_id = ? AND order_id IN ({placeholders})
    ''', [store_id] + order_ids)
    
    items_by_order = {}
    for it in cursor.fetchall():
        items_by_order.setdefault(it['order_id'], []).append(dict(it))
        
    conn.close()

    orders = []
    for r in order_rows:
        ord_dict = dict(r)
        items = items_by_order.get(ord_dict['id'], [])
        ord_dict['items'] = items
        ord_dict['store_items_count'] = sum(it['quantity'] for it in items)
        ord_dict['store_subtotal'] = sum(it['price'] * it['quantity'] for it in items)
        
        # Store-specific fulfillment status
        store_statuses = [it.get('status') or 'placed' for it in items]
        if all(s == 'completed' for s in store_statuses):
            store_status = 'completed'
        elif all(s in ('ready', 'completed') for s in store_statuses):
            store_status = 'ready'
        elif any(s in ('preparing', 'ready', 'completed') for s in store_statuses):
            store_status = 'preparing'
        else:
            store_status = 'placed'

        ord_dict['store_status'] = store_status
        ord_dict['overall_status'] = ord_dict['status']
        ord_dict['status'] = store_status
        orders.append(ord_dict)
    return jsonify({
        "success": True, 
        "store_id": store_id, 
        "store_name": store['name'],
        "orders": orders,
        "total_store_orders": len(orders)
    })


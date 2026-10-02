import datetime
from backend.database import get_db_connection

class InventoryService:
    @staticmethod
    def calculate_sci(last_sync_iso):
        """
        Computes Stock Confidence Index (SCI) based on hours since last merchant inventory verification.
        - Verified within 2 hours: 98-99%
        - Verified within 6 hours: 92-97%
        - Verified within 24 hours: 80-91%
        - Older than 24 hours: drops below 75%
        """
        try:
            last_sync = datetime.datetime.strptime(last_sync_iso, "%Y-%m-%d %H:%M:%S")
            hours_elapsed = (datetime.datetime.now() - last_sync).total_seconds() / 3600.0
            
            if hours_elapsed <= 2:
                sci = 99 - int(hours_elapsed * 1.5)
            elif hours_elapsed <= 6:
                sci = 95 - int((hours_elapsed - 2) * 2.0)
            elif hours_elapsed <= 24:
                sci = 87 - int((hours_elapsed - 6) * 1.0)
            else:
                sci = max(45, 69 - int((hours_elapsed - 24) * 0.5))
            return max(30, min(100, sci))
        except Exception:
            return 85

    @staticmethod
    def update_product_stock(product_id, is_in_stock, stock_qty=None):
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if stock_qty is not None:
            cursor.execute('''
                UPDATE products 
                SET is_in_stock = ?, stock_quantity = ?, last_verified_at = ?
                WHERE id = ?
            ''', (1 if is_in_stock else 0, stock_qty, now, product_id))
        else:
            cursor.execute('''
                UPDATE products 
                SET is_in_stock = ?, last_verified_at = ?
                WHERE id = ?
            ''', (1 if is_in_stock else 0, now, product_id))

        # Update parent store's last_inventory_sync and confidence score
        cursor.execute('SELECT store_id FROM products WHERE id = ?', (product_id,))
        row = cursor.fetchone()
        if row:
            store_id = row['store_id']
            cursor.execute('''
                UPDATE stores 
                SET last_inventory_sync = ?, stock_confidence_score = 98
                WHERE id = ?
            ''', (now, store_id))
            
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def toggle_rush_mode(store_id, rush_mode):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE stores SET rush_mode = ? WHERE id = ?', (1 if rush_mode else 0, store_id))
        conn.commit()
        conn.close()
        return True

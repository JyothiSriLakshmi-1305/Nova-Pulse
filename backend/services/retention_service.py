from backend.database import get_db_connection

class RetentionService:
    """
    Retention Ladder ground truth model derived from official case study:
    - 54% of new users complete their first order.
    - Only 31% place a second order within 30 days.
    - Customers completing 3 orders have a 72% probability of ordering again the following month.
    """
    LADDER_STAGES = {
        1: {
            "step": 1,
            "title": "First Order Completed",
            "telemetry_stat": "54% 1st-order conversion cohort",
            "cohort_repeat_prob": 31, # Historical baseline: 31% place order #2 within 30 days
            "unlocked_perk": "₹40 credit on 2nd Neighborhood Basket",
            "next_target": "Place 2nd order within 30 days to beat the 31% drop-off cliff",
            "color": "#3B82F6"
        },
        2: {
            "step": 2,
            "title": "Second Order Completed",
            "telemetry_stat": "Beat the 30-day drop-off cliff",
            "cohort_repeat_prob": 50, # Model estimate for 2-order cohort
            "unlocked_perk": "Free Priority Dispatch on Kirana & Bakery orders",
            "next_target": "Complete 3rd order to enter the 72% Following-Month Repeat Cohort",
            "color": "#8B5CF6"
        },
        3: {
            "step": 3,
            "title": "Third Order Completed — VIP Patron",
            "telemetry_stat": "Case telemetry: 72% following-month repeat probability",
            "cohort_repeat_prob": 72, # Directly from Section 4 of PDF
            "unlocked_perk": "Zero Delivery Fees + Guaranteed Fresh Stock Reservation",
            "next_target": "72% Following-Month Reorder Milestone Achieved!",
            "color": "#10B981"
        }
    }

    @staticmethod
    def get_or_create_profile(customer_name="Kavita Iyer"):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM retention_profiles WHERE customer_name = ?', (customer_name,))
        row = cursor.fetchone()
        
        if not row:
            cursor.execute('''
                INSERT INTO retention_profiles (customer_name, orders_completed, ladder_step, repeat_probability, unlocked_perk, next_perk)
                VALUES (?, 1, 1, 31, '₹40 credit on 2nd Neighborhood Basket', 'Place 2nd order within 30 days to beat 31% drop-off')
            ''', (customer_name,))
            conn.commit()
            cursor.execute('SELECT * FROM retention_profiles WHERE customer_name = ?', (customer_name,))
            row = cursor.fetchone()
            
        profile = dict(row)
        conn.close()
        
        stage_info = RetentionService.LADDER_STAGES.get(profile['ladder_step'], RetentionService.LADDER_STAGES[1])
        profile['meta'] = stage_info
        return profile

    @staticmethod
    def increment_order_progress(customer_name="Kavita Iyer"):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM retention_profiles WHERE customer_name = ?', (customer_name,))
        row = cursor.fetchone()
        
        if row:
            new_orders = row['orders_completed'] + 1
            new_step = min(3, new_orders)
            stage_info = RetentionService.LADDER_STAGES[new_step]
            
            cursor.execute('''
                UPDATE retention_profiles
                SET orders_completed = ?, ladder_step = ?, repeat_probability = ?, unlocked_perk = ?, next_perk = ?
                WHERE customer_name = ?
            ''', (new_orders, new_step, stage_info['cohort_repeat_prob'], stage_info['unlocked_perk'], stage_info['next_target'], customer_name))
            conn.commit()
            
        conn.close()
        return RetentionService.get_or_create_profile(customer_name)

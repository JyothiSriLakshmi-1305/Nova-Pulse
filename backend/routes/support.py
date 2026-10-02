import datetime
import logging
from flask import Blueprint, jsonify, request
from backend.database import get_db_connection
from backend.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

support_bp = Blueprint('support', __name__, url_prefix='/api/support')

@support_bp.route('/tickets', methods=['GET'])
def get_tickets():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM support_tickets ORDER BY id DESC')
    tickets = [dict(t) for t in cursor.fetchall()]
    
    # Calculate real-time stats
    total = len(tickets)
    resolved_count = sum(1 for t in tickets if t['status'] == 'resolved')
    avg_sec = sum(t['resolved_in_seconds'] for t in tickets) / max(1, total)
    
    conn.close()
    return jsonify({
        "success": True,
        "tickets": tickets,
        "stats": {
            "total_tickets": total,
            "resolved_count": resolved_count,
            "resolution_rate_pct": round((resolved_count / max(1, total)) * 100, 1),
            "avg_resolution_seconds": round(avg_sec, 1),
            "previous_baseline_hours": 9.2 # From PDF
        }
    })

@support_bp.route('/tickets', methods=['POST'])
def file_ticket():
    data = request.get_json() or {}
    order_id = data.get('order_id', 10525)
    customer_name = str(data.get('customer_name', 'Customer')).strip()[:100]
    issue_type = str(data.get('issue_type', 'Refund status')).strip()
    description = str(data.get('description', 'Customer reported an issue with fulfillment.')).strip()[:300]
    refund_amount = max(0.0, float(data.get('refund_amount', 180.0)))
    
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO support_tickets (order_id, customer_name, issue_type, description, status, refund_amount, resolution_notes, resolved_in_seconds, created_at)
        VALUES (?, ?, ?, ?, 'open', ?, NULL, 0, ?)
    ''', (order_id, customer_name, issue_type, description, refund_amount, now))
    
    ticket_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "ticket_id": ticket_id,
        "message": f"Support ticket #{ticket_id} opened and queued for autonomous resolution.",
        "status": "open"
    }), 201

@support_bp.route('/instant-resolve', methods=['POST'])
def instant_resolve():
    data = request.get_json() or {}
    ticket_id = data.get('ticket_id')
    issue_type = data.get('issue_type', 'Refund status')
    order_amount = float(data.get('order_amount', 320.0))
    description = data.get('description', 'Customer requested resolution')
    
    # Auto-triage via Gemini / deterministic rule-set
    triage = GeminiService.auto_triage_support(issue_type, description, order_amount)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if ticket_id:
        cursor.execute('''
            UPDATE support_tickets 
            SET status = 'resolved', refund_amount = ?, resolution_notes = ?, resolved_in_seconds = ?
            WHERE id = ?
        ''', (triage['refund_amount'], triage['resolution_notes'], triage['resolved_in_seconds'], ticket_id))
    else:
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute('''
            INSERT INTO support_tickets (order_id, customer_name, issue_type, description, status, refund_amount, resolution_notes, resolved_in_seconds, created_at)
            VALUES (?, ?, ?, ?, 'resolved', ?, ?, ?, ?)
        ''', (
            data.get('order_id', 10520),
            data.get('customer_name', 'Verified Shopper'),
            issue_type,
            description,
            triage['refund_amount'],
            triage['resolution_notes'],
            triage['resolved_in_seconds'],
            now
        ))
        ticket_id = cursor.lastrowid
        
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "ticket_id": ticket_id,
        "triage": triage
    })

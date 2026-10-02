from flask import Blueprint, jsonify, request

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/rescue-metrics', methods=['GET'])
def get_rescue_metrics():
    """
    Returns baseline metrics extracted directly from the official PDF brief,
    paired with transparent NOVA PULSE turnaround projections and documented assumptions.
    """
    baseline_6_months_ago = {
        "registered_users": 82000,
        "mau": 39000,
        "monthly_orders": 31200,
        "aov": 452,
        "repeat_purchase_rate": 41,
        "avg_delivery_time_min": 29,
        "cancellation_rate": 6,
        "support_tickets": 3100,
        "promotional_spend_lakh": 9.5,
        "monthly_revenue_lakh": 21.8
    }

    current_crisis = {
        "registered_users": 120000,
        "mau": 46000,
        "monthly_orders": 38500,
        "aov": 486,
        "repeat_purchase_rate": 27,
        "avg_delivery_time_min": 37,
        "cancellation_rate": 11,
        "support_tickets": 5900,
        "promotional_spend_lakh": 17.0,
        "monthly_revenue_lakh": 26.1
    }

    # Model turnaround projections (Clearly labeled as projected model outputs)
    nova_pulse_projected = {
        "registered_users": 135000,
        "mau": 58000,
        "monthly_orders": 46200,
        "aov": 512,
        "blended_repeat_purchase_rate": 42, # Blended platform projection as 3-order cohort expands
        "cohort_3_order_repeat_probability": 72, # Direct case telemetry finding for users who place 3 orders
        "avg_delivery_time_min": 24, # Model projection via multi-merchant route clustering
        "cancellation_rate": 3.8,   # Model projection via SCI inventory verification
        "support_tickets": 1200,    # Model projection via autonomous dispute auto-triage
        "promotional_spend_lakh": 11.2, # Projected spend after eliminating unredeemed promo burn
        "monthly_revenue_lakh": 34.8,
        "monthly_recovered_savings_lakh": 8.4,
        "projection_assumptions": [
            "Assumes 18% average platform commission take-rate on recovered GMV.",
            "Assumes cutting cancellations from 11% to 3.8% recovers ₹13.4 Lakh GMV (~₹2.41L net revenue).",
            "Assumes saving ₹5.8 Lakh/month by eliminating 44% unredeemed first-order discount coupon waste.",
            "Combines net revenue lift + promo savings: ~₹8.2L - ₹8.4L monthly financial turnaround.",
            "The 72% figure is a cohort probability for 3-order buyers, not an achieved company-wide baseline."
        ]
    }

    return jsonify({
        "success": True,
        "baseline_6_months_ago": baseline_6_months_ago,
        "current_crisis": current_crisis,
        "nova_pulse_projected": nova_pulse_projected,
        "budget_constraint": {
            "total_allowed_lakh": 25.0,
            "projected_cost_lakh": 14.8, # Software architecture, local edge sync, Gemini API tokens
            "runway_months": 6,
            "remaining_contingency_lakh": 10.2
        },
        "cancellation_breakdown_pdf": [
            {"reason": "Product unavailable (Phantom Inventory)", "percentage": 35, "category": "Store Inventory Disconnect", "solution": "SCI Heuristic & 1-Tap Toggle"},
            {"reason": "Customer cancelled because of delay", "percentage": 27, "category": "Delivery Logistics Friction", "solution": "Route Clustering & Multi-Store Bundling"},
            {"reason": "Store rejected order (busy period)", "percentage": 18, "category": "Partner Store Friction", "solution": "Rush Mode Throttling & Auto-Substitutions"},
            {"reason": "Delivery partner unavailable", "percentage": 12, "category": "Rider Allocation Constraint", "solution": "Batched Cluster Dispatch"},
            {"reason": "Other reasons", "percentage": 8, "category": "General Operational Variance", "solution": "Autonomous Support Resolution"}
        ]
    })

# User Guide: Client Current Account

## Table of Contents
1. [Overview](#overview)
2. [Understanding the Current Account](#understanding-the-current-account)
3. [Payment Allocation](#payment-allocation)
4. [Aging Reports](#aging-reports)
5. [Credit Limits](#credit-limits)
6. [QuickSale Integration](#quicksale-integration)

---

## Overview

The **Client Current Account** (Cuenta Corriente) feature allows you to:

- Track client debts and payments
- Allocate payments to specific invoices/charges
- Generate aging reports to see overdue amounts
- Set credit limits per client with automatic warnings
- Reconcile accounts with detailed allocation tracking

---

## Understanding the Current Account

### Entry Types

Each transaction in the current account is recorded as an **entry**:

| Type | Sign | Description |
|------|------|-------------|
| **CHARGE** | + | Invoice or sale on credit (client owes you) |
| **PAYMENT** | - | Payment received from client |
| **DEBIT_NOTE** | + | Additional charge (interest, fees) |
| **CREDIT_NOTE** | - | Credit/refund to client |

### Entry Status

Each charge entry has a status:

- **Pending**: No payments applied, full amount outstanding
- **Partial**: Some payments applied, remaining amount > 0
- **Paid**: Fully paid, remaining amount = 0
- **Cancelled**: Entry cancelled (e.g., order cancelled)

---

## Payment Allocation

### What is Payment Allocation?

When a client makes a payment, you can decide **which specific charges** that payment should be applied to. This is called **allocation** or **imputación**.

### Two Allocation Modes

#### 1. Automatic (FIFO)

Payments are automatically allocated to the **oldest pending charges first** (First In, First Out).

**When to use:**
- Regular client payments
- When client doesn't specify which invoices to pay

**Example:**
```
Charge #1 (Jan 1): $500  [PAID]
Charge #2 (Jan 15): $300 [PAID $100]
Charge #3 (Jan 20): $400 [UNPAID]

Payment of $600:
→ $500 to Charge #1 (fully paid)
→ $100 to Charge #2 (partially paid)
```

#### 2. Manual Allocation

You manually select which charges to pay and how much to apply to each.

**When to use:**
- Client specifies which invoices to pay
- Partial payments on specific charges
- Overpayment situations

**How to use:**
1. Open the payment dialog
2. Switch to "Manual" mode
3. Check the charges you want to pay
4. Enter the amount for each charge
5. Confirm

### Handling Overpayments

When a payment exceeds the total pending amount:
- The system pays all pending charges
- The remaining amount is shown as "unallocated"
- This creates a credit balance for the client

### Viewing Allocations

Click on any payment entry to see:
- Which charges it was applied to
- How much was allocated to each
- Remaining balance per charge

---

## Aging Reports

### What is an Aging Report?

An aging report shows **how long amounts have been outstanding**, grouped into time buckets:

| Bucket | Description | Color Code |
|--------|-------------|------------|
| **Current** | Not yet due | 🟢 Green |
| **1-30 days** | 1-30 days overdue | 🟡 Yellow |
| **31-60 days** | 31-60 days overdue | 🟠 Orange |
| **61-90 days** | 61-90 days overdue | 🔴 Red |
| **90+ days** | More than 90 days overdue | 🔴 Dark Red |

### Accessing Aging Reports

#### For a Single Client:
1. Go to **Clients** → Select a client
2. Click **Account** tab
3. View the **Aging Report** card

#### For All Clients:
1. Go to **Reports** → **Aging Report**
2. See all clients with outstanding balances
3. Click on any client to see details

### Understanding the Report

**Per Client:**
- Total outstanding amount
- Breakdown by bucket
- Individual invoice details
- Days overdue calculation

**Summary:**
- Total receivables across all clients
- Risk distribution (how much is severely overdue)
- Credit limit alerts

### Using Aging for Collections

1. **Prioritize 90+ days**: These are high-risk debts
2. **Follow up on 61-90 days**: Before they become critical
3. **Monitor 31-60 days**: Send reminders
4. **Review Current/1-30**: Normal payment cycle

---

## Credit Limits

### Setting Credit Limits

1. Go to **Clients** → Select a client
2. Click **Edit**
3. Set **Credit Limit** field
4. Save

### Credit Limit Behavior

| Utilization | Status | Action |
|-------------|--------|--------|
| < 80% | ✅ OK | No restrictions |
| 80-100% | ⚠️ Warning | Shows warning banner |
| > 100% | 🚫 Over Limit | Blocks new sales (configurable) |

### Credit Limit Alerts

When a client reaches 80% of their limit:
- Warning banner appears on their account page
- Shown in QuickSale before completing sale
- Displayed in client list with percentage badge

When a client exceeds 100%:
- Red alert banner
- Sale may be blocked (depending on settings)
- Badge shows "Excedido" (Exceeded)

### Best Practices

1. **Set realistic limits** based on client history
2. **Review limits quarterly** for active clients
3. **Use 0 for unlimited** credit (untrusted clients)
4. **Monitor utilization** in dashboard

---

## QuickSale Integration

### Credit Check in QuickSale

When processing a QuickSale for a client with a credit limit:

1. **System checks credit** before completing sale
2. **Warning appears** if approaching limit (80%+)
3. **Sale may be blocked** if over limit

### QuickSale Credit Indicators

| Indicator | Meaning | Action |
|-----------|---------|--------|
| 🟢 Green progress bar | Under 80% | Proceed normally |
| 🟡 Yellow warning | 80-100% | Warn client, can proceed |
| 🔴 Red alert | Over 100% | Block or require override |

### Bypassing Credit Limits

Admins can override credit limit blocks:
1. Click **Override** when warning appears
2. Enter reason (logged for audit)
3. Complete sale

---

## FAQ

### Q: What happens when I cancel an order?

The corresponding CHARGE entry is marked as **cancelled** and removed from balance calculations. If payments were already applied, they remain as unallocated credit.

### Q: Can I edit a payment after creating it?

No, payments cannot be edited. If you make a mistake:
1. Delete the payment entry
2. Create a new payment with correct allocation

### Q: How do I see a client's complete history?

Go to **Clients** → **Select client** → **Account** tab. All entries are shown in chronological order.

### Q: What's the difference between "balance" and "total pending"?

- **Balance**: Sum of all entries (charges - payments)
- **Total Pending**: Sum of only unpaid/partial charges

### Q: Can a client have a negative balance?

Yes! This means you've received more payments than charges. The client has a **credit** with your business.

### Q: How are due dates calculated?

Due dates are set when creating a CHARGE entry (e.g., when confirming an order). Default is order date + 30 days, but can be customized.

### Q: What if a client pays less than the full invoice?

Use **manual allocation** to specify how much of each invoice they're paying. The remaining amount stays as "partial" status.

---

## Tips & Best Practices

### Daily Operations

1. ✅ **Record payments immediately** when received
2. ✅ **Allocate payments** to specific charges
3. ✅ **Review aging report** weekly for collections
4. ✅ **Set credit limits** for all regular clients
5. ✅ **Monitor dashboard** for credit limit alerts

### Monthly Reconciliation

1. Generate aging report for all clients
2. Follow up on 90+ days overdue
3. Review credit limits for clients approaching them
4. Export account statements for clients who request them

### Data Integrity

1. Never delete paid entries (use credit notes instead)
2. Always add reference numbers for traceability
3. Use notes field to document special situations
4. Review allocations if client disputes balance

---

## Support

For technical issues or questions:
- Check this documentation first
- Contact your system administrator
- Report bugs via the support channel

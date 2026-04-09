# Rental System Guide

## Prerequisites

Before creating a rental, you need:

1. **Inventory items** in the system (at least one with available stock)
2. **A registered guest** (user account) to rent equipment to

---

## Step 1: Add Inventory Items

If this is your first time, you need to add equipment to the inventory.

1. Go to **Admin > Inventory** (or navigate to `/inventory`)
2. Click **Add Item**
3. Fill in the form:
   - **SKU** — Unique code, e.g. `KITE-12M-001`
   - **Name** — e.g. `Kite 12m`
   - **Category** — KITE, BOARD, HARNESS, BAR, WETSUIT, ACCESSORY, or OTHER
   - **Size** — Optional, e.g. `12m`, `M`, `140cm`
   - **Total Quantity** — How many units you have in stock
   - **Condition** — NEW, GOOD, FAIR, DAMAGED, or RETIRED
4. Click **Create Item**

The item's available quantity is automatically set to match the total quantity.

---

## Step 2: Create a Rental

There are two ways to start a rental:

### Option A: From the Add Services page
1. Go to **Admin > Add Services** (`/register`)
2. Search for the guest
3. Click **Add Rental** on their card — this takes you to the rental form with the guest pre-selected

### Option B: From the Rentals page
1. Go to **Admin > Rentals** (`/rentals`)
2. Click **New Rental**
3. Search and select the guest manually

### Filling out the rental form

1. **Guest** — Search by name, email, or phone. Click to select.
2. **Start / Due back** — Set the rental period (date and time)
3. **Add Equipment** — For each item:
   - Select the equipment from the dropdown (shows available stock)
   - Set the quantity
   - Enter the price in EGP (this is the unit price, not total)
   - Click **Add**
4. Review the items table and running total
5. Add optional **Notes**
6. Click **Create Rental**

### What happens when you submit

- A **Rental** record is created with status **Active**
- Inventory stock (**availableQty**) is decremented for each item
- An **inventory movement** (OUT) is logged for each item
- An **open Order** is created in the accounting system for the rental total
- You are redirected to the rentals list

---

## Step 3: Managing Rentals

### Viewing rentals
Go to **Admin > Rentals** (`/rentals`) to see all rentals. The table shows guest, items, dates, status, and total.

### Rental statuses
- **Active** (blue) — Equipment is currently rented out
- **Overdue** (red) — Past the due date and not yet returned
- **Returned** (green) — Equipment has been returned
- **Canceled** (gray) — Rental was canceled

Overdue detection is automatic — rentals past their due date are flagged as overdue when you visit the rentals page.

### Returning equipment
1. On the rentals list, click **Return** next to the rental, OR
2. Click **View** to go to the detail page, then click **Return**
3. Confirm the return

This sets the status to **Returned**, restores inventory stock, and logs an inventory movement (IN).

### Canceling a rental
1. Click **View** on an active rental
2. Click **Cancel**
3. Confirm the cancellation

This restores inventory stock, similar to a return.

---

## Step 4: Payment

Rental payments use the existing accounting system:

1. When a rental is created, an **open Order** is automatically created for the guest
2. Go to **Admin > Open Orders** (`/accounting/open-orders`) to see outstanding balances
3. Use the existing payment flow to settle the rental charge
4. Payment methods: Cash, Card, Transfer, or Discount

---

## Inventory Management

### Viewing inventory
Go to **Admin > Inventory** (`/inventory`). Items with zero available stock are highlighted in red.

### Editing an item
Click **View** on any item to:
- Edit its name, category, size, or condition
- Make stock adjustments (add/remove units with a reason)
- View full movement history (all checkouts, returns, and adjustments)

### Stock adjustments
On an item's detail page, use the **Stock Adjustment** section:
- Enter a positive number to add stock, negative to remove
- Select a type: Adjustment, Stock In, Maintenance, or Lost
- Add an optional reason
- Click **Adjust**

---

## Navigation

All rental and inventory pages are accessible from the **Admin** dropdown in the header:
- **Rentals** — Rental list and management
- **Inventory** — Equipment stock management

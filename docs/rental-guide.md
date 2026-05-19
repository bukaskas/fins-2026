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
2. **Add rental product** — Search for a rental product by name or SKU and click it. Each product becomes its own block on the form.
3. For each product block:
   - Set the product **quantity** (defaults to 1). The line total updates automatically from the product price × qty.
   - Use the **equipment picker** below the product to add the inventory items used with that product. Pick the item, set qty, click **Add**. Available stock shown in the picker reflects the items you've already allocated to other product blocks on this form.
   - Repeat to add as many equipment items as needed under that product
4. Add more products if the guest is renting multiple things at once — each one gets its own equipment list
5. Review the rental total at the bottom
6. Add optional **Notes**
7. Click **Create Rental** — the button stays disabled until every product has at least one equipment item

### What happens when you submit

- A single **Order** is created with one **OrderLine** per product
- A **Rental** record is created (linked to that Order) with status **Active**
- For each equipment item under a product, a **RentalLine** is created linking the inventory item to that specific OrderLine — this is how you can later see which equipment was used with each product
- Inventory stock (**availableQty**) is decremented for each equipment item
- An **inventory movement** (OUT) is logged for each item
- You are redirected to the rentals list

---

## Step 3: Managing Rentals

### Viewing rentals
Go to **Admin > Rentals** (`/rentals`) to see all rentals. The table shows guest, products, equipment, dates, status, and total. Open a rental's detail page to see each product with its equipment grouped beneath it.

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

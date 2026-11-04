# Owner workflows

The complete app uses one Supabase project, USD, no VAT/sales tax, and the repository's Boys & Girlz logo and centralized theme tokens.

Products have editable cost, separate channel prices, amount/percentage discounts, a shop and category, age/color variants, SKUs/barcodes, images and either website_and_pos or pos_only visibility. Add a shop or category inline without resetting product inputs. The public catalog queries with the anon key; both row policies and column grants protect it. Product discounts use one shared cents-based pricing function.

POS can scan keyboard-wedge barcodes, adjust quantities and discounts, hold/resume sales, redeem points/credit/gifts, record split cash/Whish payments, calculate change and print receipts. Quick Sale / Unlisted Item needs only name, price and quantity. Optional cost is stored as null when omitted and excluded from COGS. It never creates a product or changes inventory. Known variants can be sold at zero/negative stock. Quick-sale receipts link to a prefilled product form; reports have an unlisted-items filter.

Overview has Sales, Expenses, Liabilities, COGS, Gross Profit and Net Profit. Each card has today/week/month/custom dates. Sales and COGS count completed/delivered orders in the chosen period, unknown costs are excluded, expenses follow incurred dates, and liabilities show all currently outstanding balances. Costs snapshot the editable product cost at sale time. Monetary calculations use integer USD cents; decimal SQL projections are also supplied. Date boundaries use UTC.

Expenses, liabilities, supplier purchase/receipt/payment flows, returns/exchanges, receipts/packing slips, CSV/PDF printing and cash reconciliation remain connected to the shared records. Sales, stock movements, payments, points and journal entries use serializable transactions. Exchanges roll back together. Negative-stock receipts and purchases avoid division by zero in cost valuation.

Customer profiles record normalized phone numbers, children, tags, history, points and consent. WhatsApp campaign composition is available globally or on a customer profile. A real business WhatsApp account must be QR-linked before sending. Session keys, campaigns and per-recipient pending/sent/failed statuses persist in Supabase. The worker claims recipients transactionally, rechecks consent, excludes demo contacts, sends at a conservative jittered interval, and supports explicit retry. A sent status means the transport accepted the message; it does not imply the customer read it. A connection loss or restart never fabricates a delivery result. Uncertain attempts are surfaced for review before retry.

The server must remain running for the WhatsApp worker and linked-device connection. No messaging provider subscription is used. The optional sample-data seed is not run automatically; it never provides a real broadcast test list.

The connected project passed live RLS, Auth, Storage, pricing, sales and browser Realtime checks on 2026-11-04. Recipient delivery still needs the owner's business phone linked and a consenting test number. Live tests explicitly skip when no test project is configured. See spec-implementation.md for the verified workflows.

Admin Fulfillment (Shippo)

Overview
- Powerful, streamlined workbench at `/admin/fulfillment` for rate shopping and purchasing labels using Shippo.
- No client secrets exposed; all Shippo calls happen via server API routes.

Environment
- Add the following to `.env.local` and restart the dev server:
  - `SHIPPO_API_TOKEN`: Your Shippo API token (test/live).
  - `SHIPPO_BASE_URL` (optional): Defaults to `https://api.goshippo.com`.
  - Default ship-from address (prefill + API):
    - `SHIP_FROM_NAME`, `SHIP_FROM_COMPANY`
    - `SHIP_FROM_STREET1`, `SHIP_FROM_STREET2`
    - `SHIP_FROM_CITY`, `SHIP_FROM_STATE`, `SHIP_FROM_ZIP`, `SHIP_FROM_COUNTRY`
    - `SHIP_FROM_PHONE`, `SHIP_FROM_EMAIL`

Server API
- `POST /api/shippo/rates` → Creates a shipment with to/from + parcel, returns rates.
- `POST /api/shippo/purchase` → Purchases a label given a `rate_id`, returns `label_url` and tracking.
- `GET /api/shippo/defaults` → Returns default `from_address` from env.
- `POST /api/fulfillment/mark-fulfilled` → Marks an order fulfilled and appends shipment info to `orders.metadata.shipments`.

UI Flow
1) Ship From: prefilled from env (Load defaults), editable.
2) Ship To: paste from order/customer for now.
3) Parcel: set dimensions and weight + units.
4) Get Rates: select the best service.
5) Buy Label: downloads available via `label_url`; tracking shown with provider URL.
6) Optional: Mark order fulfilled via `/api/fulfillment/mark-fulfilled` (can be wired to an order selection step later).

Notes
- The Orders list shows most recent unfulfilled orders to keep context nearby. Click through to order details if needed.
- Future enhancement: auto-fill Ship To from order once shipping addresses are stored at checkout/webhook time.


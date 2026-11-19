# Backend Handoff: BuiltGlory Customer App

These documents were produced by analysing the React Native frontend (`src/`). Use them to build or check the backend so it matches what the app sends and expects.

| File | What's inside |
| --- | --- |
| [01_API_CONTRACT.md](01_API_CONTRACT.md) | All 51 endpoints: method, path, auth, query, request body, response `data`, and how the client uses each one. Also covers the response envelope, error format and the refresh-token protocol. |
| [02_DATA_MODELS.md](02_DATA_MODELS.md) | Every entity shape and enum, the UI → API property type mapping, amenity and city catalogues, and suggested collections. |
| [03_BUSINESS_LOGIC.md](03_BUSINESS_LOGIC.md) | Validation, filter mapping, status machines, derived fields, and the rules the backend must enforce. Ends with a list of known API gaps. |
| [04_WORKFLOWS.md](04_WORKFLOWS.md) | End-to-end flows as Mermaid diagrams (launch, OTP login, buy, visit, payment, sell, offer, profile), plus the admin actions the app depends on. |

The older screen-by-screen map is in [../API_MAPPING.md](../API_MAPPING.md).

## Rules that break the app if they are wrong

1. **Response envelope:** `{ data, meta }` on success and `{ error: { code, message, details[] } }` on failure. List endpoints need `meta.page/limit/total/totalPages`.
2. **Base path:** `/api/v1`, default port `5001`.
3. **`x-device-id`** is sent on every request. **Refresh tokens rotate**, and the app treats 401/403/409 from `/auth/refresh` as the end of the session.
4. **CSV arrays** in query strings (`bhk=3,4,5+`).
5. **`GET /properties/:id` returns 404** for sold or withdrawn listings.
6. **`/me/buy-enquiries` embeds `visits[]` and `deal`.** There are no separate visits or deals list endpoints.
7. **Seller endpoints that change data** (`offer-decision`, `messages`, `visits/:id/action`) return the full `SellerActivity`.
8. **`POST /documents` must return `url`.**
9. **`POST /payments/token` is idempotent** on `idempotencyKey`.
10. **Money is in rupees.** Availability `slot.time` strings are sent back unchanged as `visitTime`.

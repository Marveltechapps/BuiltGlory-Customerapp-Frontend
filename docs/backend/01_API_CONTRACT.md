# BuiltGlory Customer App: API Contract

This file lists every HTTP call the React Native customer app makes. It was taken from `src/api/*`, `src/services/*.service.ts` and `src/types/*.ts`. The backend must match these paths, methods, bodies and response shapes, or the app will break.

- **Base URL:** `http://<host>:5001/api/v1` (`src/api/config.ts`). On the Android emulator the host is `10.0.2.2`.
- **Client timeout:** 20 s. After that the app shows the error code `TIMEOUT`.
- Entity shapes are in [02_DATA_MODELS.md](02_DATA_MODELS.md). Rules are in [03_BUSINESS_LOGIC.md](03_BUSINESS_LOGIC.md). Flows are in [04_WORKFLOWS.md](04_WORKFLOWS.md).

---

## 1. Global conventions

### 1.1 Request headers

| Header | When | Value |
| --- | --- | --- |
| `Accept` | always | `application/json` |
| `x-device-id` | **always** (signed in or not) | A stable ID for each install, e.g. `bg-lq2x1k-a8f3k2pz`. The backend uses it for OTP cooldowns and to bind sessions. |
| `Authorization` | when the user has a session and the call does not set `auth:false` | `Bearer <accessToken>` |
| `Content-Type` | JSON body | `application/json` |
| `Content-Type` | file upload | `multipart/form-data` (the client sets the boundary) |

### 1.2 Success envelope (required)

Every JSON response must be wrapped like this:

```json
{ "data": <payload>, "meta": { "requestId": "req_abc123" } }
```

List endpoints that the client reads with `apiRequestPage` must also include pagination fields in `meta`:

```json
{
  "data": [ ... ],
  "meta": { "requestId": "req_abc", "page": 1, "limit": 20, "total": 134, "totalPages": 7 }
}
```

If `meta` fields are missing, the client uses these defaults: `page=1, limit=20, total=0, totalPages=0`. Infinite scroll uses `page < totalPages`, so **return correct `totalPages`**.

`204 No Content` is accepted, and so is an empty body. Both count as success.

### 1.3 Error envelope (required)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message shown to the user",
    "details": [ { "field": "phone", "message": "Phone must be 10 digits", "value": "123" } ]
  },
  "meta": { "requestId": "req_abc" }
}
```

- The app shows `error.message` to the user. For **400/422**, when `details[]` is not empty, the app shows `details[0].message`. Write user-friendly messages.
- `details[].field` is used to show the error next to the matching form field. Use dotted paths such as `address.city`.
- The client also accepts `error` as a plain string, or a top-level `message`, but the object form above is the one to use.

### 1.4 Status codes the client relies on

| Status | Client behaviour |
| --- | --- |
| `401` on any non-`/auth/*` path | Calls `POST /auth/refresh` **once**. Concurrent 401s share that one refresh. If refresh succeeds, the original request is retried with the new token. |
| `401 / 403 / 409` from `/auth/refresh` | The session is cleared and the "session expired" screen (G-04) is shown. |
| `404` from `GET /properties/:id` | Means **sold or withdrawn**. The app shows the Sold-Out or Property-Withdrawn screen. |
| `400 / 422` | Validation error. The app shows `details[0].message`. |
| Network failure | Code `NETWORK_ERROR`. On Splash the app shows the Offline screen. |

### 1.5 Query string encoding

- Values that are `undefined`, `null` or `''` are left out.
- **Arrays are joined with commas.** For example, the client sends `bhk=3,4,5+` and never `bhk[]=3`. The backend must split on commas.
- Booleans are sent as the strings `true` and `false`.

### 1.6 Auth flag per endpoint

**Public** means the backend must allow the call without a token. The app sends `auth:false` for these, or calls them before login.

---

## 2. Endpoint index

| # | Method | Path | Auth | Service fn |
| --- | --- | --- | --- | --- |
| 1 | GET | `/app/config` | Public | `getAppConfig` |
| 2 | POST | `/auth/customer/otp/send` | Public | `sendOtp` |
| 3 | POST | `/auth/customer/otp/verify` | Public | `verifyLoginOtp`, `verifyPhoneChangeOtp` |
| 4 | POST | `/auth/refresh` | Public (refresh token in body) | api client |
| 5 | POST | `/auth/logout` | Bearer | `logout` |
| 6 | GET | `/me` | Bearer | `getMe` |
| 7 | PATCH | `/me` | Bearer | `updateMe` |
| 8 | GET | `/me/account-deletion` | Bearer | `getAccountDeletion` |
| 9 | POST | `/me/account-deletion` | Bearer | `requestAccountDeletion` |
| 10 | DELETE | `/me/account-deletion` | Bearer | `cancelAccountDeletion` |
| 11 | GET | `/properties` | Public (optional bearer) | `listProperties` |
| 12 | GET | `/properties/:propertyId` | Public (optional bearer) | `getProperty` |
| 13 | POST | `/properties/:propertyId/save` | Bearer | `saveProperty` |
| 14 | DELETE | `/properties/:propertyId/save` | Bearer | `unsaveProperty` |
| 15 | GET | `/me/favorites` | Bearer | `listFavorites` |
| 16 | GET | `/search/trending` | Public | `getTrendingSearches` |
| 17 | GET | `/me/searches` | Bearer | `getRecentSearches` |
| 18 | POST | `/me/searches` | Bearer | `recordSearch` |
| 19 | DELETE | `/me/searches` | Bearer | `clearRecentSearches` |
| 20 | POST | `/buy-enquiries` | Bearer | `createBuyEnquiry` |
| 21 | GET | `/me/buy-enquiries` | Bearer | `listMyEnquiries` |
| 22 | GET | `/me/buy-enquiries/:enquiryId` | Bearer | `getMyEnquiry` |
| 23 | PATCH | `/me/buy-enquiries/:enquiryId/cancel` | Bearer | `cancelMyEnquiry` |
| 24 | GET | `/visits/availability` | Bearer | `getAvailability` |
| 25 | POST | `/visits` | Bearer | `createVisit` |
| 26 | PATCH | `/visits/:visitId/reschedule` | Bearer | `rescheduleVisit` |
| 27 | PATCH | `/visits/:visitId/cancel` | Bearer | `cancelVisit` |
| 28 | POST | `/payments/token` | Bearer | `createTokenPayment` |
| 29 | POST | `/payments/:paymentId/cancel` | Bearer | `cancelPayment` |
| 30 | GET | `/me/payments` | Bearer | `listMyPayments` |
| 31 | POST | `/sell-requests/drafts` | Bearer | `createSellDraft` |
| 32 | GET | `/me/sell-requests` | Bearer | `listMySellRequests` |
| 33 | GET | `/me/sell-requests/:id` | Bearer | `getMySellRequest` |
| 34 | PATCH | `/me/sell-requests/:id` | Bearer | `updateMySellRequest` |
| 35 | POST | `/me/sell-requests/:id/submit` | Bearer | `submitMySellRequest` |
| 36 | GET | `/me/sell-requests/:id/activity` | Bearer | `getSellerActivity` |
| 37 | POST | `/me/sell-requests/:id/offer-decision` | Bearer | `decideOffer` |
| 38 | POST | `/me/sell-requests/:id/messages` | Bearer | `sendSellerMessage` |
| 39 | POST | `/me/sell-requests/:id/visits/:visitId/action` | Bearer | `actOnSellerVisit` |
| 40 | POST | `/me/sell-requests/:id/valuation-estimate` | Bearer | `getValuationEstimate` |
| 41 | POST | `/documents` (multipart) | Bearer | `uploadDocument` |
| 42 | GET | `/documents/:documentId/read-url` | Bearer | `getDocumentReadUrl` |
| 43 | GET | `/me/notifications` | Bearer | `listNotifications` |
| 44 | GET | `/me/notifications/unread-count` | Bearer | `getUnreadCount` |
| 45 | PATCH | `/me/notifications/read` | Bearer | `markNotificationsRead` |
| 46 | PATCH | `/me/notifications/:id/read` | Bearer | `markNotificationRead` |
| 47 | DELETE | `/me/notifications/:id` | Bearer | `deleteNotification` |
| 48 | GET | `/content` | Public | `listContent` |
| 49 | GET | `/content/:slug` | Public | `getContent` |
| 50 | POST | `/callbacks` | Bearer | `requestCallback` |
| 51 | POST | `/feedback` | Bearer | `submitFeedback` |

**Defined in the backend spec but not called by the app yet:** `PUT /me/push-token` (FCM/APNs is not set up) and `/me/support/live-chat`.

---

## 3. Endpoint details

### 3.1 App config

#### `GET /app/config`  (public)
Called on every app launch (Splash). The response decides between three screens: **Maintenance** (G-03), **Force update** (G-02) or normal start.

Response `data`:
```json
{
  "versions": { "current": "1.0.0", "minimumSupported": "1.0.0", "latest": "1.2.0" },
  "storeUrls": { "ios": "https://apps.apple.com/...", "android": "https://play.google.com/..." },
  "maintenance": { "enabled": false, "message": "We'll be back soon", "expectedBackAt": "2026-10-21T06:00:00Z" },
  "featureFlags": {},
  "payment": {
    "tokenAmount": 100000,
    "escrow": {
      "accountHolder": "BuiltGlory Escrow", "bankName": "HDFC Bank", "accountNumber": "50200012345678",
      "ifsc": "HDFC0001234", "branch": "Adyar", "upiId": "builtglory@hdfcbank",
      "chequePayee": "BuiltGlory Escrow A/c", "chequeInstructions": ["...", "..."]
    }
  },
  "support": {
    "supportPhone": "+91 98765 43210", "supportPhoneE164": "+919876543210",
    "supportEmail": "support@builtglory.com", "whatsappNumber": "919876543210",
    "whatsappUrl": "https://wa.me/919876543210", "telUrl": "tel:+919876543210",
    "supportWhatsAppMessage": "Hi BuiltGlory", "phone": "+91 98765 43210"
  },
  "dashboardOptions": {}
}
```
Notes:
- The app's built-in version is `1.0.0` (`APP_VERSION`). Force update is shown when `APP_VERSION < versions.minimumSupported`, compared number by number on each dot-separated part.
- `payment.tokenAmount` is in **rupees**. It is the amount sent to `POST /payments/token`. `escrow` may be `null`.

---

### 3.2 Auth (phone OTP, customers only, no passwords)

The country code is fixed to `+91`. Phone numbers are 10 digits with no prefix.

#### `POST /auth/customer/otp/send`  (public)
```json
{ "phone": "9876543210", "countryCode": "+91", "deviceId": "bg-...", "purpose": "login" }
```
`purpose` is `"login"` or `"change_phone"`.

Response `data`:
```json
{ "requestId": "otp_req_123", "expiresInSeconds": 300, "canResendAt": "2026-10-20T10:01:00.000Z" }
```
- The resend countdown uses `canResendAt` (ISO). Resend calls the same endpoint again and replaces the stored `requestId`.
- For `change_phone`, return an error if the number already belongs to another account.

#### `POST /auth/customer/otp/verify`  (public)
```json
{ "phone": "9876543210", "otp": "123456", "requestId": "otp_req_123", "countryCode": "+91", "purpose": "login" }
```
- The OTP is **6 digits**. `requestId` may be `""` (the client falls back to an empty string).

**When `purpose = "login"`**, response `data` (create the user on first login):
```json
{
  "accessToken": "eyJ...", "refreshToken": "rt_...", "expiresInSeconds": 900,
  "user": { /* User, see data models */ }
}
```
After login the app looks at `user.name`. If it is empty, the app goes to **Profile setup**. Otherwise it goes to **Home**.

**When `purpose = "change_phone"`**, response `data` (no tokens, and no change to the user yet):
```json
{ "verified": true, "phone": "9876543210", "phoneNormalized": "+919876543210" }
```
After this the app calls `PATCH /me { mobileNumber }`. The backend should accept that change only if the number was verified recently.

Errors to return: wrong OTP, expired OTP, too many attempts. The `message` text is shown to the user.

#### `POST /auth/refresh`  (public)
```json
{ "refreshToken": "rt_..." }
```
Response `data`: `{ "accessToken": "...", "refreshToken": "..." }`
- **Refresh tokens rotate on every use.** Return a new refresh token every time.
- If the token was reused, revoked or has expired, return `401`, `403` or `409`. The client then logs out.

#### `POST /auth/logout`  (bearer)
```json
{ "refreshToken": "rt_..." }
```
Response `data`: `{ "revoked": true }`. Revoke the refresh token and blacklist the access token. The client clears its local session even if this call fails.

---

### 3.3 Me / profile

#### `GET /me`
Returns the `User` (see data models), **including the virtual field `profileComplete`**.

#### `PATCH /me`
Partial update. Every field is optional:
```json
{
  "name": "Arun Kumar",
  "email": "arun@x.com",            // nullable; null clears it
  "mobileNumber": "9876500000",     // only after change_phone OTP verify
  "city": "Chennai", "state": null, "country": null,
  "latitude": null, "longitude": null,
  "profilePhoto": "https://.../photo.jpg",   // URL returned by POST /documents
  "userType": "resident",           // resident | nri | pio
  "role": "both",                   // buyer | seller | both
  "bankDetails": {
    "accountHolderName": "Arun Kumar", "bankName": "HDFC", "accountNumberLast4": "5678",
    "ifsc": "HDFC0001234", "branch": "Adyar", "upiId": null
  },
  "notificationPreferences": {
    "sms":   { "marketing": true },
    "email": { "marketing": true },
    "push":  { "transactional": true, "marketing": false },
    "in_app":{ "transactional": true }
  }
}
```
Returns the updated `User`.

**`notificationPreferences` must be deep-merged.** The app sends one channel and one key at a time. Do not overwrite the whole object.

The app calls this endpoint from these places:

| Caller | Fields |
| --- | --- |
| Profile setup (S-05) | `name`, `email`, then `profilePhoto` |
| Location + user type (S-06) | `city`, `userType` |
| Terms (S-07) | `notificationPreferences.sms.marketing`, `notificationPreferences.email.marketing` |
| Enquiry form | `name` / `email`, synced if the user edited them |
| Sell submit | `role: "both"`, sent when the current role is `buyer` |
| Seller deal confirmed (SL-14) | `bankDetails`. **Only the last 4 digits of the account number are sent.** |
| Notification settings (A-02) | `notificationPreferences.push.*` and `notificationPreferences.in_app.*` |
| Change phone (P-03) | `mobileNumber` |

#### `GET /me/account-deletion`
Response `data`:
```json
{ "status": "requested", "verificationStatus": "pending", "reason": null,
  "requestedAt": "...", "scheduledDeletionAt": "...(+30 days)", "cancelledAt": null }
```
`status` is one of `none | requested | cancelled | completed`.

#### `POST /me/account-deletion`
```json
{ "confirmation": "DELETE", "reason": null }
```
`confirmation` must be the exact string `"DELETE"`. Schedule the deletion **30 days** ahead and return the `AccountDeletionStatus`.

#### `DELETE /me/account-deletion`
Cancels the deletion while the 30-day grace period is still running. Returns the `AccountDeletionStatus`.

---

### 3.4 Properties (buyer catalogue)

#### `GET /properties`  (public, paginated)
This endpoint backs Home, Search, Featured, Upcoming, Filter (live count), Results, Map, Compare and Recently-sold.

Query parameters. All are optional. **Multi-value parameters are comma-separated.**

| Param | Type | Notes |
| --- | --- | --- |
| `type` | enum | `plot, apartment, residential, commercial, organic_home, 3d_printing, fractional, ceo_mansion, holiday_home, land, farmhouse, nri, interior, villa` |
| `city` | string | Case-insensitive match on `address.city`. |
| `locality` | string | |
| `minPrice`, `maxPrice` | number (₹) | The UI slider works in lakhs; the client multiplies by 100000. |
| `minArea`, `maxArea` | number (sqft) | Compare against the area in specs (see the area fallback rule in Business Logic §2). |
| `bhk` | csv | Values `1,2,3,4,5+`. `5+` means 5 or more. |
| `amenities` | csv | Amenity labels, e.g. `Lift,Gym,Pool`. |
| `facing` | csv | e.g. `East,North`. |
| `furnishing` | csv | e.g. `Unfurnished,Semi-furnished`. |
| `propertyAge` | csv | |
| `possession` | csv | Includes `Ready to move`. |
| `constructionStatus` | string | |
| `postedBy` | `owner \| builder \| dealer` | |
| `verified` | bool | **The client treats "verified" as `status === "available"`.** Filter the same way. |
| `negotiable` | bool | `isNegotiable = true` |
| `recentlySold` | bool | Returns **sold** listings, newest `soldAt` first (used on the Sell type screen). |
| `featured` | bool | `isFeatured = true` |
| `upcoming` | bool | `isUpcoming = true` |
| `search` | string | Free text across title, locality, city and reference ID. |
| `sort` | `relevance \| price_asc \| price_desc \| newest \| oldest` | `relevance` is only sent together with `search`. |
| `page`, `limit` | int | Defaults 1 / 20. The client asks for up to 50 (map). |

Default visibility: return only `isVisibleOnApp = true` listings that are **not sold** and not drafts. The exception is `recentlySold=true`.

Response: `data: Property[]` plus the pagination `meta`.

How the client uses it:
- Home: `featured=true&limit=5`, `upcoming=true&limit=3`, and `verified=true&limit=1`. The last call **only reads `meta.total`** for the "N+ Verified listings" stat.
- Filter screen: a live "Show N properties" count, read from `meta.total`.
- Compare: first the same `type`, then `limit=10&sort=newest` as a fallback.

#### `GET /properties/:propertyId`  (public)
Returns one `Property`. **Return `404` when the property is sold, withdrawn or hidden.** The app depends on this to show the Sold-Out or Withdrawn screens.

If a bearer token is present, you may also return `savedByUsers`. The client mostly uses `/me/favorites` for saved state.

#### `POST /properties/:propertyId/save`
Adds the property to the user's favourites. Returns the full `Property` (it is put at the top of the favourites list). Make it idempotent.

#### `DELETE /properties/:propertyId/save`
Removes it. Returns `204` or `data: null`. Make it idempotent.

#### `GET /me/favorites`
Returns `data: Property[]` with **no pagination**.

---

### 3.5 Search

| Endpoint | Body / response |
| --- | --- |
| `GET /search/trending` (public) | `data: string[]` (popular terms) |
| `GET /me/searches` | `data: string[]`, the user's **last 10** terms, newest first |
| `POST /me/searches` | body `{ "term": "adyar 3bhk", "resultCount": 12 }` → `data: string[]` (updated recent list) |
| `DELETE /me/searches` | → `data: []` |

Remove duplicate terms and keep only the 10 newest.

---

### 3.6 Buy enquiries

#### `POST /buy-enquiries`
```json
{
  "propertyId": "6650...",
  "enquiryTypes": ["schedule_visit", "price_negotiation"],
  "interestType": "schedule_visit",
  "preferredContact": "whatsapp",
  "preferredVisitTime": "tomorrow_morning",
  "preferredVisitDate": null,
  "preferredVisitTimeSlot": "Tomorrow, 10:00 AM – 12:00 PM",
  "additionalMessage": "Need parking info\nAlternate contact number: +91 9123456789."
}
```

| Field | Rule |
| --- | --- |
| `propertyId` | required; the property must exist and be visible |
| `enquiryTypes` | array, subset of `schedule_visit, price_negotiation, more_details`, at least 1 |
| `interestType` | required; always equals `enquiryTypes[0]` |
| `preferredContact` | required: `phone, whatsapp, email` |
| `preferredVisitTime` | `tomorrow_morning, tomorrow_afternoon, this_weekend_morning, this_weekend_afternoon, custom`, or `null` when no visit was chosen |
| `preferredVisitDate` | `YYYY-MM-DD`; sent only when `custom` was chosen through the visit calendar |
| `preferredVisitTimeSlot` | free-text label, or the slot time such as `"11:00 AM"` |
| `additionalMessage` | nullable free text. An alternate phone number is added into it. |

Response: a `BuyEnquiry` with `status: "new"`. Fill `propertySnapshot` and `referenceId` (shown to the user).

Take buyer details (name, phone, email) **from the authenticated user**. The app updates the user through `PATCH /me` before it sends the enquiry.

#### `GET /me/buy-enquiries`  (paginated)
Query: `page`, `limit` (the client sends `limit=100`, or `1` on the Profile screen to read the count), `status`, `sort=newest|oldest`.

**Each item must embed `visits: Visit[]` and `deal: Deal | null`.** The My Visits, My Deals and My Enquiries screens are built entirely from this one response. There is no separate visits list or deals list endpoint.

#### `GET /me/buy-enquiries/:enquiryId`
Returns one `BuyEnquiry` with `visits` and `deal` embedded. It is used by Enquiry detail, Documents shared, Payment and Registration details.

#### `PATCH /me/buy-enquiries/:enquiryId/cancel`
There is **no body**. It sets `status` to `closed` (and cancels any open visits). Returns the `BuyEnquiry`.

---

### 3.7 Visits

#### `GET /visits/availability`
Query: `propertyId` (required), `visitType=physical|virtual` (default `physical`), `from=YYYY-MM-DD`, `days=<int>`.

The client sends `from` as the later of tomorrow and the first day of the month, and `days` as the remaining days in the shown month.

Response `data`:
```json
{
  "propertyId": "6650...", "visitType": "physical", "timezone": "Asia/Kolkata",
  "from": "2026-10-21", "to": "2026-10-31",
  "days": [
    { "date": "2026-10-21", "slots": [
      { "time": "10:00 AM", "available": true,  "status": "available", "remainingCapacity": 2, "bookedCount": 1 },
      { "time": "11:00 AM", "available": false, "status": "booked",    "remainingCapacity": 0, "bookedCount": 3 }
    ]}
  ]
}
```
- `slots[].time` is the **exact string** that is sent back as `visitTime`.
- A day where every slot has `available:false` is shown as "full".
- The client picks the first open slot automatically.

#### `POST /visits`
```json
{ "propertyId": "6650...", "enquiryId": "6651...", "visitDate": "2026-10-21", "visitTime": "10:00 AM",
  "visitType": "physical", "virtualPlatform": null, "meetingLink": null }
```
- For NRI video calls, `visitType` is `"virtual"` and `virtualPlatform` is one of `zoom | google_meet | teams | whatsapp_video`.
- `enquiryId` may be missing. Link the visit to the enquiry and move the enquiry to `visit_scheduled`.
- Reject a slot that is already full (409) or a date in the past (422).

Response: a `Visit` with `status: "scheduled"`.

#### `PATCH /visits/:visitId/reschedule`
Body: `{ "visitDate": "2026-10-23", "visitTime": "2:00 PM" }`. The date and time must be in the future and the slot must be free. Increase `rescheduleCount` and set `status` to `rescheduled`. Returns the `Visit`.

#### `PATCH /visits/:visitId/cancel`
Body: `{ "reason": "Change of plans" }`. **`reason` is required.** Sets `status` to `cancelled` and stores `cancelReason`. Returns the `Visit`.

---

### 3.8 Payments (manual escrow token)

#### `POST /payments/token`
```json
{
  "type": "token", "currency": "INR",
  "dealId": "6652...", "propertyId": "6650...",
  "amount": 100000, "method": "bank",
  "idempotencyKey": "token-6652...-bank",
  "transactionReference": null, "proofDocumentId": null, "notes": null
}
```
- `method` is `bank | upi | cheque` (the type also allows `cash`).
- **Idempotent on `idempotencyKey`.** The same key must return the existing payment and must not create a second one.
- `amount` should equal `config.payment.tokenAmount`, or the deal's `financials.tokenAmount`.
- Create the payment with `status: "pending"` so an admin can verify it.

Response: a `Payment`. If `status` is `failed`, `rejected` or `cancelled`, the client shows the failure screen with `failureReason` or `verificationNotes`.

#### `POST /payments/:paymentId/cancel`
No body. Returns the `Payment`.

#### `GET /me/payments`  (paginated)
Query: `dealId`, `type=token|full|stage|seller_payout|refund`, `status`, `limit` (the client sends 50).

The client uses `?dealId=X&type=token` to find an existing token payment. If one is `paid`, or `pending`/`created`, the client does not show the "pay" button again.

---

### 3.9 Sell requests (seller flow)

#### `POST /sell-requests/drafts`
Body: a `SellRequestPayload` (see data models). Every field is optional. **Do not require any fields for a draft.**

Returns a `SellRequest` with `status: "draft"` and `isDraft: true`. The app creates the draft as soon as the user picks the first photo or moves to the next step.

#### `GET /me/sell-requests`  (paginated)
Query: `page`, `limit` (the client sends 100, or 1 on Profile), `status`.

#### `GET /me/sell-requests/:id`
Returns a `SellRequest`.

#### `PATCH /me/sell-requests/:id`
Body: a partial `SellRequestPayload`. **Only allowed while `status` is `draft` or `changes_requested`.** Otherwise return 409 or 422 with a clear message. Returns the `SellRequest`.

Remove unknown keys under `specifications` instead of rejecting the request (see the allowed keys in Data Models).

#### `POST /me/sell-requests/:id/submit`
No body. Check that all required fields are present (Business Logic §5). Move the request from `draft` (or `changes_requested`) to `new`, set `submittedAt`, and set `isDraft: false`.
- **The user's role must be `seller` or `both`.** The client upgrades a `buyer` to `both` first.

Returns the `SellRequest`.

#### `GET /me/sell-requests/:id/activity`
This is the main endpoint for every seller lifecycle screen. The chat screen **polls it every 15 s**.

Response `data`:
```json
{
  "sellRequest": { /* SellRequest */ },
  "acquisition": { "_id": "...", "stage": "valuation", "agreedPrice": 8500000,
                   "documentation": { "termSheetUrl": "https://..." },
                   "token": { "amount": 100000, "paid": false }, "payout": { "completed": false },
                   "stageHistory": [ { "from": "pending_review", "to": "site_inspection", "changedAt": "...", "notes": "" } ] },
  "property": { "_id": "...", "title": "...", "status": "available" },
  "offer": { "amount": 8200000, "status": "sent", "expiresAt": "2026-10-22T10:00:00Z", "counterAmount": null, "notes": null },
  "enquiries": [ { "_id": "...", "referenceId": "BE-1001", "buyerSnapshot": { "name": "R***", "userType": "nri" },
                   "interestType": "schedule_visit", "preferredContact": "phone",
                   "preferredVisitDate": "2026-10-25", "preferredVisitTimeSlot": "10:00 AM",
                   "status": "new", "submittedAt": "..." } ],
  "visits": [ { "_id": "...", "referenceId": "VS-77", "buyerId": "...", "visitDate": "2026-10-25",
                "visitTime": "10:00 AM", "visitType": "physical", "status": "scheduled", "rescheduleCount": 0 } ],
  "chatThreads": [ { "_id": "...", "referenceId": "CT-1", "status": "open", "lastMessageAt": "...", "messageCount": 4 } ],
  "messages": [ { "sender": "seller|admin|system", "type": "text|offer|system", "text": "Hi",
                  "offerAmount": null, "offerStatus": null, "createdAt": "..." } ],
  "payoutSchedule": [ { "key": "token", "label": "Token advance", "amount": 100000, "dueLabel": "On agreement", "status": "pending|paid" } ],
  "registration": { "appointment": { "date": "2026-11-05", "time": "11:00 AM", "office": "SRO Adyar", "address": "..." },
                    "status": "scheduled|completed|pending", "checklist": ["Original sale deed", "PAN", "Aadhaar"] },
  "metrics": { "enquiryCount": 3, "visitCount": 1, "chatCount": 4, "payoutCount": 0 }
}
```
- `acquisition`, `property` and `offer` may be `null`.
- **Mask buyer personal data.** Do not send full buyer names or phone numbers to sellers.
- The client treats a message as the seller's own when `sender === "seller"`.
- The client reads the registration `appointment` flexibly. Date keys: `dateTime|date|appointmentDate|registrationDate|scheduledAt`. Time keys: `time|slot|appointmentTime`. Office keys: `office|registrationOffice|location|venue`. Address keys: `address|officeAddress|subRegistrarName`. Use `date` / `time` / `office` / `address`.
- The client looks for the term sheet in `acquisition.documentation.termSheetUrl`, then `documentation.termSheet.url`, then `documentation.termSheet`. It must be an `http(s)` URL.
- The sale deed file is found as a `sellRequest.documents[]` entry whose `name` matches `/sale[\s_-]*deed/i` and that has a `fileUrl`.
- `registration.status === "completed"` makes the Deal Complete screen show the deal as registered.

#### `POST /me/sell-requests/:id/offer-decision`
```json
{ "decision": "accepted" }
{ "decision": "countered", "counterAmount": 8800000, "notes": "Recent renovation" }
```
- After `accepted`, set `offer.status` to `seller_accepted` and move the acquisition forward.
- After `countered`, set `offer.status` to `seller_countered` and store `offer.counterAmount`.
- Reject the call if the offer has expired or has already been decided.
- Returns the **full `SellerActivity`**. The client replaces its state with it.

#### `POST /me/sell-requests/:id/messages`
Body: `{ "text": "Can we discuss?" }`. Returns the **full `SellerActivity`**.

#### `POST /me/sell-requests/:id/visits/:visitId/action`
```json
{ "action": "confirm" }
{ "action": "reschedule", "visitDate": "2026-10-27", "visitTime": "4:00 PM", "reason": "Not home" }
```
Returns the **full `SellerActivity`**. The seller has no "decline" action; a decline is sent as `reschedule`.

#### `POST /me/sell-requests/:id/valuation-estimate`
Request:
```json
{ "propertyType": "apartment", "address": { ... }, "specifications": { ... }, "amenities": [...], "askingPrice": 8500000 }
```
Response:
```json
{
  "sellRequestId": "...", "source": "comparables", "confidence": "medium",
  "estimatedPrice": 8300000, "low": 7800000, "high": 8900000, "pricePerSqft": 6900,
  "area": 1200, "comparableCount": 5, "basis": "5 sold apartments within Adyar",
  "askingPriceDeltaPercent": 2.4,
  "comparables": [ { "_id": "...", "title": "...", "price": 8100000, "status": "sold",
                     "locality": "Adyar", "city": "Chennai", "area": 1150, "pricePerSqft": 7043 } ]
}
```
- `source` is `comparables` or `baseline`. `confidence` is `high | medium | low | baseline`.
- Used on SL-07 (expected price) and on SL-12 (offer compared with the area average).

---

### 3.10 Documents / uploads

#### `POST /documents`  (multipart/form-data)
| Field | Value |
| --- | --- |
| `file` | the binary file (`{uri,name,type}` from RN), usually `image/jpeg` |
| `ownerType` | `user, property, sell_request, acquisition, sales_deal, support_ticket, payment` |
| `ownerId` | ID of the owner record (the user's `_id` for a profile photo; the draft ID for sell photos) |
| `purpose` | `kyc, legal, property_media, payment_proof, support_attachment` |
| `documentType` | optional, e.g. `photo` or the document name (`"Sale Deed"`) |

Response `data` (**`url` is required**; the app saves it into `profilePhoto`, `photos[]` or `documents[].fileUrl`):
```json
{ "_id": "...", "referenceId": "DOC-1", "ownerType": "sell_request", "ownerId": "...", "purpose": "property_media",
  "documentType": "photo", "fileName": "IMG_1.jpg", "mimeType": "image/jpeg", "sizeBytes": 231231,
  "url": "https://cdn.../IMG_1.jpg", "status": "uploaded", "scanStatus": "pending" }
```

How the app calls it:
- Profile photo: `ownerType=user`, `purpose=kyc` (or similar), then `PATCH /me {profilePhoto: url}`.
- Sell photos: `ownerType=sell_request`, `ownerId=<draftId>`, `purpose=property_media`, `documentType=photo`. Several uploads run in parallel.
- Re-uploading a flagged legal document: `ownerType=sell_request`, `purpose=legal`, `documentType=<doc name>`.

The backend should check that the caller owns `ownerId`, and should enforce file size and MIME type limits.

#### `GET /documents/:documentId/read-url`
Response `data`: `{ "documentId": "...", "readUrl": "https://signed...", "expiresInSeconds": 300 }`. Used by the in-app viewer for private files.

---

### 3.11 Notifications (in-app channel)

| Endpoint | Body | Response `data` |
| --- | --- | --- |
| `GET /me/notifications?page&limit&status=unread\|read` | | `AppNotification[]` plus pagination (the client sends `limit=30`) |
| `GET /me/notifications/unread-count` | | `{ "count": 3 }` |
| `PATCH /me/notifications/read` | `{ "ids": [] }`; an empty array means mark **all** as read | `AppNotification[]` |
| `PATCH /me/notifications/:id/read` | `{}` | `AppNotification` |
| `DELETE /me/notifications/:id` | | `{ "deleted": true, "id": "..." }`, archived for this user only |

Tapping a notification opens a screen chosen from these fields, in this order:
1. `enquiryId`, or `entityType` containing "enquir" → Enquiry detail
2. `listingId`, or `entityType` containing "sell" → Listing detail
3. `propertyId`, or `entityType === "property"` → Property detail
4. `entityType` containing "visit" → My Visits
5. `dealId`, or `entityType` containing "deal" or "payment" → My Deals

The icon is chosen by matching keywords in `notificationType + event + title`: offer/deal/negotiat, document/kyc, demand/trend. Always fill `title`, `message`, `entityType` and the matching ID field.

---

### 3.12 Content (CMS)

#### `GET /content`  (public)
Query: `section` (`home, onboarding, faq, legal, about, news, general, banner`), `category`, `search`, `limit`. Returns `ContentItem[]`. This endpoint is **not paginated**; the client reads `data` only.

| Section | Used by |
| --- | --- |
| `faq` | Help (H-05), Help & feedback, FAQs (A-05/A-06). The client groups items by `category`: `buying, selling, legal, payment, nri, app, account, other`. |
| `banner` | Offers screen |
| `news` | News & insights |

#### `GET /content/:slug`  (public)
Slugs the app calls: `terms-of-service`, `privacy-policy`, `about-builtglory`. Returns a `ContentItem`. `body` holds the text that is shown.

---

### 3.13 Support

#### `POST /callbacks`
```json
{
  "source": "help_support",
  "sourceScreen": "help",
  "category": "general",
  "bestTimePreference": "morning",
  "propertyId": null,
  "reason": "Callback requested from help. Name: Arun. Phone: +91 9876543210.",
  "preferredTime": null
}
```
- `source`: `help_support | profile_support | property_detail | payment | interior`
- `category`: `property_inquiry | pricing | technical_issue | complaint | general | stage_payment | interior`
- `bestTimePreference`: `morning | afternoon | evening`

Response: `{ "_id", "referenceId", "status", "bestTimePreference", "slaDeadline" }`.

The Offers screen sends `source: profile_support`, `sourceScreen: offers`, `reason: "Interested in offer: <title>"`.

#### `POST /feedback`
```json
{ "message": "Great app", "source": "customer_app", "sourceScreen": "help", "metadata": {} }
```
Response: `{ "_id": "..." }`.

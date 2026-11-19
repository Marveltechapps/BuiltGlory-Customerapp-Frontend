# Builtglory Customer App — API calls

Contract for the React Native customer app (`BG-Customer App`) against `BG-Service`.

The app screens are built. They still read `src/config/sampleData.ts`. The only live HTTP call today is the sample `GET /samples` in `src/services/sample.service.ts`, against the host in `src/api/config.ts` (`http://10.0.2.2:3333/api` on Android, `http://localhost:3333/api` on iOS). Product calls use the service below, not that sample host.

Paths are relative to the base URL. Admin routes (`/admin/*`) are not in this document.

---

## 1. Conventions

### 1.1 Base URL

| Item | Value |
| --- | --- |
| Service | `BG-Service` |
| Default | `http://localhost:5001/api/v1` |
| Android emulator | `http://10.0.2.2:5001/api/v1` |
| Physical device | `http://<computer-LAN-IP>:5001/api/v1` |

Join rule: strip a trailing `/` from the base and a leading `/` from the path. `GET /me` means `GET http://localhost:5001/api/v1/me`.

### 1.2 Headers

| Header | When | Value |
| --- | --- | --- |
| `Authorization` | every customer call | `Bearer <accessToken>` |
| `Content-Type` | JSON bodies | `application/json` |
| `Content-Type` | `POST /documents` | `multipart/form-data` |
| `x-device-id` | every request | stable device id, generated once and stored on the device |

Public calls (properties, content, app config, trending search, geo, OTP send/verify, refresh) do not require `Authorization`.

### 1.3 Success envelope

```json
{
  "data": {},
  "meta": { "requestId": "string", "page": 1, "limit": 20, "total": 134, "totalPages": 7 }
}
```

`data` is the payload (object, array, or null). List screens read `meta.total`. `page` defaults to 1. `limit` max is 100.

### 1.4 Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Sell request submission is incomplete.",
    "details": [{ "field": "photos", "message": "Upload at least 5 photos." }]
  },
  "meta": { "requestId": "string" }
}
```

Show `error.details[0].message` when it exists, otherwise `error.message`.

### 1.5 Session

| Step | Behaviour |
| --- | --- |
| Store | access token and refresh token on the device |
| Access token life | 15 minutes (`JWT_ACCESS_EXPIRES_IN`) |
| Refresh token life | 30 days |
| 401 on a customer call | `POST /auth/refresh` once, then retry the original request |
| Refresh fails | clear tokens and show the Session Expiry screen (G-04) |

`POST /auth/refresh` body: `{ "refreshToken": "jwt" }`. Response `data`: `{ "accessToken", "refreshToken" }`. Always store the new refresh token.

`POST /auth/logout` sends `Authorization` and `{ "refreshToken" }`. Response `data`: `{ "revoked": true }`. Clear local tokens even if the call fails.

### 1.6 IDs, money, dates

- Record ids are 24-character hex Mongo ObjectIds.
- Money is a number in INR rupees.
- Dates are ISO-8601. Date-only fields (`visitDate`) may be `YYYY-MM-DD`.
- Visit times are strings such as `11:00 AM` and `2:00 PM`, interpreted in Asia/Kolkata.

### 1.7 Enums

| Enum | Values |
| --- | --- |
| Property `type` | `plot`, `apartment`, `villa`, `residential`, `commercial`, `land`, `fractional`, `3d_printing`, `organic_home`, `ceo_mansion`, `holiday_home`, `farmhouse`, `nri`, `interior` |
| Property `status` | `draft`, `available`, `reserved`, `under_construction`, `sold` |
| User `role` | `buyer`, `seller`, `both` |
| User `userType` | `resident`, `nri`, `pio` |
| Enquiry `status` | `new`, `responded`, `visit_scheduled`, `negotiating`, `closed` |
| Visit `status` | `scheduled`, `confirmed`, `completed`, `cancelled`, `missed`, `rescheduled` |
| Visit `visitType` | `physical`, `virtual` |
| Sell request `status` | `draft`, `new`, `under_review`, `accepted`, `approved`, `active`, `negotiating`, `paused`, `sold`, `rejected`, `changes_requested` |
| Sales deal `stage` | `active_leads`, `site_visits`, `negotiation`, `token_payment`, `full_payment`, `stage_payment`, `interior_design`, `documentation`, `closed`, `lost`, `re_engagement` |
| Payment `status` | `created`, `pending`, `paid`, `failed`, `refunded`, `cancelled`, `rejected` |
| Payment `method` | `bank`, `upi`, `cheque`, `cash` |
| Support ticket `status` | `open`, `in_progress`, `resolved`, `closed` |
| Support `category` | `property_inquiry`, `payment`, `technical`, `kyc`, `general`, `complaint` |
| Content `section` | `home`, `onboarding`, `faq`, `legal`, `about`, `news`, `general`, `banner` |

---

## 2. Endpoint index

| # | Method | Path | Auth | Customer app screen |
| --- | --- | --- | --- | --- |
| 1 | POST | `/auth/customer/otp/send` | public | Login (S-03), Change phone (P-03), Delete account (A-04a) |
| 2 | POST | `/auth/customer/otp/verify` | public | OTP (S-04), Change phone, Delete account |
| 3 | POST | `/auth/refresh` | public | Any 401, splash session restore |
| 4 | POST | `/auth/logout` | bearer | Settings → Log out |
| 5 | POST | `/auth/customer/password/login` | public | Login, if password mode is used |
| 6 | PUT | `/me/password` | customer | Account settings (A-04) |
| 7 | POST | `/auth/customer/password/forgot` | public | Forgot password |
| 8 | POST | `/auth/customer/password/reset` | public | Reset password |
| 9 | POST | `/auth/email/otp/send` | public | Create profile / edit profile email |
| 10 | POST | `/auth/email/otp/resend` | public | Same |
| 11 | POST | `/auth/email/otp/verify` | public | Same |
| 12 | GET | `/me` | customer | Splash, Profile (P-01), Privacy download |
| 13 | PATCH | `/me` | customer | Create profile (S-05), Location + type (S-06), Edit profile (P-02), settings |
| 14 | PUT | `/me/push-token` | customer | After login, when notification permission is granted (S-08) |
| 15 | DELETE | `/me/push-token` | customer | Log out, or notifications turned off |
| 16 | GET | `/me/account-deletion` | customer | Delete account (A-04a) |
| 17 | POST | `/me/account-deletion` | customer | Delete account |
| 18 | DELETE | `/me/account-deletion` | customer | Cancel a pending deletion |
| 19 | GET | `/properties` | public | Home (H-01), Featured (H-03), Upcoming (H-04), Buy list (B-03), Search (H-02), Compare, Map |
| 20 | GET | `/properties/:propertyId` | public | Property detail (B-04) and its sub-pages |
| 21 | POST | `/properties/:propertyId/save` | customer | Heart |
| 22 | DELETE | `/properties/:propertyId/save` | customer | Heart |
| 23 | GET | `/me/favorites` | customer | Favorites |
| 24 | POST | `/buy-enquiries` | customer | Submit enquiry (B-10) |
| 25 | GET | `/me/buy-enquiries` | customer | My Enquiries (P-07) |
| 26 | GET | `/me/buy-enquiries/:enquiryId` | customer | Enquiry detail (P-08), Buy tracker |
| 27 | PATCH | `/me/buy-enquiries/:enquiryId/cancel` | customer | Cancel enquiry (B-17) |
| 28 | GET | `/visits/availability` | customer | Schedule visit (B-12), NRI video call (B-13a) |
| 29 | POST | `/visits` | customer | Schedule visit, NRI video call |
| 30 | GET | `/me/visits` | customer | My Visits (P-04a) |
| 31 | PATCH | `/visits/:visitId/reschedule` | customer | Reschedule (B-12a) |
| 32 | PATCH | `/visits/:visitId/cancel` | customer | My Visits → Cancel |
| 33 | POST | `/sell-requests/drafts` | customer | Sell wizard, first save |
| 34 | POST | `/sell-requests` | customer | Sell wizard, submit in one call |
| 35 | PATCH | `/me/sell-requests/:sellRequestId` | customer | Later wizard saves, Edit listing (SL-09) |
| 36 | POST | `/me/sell-requests/:sellRequestId/submit` | customer | Listing success (SL-08) |
| 37 | GET | `/me/sell-requests` | customer | My Listings (P-04), My Drafts (P-04c) |
| 38 | GET | `/me/sell-requests/:sellRequestId` | customer | Listing detail |
| 39 | GET | `/me/sell-requests/:sellRequestId/activity` | customer | Offer, negotiation, payment schedule, registration, deal complete |
| 40 | POST | `/me/sell-requests/:sellRequestId/offer-decision` | customer | Accept / Negotiate (SL-13) |
| 41 | POST | `/me/sell-requests/:sellRequestId/messages` | customer | Negotiation chat |
| 42 | POST | `/me/sell-requests/:sellRequestId/visits/:visitId/action` | customer | Seller visits |
| 43 | PUT | `/me/sell-requests/:sellRequestId/availability` | customer | Seller visit slots |
| 44 | GET | `/me/sell-requests/:sellRequestId/documents` | customer | Document viewer (P-11) |
| 45 | POST | `/me/sell-requests/:sellRequestId/payout-schedule/confirm` | customer | Payment schedule (SL-15) |
| 46 | POST | `/me/sell-requests/:sellRequestId/registration/confirm` | customer | Registration (SL-16) |
| 47 | POST | `/me/sell-requests/:sellRequestId/valuation-estimate` | customer | Expected price (SL-07), Offer (SL-12) |
| 48 | POST | `/me/sell-requests/:sellRequestId/withdraw` | customer | Withdraw listing |
| 49 | GET | `/me/deals` | customer | My Deals (P-04b) |
| 49a | GET | `/me/deals/:dealId` | customer | Buyer deal detail + registration |
| 49b | GET | `/me/deals/:dealId/documents` | customer | Documents Shared (B-14) |
| 50 | POST | `/payments/token` | customer | Payment (B-15) |
| 51 | POST | `/payments/:paymentId/cancel` | customer | Payment failure / cancel |
| 52 | GET | `/me/payments` | customer | Payment history on a deal |
| 53 | POST | `/documents` | bearer | Sell photos, profile photo, KYC, ticket screenshot, payment proof |
| 54 | POST | `/documents/upload-intents` | bearer | Large-file upload, when used |
| 55 | GET | `/documents/:documentId/read-url` | bearer | Private document viewer |
| 56 | GET | `/me/notifications` | customer | Notifications (P-10) |
| 57 | GET | `/me/notifications/unread-count` | customer | Home badge |
| 58 | PATCH | `/me/notifications/read` | customer | Mark all read |
| 59 | PATCH | `/me/notifications/:id/read` | customer | Open one notification |
| 60 | DELETE | `/me/notifications/:id` | customer | Dismiss one |
| 61 | GET | `/search/trending` | public | Search (H-02) |
| 62 | GET | `/me/searches` | customer | Search → recent |
| 63 | POST | `/me/searches` | customer | Search → record term |
| 64 | DELETE | `/me/searches` | customer | Clear all |
| 65 | DELETE | `/me/searches/:term` | customer | Remove one term |
| 66 | GET | `/content` | public | Onboarding, FAQ, legal, about, news, home banners |
| 67 | GET | `/content/:slug` | public | One legal or FAQ article |
| 68 | GET | `/app/config` | public | Splash, force update (G-02), maintenance (G-03), Call us (A-07a) |
| 69 | GET | `/geo/reverse` | public | Location + type (S-06), Sell address (SL-02) |
| 70 | POST | `/support/tickets` | customer | Customer support (A-07), Help feedback |
| 71 | GET | `/me/support/tickets` | customer | Recent tickets |
| 72 | GET | `/me/support/tickets/:ticketId` | customer | Ticket thread |
| 73 | POST | `/me/support/tickets/:ticketId/responses` | customer | Reply |
| 74 | POST | `/me/support/tickets/:ticketId/read` | customer | Open ticket |
| 75 | POST | `/me/support/tickets/:ticketId/close` | customer | Mark resolved |
| 76 | POST | `/me/support/tickets/:ticketId/reopen` | customer | Reopen |
| 77 | GET | `/me/support/live-chat` | customer | Live chat |
| 78 | POST | `/me/support/live-chat` | customer | First live-chat message |
| 79 | POST | `/callbacks` | customer | Call us → request a callback |
| 80 | POST | `/feedback` | customer | Help & feedback |
| 81 | GET | `/me/feedback` | customer | Feedback history |

---

## 3. Contracts

### 3.1 Auth

#### `POST /auth/customer/otp/send`

```json
{ "countryCode": "+91", "phone": "9884012345", "deviceId": "android-…", "purpose": "login" }
```

| Field | Rule |
| --- | --- |
| `phone` | exactly 10 digits |
| `purpose` | `login` (sign in, sign up, re-verify before deletion), `change_phone`, or `password_reset` |

Response `data`:

```json
{ "requestId": "otp_req_…", "expiresInSeconds": 300, "canResendAt": "2026-11-17T10:01:30.000Z" }
```

`canResendAt` drives the resend countdown. A 409 means the resend cooldown is still active.

#### `POST /auth/customer/otp/verify`

```json
{ "countryCode": "+91", "phone": "9884012345", "otp": "482913", "requestId": "otp_req_…", "purpose": "login" }
```

`otp` is 6 digits.

`purpose: "login"` returns a session:

```json
{ "accessToken": "jwt", "refreshToken": "jwt", "expiresInSeconds": 900, "user": { "_id": "…", "name": "Aarav" } }
```

Store both tokens, then `GET /me`. An empty `user.name` means a new account: go to Create Profile (S-05).

`purpose: "change_phone"` returns `{ "verified": true, "phone": "9000000000", "phoneNormalized": "919000000000" }`. Then `PATCH /me` with `{ "mobileNumber": "9000000000" }`.

#### Password

| Call | Body |
| --- | --- |
| `POST /auth/customer/password/login` | `{ "identifier": "9884012345 or email", "password": "…" }` — password 6–128 chars. Response is the same session shape as OTP login. |
| `PUT /me/password` | `{ "password": "…" }` — 8–128 chars. Customer auth required. |
| `POST /auth/customer/password/forgot` | `{ "countryCode": "+91", "phone": "9884012345", "deviceId": "…" }` |
| `POST /auth/customer/password/reset` | `{ "countryCode": "+91", "phone": "9884012345", "otp": "482913", "requestId": "…", "newPassword": "…" }` |

#### Email OTP

| Call | Body |
| --- | --- |
| `POST /auth/email/otp/send` | `{ "email": "aarav@example.com" }` |
| `POST /auth/email/otp/resend` | `{ "email": "aarav@example.com" }` |
| `POST /auth/email/otp/verify` | `{ "email": "aarav@example.com", "otp": "482913", "requestId": "…" }` |

---

### 3.2 Profile (`/me`)

#### `GET /me`

```json
{
  "_id": "665f…",
  "name": "Aarav Subramanian",
  "mobileNumber": "9884012345",
  "phone": "+91 9884012345",
  "email": "aarav@example.com",
  "role": "buyer",
  "userType": "resident",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "profilePhoto": "https://…/profile.jpg",
  "kycStatus": "pending",
  "bankDetails": {
    "accountHolderName": "Aarav Subramanian",
    "bankName": "HDFC Bank",
    "accountNumberLast4": "4321",
    "ifsc": "HDFC0001234",
    "branch": "Adyar",
    "upiId": "aarav@hdfc"
  },
  "notificationPreferences": {
    "push": { "transactional": true, "marketing": true },
    "whatsapp": { "transactional": true, "marketing": false },
    "sms": { "transactional": true, "marketing": false },
    "email": { "transactional": true, "marketing": false },
    "in_app": { "transactional": true, "marketing": true }
  }
}
```

`kycStatus` is `not_submitted`, `pending`, `verified`, or `rejected`. The KYC screen (B-14a) reads this. Review is done in the admin dashboard; the app uploads the files (see Documents).

#### `PATCH /me`

Response is the updated user. Send only the fields that changed.

| Screen | Body |
| --- | --- |
| Create profile (S-05) | `{ "name", "email" }` — name 2–120 chars |
| Location + type (S-06) | `{ "city", "state", "role", "userType", "latitude", "longitude" }` |
| Edit profile (P-02) | `{ "name", "email", "city" }` |
| Profile photo | `{ "profilePhoto": "<url from POST /documents>" }` |
| Change phone, after OTP | `{ "mobileNumber": "9000000000" }` |
| Notification settings (A-02) | `{ "notificationPreferences": { push, whatsapp, sms, email, in_app } }` |
| Deal confirmed, bank (SL-14) | `{ "bankDetails": { "accountHolderName", "bankName", "accountNumberLast4", "ifsc", "branch", "upiId" } }` |
| Sell submit, if role is `buyer` | `{ "role": "both" }` |

`accountNumberLast4` is exactly 4 digits. `ifsc` is 6–20 characters. `role` is `buyer`, `seller`, or `both`. `userType` is `resident`, `nri`, or `pio`.

#### Push token

```json
PUT /me/push-token
{ "token": "<fcm or apns token, 20–4096 chars>", "platform": "android", "deviceId": "…" }
```

`platform` is `android`, `ios`, or `web`.

```json
DELETE /me/push-token
{ "token": "<same token>" }
```

#### Account deletion

`GET /me/account-deletion` returns `{ "status": "none|requested|cancelled|completed", "requestedAt", "scheduledDeletionAt" }`.

```json
POST /me/account-deletion
{ "confirmation": "DELETE", "reason": "Too many notifications" }
```

`confirmation` must be the exact string `DELETE`. `DELETE /me/account-deletion` cancels a pending request.

---

### 3.3 Properties

#### `GET /properties`

Send only the filters the screen has set.

| Param | Example | Screen |
| --- | --- | --- |
| `type` | `apartment` | Buy type (B-01), Buy list |
| `city` | `Chennai` | Home, Buy list |
| `locality` | `Adyar` | Filters |
| `minPrice` / `maxPrice` | `15000000` | Budget slider |
| `minArea` / `maxArea` | `1200` | Advanced filters |
| `bhk` | `2,3` | Bedroom pills, CSV |
| `amenities` | `Lift,Pool` | CSV |
| `facing` | `East` | Advanced filters |
| `furnishing` | `Semi-Furnished` | Advanced filters |
| `verified` | `true` | Verified only |
| `negotiable` | `true` | Negotiable only |
| `featured` | `true` | Home → Featured (H-03) |
| `upcoming` | `true` | Home → Upcoming (H-04) |
| `recentlySold` | `true` | Sell → recently sold |
| `search` | `3 BHK Adyar` | Search |
| `sort` | `relevance`, `price_asc`, `price_desc`, `newest`, `oldest` | Sort menu |
| `page` / `limit` | `1` / `20` | Lists. Home featured can use `limit=6` |

Response: `data` is a property array, `meta.total` is the count.

Property shape used by cards, detail, compare, and map:

```json
{
  "_id": "665f…",
  "referenceId": "PRP-000123",
  "title": "Sunrise Heights — 3 BHK",
  "description": "…",
  "type": "apartment",
  "status": "available",
  "isFeatured": true,
  "isUpcoming": false,
  "launchDate": "2026-12-01T00:00:00.000Z",
  "price": 8500000,
  "isNegotiable": true,
  "address": { "line1": "…", "locality": "Adyar", "city": "Chennai", "pincode": "600020", "latitude": 13.0, "longitude": 80.25 },
  "specs": { "bhk": "3", "builtUpArea": 1450, "carpetArea": 1200, "plotArea": null, "floor": 7, "totalFloors": 12, "facing": "East", "unitNo": "B-704", "furnishing": "Semi-Furnished" },
  "amenities": ["Lift", "Gym", "Pool"],
  "media": { "coverPhoto": "https://…", "photos": ["https://…"], "videoUrl": "https://…", "droneImageUrl": "https://…", "tour3dUrl": "https://…", "floorPlanUrl": "https://…" },
  "advantages": { "investment": ["…"], "location": ["…"], "connectivity": ["…"] },
  "nearbyPlaces": [{ "name": "DAV School", "type": "school", "distance": "1.2 km" }],
  "highlights": ["Vaastu compliant"],
  "metrics": { "views": 1284, "enquiries": 36, "savedCount": 12 },
  "soldAt": null,
  "createdAt": "2026-08-20T00:00:00.000Z"
}
```

| Screen | Fields |
| --- | --- |
| Card | `title`, `price`, `type`, `address.locality`, `address.city`, `media.coverPhoto`, `specs.bhk`, `specs.builtUpArea` |
| Detail (B-04) | full object. 404 → "Property not found" |
| Floor plan (B-04a) | `media.floorPlanUrl` |
| Specs (B-05) | `specs`, `amenities`, `highlights` |
| Location (B-06a) | `address`, `nearbyPlaces`, `advantages` |
| Advantages (B-06) | `advantages` |
| Virtual tour (B-07) | `media.tour3dUrl` |
| Aerial (B-08) | `media.videoUrl` or `media.droneImageUrl` |
| Map | `address.latitude`, `address.longitude` |
| Sold out (B-19) | `status === "sold"` |
| Withdrawn (B-18) | property missing or no longer `available` |

#### Save and favorites

`POST /properties/:propertyId/save` and `DELETE /properties/:propertyId/save` take no body. `GET /me/favorites` returns `data: Property[]`.

---

### 3.4 Buy enquiries

#### `POST /buy-enquiries`

```json
{
  "propertyId": "665f…",
  "preferredContact": "phone",
  "interestType": "schedule_visit",
  "preferredVisitTime": "this_weekend_afternoon",
  "preferredVisitDate": "2026-11-21",
  "preferredVisitTimeSlot": "11:00 AM",
  "additionalMessage": "Please call after 6 pm",
  "enquiryTypes": []
}
```

| Field | Rule |
| --- | --- |
| `preferredContact` | `phone`, `whatsapp`, `email` |
| `interestType` | `schedule_visit`, `price_negotiation`, `more_details` |
| `preferredVisitTime` | `tomorrow_morning`, `tomorrow_afternoon`, `this_weekend_morning`, `this_weekend_afternoon`, `custom`, or null |
| `additionalMessage` | max 1000 chars |

Response is the created enquiry. Keep `_id` for the visit and the success screen (B-11).

#### `GET /me/buy-enquiries`

Query: `limit` (max 100), `sort` (`newest` or `oldest`), `status`, `propertyId`, `page`.

```json
{
  "_id": "…",
  "referenceId": "ENQ-000045",
  "propertyId": "665f…",
  "propertySnapshot": { "title": "Sunrise Heights", "price": 8500000, "type": "apartment", "location": "Adyar, Chennai" },
  "status": "visit_scheduled",
  "preferredContact": "phone",
  "interestType": "schedule_visit",
  "submittedAt": "2026-11-10T09:14:00.000Z"
}
```

`GET /me/buy-enquiries/:enquiryId` returns one enquiry. The Buy tracker (P-08) uses this plus `GET /me/deals` and `GET /me/visits`.

#### `PATCH /me/buy-enquiries/:enquiryId/cancel`

No body. Use it from Cancel enquiry (B-17) while the enquiry is still active and has no deal.

---

### 3.5 Visits

#### `GET /visits/availability`

| Param | Rule |
| --- | --- |
| `propertyId` | required, 24-hex |
| `visitType` | `physical` (site visit) or `virtual` (NRI video). Default `physical` |
| `from` | ISO date. Do not request dates before tomorrow |
| `days` | 1–30. Default 7 |

```json
{
  "days": [
    { "date": "2026-11-21", "slots": [{ "time": "10:00 AM", "available": true, "status": "available", "remainingCapacity": 1 }] }
  ]
}
```

#### `POST /visits`

```json
{
  "propertyId": "665f…",
  "enquiryId": "…",
  "visitDate": "2026-11-21",
  "visitTime": "11:00 AM",
  "visitType": "physical",
  "preferredLanguage": "English"
}
```

`enquiryId` should be the buyer's enquiry for that property so the visit shows under My Visits. `preferredLanguage` is `English`, `Tamil`, `Hindi`, or `Kannada` (NRI video call). Optional virtual fields: `virtualPlatform` (`zoom`, `google_meet`, `teams`, `whatsapp_video`) and `meetingLink`.

Response fields used by Visit confirmed (B-13): `_id`, `referenceId`, `visitDate`, `visitTime`.

#### `GET /me/visits`

Query: `page`, `limit`, `sort` (`newest`/`oldest`), `status`, `visitType`, `propertyId`.

#### `PATCH /visits/:visitId/reschedule`

```json
{ "visitDate": "2026-11-26", "visitTime": "2:00 PM" }
```

#### `PATCH /visits/:visitId/cancel`

```json
{ "reason": "Cancelled by buyer" }
```

`reason` max 500 chars.

---

### 3.6 Sell requests

Wizard payload, used by `POST /sell-requests/drafts`, `POST /sell-requests`, and `PATCH /me/sell-requests/:id`:

```json
{
  "propertyType": "apartment",
  "propertyTitle": "Bright 3 BHK in Adyar",
  "askingPrice": 8500000,
  "negotiable": true,
  "address": { "street": "Sunrise Heights", "locality": "Adyar", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600020", "latitude": 13.0, "longitude": 80.25 },
  "specifications": {
    "bhk": "3",
    "builtUpArea": 1450,
    "carpetArea": 1200,
    "floor": "7",
    "totalFloors": 12,
    "unitNo": "B-704",
    "propertyAge": "1–5 years",
    "facing": "East",
    "furnishing": "Unfurnished",
    "parking": 1
  },
  "amenities": ["Lift", "Parking", "Security"],
  "ownershipType": "Freehold",
  "description": "…",
  "photos": ["https://…/1.jpg"],
  "draftStep": 5
}
```

| Rule | Value |
| --- | --- |
| `propertyType` | a property type, plus aliases the API accepts: `flat`, `villa`, `organic`, `farm`, `holiday`, `house` |
| Title on submit | 8–200 characters |
| Street on submit | at least 3 characters |
| Pincode | 6 digits |
| Asking price | ₹50,000 to ₹50,00,00,00,000 |
| Area | 50 to 1,000,000 |
| Photos on submit | at least 5, at most 30 |
| `draftStep` | integer 1–7 |

Create the draft on the first "Save as Draft" (`POST /sell-requests/drafts`). Later steps `PATCH` the same id. `POST /sell-requests` creates a non-draft request in one call.

`POST /me/sell-requests/:id/submit` has no body. Validation errors come back in `error.details`.

#### Lists

`GET /me/sell-requests?limit=100&sort=newest&status=draft`

Query also accepts `search`, `propertyType`, `city`, `page`. Use `status=draft` for My Drafts (P-04c).

Fields for My Listings: `_id`, `referenceId`, `propertyTitle`, `askingPrice`, `status`, `address.locality`, `address.city`, `photos[0]`, `submittedAt`, `rejectionReason`, `changeRequests`.

#### Activity — seller tracker

`GET /me/sell-requests/:id/activity` is the source for Offer (SL-12), Accept / Negotiate (SL-13), Negotiation status (SL-13a), Payment schedule (SL-15), Registration (SL-16), and Deal complete (SL-17).

```json
{
  "sellRequest": { "_id": "…", "referenceId": "SR-000031", "propertyTitle": "…", "askingPrice": 8500000, "status": "negotiating", "photos": [], "address": {}, "submittedAt": "…" },
  "acquisition": { "referenceId": "ACQ-000019", "stage": "negotiation", "negotiation": { "status": "seller_countered" } },
  "offer": { "amount": 8250000, "status": "negotiation", "expiresAt": "2026-11-22T18:00:00.000Z", "counterAmount": 8800000 },
  "payoutSchedule": [
    { "key": "token", "label": "Token Amount", "amount": 247500, "dueLabel": "Due on agreement", "status": "pending" }
  ],
  "registration": {
    "appointment": { "date": "2026-12-15T10:00:00.000Z", "time": "10:00 AM", "office": "Sub-Registrar Office, Adyar" },
    "status": "pending",
    "checklist": ["Original title documents"]
  }
}
```

#### Seller actions

| Call | Body |
| --- | --- |
| `POST …/offer-decision` | `{ "decision": "accepted" }` or `{ "decision": "countered", "counterAmount": 8800000, "notes": "…" }` |
| `POST …/messages` | `{ "text": "…" }` max 2000. Negotiation chat. |
| `POST …/visits/:visitId/action` | `{ "action": "confirm" }`, `{ "action": "decline", "reason": "…" }`, or `{ "action": "reschedule", "visitDate": "2026-11-26", "visitTime": "2:00 PM" }` |
| `PUT …/availability` | `{ "slots": ["10:00 AM", "2:00 PM"] }` max 12 slots |
| `POST …/valuation-estimate` | same wizard fields, or `{}` on the Offer screen |
| `POST …/payout-schedule/confirm` | no body |
| `POST …/registration/confirm` | `{ "documentsReady": ["Original title documents", "Aadhaar & PAN"] }` |
| `POST …/withdraw` | no body |
| `GET …/documents` | seller documents for that listing |

Valuation response:

```json
{ "estimatedPrice": 8010000, "low": 7209000, "high": 8811000, "pricePerSqft": 5524, "area": 1450, "basis": "Based on comparable apartment listings near Adyar." }
```

---

### 3.7 Deals and payments

#### `GET /me/deals`

Buyer deals and seller deals in one list, newest activity first. Query: `page`, `limit`.

```json
{
  "side": "buyer",
  "id": "665f…",
  "title": "Sunrise Heights",
  "price": 8250000,
  "stage": "token_payment",
  "stageLabel": "Token Payment",
  "progressPercent": 60,
  "enquiryId": "…",
  "sellRequestId": null,
  "updatedAt": "2026-11-16T08:00:00.000Z"
}
```

`side` is `buyer` or `seller`. For a seller row, `id` and `sellRequestId` are the sell request id, and `enquiryId` is null. Open the buyer tracker with `enquiryId`, the seller tracker with `sellRequestId`.

Lost deals are omitted. Draft and rejected sell requests are omitted. A seller row appears only after the listing has a deal.

#### `POST /payments/token`

```json
{
  "dealId": "665f…",
  "propertyId": "665f…",
  "type": "token",
  "amount": 250000,
  "currency": "INR",
  "method": "upi",
  "transactionReference": "UPI123",
  "proofDocumentId": "665f…",
  "notes": null,
  "idempotencyKey": "pay-665f-token-1"
}
```

`type` must be `token`. `method` is `bank`, `upi`, `cheque`, or `cash`. Upload the proof first with `POST /documents` (`purpose: "payment_proof"`, `ownerType: "sales_deal"`) and send its id as `proofDocumentId`. Default token amount is also on `GET /app/config` → `payment.tokenAmount` (₹2,50,000 unless settings override it).

`POST /payments/:paymentId/cancel` takes no body.

`GET /me/payments` query: `page`, `limit`, `sort`, `status`, `type`, `dealId`, `method`.

---

### 3.8 Documents

`POST /documents` is multipart. Field `file` is required. Max 25 MB.

| Form field | Sell photo | Profile photo | KYC | Ticket file | Payment proof |
| --- | --- | --- | --- | --- | --- |
| `ownerType` | `sell_request` | `user` | `user` | `support_ticket` or `user` | `sales_deal` or `payment` |
| `ownerId` | sell request id | current user id | current user id | ticket or user id | deal id |
| `purpose` | `property_media` | `profile_photo` | `kyc` | `support_attachment` | `payment_proof` |
| `documentType` | `property_photo` | `profile_photo` | `pan`, `aadhaar`, or `passport` | `support_screenshot` | `payment_proof` |

`property_media` and `profile_photo` return a public `url`. Other purposes are private: call `GET /documents/:documentId/read-url` and open `readUrl` (expires in at most 900 seconds).

Response `data`: `{ "_id", "referenceId", "url", "status": "uploaded" }`.

`POST /documents/upload-intents` is JSON and returns `{ document, uploadUrl, expiresInSeconds: 900 }` for a direct upload.

---

### 3.9 Notifications

`GET /me/notifications?limit=50&status=unread`

`status` is `unread` or `read`. `isRead` is also accepted as a boolean.

```json
{
  "_id": "…",
  "event": "visit_confirmed",
  "title": "Visit confirmed",
  "message": "21 Nov, 11:00 AM · Sunrise Heights",
  "notificationType": "visit",
  "entityType": "visit",
  "entityId": "…",
  "isRead": false,
  "createdAt": "…"
}
```

| Call | Body |
| --- | --- |
| `GET /me/notifications/unread-count` | response `{ "count": 3 }` |
| `PATCH /me/notifications/read` | `{}` marks all read |
| `PATCH /me/notifications/:id/read` | `{}` |
| `DELETE /me/notifications/:id` | none |

---

### 3.10 Search

| Call | Request | Response `data` |
| --- | --- | --- |
| `GET /search/trending?limit=8` | public. `limit` 1–20, default 8 | `string[]` |
| `GET /me/searches` | — | `string[]`, newest first |
| `POST /me/searches` | `{ "term": "3 BHK Adyar" }` max 100 chars | updated `string[]` |
| `DELETE /me/searches` | — | cleared list |
| `DELETE /me/searches/:term` | URL-encode the term | updated list |

Property results still come from `GET /properties?search=…`.

---

### 3.11 Content, config, location

#### `GET /content?section=faq&limit=100`

`section` is `home`, `onboarding`, `faq`, `legal`, `about`, `news`, `general`, or `banner`. Optional `category` and `search`.

```json
{
  "_id": "…",
  "slug": "faq-schedule-visit",
  "section": "faq",
  "title": "Can I schedule a visit?",
  "excerpt": "…",
  "body": "…",
  "category": "buying",
  "order": 30,
  "metadata": { "icon": "home", "topicLabel": "Buying" }
}
```

| Screen | Call |
| --- | --- |
| Onboarding (S-02) | `section=onboarding` |
| Home banners | `section=banner` or `section=home` |
| Help & FAQs (A-05, A-06) | `section=faq` |
| Terms (S-07, P-12) | `section=legal`, slug `terms-of-service` |
| About (A-08) | `section=about` |
| News & insights | `section=news` |
| Offers, general info | `section=general` |

`GET /content/:slug` returns one item.

#### `GET /app/config`

Public. Call it on splash.

```json
{
  "versions": { "current": "2.4.0", "minimumSupported": "2.0.0", "latest": "2.4.0" },
  "storeUrls": { "android": "https://play.google.com/…", "ios": null },
  "maintenance": { "enabled": false, "message": "…", "expectedBackAt": null },
  "featureFlags": { "registration": true, "kycRequired": true, "showPrices": true, "virtualTours": true, "stagePayment": false, "interior": false },
  "payment": { "tokenAmount": 250000, "escrow": null },
  "support": { "phone": "+91 …", "supportEmail": "support@builtglory.com", "whatsappNumber": "91…" },
  "stats": { "cities": 18, "appRating": 4.8 }
}
```

| Flag | Screen |
| --- | --- |
| app version &lt; `versions.minimumSupported` | Force update (G-02), open `storeUrls` |
| `maintenance.enabled` | Maintenance (G-03) |
| `support.phone` / WhatsApp | Call us (A-07a), Help |
| `payment.tokenAmount` | Payment (B-15) |
| `featureFlags.virtualTours` | Show or hide VR tour |
| `featureFlags.kycRequired` | Buyer KYC gate |

#### `GET /geo/reverse?latitude=13.08&longitude=80.27`

Public. Latitude −90 to 90, longitude −180 to 180.

```json
{ "city": "Chennai", "state": "Tamil Nadu", "country": "India", "street": "…", "locality": "Adyar", "pincode": "600020", "latitude": 13.08, "longitude": 80.27 }
```

Use it to fill Location + type (S-06) and Sell address (SL-02). `street`, `locality`, and `pincode` are present when the lookup succeeds.

---

### 3.12 Support, callbacks, feedback

#### Tickets

```json
POST /support/tickets
{
  "category": "technical",
  "subject": "Photo upload failed",
  "message": "The sale deed upload stops at 90%.",
  "priority": "medium",
  "channel": "ticket",
  "attachments": ["https://…"]
}
```

`category` is `property_inquiry`, `payment`, `technical`, `kyc`, `general`, or `complaint`. `subject` max 200. `message` max 5000. `priority` is `low`, `medium`, `high`, or `urgent`.

`GET /me/support/tickets?channel=ticket&sort=newest&limit=20` also accepts `status` and `page`.

Ticket detail:

```json
{
  "_id": "…",
  "referenceId": "BG-TKT-2026-8842",
  "category": "technical",
  "subject": "Photo upload failed",
  "message": "…",
  "status": "open",
  "channel": "ticket",
  "attachments": [],
  "responses": [{ "_id": "…", "message": "We are looking into this.", "responderType": "admin", "createdAt": "…" }]
}
```

| Call | Body |
| --- | --- |
| `POST …/responses` | `{ "message": "…", "clientMessageId": "android-<ts>" }` |
| `POST …/read` | none |
| `POST …/close` | none |
| `POST …/reopen` | none |

#### Live chat

`GET /me/support/live-chat` returns the open live-chat ticket, or `null`.

```json
POST /me/support/live-chat
{ "category": "general", "subject": "Live chat", "message": "I need help with a visit" }
```

Later messages use `POST /me/support/tickets/:ticketId/responses`.

#### Callback

```json
POST /callbacks
{
  "source": "help_support",
  "sourceScreen": "call_us",
  "category": "general",
  "bestTimePreference": "evening",
  "propertyId": "665f…",
  "reason": "Want a site visit this weekend"
}
```

| Field | Values |
| --- | --- |
| `source` | `help_support`, `profile_support`, `property_detail`, `payment`, `interior` |
| `category` | `property_inquiry`, `pricing`, `technical_issue`, `complaint`, `general`, `stage_payment`, `interior` |
| `bestTimePreference` | `morning`, `afternoon`, `evening` |

#### Feedback

```json
POST /feedback
{ "message": "The visit calendar was easy to use.", "source": "help_feedback", "sourceScreen": "helpFeedback" }
```

`message` is required, max 5000. `GET /me/feedback` accepts `page`, `limit`, `sort`, `status` (`new`, `reviewed`, `archived`).

---

## 4. Screens with no API call

| Screen | What to do |
| --- | --- |
| Splash (S-01) | local, then `GET /app/config` and `GET /me` if a token exists |
| Coach marks (H-06) | local, once per install |
| Share property (B-09) | device share sheet. Link can be built from the property id |
| Offline (G-01) | device network state |
| Compare | `GET /properties` (or favorites) for the chosen ids. Comparison math stays on the device |
| Enquiry success, visit confirmed, payment success | show the id returned by the create call. No extra request |
| Guest profile (P-00) | no auth. Public calls only: properties, content, app config |

---

## 5. Suggested call order

**Open the app**

1. `GET /app/config` — maintenance, force update, support numbers.
2. If a refresh token exists, `POST /auth/refresh`, then `GET /me`.
3. `PUT /me/push-token` after notification permission.
4. Home: `GET /properties?featured=true&limit=6`, `GET /properties?upcoming=true&limit=4`, `GET /content?section=banner`, `GET /me/notifications/unread-count`.

**Sign in**

1. `POST /auth/customer/otp/send` with `purpose: "login"`.
2. `POST /auth/customer/otp/verify`.
3. `GET /me`. Empty name → profile setup → `PATCH /me`.

**Buy**

1. `GET /properties` with the filters from B-01 / B-02.
2. `GET /properties/:id`.
3. `POST /buy-enquiries`.
4. `GET /visits/availability`, then `POST /visits`.
5. Track with `GET /me/buy-enquiries/:id`, `GET /me/visits`, `GET /me/deals`.
6. At token stage: `POST /documents` (proof), then `POST /payments/token`.

**Sell**

1. `POST /sell-requests/drafts` on first save.
2. `POST /documents` for each photo, then `PATCH` the draft with `photos`.
3. `POST …/valuation-estimate` on the price step.
4. `POST …/submit`.
5. Track with `GET …/activity`. Offer actions use `POST …/offer-decision`.

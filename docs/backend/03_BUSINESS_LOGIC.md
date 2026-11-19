# BuiltGlory Customer App: Business Logic and Functionality

This file covers the rules the frontend enforces or assumes. The backend has to enforce them too, or at least behave the same way. Each section names the source file it came from.

---

## 1. Session and authentication (`src/api/index.ts`, `src/api/session.ts`, `AuthContext.tsx`)

| Rule | Detail |
| --- | --- |
| Login method | Phone + 6-digit OTP only. There are no passwords, so the reference "Change password" screen only explains OTP sign-in. |
| Country code | Fixed to `+91`. The phone number is exactly 10 digits. |
| Device ID | Generated once per install and sent on **every** request as `x-device-id`. Use it for OTP rate limiting and per-device sessions. |
| Token storage | `accessToken` and `refreshToken` are kept in AsyncStorage under the key `bg.session`. |
| Refresh | Any 401 on a non-`/auth` path triggers **one shared** refresh call; concurrent requests wait for it. After it succeeds, each request is retried once. |
| Refresh rotation | Each refresh returns a **new** refresh token. If a token is reused, return 409/401/403. The client then clears the session and shows G-04 (Session expired). |
| Bootstrap | On Splash: `GET /app/config`, then (if a token is stored) `GET /me`. Network error → Offline screen. Any other error → session cleared → Login. |
| Logout | `POST /auth/logout` is best-effort. The local session is cleared whatever the result. |
| Auth states | `booting`, `signedOut`, `guest`, `signedIn`. **Guest** users can browse public screens without a token. |

### Guest-gated actions (`RootNavigator.tsx`)
When a guest or signed-out user opens one of these screens, the app shows a sign-in sheet. After login the app returns to the screen they wanted. The backend must return **401** for these endpoints when no token is sent.

| Screen | Reason shown |
| --- | --- |
| enquiry | submit an enquiry |
| visitCalendar / rescheduleVisit | schedule / reschedule a site visit |
| nriVideoCall | book an NRI video call |
| sellType / sellIntent | list a property |
| myListings / myEnquiries / myVisits / myDeals | track listings, enquiries, visits, deals |
| notifications | get notifications |
| profileEdit | edit your profile |
| favorites | save properties |

**Public, no token needed:** app config, properties list and detail, trending searches, content, and the OTP send/verify/refresh endpoints.

---

## 2. Property catalogue logic (`utils/filters.ts`, `utils/property.ts`)

### Filter → query mapping
| UI filter | Query |
| --- | --- |
| Budget slider (lakhs, range 0–300) | `minPrice = lo × 100000` only if `lo > 0`; `maxPrice = hi × 100000` only if `hi < 300` |
| "Under 1 Cr" chip | `maxPrice = min(maxPrice, 10000000)` |
| Area slider (sqft, range 0–3000) | `minArea` only if `> 0`; `maxArea` only if `< 3000` |
| BHK chips | `bhk=1,2,...,5+`. The "3+ BHK" chip adds `3,4,5+`. |
| "Verified" chip | `verified=true`, which must mean `status = available` |
| "Negotiable" chip | `negotiable=true` |
| "Ready to move" chip | adds `Ready to move` to `possession` csv |
| Construction status (advanced) | values go into the **`possession`** csv |
| Furnishing / facing / age / amenities | csv lists |
| Posted by | `owner \| builder \| dealer` |
| Sort | `relevance` is sent only when `search` is set; otherwise `price_asc`, `price_desc` or `newest` |

Defaults: budget `[20, 150]` lakhs, area `[400, 2000]` sqft.

### Server-side requirements
- **Area filter:** use the first of `specs.builtUpArea`, `carpetArea`, `plotArea`, `area`, `totalArea` that has a value. Values may be numeric strings, so convert them.
- **`bhk=5+`:** match `bhk >= 5`.
- **Visibility:** list and detail return only `isVisibleOnApp` listings that are not `draft` and not `sold`. `recentlySold=true` returns only sold listings.
- **Detail 404:** a sold or withdrawn property returns 404. The app handles this on purpose.
- `meta.total` must be correct. It drives counts on Home ("N+ verified listings") and the Filter "Show N properties" button.

### Favourites
- Saving is optimistic: the heart toggles immediately and goes back if the API call fails.
- `POST .../save` returns the Property. `DELETE .../save` returns 204. Both must be idempotent.
- Increase or decrease `metrics.savedCount` to match.

### Search
- Recent searches: up to **10** per user, newest first, no duplicates.
- The app records a search together with the number of results.
- Trending: the most popular recent terms across all users.

---

## 3. Buy enquiry logic (`EnquiryScreen.tsx`)

Validation done by the client. **Enforce the same rules on the server:**
- Name is at least 2 characters.
- Phone is exactly 10 digits.
- The consent checkbox is ticked.
- At least one interest type is chosen.
- If an email is given, it must be valid. Email is required when `preferredContact = email`.

Building the request:
- `enquiryTypes` = selected interests in a fixed order: `schedule_visit`, `price_negotiation`, `more_details`.
- `interestType` = `enquiryTypes[0]`.
- If `schedule_visit` was chosen, `preferredVisitTime` is one of `tomorrow_morning`, `this_weekend_afternoon` or `custom`, and `preferredVisitTimeSlot` holds a readable label. Otherwise both are `null`.
- If the user entered a phone number different from their profile number, it is **added to `additionalMessage`** as `Alternate contact number: +91 XXXXXXXXXX.`.
- Before sending, the client runs `PATCH /me` with any changed name or email. The **backend should take the buyer snapshot from the user record**.

The custom-slot path: choosing "Custom Date & Time" opens the visit calendar. When the user confirms there, the client creates the enquiry (with `preferredVisitDate` and the slot) and then calls `POST /visits` linked to that enquiry.

### Enquiry lifecycle (backend-driven)
```
new → responded → visit_scheduled → negotiating → closed
```
- **Closed and the deal's `stage === 'closed'`:** shown as **Completed**.
- **Closed any other way:** shown as **Cancelled**.
- Status labels: `new`=awaiting, `responded`, `visit_scheduled`, `negotiating`, `completed`, `cancelled`.

The note on each enquiry card is chosen in this order:
1. The next upcoming visit ("Visit on 21 Oct · 10:00 AM")
2. `customerStageLabel` (set by the backend or admin)
3. A text based on status

So **`customerStageLabel` is the main way the backend tells the buyer where things stand.**

### Upcoming visit definition
A visit is upcoming when its status is `scheduled`, `confirmed` or `rescheduled` **and** `visitDate >= today`.

---

## 4. Visits (`VisitPicker.tsx`, `VisitCalendarScreen.tsx`, `RescheduleVisitScreen.tsx`, `CancelEnquiryScreen.tsx`)

- Availability is fetched one month at a time, starting **tomorrow** (no same-day booking).
- Slot `time` strings come back unchanged as `visitTime`. Keep them in a fixed format, e.g. `10:00 AM`.
- The server must enforce slot capacity (`remainingCapacity`) and reject double bookings with 409.
- Reschedule: the new date and time must be in the future and in a free slot. Increase `rescheduleCount`. You may cap the number of reschedules; return a clear message when the cap is reached.
- Cancel visit: `reason` is required.
- Cancel enquiry: no body. Close the enquiry and cancel its pending visits.
- NRI video call: `visitType=virtual`. Availability is requested with `visitType=virtual`. The language the user picks is **not sent**, because the API has no field for it.

---

## 5. Seller flow logic (`SellFlowContext.tsx`)

### Wizard steps (SL-01 … SL-07) and `draftStep`
| Step | Screen | Data |
| --- | --- | --- |
| 1 | SellType / SellIntent | property type |
| 2 | SellAddress | building (→ `address.street`), locality, city, pincode |
| 3 | SellDetails | title, subType, bhk, builtUp, carpet, floor, totalFloors, unitNo, age, facing, furnishing, parking, plotArea/landArea, zoning, roadAccess, feature checkboxes |
| 4 | SellAmenities | amenities[] |
| 5 | SellPhotos | photos (uploaded straight to `/documents`) |
| 6 | SellPrice | askingPrice, negotiable (shows valuation estimate) |
| 7 | Submit | `PATCH` with `draftStep: 7`, then `POST /submit` |

- **The draft is created lazily:** on the first save (`POST /sell-requests/drafts`) or on the first photo upload. Later saves use `PATCH /me/sell-requests/:id`.
- The draft is also saved in the background on each step. If that fails, the user only sees a warning toast.
- Concurrent creates are merged on the client so only one draft is created. The backend should still accept repeated PATCHes safely.
- When the user restarts the flow with the same type, the current draft is reused. A different type starts a new draft.

### Payload mapping rules
- `propertyType` = the API type from the catalogue.
- Numbers are taken from text inputs by removing non-digits. Values `<= 0` are **left out**.
- Empty strings are left out (`undefined`). `askingPrice` is removed when it is empty.
- Feature checkboxes and zoning/road access are **sent inside `amenities[]`** because `specifications` has no field for them:
  - `Water source available`, `Electricity connection`, `Compound wall/fencing`, `Garden`, `Terrace`, `Borewell`
  - `Zoning: <text>`, `Road access: <text>`
- `specifications.plotArea` = plotArea, or landArea if plotArea is empty.
- `photos[]` holds only the URLs of uploads that succeeded.
- Defaults: city `Chennai`, ownership `Freehold`, facing `East`, furnishing `Unfurnished`, parking `1`, amenities `[Lift, Parking, Power Backup, Security]`, negotiable `true`.

### Submit rules
1. If `user.role === 'buyer'`, the client first calls `PATCH /me {role:'both'}`. **The backend must reject submissions from users who are only buyers.**
2. Final `PATCH` with all data and `draftStep: 7`.
3. `POST /submit`. The backend checks required fields and moves the status from `draft` to `new`.

Suggested required fields for submit: `propertyType`, `propertyTitle`, `address.city`, `address.locality`, `askingPrice > 0`, at least 1 photo, and some area (`builtUpArea`, `plotArea` or `carpetArea`). Return a `details[]` entry for each missing field.

### Edit rules
`PATCH /me/sell-requests/:id` is only allowed in `draft` or `changes_requested`. The app has **no delete endpoint** for listings; it sends the user to Customer Support instead.

### Seller status labels
`draft` Draft · `new` Submitted · `under_review` In review · `changes_requested` Changes requested · `accepted` Accepted · `approved` Approved · `active` Live · `negotiating` Negotiating · `paused` Paused · `sold` Sold · `rejected` Rejected.

---

## 6. Seller verification and acquisition (`VerificationStatusScreen.tsx`)

The SL-10 timeline is **computed from** `sellRequest.status`, `sellRequest.documents[]` and `acquisition.stage` and `stageHistory`:

Acquisition stage order:
`pending_review → site_inspection → valuation → negotiation → token_to_seller → documentation → seller_payout → acquired`

`rejected` and `on_hold` are outside this order.

| Step | Done when | Other states |
| --- | --- | --- |
| 1 Submitted | always | date = `submittedAt` |
| 2 Verification Call | `status !== 'new'` or an acquisition exists | date = stageHistory `to: pending_review` |
| 3 Document Verification | stage index ≥ 1, or status ∈ approved/active/negotiating/sold, **and** nothing flagged | **alert** if `status = changes_requested` or any document is `rejected` or `missing` → "Re-upload" action |
| 4 Site Inspection | stage index > 1 | date = stageHistory `to: valuation` |
| 5 Legal Verification | stage index > 2 | |
| 6 Valuation | an `offer` exists | → "Review offer" action |

**For the backend:** to send a seller back to fix documents, set the document's `status` to `rejected` or `missing` and/or set the sell request to `changes_requested` with `changeRequests[]`. The seller re-uploads with `POST /documents` (purpose `legal`), then `PATCH documents[]`, then `POST /submit` again.

---

## 7. Offer and negotiation (`OfferScreen`, `AcceptNegotiateScreen`, `DealConfirmedScreen`)

- The offer comes from `activity.offer`.
- **Expiry:** a countdown to `expiresAt`. If `expiresAt` is null, the client assumes a **48-hour** window. Once it has expired, the client tells the user to contact BuiltGlory. **The backend must reject decisions on expired offers.**
- The client treats these offer statuses as accepted: `seller_accepted`, `accepted`, `token_to_seller`, `documentation`, `seller_payout`, `acquired`.
- `seller_countered`: shows "Your counter of ₹X is under review".
- Comparison with the market: `(offer.amount − valuation.estimatedPrice) / estimatedPrice × 100`.
- Accept: `decision: accepted`, then the Deal Confirmed screen.
- Counter: `decision: countered`, `counterAmount > 0`, optional `notes`.
- After accepting, the seller enters payout bank details. The client checks that holder and bank name are at least 2 characters, the account number is at least 6 digits and typed the same twice, and the IFSC is at least 6 characters. **Only `accountNumberLast4` is sent to `PATCH /me`.** The full account number never leaves the device. Plan for collecting the full account number separately, offline or through KYC.
- Term sheet: shown only if `acquisition.documentation.termSheetUrl` (or `termSheet.url`) is an http(s) URL.
- Payout schedule (SL-15): taken directly from `activity.payoutSchedule[]`.
- Registration (SL-16): taken from `activity.registration` (`appointment`, `status`, `checklist[]`).
- Deal complete (SL-17): `registration.status === 'completed'`. The sale deed comes from a document whose name contains "sale deed" and that has a `fileUrl`.

### Seller chat
- The client polls `GET /activity` every **15 s** while the chat is open.
- Sending a message returns the full activity, which replaces the client state.
- `sender === 'seller'` messages are drawn on the right. Messages with `type: 'offer'` show `offerAmount` and `offerStatus`.

### Seller visit management
- The actions are `confirm` and `reschedule` (with date, time and reason). There is no decline; the decline button sends `reschedule`.
- The seller's availability chips are stored **on the device only**, because there is no API for them yet.

---

## 8. Buyer deal and payment (`PaymentScreen`, `DocumentsSharedScreen`, `RegistrationDetailsScreen`, `MyDealsScreen`)

### Deal stage progress (My Deals)
In order: `active_leads` (Lead) → `site_visits` → `negotiation` → `token_payment` → `full_payment` → `stage_payment` → `interior_design` → `documentation` → `closed` (Completed).

`progress = (index + 1) / 9 × 100`. `lost` = 0%. `re_engagement` = 10%.

### Token payment (manual escrow, no payment gateway)
1. Load the enquiry, take `enquiry.deal`, then load `GET /me/payments?dealId&type=token`.
2. If a payment is `paid`, the button says "View registration details". If one is `pending` or `created`, it says "Awaiting verification". In both cases the **pay button is blocked**.
3. The amount is `appConfig.payment.tokenAmount`. Escrow bank, UPI and cheque details come from `appConfig.payment.escrow`.
4. The UPI deep link is built on the client: `upi://pay?pa=<upiId>&pn=<holder>&am=<amount>&cu=INR&tn=<deal.referenceId>`.
5. When the user taps "I have paid", the client calls `POST /payments/token` with `idempotencyKey = token-<dealId>-<method>`.
6. Response `failed`, `rejected` or `cancelled` → failure screen. `paid` → "confirmed" toast. Anything else → "submitted for verification". In both success cases the client goes to Registration details.

**For the backend:** an admin checks the transfer, sets the payment to `paid`, sets `deal.financials.tokenPaid = true`, and moves the deal to the next stage.

### Documents shared with the buyer
The app shows files from `deal.documentation.documents[]` and `customDocs[]` **only when `sentToBuyerAt` is set** and the file has a `url`.

Private files are opened with `GET /documents/:id/read-url`.

### Registration details
These come from `deal.documentation.registration`: `registrationDate`, `registrationOffice`, `subRegistrarName`, `stampDuty`, `registrationFee`, `notes`.

---

## 9. Profile, settings and account

- **Profile setup (S-05):** name is required, email is optional. The photo is uploaded with `POST /documents`, then saved with `PATCH /me {profilePhoto: url}`.
- **Location and type (S-06):** `city` plus `userType` (resident/nri/pio).
- **Terms (S-07):** acceptance is stored on the device (`bg.termsAccepted`). The "updates by SMS/Email" choice is saved as `sms.marketing` and `email.marketing`.
- **Notification settings (A-02):** the 4 "update" toggles all map to `push.transactional` + `in_app.transactional`. "Seminars" maps to `marketing`.
- **Change phone (P-03):** OTP send (`change_phone`), then OTP verify (`change_phone`), then `PATCH /me {mobileNumber}`.
- **Account deletion (A-04a):** the user must type `DELETE`. There is a 30-day grace period and the request can be cancelled during it.
- **Profile counts:** `GET /me/buy-enquiries?limit=1` and `GET /me/sell-requests?limit=1`. The counts are read from `meta.total`.
- **Stored on the device only (no API):** onboarding seen, coach marks, terms accepted, permissions, app settings (language, dark mode, GPS), filter preset, recently viewed, seller availability.

---

## 10. Notifications

- The unread badge on Home and Profile comes from `GET /me/notifications/unread-count`.
- Opening a notification marks it read optimistically (`PATCH /:id/read`).
- "Mark all read" sends `PATCH /read {ids: []}`.
- Swipe to dismiss calls `DELETE /:id`, which archives it for that user.
- Notifications are grouped by day using `createdAt`.
- **Events the backend should send** (inferred from the screens): enquiry responded, visit scheduled/confirmed/rescheduled/cancelled, deal stage changed, token payment verified/rejected, documents shared, registration scheduled, sell request status changed, changes requested, offer received, offer counter answered, new buyer enquiry or visit on a listing, payout released.

---

## 11. Global app states

| State | Trigger |
| --- | --- |
| G-01 Offline | `NETWORK_ERROR` during bootstrap |
| G-02 Force update | `APP_VERSION (1.0.0) < config.versions.minimumSupported` |
| G-03 Maintenance | `config.maintenance.enabled === true` (shows `message` and `expectedBackAt`) |
| G-04 Session expired | refresh rejected with 401/403/409 |

---

## 12. Known gaps (backend can add)

| Gap | Suggestion |
| --- | --- |
| No seller "decline visit" | Add `action: 'decline'` |
| No seller availability API | `PUT /me/sell-requests/:id/availability` |
| No listing delete or withdraw | `DELETE` or `POST /me/sell-requests/:id/withdraw` |
| No video-call language field | Add `language` to `POST /visits` |
| Advisor name not exposed | Add `assignedAdvisor {name, phone}` to the enquiry and the activity |
| Push not registered | `PUT /me/push-token` is ready, but the app has no FCM/APNs config yet |
| No geocoding | "Use current location" only fills the profile city |
| No production URL | `src/api/config.ts` points at the local dev server |

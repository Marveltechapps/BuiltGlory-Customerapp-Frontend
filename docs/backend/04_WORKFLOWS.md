# BuiltGlory Customer App: End-to-End Workflows

These are the user journeys and the exact order of API calls each one makes. The diagrams use Mermaid and render on GitHub and in VS Code with a Mermaid extension. Screen codes (S-, H-, B-, SL-, P-, A-, G-) match the design reference.

---

## 1. App launch / Splash (S-01)

```mermaid
flowchart TD
  A[App start] --> B[GET /app/config]
  B -->|network error| OFF[G-01 Offline]
  B -->|maintenance.enabled| MAINT[G-03 Maintenance]
  B -->|APP_VERSION < minimumSupported| FU[G-02 Force update]
  B -->|ok| C{Stored session?}
  C -->|no| D{Onboarding seen? device}
  D -->|no| ONB[S-02 Onboarding] --> LOGIN
  D -->|yes| LOGIN[S-03 Login]
  C -->|yes| E[GET /me]
  E -->|200| HOME[H-01 Home]
  E -->|401 → refresh fails| LOGIN
  E -->|network error| OFF
```

---

## 2. Login / signup with OTP (S-03 → S-08)

```mermaid
sequenceDiagram
  participant App
  participant API
  App->>API: POST /auth/customer/otp/send {phone, countryCode:+91, deviceId, purpose:login}
  API-->>App: {requestId, expiresInSeconds, canResendAt}
  Note over App: S-04 OTP screen, resend countdown from canResendAt
  opt Resend
    App->>API: POST /auth/customer/otp/send (same body)
    API-->>App: new requestId
  end
  App->>API: POST /auth/customer/otp/verify {phone, otp, requestId, purpose:login}
  API-->>App: {accessToken, refreshToken, expiresInSeconds, user}
  alt came from guest gate / resume target
    Note over App: Return to the gated screen
  else user.name empty (new user)
    App->>API: PATCH /me {name, email}               (S-05)
    App->>API: POST /documents (profile photo) → PATCH /me {profilePhoto}
    App->>API: PATCH /me {city, userType}            (S-06)
    App->>API: GET /content/terms-of-service, /content/privacy-policy (S-07)
    App->>API: PATCH /me {notificationPreferences.sms/email.marketing}
    Note over App: S-08 Permissions (device only) → Home
  else existing user
    Note over App: H-01 Home
  end
```

**Guest mode:** "Explore as guest" on Login goes to Home without a token. Gated actions open a sign-in sheet, and after login the app returns to the screen the user wanted.

---

## 3. Token refresh (any screen)

```mermaid
sequenceDiagram
  participant App
  participant API
  App->>API: GET /me/... (Bearer expired)
  API-->>App: 401
  App->>API: POST /auth/refresh {refreshToken}   (single in-flight, shared)
  alt 200
    API-->>App: {accessToken, refreshToken (rotated)}
    App->>API: retry original request
  else 401/403/409
    Note over App: clear session → G-04 Session expired → Login
  end
```

---

## 4. Home and discovery (H-01 … H-04)

```mermaid
flowchart LR
  H[H-01 Home] -->|parallel| P1[GET /properties?featured=true&limit=5]
  H --> P2[GET /properties?upcoming=true&limit=3]
  H --> P3[GET /properties?verified=true&limit=1 → meta.total]
  H --> P4[GET /me/notifications/unread-count]
  H --> S[H-02 Search]
  S --> S1[GET /search/trending]
  S --> S2[GET /me/searches]
  S --> S3[GET /properties?search=term&limit=20]
  S3 --> S4[POST /me/searches term,resultCount]
  H --> F[H-03 Featured: GET /properties?featured=true&sort&page]
  H --> U[H-04 Upcoming: GET /properties?upcoming=true&page]
```

---

## 5. Buy: browse → filter → detail (B-01 … B-09)

```mermaid
flowchart TD
  T[B-01 Buy type] --> FI[B-02 Filters]
  FI -->|live count, debounced| C[GET /properties?...&limit=1 → meta.total]
  FI --> AF[Advanced filters]
  FI --> L[B-03 Results: GET /properties?...&page=N&limit=20 infinite scroll]
  L --> M[B-17 Map: GET /properties?...&limit=50 uses address.latitude/longitude]
  L --> D[B-04 Detail: GET /properties/:id]
  D -->|404| SO[Sold-out / withdrawn screen]
  D --> SUB[B-05 Specs / B-06 Advantages / B-07 Floor plan / B-08 VR / B-09 Aerial: same record, media.*]
  D --> CMP[Compare: GET /properties?type=X then ?sort=newest&limit=10]
  D --> FAV[Heart: POST or DELETE /properties/:id/save]
  D --> ENQ[B-10 Enquiry]
  D --> NRI[B-13a NRI video call]
```

---

## 6. Buy: enquiry and site visit (B-10 → B-13)

```mermaid
sequenceDiagram
  participant App
  participant API
  Note over App: B-10 Enquiry form (guest → sign-in sheet)
  App->>API: PATCH /me {name?, email?}  (only if edited)
  alt Preset visit time / no visit
    App->>API: POST /buy-enquiries {propertyId, enquiryTypes, interestType, preferredContact, preferredVisitTime, preferredVisitTimeSlot, additionalMessage}
    API-->>App: BuyEnquiry (status new)
    Note over App: B-11 Enquiry success
  else Custom date and time
    Note over App: B-12 Visit calendar
    App->>API: GET /visits/availability?propertyId&visitType=physical&from&days
    API-->>App: {days:[{date, slots:[{time, available}]}]}
    App->>API: POST /buy-enquiries {..., preferredVisitTime:custom, preferredVisitDate, preferredVisitTimeSlot}
    API-->>App: BuyEnquiry
    App->>API: POST /visits {propertyId, enquiryId, visitDate, visitTime, visitType:physical}
    API-->>App: Visit (scheduled)
    Note over App: B-13 Visit confirmation
  end
```

**Booking a visit from an existing enquiry** skips the enquiry creation and calls `POST /visits` with the `enquiryId` it already has.

**NRI video call (B-13a):** `GET /visits/availability?visitType=virtual`, then `POST /visits {visitType:'virtual', virtualPlatform}`, then B-13b confirmation.

**Reschedule (B-12a):** `GET /visits/availability`, then `PATCH /visits/:id/reschedule {visitDate, visitTime}`, then the confirmation screen with `rescheduled: true`.

**Cancel (B-17):** `PATCH /visits/:id/cancel {reason}` for a visit, or `PATCH /me/buy-enquiries/:id/cancel` for the whole enquiry.

---

## 7. Buy: deal, token payment, documents and registration (B-14 … B-16)

```mermaid
sequenceDiagram
  participant Admin as Admin dashboard
  participant API
  participant App
  Admin->>API: Create sales deal for enquiry, move stages (site_visits → negotiation → token_payment)
  App->>API: GET /me/buy-enquiries (deal embedded) → My Deals progress
  Note over App: B-15 Payment
  App->>API: GET /me/buy-enquiries/:id
  App->>API: GET /me/payments?dealId&type=token
  App->>API: GET /app/config (tokenAmount, escrow)
  Note over App: User transfers via bank / UPI / cheque outside app
  App->>API: POST /payments/token {dealId, propertyId, amount, method, idempotencyKey}
  API-->>App: Payment (pending)
  alt failed / rejected / cancelled
    Note over App: Payment failure screen (failureReason)
  else pending / paid
    Note over App: B-16 Registration details
  end
  Admin->>API: Verify payment → paid, deal.financials.tokenPaid=true, stage → documentation
  Admin->>API: Attach deal.documentation.documents[].files[], set sentToBuyerAt
  App->>API: GET /me/buy-enquiries/:id → B-14 Documents shared (only sentToBuyerAt)
  App->>API: GET /documents/:id/read-url (private file viewer)
  Admin->>API: Set deal.documentation.registration {registrationDate, office, fees}
  App->>API: GET /me/buy-enquiries/:id → B-16 shows appointment
  Admin->>API: Deal stage → closed; enquiry status → closed
  Note over App: Enquiry shown as Completed
```

---

## 8. Sell: listing wizard (SL-01 → SL-08)

```mermaid
sequenceDiagram
  participant App
  participant API
  Note over App: SL-03 Sell type
  App->>API: GET /properties?recentlySold=true&limit=6&sort=newest
  Note over App: SL-01/02 type + intent → SL-02 address → SL-04 details → SL-05 amenities
  loop each step (background, non-blocking)
    alt no draft yet
      App->>API: POST /sell-requests/drafts {partial payload, draftStep}
      API-->>App: SellRequest (draft, _id)
    else draft exists
      App->>API: PATCH /me/sell-requests/:id {partial payload, draftStep}
    end
  end
  Note over App: SL-06 Photos
  App->>API: POST /documents (multipart, ownerType=sell_request, ownerId=draftId, purpose=property_media) ×N parallel
  API-->>App: {url} for each photo
  Note over App: SL-07 Expected price
  App->>API: POST /me/sell-requests/:id/valuation-estimate
  API-->>App: {estimatedPrice, low, high, comparables}
  Note over App: Submit
  opt user.role == buyer
    App->>API: PATCH /me {role: both}
  end
  App->>API: PATCH /me/sell-requests/:id {full payload, draftStep:7}
  App->>API: POST /me/sell-requests/:id/submit
  API-->>App: SellRequest (status new)
  Note over App: SL-08 Sell success
```

**Save as draft:** the app saves and shows Draft success. The draft can be resumed later from My Listings (`GET /me/sell-requests/:id` loads it back into the form).

---

## 9. Sell: verification → offer → deal → payout → registration (SL-10 … SL-17)

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> new: POST /submit
  new --> under_review: admin
  under_review --> changes_requested: admin flags docs
  changes_requested --> new: seller re-uploads + POST /submit
  under_review --> rejected: admin (rejectionReason)
  under_review --> approved: admin
  approved --> active: listed
  active --> negotiating
  negotiating --> sold
  active --> paused
  paused --> active
```

```mermaid
sequenceDiagram
  participant Admin
  participant API
  participant App as Seller app
  App->>API: GET /me/sell-requests/:id/activity  (SL-10 timeline)
  Admin->>API: Create acquisition (pending_review → site_inspection → valuation)
  opt documents flagged
    Admin->>API: documents[i].status=rejected / status=changes_requested
    Note over App: SL-11 Re-upload
    App->>API: POST /documents (purpose=legal, documentType=doc name)
    App->>API: PATCH /me/sell-requests/:id {documents}
    App->>API: POST /me/sell-requests/:id/submit
  end
  Admin->>API: Create offer {amount, expiresAt}
  Note over App: SL-12 Offer
  App->>API: GET /activity + POST /valuation-estimate (area average)
  alt Accept
    App->>API: POST /offer-decision {decision: accepted}
  else Counter
    App->>API: POST /offer-decision {decision: countered, counterAmount, notes}
    Admin->>API: Respond (new offer / accept counter)
  end
  Note over App: SL-14 Deal confirmed
  App->>API: PATCH /me {bankDetails (last4 only)}
  Admin->>API: acquisition → token_to_seller → documentation → seller_payout; fill payoutSchedule
  Note over App: SL-15 Payment schedule (activity.payoutSchedule)
  Admin->>API: registration.appointment + checklist
  Note over App: SL-16 Registration (activity.registration)
  Admin->>API: registration.status=completed, acquisition → acquired, sellRequest → sold, attach Sale Deed doc
  Note over App: SL-17 Deal complete
```

**Seller side screens that all use `GET /activity`:**
- Seller enquiries (SL): `activity.enquiries` (buyer data masked)
- Visit management: `activity.visits`, with actions sent to `POST /visits/:visitId/action {confirm | reschedule}`
- Negotiation chat: `activity.messages`. The app sends with `POST /messages {text}` and polls every 15 s.
- SL-18 Rejected: `GET /me/sell-requests/:id` (`rejectionReason`)

---

## 10. Profile and account (P-01 … P-12, A-01 … A-08)

```mermaid
flowchart TD
  P[P-01 Profile] --> P1[GET /me/buy-enquiries?limit=1 → meta.total]
  P --> P2[GET /me/sell-requests?limit=1 → meta.total]
  P --> P3[GET /me/notifications/unread-count]
  P --> E[P-02 Edit: PATCH /me, POST /documents]
  P --> CP[P-03 Change phone: otp/send purpose=change_phone → otp/verify → PATCH /me mobileNumber]
  P --> ML[P-04 My listings: GET /me/sell-requests]
  P --> MV[P-04a My visits: GET /me/buy-enquiries → visits]
  P --> MD[P-04b My deals: GET /me/buy-enquiries + GET /me/sell-requests]
  P --> ME[P-07 My enquiries: GET /me/buy-enquiries?sort=newest]
  ME --> ED[P-08 Detail: GET /me/buy-enquiries/:id + GET /properties/:id → 404 = withdrawn]
  P --> N[P-10 Notifications: GET/PATCH/DELETE /me/notifications]
  P --> O[Offers: GET /content?section=banner → POST /callbacks]
  P --> NI[News: GET /content?section=news]
  P --> S[A-01 Settings]
  S --> NS[A-02 Notifications: PATCH /me notificationPreferences]
  S --> AD[A-04a Delete account: GET/POST/DELETE /me/account-deletion]
  S --> FQ[A-05/06 FAQs: GET /content?section=faq]
  S --> CS[A-07 Support: POST /callbacks source=profile_support]
  S --> AB[A-08 About: GET /content/about-builtglory + /app/config]
  P --> LO[Logout: POST /auth/logout → clear session]
```

---

## 11. Help and support (H-05)

1. `GET /content?section=faq&limit=100`. The app groups the FAQs by `category`.
2. Request a callback with `POST /callbacks {source:'help_support', sourceScreen:'help', category:'general', bestTimePreference, reason}`.
3. Send feedback with `POST /feedback {message, source:'customer_app', sourceScreen:'help'}`.
4. Call or WhatsApp uses `appConfig.support.telUrl` and `whatsappUrl`.

---

## 12. Admin-side triggers the app depends on

The customer app only reads these state changes. The admin dashboard or backend jobs must make them:

| Admin action | Field(s) changed | App effect |
| --- | --- | --- |
| Respond to enquiry | `enquiry.status=responded`, `customerStageLabel` | Card note and badge |
| Create sales deal | `deal` linked to the enquiry | Shows in My Deals |
| Move deal stage | `deal.stage`, `stageHistory` | Progress bar |
| Verify token | `payment.status=paid`, `deal.financials.tokenPaid` | Payment screen unlocks Registration |
| Share documents | `documentation.documents[].sentToBuyerAt`, `files[].url` | B-14 list |
| Schedule buyer registration | `documentation.registration` | B-16 |
| Review sell request | `status`, `documents[].status`, `changeRequests`, `rejectionReason` | SL-10 / SL-11 / SL-18 |
| Acquisition stages | `acquisition.stage`, `stageHistory` | SL-10 timeline |
| Make offer | `offer {amount, expiresAt, status}` | SL-12 |
| Term sheet | `acquisition.documentation.termSheetUrl` | SL-14 link |
| Payout plan | `payoutSchedule[]` | SL-15 |
| Seller registration | `registration {appointment, status, checklist}` | SL-16 / SL-17 |
| Mark sold | `sellRequest.status=sold`, `sale {...}`, Sale Deed document | SL-17 |
| Any of the above | Create an `in_app` notification with the matching ID field | P-10 and badge |

# Builtglory Customer App — Business Logic

The rules the customer app enforces today: lifecycle stages, gates, validation, pricing, negotiation and filtering. Each rule names the source file that owns it.

Related docs:

- [WORKFLOWS.md](WORKFLOWS.md): step-by-step user journeys and diagrams.
- [FUNCTIONALITY.md](FUNCTIONALITY.md): screen-by-screen feature reference.
- [API_CALLS.md](API_CALLS.md): the backend contract these rules must move to.

---

## 1. Business model

Builtglory is a property marketplace in which Builtglory is the counterparty on both sides:

- **Buyers** enquire on verified listings, visit, confirm a deal, pass KYC, pay a fixed token into a Builtglory escrow account, then register the sale at the Sub-Registrar office.
- **Sellers** list a property. Builtglory verifies it, values it and makes an offer. The seller can accept or counter up to 3 times. After agreement the seller adds bank details, confirms a payout schedule and registers the sale.

Product promises the app makes (copy in [sampleData.ts](../src/config/sampleData.ts) FAQs and screen text):

| Promise | Where it appears |
| --- | --- |
| No brokerage or commission | FAQ "Do you charge brokerage?" |
| Every listing legally verified before publishing | FAQ, Advantages "Legally verified title" |
| Advisor calls within 1 hour of an enquiry | Enquiry Success (B-11) |
| Listing reviewed within 48 hours | Listing Success (SL-08) |
| Counter-offers answered within 24 hours | Negotiation Status (SL-13a) |
| Seller has 48 hours to decide on an offer | Offer screen (SL-12) countdown |

---

## 2. Current implementation state

The screens are complete. The data layer is a prototype:

| Concern | Today | Source |
| --- | --- | --- |
| Catalogue | 7 hard-coded properties | [sampleData.ts](../src/config/sampleData.ts) |
| Seller listings | 6 seeded listings | [myListings.ts](../src/config/myListings.ts) |
| Journey state | In-memory module store, lost on app close | [journeyStore.ts](../src/context/journeyStore.ts) |
| Sell form | In-memory draft object | [sellStore.ts](../src/context/sellStore.ts) |
| Drafts | In-memory list with 2 seeds | [draftStore.ts](../src/context/draftStore.ts) |
| Session | In-memory `authMode`, `authName`, `token` | [session.ts](../src/lib/session.ts) |
| Back office | Simulated with timers (`J_AUTO` = 6 s) | `journeyStore.ts`, `sellStore.ts` |
| HTTP | Only the starter `GET /samples` | [sample.service.ts](../src/services/sample.service.ts) |

Rules below marked **(simulated)** stand in for back-office work. Replace them with server state when the API in [API_CALLS.md](API_CALLS.md) is wired up.

---

## 3. Authentication and session

Source: [LoginScreen.tsx](../src/screens/auth/LoginScreen.tsx), [OtpScreen.tsx](../src/screens/auth/OtpScreen.tsx), [RootNavigator.tsx](../src/navigation/RootNavigator.tsx).

| Rule | Value |
| --- | --- |
| Auth modes | `signin` and `signup`, toggled on the Login screen and kept in `session.authMode` |
| Phone number | Exactly 10 digits |
| Sign-up name | Required, at least 2 characters after trimming |
| OTP length | 6 digits |
| OTP resend | Locked for 60 s, then "Code expired" and Resend is enabled |
| Demo OTP | `123456` **(simulated)**. Any other code shows "Invalid OTP" and clears after 2 s |
| Demo send failure | A phone number starting `000` fails to send **(simulated)** |
| Token | Set to `'demo'` on successful OTP. Lets the user tap the next splash to skip to Home |

Routing after OTP:

| Situation | Next screen |
| --- | --- |
| Guest signing in from a gate | Home, plus the screen the guest was blocked from (resume) |
| `authMode = signin` | Home (onboarding skipped) |
| `authMode = signup` | Create Profile → Location + Type → Terms → Permissions → Home |

### 3.1 Onboarding validation

| Screen | Continue is enabled when |
| --- | --- |
| Create Profile (S-05) | Name is at least 2 characters. Email and photo are optional |
| Location + Type (S-06) | GPS is granted, or GPS failed and the manual city is at least 2 characters |
| Terms (S-07) | Terms of Use and Privacy Policy are both ticked. The third (marketing) box is optional |
| Permissions (S-08) | Always. Camera and Location are labelled Required but are not enforced |

User types offered on S-06: **Resident**, **NRI**, **PIO**. Default Resident. The choice is not stored yet.

Profile photo upload succeeds 70% of the time **(simulated)** and offers retry on failure.

### 3.2 Logout and account deletion

- Logout (P-01) and Delete Account (A-04a) both route to Splash. Neither clears `session` or journey state yet.
- Delete Account requires typing `DELETE` exactly.
- Deletion removes (per screen copy): profile and contact details, saved searches and favourites, enquiry and listing history, uploaded documents.

### 3.3 Account changes

| Action | Rule |
| --- | --- |
| Change phone (P-03) | New number at least 10 digits → 6-digit OTP → verified. Resend locked 30 s |
| Change password (A-04) | Current password present, new password at least 6 characters, confirm matches |

---

## 4. Guest mode

Source: [GuestScreens.tsx](../src/screens/profile/GuestScreens.tsx), [RootNavigator.tsx](../src/navigation/RootNavigator.tsx).

A user can "Continue as guest" from Login. Guests can browse everything public. These actions open a sign-in sheet instead:

| Gated target | Reason shown ("Sign in to …") |
| --- | --- |
| `enquiry` | submit an enquiry |
| `visitCalendar` | schedule a site visit |
| `rescheduleVisit` | reschedule a visit |
| `nriVideoCall` | book an NRI video call |
| `sellType`, `sellIntent`, Sell tab | list a property |
| `myListings` | see your listings |
| `myEnquiries` | track your enquiries |
| `notifications` | get notifications |
| `profileEdit` | edit your profile |
| `favorites`, heart toggle | save properties |

Rules:

- Guests see an empty favourites set. Toggling a heart opens the gate.
- The Profile tab opens Guest Profile (P-00) instead of Profile.
- Sign-in from the gate stores the blocked target and context. After OTP the stack becomes `[home, target]`, so the guest lands where they were going.
- Not gated today: `myVisits`, `myDeals`, `buyerDeal`, `payment` and other deal screens. Those screens show a journey lock when there is no record, so a guest cannot act on them, but they are not behind the sign-in sheet.

---

## 5. Catalogue rules

Source: [sampleData.ts](../src/config/sampleData.ts), [types/property.ts](../src/types/property.ts).

### 5.1 Property classification

| Field | Meaning |
| --- | --- |
| `badge = 'For Sale'` | Listed on Home "Featured" and the Featured list |
| `badge = 'Upcoming'` | Listed on Home "Upcoming" with a `launchDate` countdown and a notify toggle |
| `soldOut = true` | Opening its detail page redirects to Sold Out (B-19) |
| `verified` | Shows the verified mark and the "Legally verified title" advantage |
| `negotiable` | Shows "Price negotiable" advantage and matches the Negotiable quick chip |
| `bhk = 0` | Plot, land or commercial. Shown as "Plot" in the enquiry header |

13 property types are offered on Buy (B-01) and Sell (SL-03): Plot, Apartment, Villa, Commercial, Land Bank, Fractional Ownership, 3D Print Home, Organic Home, CEO Mansion, Holiday Home, Farmhouse, NRI Services, Interior.

### 5.2 Money formatting

Source: [format.ts](../src/utils/format.ts).

| Amount | Display |
| --- | --- |
| ≥ 1,00,00,000 | `₹ 2.45 Cr` (trailing `.00` removed) |
| ≥ 1,00,000 | `₹ 85 L` |
| Below | Indian grouping, `₹ 5,862` |

All amounts are whole rupees.

### 5.3 Derived insights

Source: [propertyInsights.ts](../src/utils/propertyInsights.ts).

- **Price vs average**: `diff = round((sqftPrice − avg) / avg × 100)`, where `avg` is the mean `sqftPrice` across listings of the same type. Shown as "N% below / above {type} average" or "At {type} average".
- **Advantages** list, each shown only when its condition holds: verified, sqft price, negotiable, amenity count, demand (enquiries and views), rating.
- **Nearby distances**: 6 categories (schools, hospital, metro, shopping, IT corridor, bank) with a deterministic placeholder distance of 0.3–3.6 km derived from a hash of property id + label, sorted nearest first. Replace with real geodata.

---

## 6. Search, filters and compare

Source: [journeyStore.ts](../src/context/journeyStore.ts) (`BuyFilters`, `applyBF`, `QUICK`, `jToggleCompare`).

### 6.1 Filters

| Filter | Default | Rule |
| --- | --- | --- |
| Types | none | Match any selected type |
| Budget | ₹10 L – ₹300 L | Values are lakhs. `price ≥ min × 1e5`. Max 300 means no upper cap ("₹3 Cr+") |
| Area | 0 – 4000 sqft | Max 4000 means no upper cap ("4000+") |
| BHK | none | Match any; `5+` matches `bhk ≥ 5` |
| Location | empty | Case-insensitive substring of location + city + title |
| Sort | relevance | `price-asc`, `price-desc`, `new` (by "N days/weeks/months ago") |

- Active filter count (`bfCount`) adds 1 for each filter that differs from the default. The count badge appears on the Listing Results filter button.
- The Filter screen's apply button reads "Show N results" and is disabled at 0 matches.
- Choosing a type on B-01 resets all filters before opening results.
- Filters are global for the session. Clear on Listing Results resets filters and quick chips.

### 6.2 Quick chips (Listing Results)

All selected chips must match:

| Chip | Rule |
| --- | --- |
| Verified | `verified` |
| Under ₹1Cr | `price < 1,00,00,000` |
| 3+ BHK | `bhk ≥ 3` |
| Negotiable | `negotiable` |

### 6.3 Search

- Free text matches title + location, case-insensitive.
- Trending areas and recent searches are static lists today.

### 6.4 Compare

- Up to **3** properties. Adding a 4th is refused; the picker disables unselected items when full.
- Opening Compare from a property adds it if there is room.
- The side-by-side table appears at 2 or more properties.
- "Best" highlight on a numeric row needs at least 2 numeric values. Lower wins for price-type rows, higher for others.

### 6.5 Favourites

- Session set seeded with `p1` and `p6`.
- Guests cannot add favourites (gate) and see an empty set.

---

## 7. Buyer journey

Source: [journeyStore.ts](../src/context/journeyStore.ts), [buyerActions.ts](../src/components/journey/buyerActions.ts), gate screens in [screens/buy/](../src/screens/buy/).

### 7.1 Buy record

One active record per property (`pid`). A cancelled record is kept for history; a new enquiry on the same property creates a new record.

| Field | Meaning |
| --- | --- |
| `id` | `BG-XXXXX` reference |
| `stage` | Index into `BUY_STAGES` |
| `at` | Timestamp per completed stage key |
| `enquiry` | Interests, NRI flag, time |
| `visit` | Date, slot, `VG-XXXXX` ref, status `scheduled / completed / cancelled`, rescheduled flag |
| `kyc` | Masked PAN (`AB•••••12F`) and Aadhaar (`•••• 1234`) |
| `payment` | `TXN-XXXXX` ref, amount, method, time |
| `cancelled`, `cancelReason`, `cancelledAt` | Cancellation |

References are a prefix plus 5 random base-36 characters (`jRef`).

### 7.2 Stages

| # | Key | Label | Entered by |
| --- | --- | --- | --- |
| 0 | submitted | Enquiry submitted | Record created |
| 1 | call | Advisor call | Enquiry submitted |
| 2 | visit | Site visit | 6 s after the enquiry **(simulated advisor call)**, or booking a visit |
| 3 | deal | Deal confirmed | Visit marked done |
| 4 | docs | Documents shared | Buyer taps Confirm deal |
| 5 | kyc | KYC & verification | Buyer leaves Documents for payment |
| 6 | token | Token payment | KYC submitted |
| 7 | method | Payment method | Skipped: payment success jumps to 8 |
| 8 | registration | Registration | Token payment succeeds |
| 9 | completed | Completed | Buyer taps Registration done / Registered |

Stages only move forward (`Math.max`). Advancing fills a timestamp for every skipped stage.

### 7.3 Gates

Each step screen checks the stage and shows a lock card with a single action when the buyer is too early.

| Screen | Requires | Lock action |
| --- | --- | --- |
| Schedule Visit (B-12) | An enquiry on the property | Submit enquiry |
| Reschedule (B-12a) | A booked visit | Schedule a visit |
| Deal Confirmed (B-13c) | Stage ≥ 3 (visit done) | Open tracker |
| Documents (B-14) | Stage ≥ 4 (deal confirmed) | Go to deal |
| KYC (B-14a) | Stage ≥ 5 (documents reviewed) | Review documents |
| Payment (B-15) | Stage ≥ 6 (KYC verified) | The earliest missing step |
| Registration (B-16) | Stage ≥ 8 (token paid) | Open tracker |

With no buy record at all, every gate offers "Browse properties".

### 7.4 Enquiry

- Required: name, 10-digit phone, consent box, at least one interest.
- Interests: More Details (default), Price Negotiation, Legal Documents, Home Loan.
- Preferred contact: WhatsApp (default) or other channels on the form.
- Effect: stage → at least 1, `submitted` timestamp set.

### 7.5 Site visit

- First booking calendar: design calendar anchored at 22 May 2026, past days disabled, 8 slots 9 AM–6 PM, default 24 May 11:00 AM.
- Reschedule calendar: real dates, from tomorrow to 60 days ahead, **Sundays unavailable**, 8 slots 9 AM–5 PM. The same date and slot as the current visit is refused.
- Rescheduling keeps the visit reference and sets `rescheduled = true`.
- Assigned advisor shown on confirmation: placeholder "Rajesh S.".
- Marking a visit done sets status `completed` and stage 3.

### 7.6 NRI video call

- Offered from Enquiry Success and Visit Confirmation when the context marks the buyer as NRI.
- Pick a date (5 fixed dates), a time slot in IST (5 slots) and a language: English (default), Tamil, Hindi, Kannada.
- Confirmation only. It does not change the buy record.

### 7.7 Deal, documents, KYC

- Token amount: **₹2,50,000** (`TOKEN_AMOUNT`). Balance at registration = price − token.
- Shared documents: Sale Deed, Approval Document, Layout Plan, Legal Opinion. Each can be viewed or downloaded.
- KYC requires:
  - PAN matching `^[A-Z]{5}[0-9]{4}[A-Z]$`
  - Aadhaar of exactly 12 digits
  - ID document uploaded
  - Consent ticked
- Only masked PAN and Aadhaar are stored on the record.

### 7.8 Token payment

- Pay into Builtglory Escrow (HDFC Bank, branch Adyar) by Bank Transfer (default), UPI (`builtglory@hdfcbank`) or Cheque.
- The buyer confirms with "I have paid ₹ 2,50,000" or "I have handed over the cheque".
- Outcome is random today: 65% success, 35% failure **(simulated)**.
- Success: stores the payment, stage → 8, shows receipt.
- Failure: Try Again or Choose a Different Method. Record unchanged.

### 7.9 Registration

- Venue shown: Sub-Registrar Office, Adyar.
- Checklist the buyer must tick before "Deal Complete": Original Sale Deed, Aadhaar & PAN, Token payment receipt, 2 passport photos, Witness ID proofs.
- The checklist's "Deal Complete" button returns Home without advancing the stage. Completion (stage 9) is set from the tracker's "Registration done" or the enquiry card's "Registered" action.

### 7.10 Cancellation

- From the Buyer Tracker (P-08): pick a reason (Found another property, Budget changed, Location not suitable, Other). Marks the record cancelled and its visit cancelled.
- The standalone Cancel Enquiry screen (B-17) collects a reason (Changed my mind, Found another property, Other) and returns Home. It does not update the record today.
- A cancelled record offers "Enquire again" and "Similar".

### 7.11 Status labels

`buyStatus`: Cancelled (rose), Completed at stage ≥ 9 (green), otherwise the current stage label (brand).

---

## 8. Seller journey

Source: [sellStore.ts](../src/context/sellStore.ts), [journeyStore.ts](../src/context/journeyStore.ts), screens in [screens/sell/](../src/screens/sell/).

### 8.1 Listing form

Seven steps, in order (`SELL_STEPS`):

| # | Screen | Required |
| --- | --- | --- |
| 1 | Property type (SL-03) | A type |
| 2 | Seller details (SL-01) | Full name ≥ 2 chars, valid email if given (`\S+@\S+\.\S+`), confirmation ticked |
| 3 | Address (SL-02) | Door, street, area, city; pincode `^[1-9]\d{5}$`. State from a list, default Tamil Nadu |
| 4 | Property details (SL-04) | Fields vary by type (below) |
| 5 | Amenities (SL-05) | Nothing |
| 6 | Photos & documents (SL-06) | At least **5** photos |
| 7 | Expected price (SL-07) | A price. Negotiable toggle defaults on |

Details fields by type:

| Type | Fields | Required |
| --- | --- | --- |
| Apartment | title, ownership, bhk, builtUp, carpetArea, floor, totalFloors, facing, age, furnish, parking | title, ownership, bhk, builtUp, age |
| Villa | title, ownership, bhk, landArea, builtUp, floor, facing, age, furnish, parking, garden, terrace, borewell | title, ownership, bhk, builtUp, age |
| Plot | title, ownership, area, facing, roadAccess, zoning, water, electricity, fencing | title, ownership, area |
| Land | title, ownership, area, facing, roadAccess, water, electricity, zoning | title, ownership, area |
| Commercial | title, ownership, builtUp, floor, parking, facing, age | title, ownership, builtUp, age |

Defaults: ownership Freehold, facing East, furnish Unfurnished.

Submit (SL-07):

- Creates a listing `L-XXXXX` at stage 1 with a title from the form or "{Type} in {area}".
- Adds it to My Listings, sets it active, clears the in-progress form.

### 8.2 Drafts

- Any form step can be saved as a draft. The draft records the step reached, title (form title, "{Type}, {area}" or "Untitled property"), type, price, area and today's date.
- Saving again updates the same draft (`draftId`).
- Continue opens the next step after the saved one. Drafts can be deleted.
- Edit Listing (SL-09) can save changes (returns to My Listings) or save as a draft at step 7.

### 8.3 Stages

| # | Key | Label | Entered by |
| --- | --- | --- | --- |
| 0 | submitted | Submitted | — |
| 1 | call | Verification call | Listing submitted |
| 2 | docs | Document verification | +6 s **(simulated)** |
| 3 | inspection | Site inspection | +12 s **(simulated)** |
| 4 | legal | Legal verification | +18 s **(simulated)** |
| 5 | valuation | Valuation | +24 s **(simulated)** |
| 6 | offer | Offer sent | +30 s **(simulated)**, the auto-advance ceiling |
| 7 | negotiation | Negotiation / accepted | Seller counters |
| 8 | deal | Deal confirmed | Seller accepts a price |
| 9 | bank | Bank details | Filled when stage 10 is set |
| 10 | schedule | Payment schedule | Seller saves bank details |
| 11 | registration | Registration | Seller confirms the payment schedule |
| 12 | sold | Sold | Seller confirms the registration appointment (sets 13; ≥ 12 reads Sold) |

Rejected listings keep their stage and show "Rejected". Stage labels below 6 read "… in progress".

### 8.4 Gates

| Screen | Minimum stage | Lock message |
| --- | --- | --- |
| Offer (SL-12), Accept / Negotiate (SL-13) | 6 | Offer made once verification and valuation are complete |
| Negotiation Status (SL-13a) | 6 | Negotiation opens once Builtglory sends an offer |
| Deal Confirmed + Bank (SL-14) | 8 | Accept the offer first |
| Payment Schedule (SL-15) | 10 | Confirm the deal and add bank details first |
| Registration (SL-16) | 11 | Confirm the payment schedule first |
| Deal Complete (SL-17) | 12 | Registration must be completed first |

### 8.5 Offer and negotiation

Constants: `BASE_OFFER` = ₹82,50,000 (used when the listing has no offer), `MAX_ROUNDS` = 3.

- The offer screen shows a 48-hour decision countdown.
- **Accept** (any round): records `finalPrice` = current Builtglory amount, closes the negotiation as `agreed`, stage → 8, opens Offer Accepted.
- **Counter**: the seller enters an amount and optional note. Stage → at least 7. Status "In review" while Builtglory responds.
- **Builtglory response (simulated, after 6 s):**
  - If the counter ≤ previous Builtglory amount × 1.03, Builtglory accepts at the counter.
  - Otherwise Builtglory revises to the midpoint of its last amount and the counter, rounded to the nearest ₹10,000.
  - After the seller's 3rd counter, Builtglory's reply is marked final.
- The seller can counter again only when not waiting, the current amount is not final or accepted, and fewer than 3 counters have been sent.
- **Decline**: closes as `declined` and withdraws the listing. Documents stay in the account.

```text
Example: offer ₹82.5 L, seller counters ₹90 L
  90 > 82.5 × 1.03 (84.98)  → Builtglory revises to round((82.5+90)/2) = ₹86.25 L
Seller counters ₹88 L
  88 > 86.25 × 1.03 (88.84)? No → Builtglory accepts ₹88 L
```

### 8.6 Bank details and payout

- Required: account holder, bank name, account number entered twice and matching, IFSC at least 6 characters, deal confirmation ticked.
- The payment schedule is reviewed and confirmed; it does not collect input.

### 8.7 Seller registration

Checklist to confirm the appointment: original title documents, Aadhaar & PAN (seller), latest tax receipts, encumbrance certificate, 2 passport photos.

### 8.8 Re-upload

When documents are flagged (today: Title Document blurry, Encumbrance Certificate missing a page), every flagged item must be re-uploaded before "Submit for Re-verification".

### 8.9 My Listings status

Listings created in the journey are linked into My Listings with a live `stage` label. Tabs: All, Active, Upcoming, Drafts, Sold out, Withdrawn. Rejected listings open the Rejected screen instead of the tracker.

---

## 9. Deals list

Source: [MyJourneyListsScreens.tsx](../src/screens/profile/MyJourneyListsScreens.tsx).

My Deals merges both roles:

| Role | Included when | Progress |
| --- | --- | --- |
| Buying | Not cancelled and stage ≥ 3 | `stage / 9` |
| Selling | Not rejected and stage ≥ 8 | `stage / 12` |

Done means buy stage ≥ 9 or sell stage ≥ 12.

---

## 10. Simulated behaviour to replace

| Simulation | Location | Replace with |
| --- | --- | --- |
| OTP `123456`, phone `000…` fails | `OtpScreen`, `LoginScreen` | `POST /auth/customer/otp/send`, `/verify` |
| Advisor call completes after 6 s | `buyStage` | Back-office stage update |
| Seller stages 1–6 tick every 6 s | `sellStage` | Server stage and timestamps |
| Builtglory counter after 6 s | `negoOf` | Pricing team response from the server |
| 65% payment success | `TokenPayment` | `POST /payments/token` result |
| 70% avatar upload success | `ProfileSetupScreen` | Upload response |
| Fixed visit calendar base date and NRI dates | `VisitScreens`, `NriVideoScreens` | `GET /visits/availability` |
| Nearby distances from a hash | `propertyInsights.ts` | Geo data |
| In-memory state | All stores | Server state plus device persistence for the token |

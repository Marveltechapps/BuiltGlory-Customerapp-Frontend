# Builtglory Customer App — Functionality Reference

Screen-by-screen reference: what each screen shows, what the user can do, and what it changes. Screen IDs and route names come from [navigation/screens.ts](../src/navigation/screens.ts) and [navigation/types.ts](../src/navigation/types.ts).

Related docs: [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md) (rules and thresholds), [WORKFLOWS.md](WORKFLOWS.md) (journeys), [API_CALLS.md](API_CALLS.md) (backend contract).

Legend for **State**: the store function the screen calls, or "—" when the screen only navigates or holds local UI state.

---

## 1. App overview

| Item | Value |
| --- | --- |
| Product | Builtglory, customer app for buying and selling property |
| Stack | React Native 0.83.1, React 19.2, TypeScript |
| Navigation | Custom stack in [RootNavigator.tsx](../src/navigation/RootNavigator.tsx) |
| State | Module stores in [src/context/](../src/context/), in memory only |
| Data | Sample catalogue in [src/config/](../src/config/) |
| Screens | 104 registered routes in 8 groups, plus the starter `samples` screen |

Feature groups:

| Group | Prefix | Screens |
| --- | --- | --- |
| Auth & Onboarding | S- | 8 |
| Home & Navigation | H- | 6 |
| Buy Flow | B- | 28 |
| Sell Flow | SL- | 21 |
| Profile & Account | P- | 16 |
| Settings & Help | A- | 10 |
| Global | G- | 4 |
| Extras | — | 11 |

Note: [ARCHITECTURE.md](../ARCHITECTURE.md) and [README.md](../README.md) still describe the two-screen Mineral Bridge starter. This document reflects the current code.

---

## 2. Auth & Onboarding

| ID | Route | Screen | Functionality | State |
| --- | --- | --- | --- | --- |
| S-01 | `splash` | Splash | Animated BUILTGLORY wordmark. Auto-advances after 2.6 s. Retry after 5 s stall. Tap skips to Home when a token exists | — |
| S-02 | `onboarding` | Onboarding | 3 story slides with progress bars, auto-advance, swipe, Back and Next / Get Started | — |
| S-03 | `login` | Login / Sign up | Segmented Sign in / Sign up. Phone (10 digits), name for sign-up. Send OTP / Create account. Social sign-in buttons. Continue as guest | `session.authMode`, `session.authName` |
| S-04 | `otp` | OTP Verify | 6 digit boxes with auto-focus, error shake, 60 s resend countdown. Demo code `123456` | `session.token` |
| S-05 | `profileSetup` | Create Profile | Name (prefilled from sign-up), optional email, avatar upload with uploading / done / error states | — |
| S-06 | `locationType` | Location + Type | Use GPS, or type a city with suggestions from 12 cities. User type Resident / NRI / PIO | — |
| S-07 | `terms` | Terms & Privacy | Scrollable terms, 3 checkboxes; first two required | — |
| S-08 | `permissions` | App Permissions | Toggles for Camera, Location (Required), Notifications, Contacts (Optional). Finish Setup | — |

---

## 3. Home & Navigation

| ID | Route | Screen | Functionality | State |
| --- | --- | --- | --- | --- |
| H-01 | `home` | Home | Hero with greeting, help and notifications bell (unread badge, bell animation). Guest pill to sign in. Search bar. Buy and Sell tiles. Featured and Upcoming carousels with favourite hearts. Help card. Bottom nav | `toggleFav` |
| H-02 | `search` | Search | Live text search, recent searches (removable), trending areas, property type grid, filter shortcut, compact result cards | — |
| H-03 | `featured` | Featured List | All For Sale listings, list / grid toggle, sort sheet, filter shortcut | `toggleFav` |
| H-04 | `upcoming` | Upcoming List | Upcoming launches with live countdown, notify-me toggle with toast | — |
| H-05 | `help` | Help & Support | FAQ accordion, request-callback form (name, phone, time), feedback box with toast | — |
| H-06 | `coachMarks` | Coach Marks | 4-step spotlight overlay on Search, Buy, Sell. Shown automatically on the first Home visit | — |

---

## 4. Buy Flow

### 4.1 Browse

| ID | Route | Screen | Functionality | State |
| --- | --- | --- | --- | --- |
| B-01 | `buyTypes` | Property Type | Grid of 13 types. Selecting one resets filters and opens results | `setBF` |
| B-02 | `filters` | Filter | Type, budget dual-range (₹10 L – ₹3 Cr+), area (0 – 4000+ sqft), BHK, sort. Reset. Live "Show N results" | `setBF` |
| B-03 | `buyList` | Listing Results | Skeleton loading, result count, quick chips, filter badge and Clear, Advanced filters, Map. Dock: Map + Compare (when items selected) or Filters | `setBF` |
| — | `advancedFilters` | Advanced Filters | Multi-select sections (age of property, furnishing, facing and more), amenities, Reset | — |
| — | `mapView` | Map View | Map with price pins, zoom controls, selected property card | — |
| — | `compare` | Compare | Up to 3 properties, picker sheet, remove, Clear. Comparison table with "best" highlights at 2+ | `jToggleCompare` |
| — | `favorites` | Favorites | Saved properties with unfavourite; empty state with Browse | `toggleFav` |

### 4.2 Property detail

| ID | Route | Screen | Functionality | State |
| --- | --- | --- | --- | --- |
| B-04 | `propertyDetail` | Property Detail | Image gallery with counter and fullscreen, share, favourite. Price, specs, location row, description, floor plans, Explore grid. Dock: Schedule Visit (lock icon until enquired), Enquire | `jToggleCompare` |
| B-04a | `floorPlan` | Floor Plan | Plan tabs (2/3/4 BHK), blueprint room layout, zoom, download toast | — |
| B-05 | `specs` | Specifications | Amenities grid and property highlights | — |
| B-06a | `locationView` | Location & Nearby | Map, directions, nearby places with distances | — |
| B-06 | `advantages` | Advantages | Derived advantages (verified, price vs average, negotiable, amenities, demand, rating) | — |
| B-07 | `vrTour` | Virtual Tour | 360° viewer placeholder, room chips, play / pause | — |
| B-08 | `aerial` | Aerial View | Drone video placeholder with playback progress | — |
| B-09 | `shareProperty` | Share Property | Share channels, copy link with confirmation | — |

### 4.3 Enquiry and visits

| ID | Route | Screen | Functionality | State |
| --- | --- | --- | --- | --- |
| B-10 | `enquiry` | Submit Enquiry | Property header, name / phone / email, preferred contact, interest chips, message, consent. Submit with loading state | `jEnquire` |
| B-11 | `enquirySuccess` | Enquiry Success | What-happens-next list, My Enquiries, Home, View Property, schedule-visit link, NRI video call (NRI only) | — |
| B-12 | `visitCalendar` | Schedule Visit | Gate: enquiry required. Month calendar, time slots, confirm | `jScheduleVisit` |
| B-12a | `rescheduleVisit` | Reschedule Visit | Gate: visit required. Real calendar, Sundays off, 60-day window, new slot | `jScheduleVisit(…, true)` |
| B-13 | `visitConfirmation` | Visit Confirmed | Ticket with date, slot, advisor and reference. NRI video call option. Reschedule, Track deal progress, My Visits, Home | — |
| B-13a | `nriVideoCall` | NRI Video Call | Language, date, IST time slot | — |
| B-13b | `nriVideoConfirm` | NRI Video Confirm | Call details, My Visits, Home | — |

### 4.4 Deal and payment

| ID | Route | Screen | Functionality | State |
| --- | --- | --- | --- | --- |
| B-13c | `buyerDeal` | Deal Confirmed | Gate: stage ≥ 3. Agreed price, token and balance split, next steps, term sheet. Confirm deal or Review documents | `jAdvanceBuy(4)` |
| B-14 | `documentsShared` | Documents Shared | Gate: stage ≥ 4. 4 documents with view and download. Proceed to Token Payment routes through KYC | `jAdvanceBuy(5)` |
| B-14a | `buyerKyc` | KYC Verification | Gate: stage ≥ 5. PAN, Aadhaar with inline errors, ID upload, consent, Verify identity. Verified view links to payment | `jUpsertBuy`, `jAdvanceBuy(6)` |
| B-15 | `payment` | Token Payment | Gate: stage ≥ 6. Amount card, method tabs (Bank / UPI / Cheque) with copyable details, QR placeholder, confirm-paid button | `jUpsertBuy`, `jAdvanceBuy(8)` |
| B-15b | `paymentSuccess` | Payment Success | Reference, amount, method. Continue to Registration, Receipt, Track status | — |
| B-15a | `paymentFailure` | Payment Failure | Try again, Choose a different method, Contact support | — |
| B-16 | `registrationDetails` | Registration Details | Gate: stage ≥ 8. Appointment card, documents-to-carry checklist, Deal Complete when all ticked | — |
| B-17 | `cancelEnquiry` | Cancel Enquiry | Reason dropdown, Cancel or Keep enquiry | — (see BUSINESS_LOGIC §7.10) |
| B-18 | `propertyWithdrawn` | Property Withdrawn | Notice and Browse similar | — |
| B-19 | `soldOut` | Sold Out | Sold date, notify, View similar, Home. Opened automatically for sold-out properties | — |

---

## 5. Sell Flow

### 5.1 Create listing

| ID | Route | Screen | Functionality | State |
| --- | --- | --- | --- | --- |
| SL-03 | `sellType` | Property Type | 13 types, recently sold strip, help, call support | `sdSet({type})` |
| SL-01 | `sellIntent` | Seller Details | Step 1 header. Name, email, confirmation with inline errors | `sdSet({intent})` |
| SL-02 | `sellAddress` | Address | Door, street, area, city, state dropdown, pincode, landmark, map pin. Missing-fields banner | `sdSet({address})` |
| SL-04 | `sellDetails` | Property Details | Type-specific fields (see BUSINESS_LOGIC §8.1), required-field errors | carried in ctx |
| SL-05 | `sellAmenities` | Amenities | Standard and extra amenity chips | carried in ctx |
| SL-06 | `sellPhotos` | Photo Upload | Photo grid, add / remove, tips, "Continue (n/5 photos)" | carried in ctx |
| SL-07 | `sellPrice` | Expected Price | Price input with formatted preview, Negotiable toggle, Submit Listing | `jAddListing`, `linkListing`, `sdReset` |
| SL-08 | `sellSuccess` | Listing Success | Review timeline, Home, My Listings, Track | — |
| SL-08a | `draftSuccess` | Draft Saved | Draft summary, Home, View Drafts | `saveDraft` |
| SL-09 | `editListing` | Edit Listing | Edit title, price, area and more; link to photos; Save changes or Save as draft | `saveDraft` |

### 5.2 Verification and deal

| ID | Route | Screen | Functionality | State |
| --- | --- | --- | --- | --- |
| P-05 / SL-10 | `listingDetail` / `verificationStatus` | Seller Tracker | Stage timeline with timestamps, details and per-stage actions; dock with the next action. Verification view shows the first 6 stages | `jSet(activeListing)` |
| SL-11 | `reupload` | Re-upload | Flagged documents with reasons, upload each, Submit for re-verification | — |
| SL-12 | `offer` | Offer | Gate: stage ≥ 6. Offer amount, 48 h countdown ring, valuation note, Accept / Negotiate | — |
| SL-13 | `acceptNegotiate` | Accept / Negotiate | Accept confirmation, or counter amount with ≈ preview and notes | `jAgree`, `jCounter` |
| SL-13a | `negotiationStatus` | Negotiation Status | Round history, "In review" with countdown, accept, counter (round n of 3), decline sheet, call advisor | `jAgree`, `jDeclineOffer` |
| SL-13b | `offerAccepted` | Offer Accepted | Agreed price and rounds count, continue to deal, listing status | — |
| SL-14 | `dealConfirmed` | Deal Confirmed + Bank | Gate: stage ≥ 8. Term sheet, bank form with account confirmation, deal confirmation | `jSetListingStage(10)` |
| SL-15 | `paymentSchedule` | Payment Schedule | Gate: stage ≥ 10. Payout milestones, Confirm schedule | `jSetListingStage(11)` |
| SL-16 | `sellRegistration` | Registration | Gate: stage ≥ 11. Appointment, documents checklist, Confirm appointment | `jSetListingStage(13)` |
| SL-17 | `dealComplete` | Deal Complete | Gate: stage ≥ 12. Sale summary, download sale deed, contact Builtglory | — |
| SL-18 | `rejectedListing` | Rejected Listing | Rejection reasons, delete listing, contact team | — |

### 5.3 Seller tools

| Route | Screen | Functionality |
| --- | --- | --- |
| `sellEnquiries` | Seller Enquiries | Buyer messages with status and rating, Schedule, Chat |
| `sellVisitMgmt` | Seller Visits | Visit requests with accept / decline |
| `sellChat` | Negotiation Chat | Message thread and composer (local only) |

---

## 6. Profile & Account

| ID | Route | Screen | Functionality | State |
| --- | --- | --- | --- | --- |
| P-00 | `guestProfile` | Guest Profile | Guest hero, sign-in card, locked and open menu groups | — |
| P-01 | `profile` | Profile | Hero with avatar, notifications, edit. Stat tiles. Menu: My Enquiries, My Visits, My Deals, My Listings, Saved, Settings, Help. Logout with confirmation | — |
| P-02 | `profileEdit` | Edit Profile | Name, email, phone with Change Number | — |
| P-03 | `changePhone` | Change Phone | Enter number → OTP (30 s resend) → verified | — |
| P-04 | `myListings` | My Listings | Tabs All / Active / Upcoming / Drafts / Sold out / Withdrawn with counts. Cards by status. List a property | — |
| P-04c | `myDrafts` | My Drafts | Draft cards with progress, Continue at the next step, Delete | `deleteDraft` |
| P-04a | `myVisits` | My Visits | Tabs Upcoming / Completed / Cancelled. Reschedule, Mark visited, Continue to deal | `jCompleteVisit` |
| P-04b | `myDeals` | My Deals | Buying and selling deals with progress bar. Tabs Active / Completed / All | — |
| P-06 | `noListings` | No Listings | Empty state, List a property | — |
| P-07 | `myEnquiries` | My Enquiries | Tabs All / Active / Done / Cancelled. Cards with stage status and stage actions | `enquiryActions` |
| P-08 | `enquiryDetail` | Buyer Tracker | 10-stage timeline with pager, per-stage detail and actions, cancel sheet | `jCompleteVisit`, `jAdvanceBuy`, `jCancelBuy` |
| P-09 | `noEnquiries` | No Enquiries | Empty state, Browse | — |
| P-10 | `notifications` | Notifications | Grouped by day, swipe to dismiss | — |
| P-11 | `pdfViewer` | Document Viewer | Paged PDF preview with page controls | — |
| P-12 | `termsOfUse` | Terms of Use | Same component as S-07 | — |

Extras reachable from profile and info links:

| Route | Screen | Functionality |
| --- | --- | --- |
| `offers` | Offers & Deals | Promotional offers |
| `newsInsights` | News & Insights | Articles with Read links |
| `generalInfo` | General Info | Info sections linking to other screens |
| `helpFeedback` | Help & Feedback | Support channels, feedback with submitted state |

---

## 7. Settings & Help

| ID | Route | Screen | Functionality |
| --- | --- | --- | --- |
| A-01 | `settingsMain` | Settings | Rows to Account, Notifications, App settings, Help & FAQs, About |
| A-02 | `notificationSettings` | Notification Settings | Toggles per alert category, save confirmation |
| A-03 | `appSettings` | App Settings | Language (English default), dark mode, location source (GPS default) |
| A-04 | `accountSettings` | Account Settings | Change password (≥ 6, confirm match), Delete account entry |
| A-04a | `accountDeletion` | Delete Account | What is deleted, type `DELETE` to enable |
| A-05 | `helpFaqs` | Help & FAQs | FAQ search, 8 topic tiles, still-need-help link |
| A-06 | `faqTopic` | FAQ Topic | Multi-open accordion |
| A-07 | `customerSupport` | Customer Support | Callback form with slot, Call us |
| A-07a | `callUs` | Call Us | Phone numbers and hours, request callback |
| A-08 | `aboutUs` | About Us | Mission, how it works, legal links, contact |

---

## 8. Global

| ID | Route | Screen | Functionality |
| --- | --- | --- | --- |
| G-01 | `offline` | No Internet | Retry with spinner |
| G-02 | `forceUpdate` | Force Update | Update prompt |
| G-03 | `maintenance` | Maintenance | Maintenance notice |
| G-04 | `sessionExpiry` | Session Expiry | Log in |
| — | (any unknown) | Missing Screen | Fallback with Home |

---

## 9. Shared components

| Component | File | Used for |
| --- | --- | --- |
| `PropertyCard` | [PropertyCard.tsx](../src/components/PropertyCard.tsx) | Listing cards (full and compact) with favourite |
| `PropertyTypeGrid` | [PropertyTypeGrid.tsx](../src/components/PropertyTypeGrid.tsx) | 13-type picker for Buy and Sell |
| `JourneyLock` and journey parts | [components/journey/](../src/components/journey/) | Gate cards, tracker rows, buyer actions |
| `StatusHero`, `StatusMark` | [components/hero/](../src/components/hero/) | Success and failure hero headers |
| `BottomNav`, `Screen`, `AppScreen`, `Groups` | [components/layout/](../src/components/layout/) | Screen shells, tabs, inset groups and rows |
| `Btn`, `Field`, `Toggle`, `DualRange`, `Sheet`, `Toast`, `Timeline`, `DocCard`, `Skeleton` | [components/ui/](../src/components/ui/) | UI primitives |
| `Icon` | [components/icons/](../src/components/icons/) | SVG icon set |
| Theme tokens | [src/theme/](../src/theme/) | Colours, gradients, motion, radius, shadows, spacing, typography |

Haptics: `buzz()` in [Press.tsx](../src/components/ui/Press.tsx) fires on navigation gestures, gates, toggles and key actions.

---

## 10. State stores

| Store | File | Holds | Key functions |
| --- | --- | --- | --- |
| Journey | [journeyStore.ts](../src/context/journeyStore.ts) | Buy records, listings, compare, active ids, filters | `useJ`, `jEnquire`, `jScheduleVisit`, `jCompleteVisit`, `jAdvanceBuy`, `jCancelBuy`, `jAddListing`, `jSetListingStage`, `jToggleCompare`, `useBF`, `setBF`, `applyBF` |
| Sell | [sellStore.ts](../src/context/sellStore.ts) | In-progress listing form, negotiation | `sdSet`, `sdReset`, `sellSaveDraft`, `negoOf`, `jCounter`, `jAgree`, `jDeclineOffer`, `linkListing` |
| Drafts | [draftStore.ts](../src/context/draftStore.ts) | Saved drafts | `getDrafts`, `saveDraft`, `deleteDraft` |
| Session | [session.ts](../src/lib/session.ts) | Auth mode, name, token | — |
| Navigator | [RootNavigator.tsx](../src/navigation/RootNavigator.tsx) | Stack, favourites, guest flag, gate, coach marks | `go`, `back`, `jump`, `toggleFav`, `signIn` |

Components subscribe with `useJ()` / `useBF()`; time-based stage progress re-renders with `useTick()`.

---

## 11. Known gaps

| Gap | Impact |
| --- | --- |
| No persistence | All journeys, drafts and favourites reset on app restart |
| No live API | Every screen reads sample data; see [API_CALLS.md](API_CALLS.md) |
| Logout and delete do not clear state | Signing out keeps the previous user's journey in memory |
| Required permissions not enforced | User can finish setup with Camera and Location off |
| Location and user type not saved | S-06 choices are discarded |
| B-17 Cancel Enquiry does not cancel | Only the tracker's cancel sheet updates the record |
| B-16 Deal Complete does not complete | Completion is set from the tracker instead |
| SL-11 re-upload does not change stage | Re-verification is not tracked |
| Global screens not triggered | Offline, force update, maintenance and session expiry need wiring |
| Some deal screens not guest-gated | `myVisits`, `myDeals`, deal and payment screens rely on journey locks |
| IFSC check is length ≥ 6 | Real IFSC is 11 characters (`^[A-Z]{4}0[A-Z0-9]{6}$`) |
| Placeholder content | Advisor name, Sub-Registrar office, escrow details, NRI dates and visit base date are hard-coded |

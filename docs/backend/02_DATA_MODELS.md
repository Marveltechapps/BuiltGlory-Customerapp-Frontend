# BuiltGlory Customer App: Data Models and Enums

These are the shapes the app expects in the `data` field of responses. They come from `src/types/*.ts`.

- `?` means optional. The client tolerates a missing optional field.
- Fields without `?` should always be present.
- IDs are strings (Mongo `ObjectId` as a hex string). Dates are ISO-8601 strings unless marked `YYYY-MM-DD`.
- Money is in **INR rupees** (integer), not paise.

---

## 1. Enums (single source of truth)

| Enum | Values |
| --- | --- |
| `UserType` | `resident`, `nri`, `pio` |
| `CustomerRole` | `buyer`, `seller`, `both` |
| `KycStatus` | `not_submitted`, `pending`, `verified`, `rejected` |
| `NotificationChannel` | `sms`, `whatsapp`, `email`, `push`, `in_app` |
| `PropertyType` | `plot`, `apartment`, `residential`, `commercial`, `organic_home`, `3d_printing`, `fractional`, `ceo_mansion`, `holiday_home`, `land`, `farmhouse`, `nri`, `interior`, `villa` |
| `PropertyStatus` | `draft`, `available`, `reserved`, `under_construction`, `sold` |
| `BuyEnquiryStatus` | `new`, `responded`, `visit_scheduled`, `negotiating`, `closed` |
| `PreferredContact` | `phone`, `whatsapp`, `email` |
| `InterestType` | `schedule_visit`, `price_negotiation`, `more_details` |
| `PreferredVisitTime` | `tomorrow_morning`, `tomorrow_afternoon`, `this_weekend_morning`, `this_weekend_afternoon`, `custom` |
| `VisitStatus` | `scheduled`, `confirmed`, `completed`, `cancelled`, `missed`, `rescheduled` |
| `VisitType` | `physical`, `virtual` |
| `VirtualPlatform` | `zoom`, `google_meet`, `teams`, `whatsapp_video` |
| `SalesDealStage` | `active_leads`, `site_visits`, `negotiation`, `token_payment`, `full_payment`, `stage_payment`, `interior_design`, `documentation`, `closed`, `lost`, `re_engagement` |
| `PaymentStatus` | `created`, `pending`, `paid`, `failed`, `refunded`, `cancelled`, `rejected` |
| `PaymentMethod` | `bank`, `upi`, `cheque`, `cash` (plus `razorpay` in responses) |
| `PaymentType` | `token`, `full`, `stage`, `seller_payout`, `refund` |
| `SellRequestStatus` | `draft`, `new`, `under_review`, `accepted`, `approved`, `active`, `negotiating`, `paused`, `sold`, `rejected`, `changes_requested` |
| `SellDocumentStatus` | `uploaded`, `missing`, `pending`, `verified`, `rejected` |
| `AcquisitionStage` | `pending_review`, `site_inspection`, `valuation`, `negotiation`, `token_to_seller`, `documentation`, `seller_payout`, `acquired`, `rejected`, `on_hold` |
| `OfferStatus` (from the app's code) | `sent` (or any pending value), `seller_countered`, `seller_accepted`, `accepted`, `token_to_seller`, `documentation`, `seller_payout`, `acquired`, `expired` |
| `DocumentOwnerType` | `user`, `property`, `sell_request`, `acquisition`, `sales_deal`, `support_ticket`, `payment` |
| `DocumentPurpose` | `kyc`, `legal`, `property_media`, `payment_proof`, `support_attachment` |
| `ContentSection` | `home`, `onboarding`, `faq`, `legal`, `about`, `news`, `general`, `banner` |
| `CallbackSource` | `help_support`, `profile_support`, `property_detail`, `payment`, `interior` |
| `CallbackCategory` | `property_inquiry`, `pricing`, `technical_issue`, `complaint`, `general`, `stage_payment`, `interior` |
| `BestTime` | `morning`, `afternoon`, `evening` |
| `AccountDeletionStatus.status` | `none`, `requested`, `cancelled`, `completed` |

### UI property type ID → API `type`
The app uses its own IDs for property types in the UI. It maps them to the API value like this:

| UI id | API `type` | Label |
| --- | --- | --- |
| `plot` | `plot` | Plot |
| `apartment` | `apartment` | Apartment |
| `villa` | `villa` | Villa |
| `commercial` | `commercial` | Commercial |
| `land` | `land` | Land |
| `fractional` | `fractional` | Fractional |
| `3d-print` | `3d_printing` | 3D Print Home |
| `organic` | `organic_home` | Organic Home |
| `ceo-mansion` | `ceo_mansion` | CEO Mansion |
| `holiday` | `holiday_home` | Holiday Home |
| `farmhouse` | `farmhouse` | Farmhouse |
| `nri` | `nri` | NRI |
| `interior` | `interior` | Interior |

**Known issue:** a listing saved as `villa` with `specs.plotArea` came back as `type: "plot"`. **Do not change the `type` the client sends.**

### Amenity catalogue (labels sent as strings)
`Lift, Gym, Pool, Garden, Parking, Security, Power Backup, CCTV, Club House, Wifi, Solar, EV Charger, Servants, Lounge, Library, Play Area, Jogging Track, Pet Friendly, Fire Safety, Rainwater`.

Extra seller amenities: `Modular Kitchen, Marble flooring, Wooden flooring, AC, RO water, Geyser, Wardrobes, Balcony`.

Seller "feature" amenities (sent as strings in `amenities[]`): `Water source available, Electricity connection, Compound wall/fencing, Garden, Terrace, Borewell`.

Two encoded amenities also appear: `Zoning: <text>` and `Road access: <text>`.

### Cities (UI list)
`Ahmedabad, Bangalore, Chennai, Coimbatore, Delhi, Hyderabad, Jaipur, Kolkata, Mumbai, Pune, Surat, Thiruvananthapuram`.

---

## 2. User

```ts
User {
  _id: string; id?: string; referenceId: string;
  name?: string;                 // empty → app routes to Profile Setup after login
  mobileNumber?: string; phone?: string; phoneNormalized?: string;
  email?: string; isVerified?: boolean; isEmailVerified?: boolean;
  userType: UserType;            // default 'resident'
  role: CustomerRole;            // default 'buyer'
  profilePhoto?: string;         // URL
  city?: string; state?: string; country?: string; latitude?: number; longitude?: number;
  bankDetails?: {
    accountHolderName: string; bankName: string;
    accountNumberLast4: string;  // ONLY last 4 digits are ever sent/stored from app
    ifsc: string; branch?: string|null; upiId?: string|null; updatedAt?: string;
  };
  kycStatus?: KycStatus;
  notificationPreferences?: { [channel in NotificationChannel]?: { transactional?: boolean; marketing?: boolean } };
  accountDeletion?: AccountDeletionStatus;
  totalEnquiries?: number; totalVisits?: number; totalDeals?: number; totalListings?: number;
  profileComplete?: boolean;     // virtual
  createdAt?: string;
}

AccountDeletionStatus {
  status: 'none'|'requested'|'cancelled'|'completed';
  verificationStatus?: 'not_started'|'pending'|'verified'|'failed';
  reason?: string|null; requestedAt?: string; scheduledDeletionAt?: string; cancelledAt?: string;
}
```

---

## 3. Property

```ts
Property {
  _id: string; referenceId: string; title: string; description?: string;
  type: PropertyType; status: PropertyStatus;
  isFeatured?: boolean; isUpcoming?: boolean; isVisibleOnApp?: boolean;
  address?: { line1?, line2?, locality?, city?, state?, pincode?, landmark?, latitude?: number, longitude?: number };
  price: number; isNegotiable?: boolean;
  specs?: Record<string, unknown>;   // see "specs keys read by the app"
  amenities?: string[];
  media?: { photos?: string[]; coverPhoto?: string; videoUrl?: string; droneImageUrl?: string; tour3dUrl?: string; floorPlanUrl?: string };
  advantages?: { investment?: string[]; location?: string[]; connectivity?: string[] };
  nearbyPlaces?: Array<{ name?: string; type?: string; distance?: string }>;
  highlights?: string[];
  metrics?: { savedCount?: number; views?: number; enquiries?: number; visits?: number };
  savedByUsers?: string[];
  launchDate?: string; possessionDate?: string; soldAt?: string;
  createdAt?: string; updatedAt?: string;
}
```

**`specs` keys the app reads:**
`builtUpArea`, `carpetArea`, `plotArea`, `area`, `totalArea` (number or numeric string), `bhk` (`"3"`, `"5+"`, `"Studio"`), `floor`, `totalFloors` / `floors`, `age` / `propertyAge`, `facing`, `furnishing` / `furnish`.

**`nearbyPlaces[].type` values that get an icon:**
`school, college, education, hospital, health, metro, transport, railway, bus, airport, mall, shopping, market`.

**What the client derives:**
- `area` = first of builtUpArea, carpetArea, plotArea, area, totalArea that has a value
- `pricePerSqft` = `price / area`
- `verified` = `status === 'available'`
- Images = `coverPhoto` first, then `photos` without it

---

## 4. Buy enquiry, Deal and Visit

```ts
BuyEnquiry {
  _id; referenceId; buyerId; propertyId;
  propertySnapshot?: { title?, price?, type?: PropertyType, location? };
  enquiryTypes?: InterestType[]; preferredContact: PreferredContact; interestType: InterestType;
  preferredVisitTime?: PreferredVisitTime|null; preferredVisitDate?: string|null; preferredVisitTimeSlot?: string|null;
  additionalMessage?: string|null;
  status: BuyEnquiryStatus;
  customerStage?: string|null; customerStageLabel?: string|null;  // label shown as the card's status note
  visits?: Visit[];            // MUST be embedded in /me/buy-enquiries responses
  deal?: Deal|null;            // MUST be embedded
  submittedAt?; createdAt?; updatedAt?;
}

Deal {   // sales deal, embedded in the enquiry
  _id; referenceId; stage: SalesDealStage; buyerId; propertyId;
  propertySnapshot?: { title?, price?, type?, location? };
  financials?: { offeredPrice?, agreedPrice?, tokenAmount?, tokenPaid?: boolean, totalPaid?, paymentType?: 'full'|'stage'|null };
  documentation?: {
    documents?: DealDocumentItem[];
    customDocs?: DealDocumentItem[];
    registration?: { registrationDate?, registrationOffice?, subRegistrarName?, stampDuty?: number, registrationFee?: number, notes? };
    [k: string]: unknown;
  };
  stageHistory?: Array<{ from, to, changedAt, notes? }>;
  closedAt?; createdAt?;
}

DealDocumentItem { id; name; required?: boolean; files: DealDocumentFile[]; sentToBuyerAt?: string|null }
DealDocumentFile { id; fileName; uploadedAt; status; notes: string|null; url: string|null; description? }

Visit {
  _id; referenceId; buyerId; propertyId; enquiryId?;
  visitDate: string;            // 'YYYY-MM-DD' or ISO; client reads date part
  visitTime?: string;           // e.g. '10:00 AM' (same string as availability slot)
  visitType: VisitType; virtualPlatform?: VirtualPlatform|null; meetingLink?: string;
  status: VisitStatus; assignedAdmin?: string|null; rescheduleCount?: number; cancelReason?: string;
  feedback?: { buyerInterest?: string|null; notes?: string; nextAction?: string|null };
  createdAt?;
}
```

---

## 5. Payment

```ts
Payment {
  _id; referenceId; dealId?; propertyId?;
  type: 'token'|'full'|'stage'|'seller_payout'|'refund';
  amount: number; status: PaymentStatus; method: PaymentMethod|'razorpay';
  failureReason?: string; verificationNotes?: string; createdAt: string;
}
```

---

## 6. Sell request, Acquisition and Seller activity

```ts
SellRequestPayload {            // body for drafts / PATCH
  propertyType?: string;        // API PropertyType
  propertyTitle?: string;
  askingPrice?: number;         // omitted when 0/empty
  negotiable?: boolean;
  address?: { street?, locality?, city?, state?, pincode?, landmark?, latitude?, longitude? };   // all nullable strings
  specifications?: SellSpecifications;
  amenities?: string[];
  ownershipType?: string|null;  // 'Freehold' | 'Leasehold' | ...
  possessionStatus?: string|null;
  description?: string|null;
  photos?: string[];            // URLs from POST /documents
  documents?: SellDocument[];
  draftStep?: number;           // wizard step 1..7 (7 = submit)
}

SellSpecifications {            // ONLY these keys; strip unknown keys
  subType?, title?, bhk?: string;
  builtUpArea?, plotArea?, area?, totalArea?, carpetArea?: number;
  floor?: string|number; totalFloors?: number; unitNo?: string;
  age?: string;                 // app sends '0–1 year' | '1–5 years' | '5–10 years' | '10+ years' | 'Under Construction'
                                // app also understands legacy 'New' | '1-5y' | '5-10y' | '10+y' on read
  facing?, furnishing?, furnishDetails?: string;
  parking?: number; parkingType?: string;
}

SellDocument { documentId?: string; name: string; status: SellDocumentStatus; fileUrl?: string; scanStatus?: string }

SellRequest extends SellRequestPayload {
  _id; referenceId; sellerId; status: SellRequestStatus; isDraft?: boolean;
  photosCount?; documentsCount?; completenessPercent?: number;
  rejectionReason?: string; pauseReason?: string; changeRequests?: string[];
  metrics?: { views?, enquiryCount?, visitCount?, saveCount? };
  sale?: { salePrice?, saleDate?, buyerName? };
  submittedAt?; draftSavedAt?; createdAt?; updatedAt?;
}

Acquisition {
  _id; referenceId?; stage: AcquisitionStage; agreedPrice?: number;
  negotiation?: object; documentation?: object /* termSheetUrl | termSheet{url} */;
  token?: { amount?, paid?: boolean }; payout?: { completed?: boolean };
  stageHistory?: Array<{ from, to, changedAt, notes? }>;   // client reads changedAt for step timestamps
  createdAt?; updatedAt?;
}

SellerOffer { amount: number; status: string; expiresAt: string|null; counterAmount: number|null; notes: string|null }
SellerEnquiry { _id; referenceId; buyerSnapshot?: { name?, phone?, email?, userType? }; interestType; preferredContact; preferredVisitDate?; preferredVisitTimeSlot?; status; submittedAt? }
SellerVisit { _id; referenceId; buyerId; visitDate; visitTime?; visitType; status; rescheduleCount? }
SellerMessage { threadId?; logId?; sender: string /* 'seller' = own */; type: string; text?; offerAmount?; offerStatus?; createdAt? }
PayoutScheduleItem { key; label; amount: number; dueLabel: string; status: string }

SellerActivity {
  sellRequest: SellRequest; acquisition: Acquisition|null;
  property: { _id; title?; status? }|null; offer: SellerOffer|null;
  enquiries: SellerEnquiry[]; visits: SellerVisit[];
  chatThreads: Array<{ _id; referenceId; status; lastMessageAt?; messageCount: number }>;
  messages: SellerMessage[]; payoutSchedule: PayoutScheduleItem[];
  registration: { appointment: unknown; status: string; checklist: string[] };
  metrics: { enquiryCount: number; visitCount: number; chatCount: number; payoutCount: number };
}

ValuationEstimate {
  sellRequestId; source: 'comparables'|'baseline'; confidence: 'high'|'medium'|'low'|'baseline';
  estimatedPrice; low; high; pricePerSqft; area; comparableCount; basis: string;
  askingPriceDeltaPercent: number|null;
  comparables: Array<{ _id; title; price; status; locality?; city?; area; pricePerSqft }>;
}
```

---

## 7. Documents, notifications, content and support

```ts
UploadedDocument { _id; referenceId; ownerType; ownerId; purpose; documentType?; fileName?; mimeType?; sizeBytes?; url?: string /* required in practice */; status; scanStatus? }
DocumentReadUrl  { documentId; readUrl; expiresInSeconds }

AppNotification {
  _id; referenceId; event; channel; title?; message?; notificationType?; screen?;
  entityId?; entityType?;  // 'enquiry' | 'sell_request' | 'property' | 'visit' | 'deal' | 'payment'
  listingId?; enquiryId?; propertyId?; dealId?; image?;
  isRead?: boolean; readAt?: string; createdAt: string;
}

ContentItem { _id; slug; section: ContentSection; title; excerpt?; body; category?; imageUrl?; cta?: { label?, target? }; tags?: string[]; order?: number; metadata?: object; publishedAt? }

Callback { _id; referenceId; status; bestTimePreference?; slaDeadline? }
```

---

## 8. Suggested collections (backend)

| Collection | Key relations |
| --- | --- |
| `users` | — |
| `refresh_tokens` / `sessions` | userId, deviceId, rotated chain, revokedAt |
| `otp_requests` | phone, deviceId, purpose, codeHash, attempts, expiresAt, canResendAt |
| `properties` | savedByUsers[] → users |
| `buy_enquiries` | buyerId → users, propertyId → properties |
| `visits` | buyerId, propertyId, enquiryId |
| `sales_deals` | buyerId, propertyId, enquiryId (embedded into the enquiry response) |
| `payments` | dealId, propertyId, userId, idempotencyKey (unique) |
| `sell_requests` | sellerId → users |
| `acquisitions` | sellRequestId, offer, payout, registration |
| `chat_threads` / `messages` | sellRequestId |
| `documents` | ownerType + ownerId |
| `notifications` | userId, archivedAt |
| `searches` | userId, term, resultCount, createdAt (also feeds trending) |
| `content` | slug (unique), section, category, publishedAt |
| `callbacks`, `feedback` | userId |
| `app_config` | singleton |

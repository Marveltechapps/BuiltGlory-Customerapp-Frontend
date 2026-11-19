# Screen → API mapping

All paths are relative to `API_BASE_URL` (`…/api/v1`). Every request sends `x-device-id`; signed-in
requests send `Authorization: Bearer <accessToken>`. A `401` on any non-`/auth` call triggers one shared
`POST /auth/refresh` (rotating refresh token) and a retry; a rejected refresh ends the session (G-04).

## App-wide

| Where | Endpoints |
| --- | --- |
| AppConfigContext (Splash, G-02/G-03, payment, support) | `GET /app/config` |
| AuthContext | `GET /me` (bootstrap), `PATCH /me` (saveProfile), `POST /auth/logout` |
| FavoritesContext (hearts everywhere, B-14) | `GET /me/favorites`, `POST /properties/:id/save`, `DELETE /properties/:id/save` |
| SellFlowContext (SL-01 … SL-07) | `POST /sell-requests/drafts`, `PATCH /me/sell-requests/:id`, `POST /documents` (photos), `PATCH /me` (`role: both` before first submission), `POST /me/sell-requests/:id/submit` |
| API client | `POST /auth/refresh` |

## Auth & onboarding

| Screen | Endpoints |
| --- | --- |
| S-01 Splash | `GET /app/config`, `GET /me` |
| S-03 Login | `POST /auth/customer/otp/send` (`purpose: login`) |
| S-04 OTP | `POST /auth/customer/otp/verify`, resend → `POST /auth/customer/otp/send` |
| S-05 Create profile | `PATCH /me`, `POST /documents` (profile photo) |
| S-06 Location + type | `PATCH /me` (`city`, `userType`) |
| S-07 Terms / P-12 Terms of use | `GET /content/:slug` (`terms-of-service`, `privacy-policy`), `PATCH /me` (`notificationPreferences` marketing) |
| S-02, S-08 | none (device only) |

## Home

| Screen | Endpoints |
| --- | --- |
| H-01 Home | `GET /properties` (`featured`, `upcoming`, verified count), `GET /me/notifications/unread-count` |
| H-02 Search | `GET /properties?search=`, `GET /search/trending`, `GET/POST/DELETE /me/searches` |
| H-03 Featured, H-04 Upcoming | `GET /properties?featured=true` / `?upcoming=true` |
| H-05 Help & support | `GET /content?section=faq`, `POST /callbacks`, `POST /feedback` |

## Buy

| Screen | Endpoints |
| --- | --- |
| B-02 Filter (live count), B-03 Results, B-17 Map, Compare | `GET /properties` |
| B-04 Property detail (+ B-05…B-09, B-04a from the same record) | `GET /properties/:id` |
| B-10 Enquiry | `POST /buy-enquiries` |
| B-12 Schedule visit | `GET /visits/availability`, `POST /buy-enquiries` (custom slot), `POST /visits` |
| B-12a Reschedule | `GET /visits/availability`, `PATCH /visits/:id/reschedule` |
| B-13a NRI video call | `GET /visits/availability?visitType=virtual`, `POST /visits` (`visitType: virtual`) |
| B-14 Documents shared, B-16 Registration | `GET /me/buy-enquiries/:id` (`deal.documentation`) |
| B-15 Token payment | `GET /me/buy-enquiries/:id`, `GET /me/payments?dealId&type=token`, `POST /payments/token` |
| B-17 Cancel | `PATCH /me/buy-enquiries/:id/cancel` or `PATCH /visits/:id/cancel` (with reason) |
| P-11 Document viewer | `GET /documents/:id/read-url` (private files) |

## Sell

| Screen | Endpoints |
| --- | --- |
| SL-03 Property type | `GET /properties?recentlySold=true` |
| SL-07 Expected price | `POST /me/sell-requests/:id/valuation-estimate` |
| SL-09 Edit listing | `GET /me/sell-requests/:id`, `PATCH /me/sell-requests/:id` |
| SL-10, SL-12, SL-15, SL-16, SL-17, P-05, seller enquiries/visits/chat | `GET /me/sell-requests/:id/activity` |
| SL-11 Re-upload | `POST /documents`, `PATCH /me/sell-requests/:id` (`documents`), `POST /me/sell-requests/:id/submit` |
| SL-12 Offer | `POST /me/sell-requests/:id/valuation-estimate` (area average) |
| SL-13 Accept / negotiate, SL-14 Confirm deal | `POST /me/sell-requests/:id/offer-decision` |
| SL-14 Bank details | `PATCH /me` (`bankDetails`, last 4 digits only) |
| Seller visits | `POST /me/sell-requests/:id/visits/:visitId/action` (`confirm` / `reschedule`) |
| Negotiation chat | `POST /me/sell-requests/:id/messages` (+ activity polling every 15 s) |
| SL-18 Rejected | `GET /me/sell-requests/:id` |

## Profile & settings

| Screen | Endpoints |
| --- | --- |
| P-01 Profile | `GET /me/buy-enquiries`, `GET /me/sell-requests`, `GET /me/notifications/unread-count` |
| P-02 Edit profile | `PATCH /me`, `POST /documents` |
| P-03 Change phone | `POST /auth/customer/otp/send` + `/verify` (`purpose: change_phone`), `PATCH /me` (`mobileNumber`) |
| P-04 My listings | `GET /me/sell-requests` |
| P-04a My visits, P-07 My enquiries | `GET /me/buy-enquiries` (visits embedded) |
| P-04b My deals | `GET /me/buy-enquiries` (`deal`), `GET /me/sell-requests` |
| P-08 Enquiry detail | `GET /me/buy-enquiries/:id`, `GET /properties/:id` (404 → B-18) |
| P-10 Notifications | `GET /me/notifications`, `PATCH /me/notifications/read`, `PATCH /me/notifications/:id/read`, `DELETE /me/notifications/:id` |
| Offers | `GET /content?section=banner`, `POST /callbacks` (claim) |
| News & insights | `GET /content?section=news` |
| Help & feedback | `GET /content?section=faq`, `POST /feedback` |
| A-02 Notification settings | `PATCH /me` (`notificationPreferences.push/in_app`) |
| A-04a Delete account | `GET/POST/DELETE /me/account-deletion` |
| A-05/A-06 FAQs | `GET /content?section=faq` |
| A-07 Customer support | `POST /callbacks` (`source: profile_support`) |
| A-07a Call us | `GET /app/config` (support phone) |
| A-08 About us | `GET /content/about-builtglory`, `GET /app/config` |

## UI features the API cannot back (handled as noted)

| Reference feature | API situation | What the app does |
| --- | --- | --- |
| Change password (A-04) | Customers sign in with OTP; no password exists | Explains OTP sign-in, links to Change Phone |
| Delete listing (SL-18) | No customer delete endpoint for sell requests | Sends the user to Customer Support |
| Seller "Your availability" chips | No seller-availability endpoint | Stored on the device only |
| Seller declines a visit | Visit action supports only `confirm` / `reschedule` | ✗ proposes another time (`reschedule`) |
| Per-category notification toggles | Preferences exist per channel (`transactional` / `marketing`) | 4 update rows share push + in-app `transactional`; seminars map to `marketing` |
| App language / dark mode / GPS (A-03) | No fields in the API; no translations or geolocation service | Stored on the device; copy says so |
| Live chat | `/me/support/live-chat` exists but the reference has no chat UI | Reference toast ("coming soon") |
| NRI video call language | `POST /visits` has no language field | Shown on the confirmation only |
| Advisor name, buyer names/ratings | Not returned to customers | Shows "Assigned / To be assigned", reference IDs |
| "Use current" location (SL-02) | No geocoding endpoint | Fills the city saved on the profile |
| Term sheet / sale deed files | Only present if the team attaches them to the acquisition / documents | Row disabled until a file URL exists |
| PDF rendering | No PDF renderer dependency in the architecture | Images render inline; PDFs open in the device viewer |
| Push notifications | `PUT /me/push-token` exists, but no FCM/APNs project config was provided | Not registered |
| Production API URL | Not provided | `src/api/config.ts` uses the local dev server |

## Observations from the end-to-end run (local backend, test data)

- A listing created as `type: "villa"` with a `specs.plotArea` came back from the API as `type: "plot"`; the app shows
  the type the API returns.
- No brand app icon or launch artwork was supplied with the design reference, so the native projects still use the
  React Native template launcher icon.

# NeighbourLink — Detailed Functional Documentation

Version: 1.0
Date: 2025-08-23

This document explains the NeighbourLink project's functionality in detail. It covers user-facing features, system components, data models, integrations, operational concerns, developer notes, and recommended next steps. Use this as a single reference for product, developer, and operations teams.

## Table of Contents

- Project overview
- High-level features (user-facing)
- Functional components and responsibilities
- Data models and Firestore collections
- Important frontend modules and pages
- Messaging and notification flows (detailed)
- Authentication and verification
- Geolocation and mapping
- Resource sharing and posts
- Events, business promotions and community updates
- Volunteer & skill-exchange flows
- Push notifications and offline behavior
- Third-party integrations
- Environment variables and configuration
- Development setup and scripts
- Testing and quality gates
- Deployment and hosting notes
- Security, privacy and compliance
- Operational runbook / monitoring
- Known gaps, assumptions, and recommended next steps

---

## Project overview

NeighbourLink is a hyperlocal community platform for connecting neighbours to share resources, request help, organize events, promote local businesses, and coordinate volunteers. The front end is a React + Vite single-page web app using Tailwind for styling. Firebase provides authentication, Firestore for data, Realtime Database where needed, and Firebase Cloud Messaging (FCM) for push notifications. AWS S3 (or the AWS SDK) is used for media storage. The project emphasizes proximity-based discovery (115 km), emergency alerting, privacy-preserving communication, and local-language support.

Source layout (high-level):
- `src/` — React app source
- `src/components` — UI components (landing, messaging, maps, updates, posts)
- `src/services` — business logic services (messagingService, addressManager, pandelService, etc.)
- `src/contexts` — React contexts (StateContext, ThemeContext, MobileContext)
- `functions/` — cloud functions (Firebase Functions) used for server-side jobs
- `public/` — public assets and service worker
- `docs/` — documentation (this file will be placed here)

## High-level features (user-facing)

1. User authentication and profile management (email sign-up, profile editing).
2. Optional identity verification for "Trusted Neighbor" badges.
3. Resource sharing: create offers/requests with categories, images, availability and urgency.
4. Emergency alerts: prioritized broadcast to nearby users.
5. In-app encrypted chat per post or conversation with message history and read/unread tracking.
6. Event creation, RSVP, calendar view and reminders.
7. Business promotion posts with optional paid features and verification.
8. Community updates: report local issues, post construction updates, and track statuses.
9. Skill exchange: list skills on profile, search for skills, request services.
10. Volunteer management: register volunteers and provide direct communication channels.
11. Multi-language support and message translation support.
12. Location-based discovery and meeting point suggestions.
13. Push notifications and in-app notification center.

---

## Functional components and responsibilities

- Frontend (React + Vite): UI rendering, client-side routing, contexts, local state, form validation, file uploads, map UI, and offline behavior.
- Firebase: Authentication (Auth), Firestore (primary data store), Realtime Database (real-time requirements where used), Cloud Messaging (push), Functions (server-side triggers), Storage for files (optionally, Firebase Storage or S3 via signed URLs).
- AWS S3: Media storage for uploaded images/videos (project uses AWS SDK libs in package.json).
- Cloud functions: sending push notifications, background processing (e.g., generate thumbnails, moderate content, schedule reminders).
- External APIs: Map provider (OLA maps referenced in SRS), Google Cloud translation (for multi-language support), possibly SMS gateway for critical alerts.

## Data models and Firestore collections

Based on code and SRS, key collections and fields:

- `Users` (collection)
  - id
  - email
  - displayName
  - avatarUrl
  - verified (boolean)
  - verifiedDocument (URL / metadata)
  - location (lat, lng, address)
  - radiusPreference (number)
  - languages (array)
  - skills (array)
  - createdAt, updatedAt

- `posts` / `Resources` (collection)
  - id
  - title
  - description
  - category (Medical, Tools, Books, Business, Event, Update)
  - type (offer | request | emergency)
  - images (array of URLs)
  - ownerId
  - location { lat, lng }
  - radius (km)
  - urgencyLevel
  - availability { from, to }
  - createdAt, updatedAt, status

- `conversations` (collection) — see `src/services/messagingService.ts`
  - participants (array of user ids)
  - postId (optional)
  - postTitle, postImageUrl (optional)
  - lastMessage { text, senderId, timestamp }
  - unreadCount { userId: number }
  - createdAt, updatedAt

- `messages` (collection)
  - conversationId
  - senderId
  - text
  - mediaUrls
  - read (boolean)
  - createdAt

- `notifications` (could be a collection or function-driven push)
  - userId
  - title
  - description
  - link (action_url)
  - read
  - createdAt

- `events` (collection)
  - title, description, location, time, rsvpList, capacity

- `reports` or `issues` (collection)
  - reportedBy, type, description, photos, status, comments, createdAt

Note: Firestore document timestamps generally use serverTimestamp() for consistency.

## Important frontend modules and pages

- `src/main.tsx` — app bootstrapping, providers (StateProvider, ThemeProvider, MobileProvider), root router `PlayGround`.
- `src/firebase.ts` — initializes Firebase services and exposes `auth`, `db`, `realtimeDB`, and `initializeMessaging()` helper. It reads Firebase config from environment variables.
- `src/services/messagingService.ts` — core client-side messaging API wrapping Firestore queries, real-time listeners, create conversation, send messages, mark read, and helper functions for conversation retrieval.
- `src/components` — contains UI building blocks. Important subfolders: `messaging/`, `maps/`, `update/` (for community updates), `PostCard/`, `ProfileCard/`.
- `router/` — contains route definitions for authenticated and guest screens.

## Messaging and notification flows (detailed)

Messaging (client-side flow):
1. `getOrCreateConversationWithUser(currentUserId, otherUserId, postId?)` — checks for existing post-specific or general conversations and creates one if not found.
2. `createConversation(participants, postId?)` — creates a conversation document, initialized unread counters and timestamps.
3. `sendMessage(conversationId, senderId, text, mediaUrls)` — adds a `messages` document, increments unread counts for other participants, updates the conversation `lastMessage`, and calls `addNotification()` helper to create a user-level notification (and/or trigger server-side push via function).
4. `getMessages(conversationId, callback)` — sets up a Firestore `onSnapshot` to stream messages in ascending order by `createdAt`.
5. `markConversationAsRead(conversationId, userId)` — resets user unread counter in conversation and marks other users' unread messages as read.

Notifications:
- In-app notifications are created by client calls to `addNotification` (utility in utils) and by cloud functions for events like emergency broadcasts or promotion expirations.
- Push notifications are delivered via Firebase Cloud Messaging (FCM). The app initializes FCM with `initializeMessaging()` from `src/firebase.ts` when supported.
- Emergency broadcasts should run a server-side function to select affected users within radius and call FCM to send push + create `notifications` entries.

Edge cases handled by messagingService:
- Ensures conversation exists before sending messages.
- Uses `serverTimestamp()` to keep ordering consistent.
- Prevents incrementing unread count for sender.
- Searches for existing conversations for the post or between users to avoid duplicates.

## Authentication and verification

- Auth: Email/password via Firebase Auth. The UI offers create/login flows.
- Verification: Optional flow where users upload government-issued ID. Verified status and verification artifacts stored on user document (or a dedicated `verifications` collection) with admin review workflow (through functions or a dashboard). Verification badge can impact business features (verified business) and trust signals.

Security notes:
- Sensitive verification images should be stored in private storage with limited access and only share metadata in Firestore.
- Verification process should include expiration or re-verification flows.

## Geolocation and mapping

- The system supports both automatic location via browser geolocation and manual address entry.
- Each post optionally attaches coordinates; search uses distance calculations to filter posts within user radius.
- Meeting points: chat UI supports suggesting meeting points that convert into map coordinates and sendable links.
- Integration with a map provider (OLA maps documented in SRS) — for routing, location pickers, and meeting suggestions.

Implementation tasks for mapping:
- Use a geospatial index strategy (geohashes or client-side filtering using Haversine formula) for small neighborhoods. For scale, consider a geospatial index in Firestore via third-party libs.

## Resource sharing and posts

Posts include offers, requests and emergency posts. Key behaviors:
- Post form: title, description, category, location, images, availability, urgency.
- Emergency posts: flagged and routed to a server-side function to trigger immediate alerts to users nearby.
- Search & filters: by category, keyword, distance, availability. Feed sorted by recency and proximity.
- Post lifecycle: draft -> published -> expired -> archived. Business promotions may include durations and paid tiers.
- Commenting and updates: posts can have update threads or comments for status updates.

## Events, business promotions and community updates

Events:
- Event creation with time, location, description and RSVP support.
- Calendar view and reminders set by client or server-scheduled notifications.

Business promotions:
- Businesses create promotion posts. Paid tiers may be handled using a payment provider and a promotions collection for scheduling and tracking.
- Verified businesses receive badges.

Community updates:
- Reporting issues flow supports photos, categorization, comments, and status tracking (New, In Progress, Resolved).

## Volunteer & skill-exchange flows

- Volunteers register and indicate available skills and time slots.
- Volunteer coordination includes special broadcast channels or volunteer-only conversations.
- Skill-exchange: users add skills to profile; search by skill returns profiles and direct conversation options.

## Push notifications and offline behavior

- FCM registration is initialized in `src/firebase.ts` using `initializeMessaging()` if the browser supports it.
- Service worker (`public/firebase-messaging-sw.js`) handles background notification display and click behaviors.
- Offline: Firestore's offline persistence (if enabled) helps viewing cached data; operations should gracefully indicate offline status and queue writes for later.

## Third-party integrations

- Firebase (Auth, Firestore, Realtime DB, Messaging, Functions)
- AWS S3 (media storage) — clients or functions can upload using pre-signed URLs.
- Google Cloud Translation API (message/post translation)
- Map provider (OLA maps mentioned; consider Mapbox or Google Maps depending on API access)
- Payment provider (Stripe / Razorpay) for paid promotions (not yet included in repo but part of SRS)

## Environment variables and configuration

The project reads Firebase config from Vite environment variables. Important variables (in `.env` or hosting config):

- VITE_FB_API_KEY
- VITE_FB_AUTH_DOMAIN
- VITE_FB_PROJECT_ID
- VITE_FB_STORAGE_BUCKET
- VITE_FB_MESSAGING_SENDER_ID
- VITE_FB_APP_ID
- VITE_FB_APP_MEASUREMENT_ID (optional)
- AWS credentials (for server-side use only): AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET
- GOOGLE_TRANSLATION_API_KEY
- OLA_MAPS_API_KEY (or alternate map provider key)

Security: Do not embed sensitive keys in client code. Use server-side functions or signed URL flows for privileged operations.

## Development setup and scripts

From the repo root:
- Install dependencies: `npm install` (or `pnpm`/`yarn` depending on team choice).
- Start dev server: `npm run dev` — launches Vite dev server.
- Build: `npm run build` — compiles TypeScript and bundles app.
- Lint: `npm run lint` — runs ESLint.
- Deploy helper: `npm run deploy` — runs `deploy.js` (project-specific script).

Quick local steps:
1. Create `.env` with required VITE_FB_* entries.
2. Ensure `public/firebase-messaging-sw.js` is present for FCM.
3. Start: `npm run dev` and open http://localhost:5173 (Vite default) or as configured.

## Testing and quality gates

- Unit tests: add unit tests with Jest or Vitest for core services (`src/services/*`) — especially messaging and resource filtering logic.
- Integration tests: test Firestore rules and cloud function behaviors in Firebase emulator.
- Linting: ESLint configured; run `npm run lint`.
- Type checking: project uses TypeScript — ensure `npm run build` passes.

Suggested minimal test cases:
- MessagingService: createConversation -> sendMessage -> getMessages -> markConversationAsRead.
- Post filter: create several posts with different locations, verify distance-based filtering.
- Emergency broadcast: simulate emergency post and assert notifications are queued for users within radius (use Firebase emulator).

## Deployment and hosting notes

- Frontend: deploy to static hosting (Vercel, Netlify, Firebase Hosting, or AWS Amplify). `vite build` produces production bundle.
- Backend: Firebase Functions for notifications & scheduled tasks. Use Firebase emulator suite for local testing.
- Storage: use either Firebase Storage or AWS S3 for media. If S3 is used, generate pre-signed upload URLs via server functions.
- CI/CD: add pipeline for build, test, lint and deploy. Ensure environment values are provided securely by the hosting provider.

## Security, privacy and compliance

- Sensitive data (IDs) should not be stored in public Firestore documents; keep verification files private in storage.
- Use Firestore security rules to ensure writes/reads limited to authorized users and validate data shapes.
- Use HTTPS and FCM tokens securely. Rotate keys and restrict service accounts.
- For ID verification, ensure retention policies and data deletion flows comply with local regulations (GDPR-like requirements where applicable).

## Operational runbook / monitoring

- Logs: Cloud Functions should log important events (emergency broadcasts, failed pushes).
- Alerts: Monitor failed push counts, function errors, and storage error rates.
- Backups: Export Firestore daily or enable managed backups.
- Performance: Monitor Firestore read/write throughput and index usage; add indexes for heavy queries.

## Known gaps, assumptions, and recommended next steps

Assumptions made while drafting this doc:
- Firebase is the primary backend; AWS S3 is used for media.
- Map provider can be switched; SRS references OLA maps but code doesn't show a provider-specific client.
- Payment flow for promotions is not implemented yet.

Recommended next steps (priority order):
1. Implement server-side emergency broadcast function (cloud function) that selects users by radius and calls FCM. Add tests using emulator.
2. Add Firestore security rules and unit tests for data validation.
3. Implement pre-signed S3 upload flow via Functions for secure media uploads and remove client secrets from the browser.
4. Add automated tests (Vitest) for `messagingService` and `addressManager`.
5. Add documentation for the admin process of verifying IDs and promoting businesses.
6. Add analytics events and dashboards to monitor promotions, emergency alerts, and message volumes.

---

## Appendix: Developer reference snippets

- Firestore server timestamps: use `serverTimestamp()` when creating/updating documents to avoid clock skew.
- Example messaging lifecycle (client):
  1. call `getOrCreateConversationWithUser` to get conversationId
  2. call `sendMessage(conversationId, senderId, text, mediaUrls)`
  3. listen via `getMessages(conversationId, cb)`

- Environment variables must be prefixed with `VITE_` to be available to client-side Vite code.

---

## Requirements coverage checklist

- Generate detailed documentation about project: Done — file created in `docs/DETAILED_FUNCTIONAL_DOCUMENTATION.md`.
- Focus on explaining functionalities: Done — core features, messaging, posts, events, business, volunteer, mapping, notifications, and more are described.
- Cover each point (SRS-based): Done — this doc expands the SRS with implementation notes and developer guidance.

---

## Completion summary

Created the detailed functional documentation and saved it to `docs/DETAILED_FUNCTIONAL_DOCUMENTATION.md`. This file explains features, architecture, data models, key frontend files, messaging flows, environment variables, and recommended next steps. Verify the doc, request additions (APIs, sequence diagrams or ERD) if needed, and I will extend it.

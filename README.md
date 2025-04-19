# Software Requirements Specification (SRS) for NeighbourLink (Neighborhood Focus)

**Version:** 1.0  
**Date:** April 18, 2025

## 1. Introduction

### 1.1 Purpose
NeighbourLink is a hyperlocal platform connecting neighbors to share resources (e.g., tools, medical equipment) and provide urgent assistance within their immediate community.

### 1.2 Scope
- **Target Users:** Residents within a defined neighborhood (1–5 km radius).
- **Key Features:**
  - Post and search for resources.
  - Emergency alerts for critical needs.
  - Trust-building tools (ratings, verification).
  - Secure in-app communication.

### 1.3 Out of Scope (Future)
- School/college or workplace-specific hubs.
- Event-based temporary communities.

## 2. Overall Description

### 2.1 User Needs
- Quickly locate nearby resources during emergencies (e.g., oxygen cylinders).
- Share underutilized items (e.g., tools, books) with trusted neighbors.
- Maintain privacy while requesting/receiving help.

### 2.2 System Features

#### Core Features:
1. **User Authentication & Verification**
   - Sign-up via phone/email.
   - Optional ID verification for "Trusted Neighbor" badges.

2. **Resource Posting & Search**
   - Post requests/offers with categories (Medical, Tools, Books).
   - Filter by distance (1–5 km), urgency, or keyword.

3. **Emergency Alerts**
   - Priority notifications for critical needs (e.g., "Blood donor needed").
   - Broadcast alerts via SMS/push to all users within 2 km.

4. **In-App Communication**
   - Encrypted chat (no phone number sharing).
   - Photo uploads for item verification.

5. **Trust & Safety**
   - User ratings after exchanges.
   - Report/block suspicious users.
   - Anonymous posting for sensitive requests.

## 3. Functional Requirements

### 3.1 User Management
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR1 | Registration | Sign up via phone/email. |
| FR2 | Verification | Optional ID scan for "Trusted Neighbor" badge. |

### 3.2 Resource Sharing
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR3 | Post Creation | Users can post requests/offers with photos, categories, and urgency levels. |
| FR4 | Search & Filter | Search by keyword, category, or distance (1–5 km). |
| FR5 | Emergency Broadcast | Critical posts trigger SMS + push alerts to users within 2 km. |

### 3.3 Communication
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR6 | In-App Chat | Encrypted messaging between users. |
| FR7 | Notifications | Push/SMS alerts for matches or messages. |

### 3.4 Administration
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR8 | Moderation | Admins can remove posts, suspend users, or resolve reports. |
| FR9 | Dashboard | View neighborhood activity (e.g., most-requested items). |

## 4. Non-Functional Requirements
| **Category** | **Requirement** |
|--------------|-----------------|
| **Performance** | Load search results within 2 seconds for 95% of queries. |
| **Security** | End-to-end encryption for chats; anonymize location data. |
| **Usability** | 90% of test users can post a request within 3 minutes. |
| **Compatibility** | Support Android (8.0+) and iOS (14+). |

## 5. System Architecture

### 5.1 High-Level Design
- **Frontend:** Mobile apps (iOS/Android) and Progressive Web App (PWA).
- **Backend:** REST API (Node.js).
- **Database:** Firebase (for real-time updates) + MongoDB (user profiles).
- **Cloud:** AWS S3 for image storage.

### 5.2 External Interfaces
- **Maps:** OLA Maps API for location filtering.
- **SMS:** Twilio for emergency alerts.

## 6. Use Case Diagrams

### 6.1 Primary Use Cases
1. **Post a Resource Request**
   - **Actor:** Resident
   - **Flow:** Post request → System notifies nearby users → Match found → Chat to coordinate pickup.

2. **Respond to Emergency Alert**
   - **Actor:** Resident
   - **Flow:** Receive SMS alert → View details → Accept/decline assistance.

## 7. Risks & Mitigation
| **Risk** | **Mitigation** |
|----------|----------------|
| Low adoption in neighborhoods. | Partner with local NGOs for grassroots promotion. |
| Safety during exchanges. | Integrate **safe pickup zones** (e.g., local police stations). |
| Spam/fake requests. | Require phone verification for posting. |

## 8. Glossary
- **Trusted Neighbor:** Verified user with ID proof.
- **Emergency Alert:** Priority broadcast for critical needs.

## 9. Next Steps
1. **Prioritize MVP Features:**
   - Core: Resource posting, search, in-app chat, emergency alerts.
   - Defer: Advanced analytics, anonymous posting.
2. **Wireframing:** Map user flows for posting requests and responding to alerts.
3. **Pilot Testing:** Launch in 1–2 neighborhoods to gather feedback.

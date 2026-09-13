# VehicleeCare — Multi-Portal Automotive & Garage Platform

A unified multi-portal ecosystem for garage operations, vehicle bookings, corporate fleet maintenance, and automotive service management. VehicleeCare connects Admin Operations, Garages, Business Fleets, and Field Staff with real-time job tracking, multi-category service hub management (Petrol, Diesel, EV, Roadside Assistance), workforce management (attendance, leaves, meetings, notifications), financial ledgers, and role-based security controls.

---

## Live Deployments & Demo Credentials

Explore the live portals with real data of the VehicleeCare ecosystem using the URLs and Guest credentials below:

| Portal | Live Deployment URL | Guest ID | Password |
| :--- | :--- | :--- | :--- |
| **Admin Portal** | [vehiclecareadmin.vercel.app](https://vehiclecareadmin.vercel.app/) | `guestadmin@vehicleecare.com` | `GuestAdmin@2026` |
| **Garage Portal** | [vehiclee-care.vercel.app](https://vehiclee-care.vercel.app/) | `guestgarage@vehicleecare.com` | `GuestGarage@2026` |
| **Employee Portal** | [vehicleecareemployee.vercel.app](https://vehicleecareemployee.vercel.app/) | `guestemployee@vehicleecare.com` | `GuestEmployee@2026` |

> **Security Note:** Guest Admin, Guest Garage, and Guest Employee sessions feature **read-only access** and client-side data obfuscation (`g****@domain.com`, `98****1234`, `22****3A`) to prevent raw personal and legal data inspection via browser DevTools while keeping operational features fully testable. 

> **Note:** You can check all the features of the VehicleeCare in this live deployment with guest credentials provided above. All the portals at once are live and working with the same database. So you can test all the features of the website in this live deployment and guest credentials provided above.

---

## Multi-Portal Ecosystem Architecture

VehicleeCare integrates five dedicated portals into a centralized platform:

### 1. Customer Experience Portal
High-performance application designed for seamless automotive service discovery, booking, and real-time vehicle status tracking:
- **Service Catalog & Customization:** Interactive exploration of vehicle maintenance packages categorized by engine fuel types (Petrol, Diesel, EV, Premium).
- **Instant Booking Engine:** Multi-step reservation workflow allowing customers to select preferred garages, date/time slots, pickup & drop services, and special instructions.
- **Live Booking Tracker:** Real-time status updates tracking vehicle inspection, service progress, part replacements, and final delivery notifications.
- **Transparent Billing & Invoicing:** Digital breakdown of line-item costs, taxes, convenience fees, and instant online payment gateway integration.

### 2. Admin Management Portal
Central control tower for platform administrators providing operational oversight, financial tracking, workforce management, and security governance:
- **Executive Dashboard:** Live metrics for gross revenue, completed service volume, active garage onboarding, and real-time customer activity feeds.
- **Entity & User Directory:** Complete lifecycle management for Customers, Garages, Field Employees, and Corporate Fleet Accounts with status toggle controls and approval verification.
- **Financial Ledger & Billing:** Unified payment oversight tracking UPI, Card, and COD transactions, commission splits, automated invoice prefixing, and corporate tax settings (GST, PAN, CIN, HSN/SAC).
- **Security Governance:** Multi-factor authentication (2FA OTP & Authenticator App support), session duration controls, guest admin read-only action guarding (`useGuestGuard`), and inspect-element proof sensitive data masking.
- **Multi-Category Service & Infrastructure Hubs:** Comprehensive operational tracking across all vehicle engine and service types — including Petrol & Diesel maintenance hubs, EV charging stations (connectors, slot reservations, status logs), Emergency Roadside Assistance dispatching, parking facility reservations, and automotive spare parts & accessory stores.
- **Attendance & Shift Management:** Real-time digital clock-in/out tracking, shift schedule allocations, work hour analytics, and daily staff presence reporting.
- **Leave Management Governance:** Centralized workflow to review, approve, or reject employee leave applications with automated balance tracking and status updates.
- **Notification & Alert Broadcast Center:** Centralized real-time notification control for dispatching system alerts, operational updates, security warnings, and financial notifications across all portals with category filtering, broadcast creation, and unread counters.
- **Meeting & Schedule Planner:** Integrated scheduling tool for team syncs, operational briefings, meeting room bookings, and calendar invitations.

### 3. Garage Partner Portal
Specialized operational workspace built for garage owners, service managers, and mechanics:
- **Digital Workorders & Job Cards:** Instant creation and tracking of digital job cards detailing reported vehicle issues, estimated completion timelines, and assigned technicians.
- **Service Offering Configuration:** Customizable enablement/disablement of specific repair services across Petrol, Diesel, EV, and Premium vehicle categories.
- **Real-Time Notification & Alert Hub:** Dedicated notification stream for garage receiving instant alerts for new service bookings, job card updates, part approval requests, payout settlements, and system-wide admin broadcasts.
- **Part Inventory & Billing:** Real-time billing management for spare parts, labor charges, and additional customer-approved repairs.
- **Performance & Payout Analytics:** Detailed reports tracking completed jobs, customer ratings, payout settlements, and pending commission balances.

### 4. Business Corporate Portal
Dedicated B2B platform engineered for enterprise fleets, commercial transport operators, and corporate clients:
- **Fleet Vehicle Directory:** Centralized management of company vehicle fleets, maintenance histories, and driver assignments.
- **Scheduled Fleet Maintenance:** Automated recurring service schedules to minimize fleet downtime and maintain operational readiness.
- **Consolidated Corporate Invoicing:** Simplified B2B billing with bulk payment processing, customized corporate pricing agreements, and downloadable tax invoices.

### 5. Field Employee Portal
Mobile-first operational web application empowering field drivers and logistics staff:
- **Pickup & Delivery Task Management:** Real-time assignment dispatch for customer vehicle pickup and return delivery tasks.
- **Digital Inspection Checklists:** Pre-service and post-service digital inspection logging (kilometer reading, fuel level, existing scratches, vehicle photos).
- **Attendance & Shift Check-In:** Self-service clock-in/clock-out logging, shift tracking, and daily activity logs.
- **Leave Request Management:** Direct submission of leave requests, status tracking (Pending/Approved/Rejected), and leave quota monitoring.
- **Notification & Meeting Alerts:** Instant push notifications for new task dispatches, system announcements, and scheduled team meetings.
- **Route & Status Sync:** Live status updates keeping both admin operations and customers informed during vehicle transit.

---

## Key Features & Security Governance

- **Role-Based Access Control (RBAC):** Granular permission boundaries with strict mutation guards for guest administrators.
- **Real-Time Notification & Communication Engine:** Multi-portal notification system delivering instant category-filtered alerts (System, Operational, Security, Financial) across Admin, Garage, Corporate, and Field Employee interfaces with unread badge tracking and admin broadcast dispatching.
- **Workforce Management Suite:** Integrated digital attendance clock-in, leave approval workflows, team meeting scheduling, and real-time activity tracking.
- **Multi-Category Service Infrastructure:** Operational monitoring across EV charging hubs, Petrol & Diesel garage networks, emergency roadside assistance dispatch, parking slot reservations, and accessory store inventories.
- **Financial & Payment Governance:** Transaction ledgers supporting UPI, Card, and COD settlements, automated invoice prefixing, and commission split configuration.
- **Modern Glassmorphic UI:** Built with responsive glassmorphism design tokens, interactive micro-animations, and dynamic tab controls.

---

## Technology Stack

- **Frontend Frameworks:** React (Vite), Tailwind CSS, Lucide Icons, Framer Motion
- **Backend Architecture:** Node.js, Express REST API, Mongoose ORM
- **Database:** MongoDB Atlas
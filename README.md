# VehicleeCare — Multi-Portal Automotive & Garage Platform

A unified multi-portal ecosystem for garage operations, vehicle bookings, corporate fleet maintenance, and automotive service management. VehicleeCare connects Admin Operations, Garages, Business Fleets, and Field Staff with real-time job tracking, multi-category service hub management (Petrol, Diesel, EV, Roadside Assistance), financial ledgers, and role-based security controls.

---

## 🌐 Live Deployments & Demo Credentials

Explore the live portals of the VehicleeCare ecosystem using the URLs and Guest credentials below:

| Portal | Live Deployment URL | Guest Email / ID | Guest Password |
| :--- | :--- | :--- | :--- |
| **👑 Admin Management Portal** | [vehiclecareadmin.vercel.app](https://vehiclecareadmin.vercel.app/) | `guest@vehicleecare.com` | `guest123` |
| **🚗 Customer Web App** | [fehicleefarefrontend.vercel.app](https://fehicleefarefrontend.vercel.app/) | — *(Public)* | — *(Public)* |
| **🔧 Garage & Business Portal** | [vehiclee-care.vercel.app](https://vehiclee-care.vercel.app/) | `guest@vehicleecare.com` | `guest123` |
| **👔 Field Employee Portal** | [vehicleecareemployee.vercel.app](https://vehicleecareemployee.vercel.app/) | `guest@vehicleecare.com` | `guest123` |

> **Security Note:** Guest Admin sessions feature **read-only access** and client-side data obfuscation (`g****@domain.com`, `98****1234`, `22****3A`) to prevent raw personal and legal data inspection via browser DevTools while keeping operational features fully testable.

---

## 🏛️ Multi-Portal Ecosystem Architecture

VehicleeCare integrates five dedicated portals into a centralized platform:

### 1. 👑 Admin Management Portal
Central control tower for platform administrators providing operational oversight, financial tracking, and security governance:
- **Executive Dashboard:** Live metrics for gross revenue, completed service volume, active garage onboarding, and real-time customer activity feeds.
- **Entity & User Directory:** Complete lifecycle management for Customers, Garages, Field Employees, and Corporate Fleet Accounts with status toggle controls and approval verification.
- **Financial Ledger & Billing:** Unified payment oversight tracking UPI, Card, and COD transactions, commission splits, automated invoice prefixing, and corporate tax settings (GST, PAN, CIN, HSN/SAC).
- **Security Governance:** Multi-factor authentication (2FA OTP & Authenticator App support), session duration controls, guest admin read-only action guarding (`useGuestGuard`), and inspect-element proof sensitive data masking.
- **Multi-Category Service & Infrastructure Hubs:** Comprehensive operational tracking across all vehicle engine and service types — including Petrol & Diesel maintenance hubs, EV charging stations (connectors, slot reservations, status logs), Emergency Roadside Assistance dispatching, parking facility reservations, and automotive spare parts & accessory stores.

### 2. 🚗 Customer Experience Portal
High-performance application designed for seamless automotive service discovery, booking, and real-time vehicle status tracking:
- **Service Catalog & Customization:** Interactive exploration of vehicle maintenance packages categorized by engine fuel types (Petrol, Diesel, EV, Premium).
- **Instant Booking Engine:** Multi-step reservation workflow allowing customers to select preferred garages, date/time slots, pickup & drop services, and special instructions.
- **Live Booking Tracker:** Real-time status updates tracking vehicle inspection, service progress, part replacements, and final delivery notifications.
- **Transparent Billing & Invoicing:** Digital breakdown of line-item costs, taxes, convenience fees, and instant online payment gateway integration.

### 3. 🔧 Garage Partner Portal
Specialized operational workspace built for garage owners, service managers, and mechanics:
- **Digital Workorders & Job Cards:** Instant creation and tracking of digital job cards detailing reported vehicle issues, estimated completion timelines, and assigned technicians.
- **Service Offering Configuration:** Customizable enablement/disablement of specific repair services across Petrol, Diesel, EV, and Premium vehicle categories.
- **Part Inventory & Billing:** Real-time billing management for spare parts, labor charges, and additional customer-approved repairs.
- **Performance & Payout Analytics:** Detailed reports tracking completed jobs, customer ratings, payout settlements, and pending commission balances.

### 4. 🏢 Business Corporate Portal
Dedicated B2B platform engineered for enterprise fleets, commercial transport operators, and corporate clients:
- **Fleet Vehicle Directory:** Centralized management of company vehicle fleets, maintenance histories, and driver assignments.
- **Scheduled Fleet Maintenance:** Automated recurring service schedules to minimize fleet downtime and maintain operational readiness.
- **Consolidated Corporate Invoicing:** Simplified B2B billing with bulk payment processing, customized corporate pricing agreements, and downloadable tax invoices.

### 5. 👔 Field Employee Portal
Mobile-first operational web application empowering field drivers and logistics staff:
- **Pickup & Delivery Task Management:** Real-time assignment dispatch for customer vehicle pickup and return delivery tasks.
- **Digital Inspection Checklists:** Pre-service and post-service digital inspection logging (kilometer reading, fuel level, existing scratches, vehicle photos).
- **Route & Status Sync:** Live status updates keeping both admin operations and customers informed during vehicle transit.

---

## 🛡️ Key Features & Security Governance

- **🔐 Role-Based Access Control (RBAC):** Granular permission boundaries with strict mutation guards for guest administrators.
- **🛠️ Multi-Category Service Infrastructure:** Operational monitoring across EV charging hubs, Petrol & Diesel garage networks, emergency roadside assistance dispatch, parking slot reservations, and accessory store inventories.
- **📊 Financial & Payment Governance:** Transaction ledgers supporting UPI, Card, and COD settlements, automated invoice prefixing, and commission split configuration.
- **✨ Modern Glassmorphic UI:** Built with responsive glassmorphism design tokens, interactive micro-animations, and dynamic tab controls.

---

## 💻 Technology Stack

- **Frontend Frameworks:** React (Vite), Tailwind CSS, Lucide Icons, Framer Motion
- **Backend Architecture:** Node.js, Express REST API, Mongoose ORM
- **Database:** MongoDB Atlas
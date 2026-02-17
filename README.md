# VehicleeCare

This project is a vehicle service application built with a modern tech stack.

## 🚀 Project Structure

The project is organized into three main directories:

- `frontend/`: The customer-facing web application.
  - Tech Stack: React (Vite), Tailwind CSS v4.
  - Port: 5173
- `backend/`: The server-side logic and API.
  - Tech Stack: Node.js, Express, Mongoose.
  - Database: MongoDB (Atlas).
  - Port: 5001
- `admin/`: The administration dashboard.
  - Tech Stack: React (Vite), Tailwind CSS v4.
  - Port: 5174

## 🛠 Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB Atlas Account

### 1. Backend Setup
Navigate to the `backend` folder and install dependencies:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory with your MongoDB connection string:
```env
MONGO_URI=your_mongodb_connection_string
PORT=5001
```
Start the server:
```bash
npm run dev
```

### 2. Frontend Setup
Navigate to the `frontend` folder and install dependencies:
```bash
cd frontend
npm install
```
Start the development server:
```bash
npm run dev
```

### 3. Admin Setup
Navigate to the `admin` folder and install dependencies:
```bash
cd admin
npm install
```
Start the development server:
```bash
npm run dev
```

## ✅ Progress So Far

- [x] **Project Initialization**: Created `frontend`, `backend`, and `admin` folders.
- [x] **Backend Configuration**: Set up Express server, connected to `VehicleeCare` MongoDB database, and configured `nodemon`.
- [x] **Database Initialization**: Created `models` directory and seeded the database to ensure it's visible in Atlas.
- [x] **Frontend Configuration**: Initialized Vite React app with Tailwind CSS v4.
- [x] **Admin Configuration**: Initialized Vite React app with Tailwind CSS v4.
- [x] **Version Control**: Initialized Git, configured `.gitignore`, and pushed to GitHub.

## 🔗 Repository

[https://github.com/sinhagouravv/VehicleeCare](https://github.com/sinhagouravv/VehicleeCare)
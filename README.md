# 🚀 CryptoTrack - Cryptocurrency Portfolio Manager

<div align="center">

![CryptoTrack Banner](https://img.shields.io/badge/CryptoTrack-Portfolio%20Manager-blue?style=for-the-badge&logo=bitcoin&logoColor=white)

**A modern, full-stack cryptocurrency portfolio tracking application with real-time market data, advanced analytics, and secure user management.**

[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage)  [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Environment Variables](#-environment-variables)
- [Security](#-security)



---

## 🌟 Overview

CryptoTrack is a comprehensive cryptocurrency portfolio management platform that enables users to track their crypto investments in real-time, analyze performance metrics, manage watchlists, and export detailed reports. Built with modern web technologies, it offers a seamless experience across all devices with dark/light theme support.

### Why CryptoTrack?

- 📊 **Real-time Data**: Live cryptocurrency prices from CoinGecko API
- 💼 **Portfolio Management**: Track holdings with automatic profit/loss calculations
- 📈 **Advanced Analytics**: Visualize portfolio performance with interactive charts
- 🔐 **Secure**: JWT authentication with bcrypt password hashing
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- 📱 **Mobile-First**: Optimized for all screen sizes
- 💱 **Multi-Currency**: Support for USD, EUR, BTC, and ETH
- 📄 **Export Reports**: Generate PDF and CSV reports of your portfolio

---

## ✨ Features

### Core Functionality

- ✅ **User Authentication**
  - Secure registration and login with JWT tokens
  - Password encryption with bcryptjs
  - Profile management and password change
  - Session persistence with localStorage

- ✅ **Portfolio Management**
  - Add, edit, and delete cryptocurrency holdings
  - Real-time profit/loss calculations
  - Track purchase price and current value
  - Portfolio analytics with performance metrics
  - Export to PDF and CSV formats

- ✅ **Cryptocurrency Market Data**
  - Live prices for top 100 cryptocurrencies
  - Market cap, volume, and 24h change tracking
  - Search and filter functionality
  - Detailed coin information

- ✅ **Watchlist System**
  - Add/remove coins to personal watchlist
  - Real-time price monitoring
  - Quick access to favorite cryptocurrencies

- ✅ **Analytics Dashboard**
  - Portfolio allocation pie charts
  - Top/worst performing assets
  - Total value and P&L tracking
  - Historical performance graphs

- ✅ **User Experience**
  - Dark/Light theme toggle
  - Multi-currency support (USD, EUR, BTC, ETH)
  - Responsive design for all devices
  - Loading states and error handling
  - Toast notifications for user feedback

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1 | UI library for building user interfaces |
| **Vite** | 7.1 | Fast build tool and dev server |
| **React Router** | 7.9 | Client-side routing |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **Chart.js** | 4.5 | Data visualization and charts |
| **Axios** | 1.12 | HTTP client for API requests |
| **React Hot Toast** | 2.6 | Toast notifications |
| **Lucide React** | Latest | Modern icon library |
| **jsPDF** | 3.0 | PDF generation |
| **html2canvas** | 1.4 | HTML to canvas conversion |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 16+ | JavaScript runtime |
| **Express.js** | 4.18 | Web application framework |
| **MongoDB** | Latest | NoSQL database |
| **Mongoose** | 8.18 | MongoDB ODM |
| **JWT** | 9.0 | JSON Web Token authentication |
| **bcryptjs** | 3.0 | Password hashing |
| **Helmet** | 8.1 | Security middleware |
| **CORS** | 2.8 | Cross-origin resource sharing |
| **express-validator** | 7.2 | Input validation |
| **express-rate-limit** | 8.1 | API rate limiting |
| **Morgan** | 1.10 | HTTP request logger |
| **node-cron** | 4.2 | Task scheduling |

### External APIs

- **CoinGecko API** - Real-time cryptocurrency data

---

## 📦 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **MongoDB Atlas** account or local MongoDB - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/suhassuvi09/CryptoTrack-Portfolio-Manager
   cd cryptotrack
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   # Server Configuration
   PORT=5001
   NODE_ENV=development
   
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT Secret
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   
   # CoinGecko API (optional - free tier works without key)
   COINGECKO_API_KEY=your_api_key_here
   ```

5. **Start the development servers**
   
   **Terminal 1 - Backend Server:**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:5001`
   
   **Terminal 2 - Frontend Development Server:**
   ```bash
   cd client
   npm run dev
   ```
   Client will run on `http://localhost:5173`

6. **Access the application**
   
   Open your browser and navigate to `http://localhost:5173`

---

## 🚀 Usage

### Getting Started

1. **Register an Account**
   - Click "Get Started" or "Sign Up"
   - Enter your email and password (minimum 6 characters)
   - Click "Create Account"

2. **Add Your First Holding**
   - Navigate to Portfolio page
   - Click "Add Holding" button
   - Select cryptocurrency, enter amount and purchase price
   - Click "Add" to save

3. **Track Prices**
   - Visit Markets page to see all cryptocurrencies
   - Use search to find specific coins
   - Click "Add to Watchlist" for quick access

4. **View Analytics**
   - Go to Analytics page
   - See portfolio allocation charts
   - Track profit/loss metrics
   - View top performers

5. **Export Reports**
   - Navigate to Portfolio page
   - Click "Export" button
   - Choose PDF or CSV format
   - Download your report

---



## 🔐 Environment Variables

### Server Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cryptotrack?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRE=7d

# CoinGecko API (Optional)
COINGECKO_API_KEY=your_api_key_here

# CORS Configuration (Production)
FRONTEND_URL=https://your-frontend-domain.com
```

### Important Notes

⚠️ **Never commit `.env` files to version control**
⚠️ **Use strong, unique JWT secrets in production**
⚠️ **Enable MongoDB IP whitelist for production**

---

## 🔒 Security

### Implemented Security Features

- ✅ **Password Security**
  - Bcrypt hashing with salt rounds (10)
  - Minimum password length requirements
  - Password strength validation

- ✅ **Authentication & Authorization**
  - JWT token-based authentication
  - Token expiration (7 days default)
  - Protected routes with middleware
  - User session management

- ✅ **API Security**
  - Rate limiting (500 requests per 15 minutes)
  - CORS configuration
  - Helmet.js security headers
  - Input validation with express-validator
  - MongoDB injection prevention

- ✅ **Data Protection**
  - Secure HTTP headers
  - XSS protection
  - Environment variable management
  - Sensitive data filtering in responses

### Security Best Practices

1. Always use HTTPS in production
2. Implement additional rate limiting per user
3. Add CSRF protection for state-changing operations
4. Enable MongoDB authentication and encryption at rest
5. Implement email verification for new accounts
6. Add two-factor authentication (2FA)
7. Monitor and log suspicious activities
8. Regular security audits with `npm audit`

---


##  Acknowledgments

- [CoinGecko](https://www.coingecko.com/) - Cryptocurrency data API
- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [MongoDB](https://www.mongodb.com/) - Database
- [Express.js](https://expressjs.com/) - Web framework



<div align="center">

**⭐ Star this repo if you find it helpful! ⭐**

Made with ❤️ by [SUHAS]

</div>
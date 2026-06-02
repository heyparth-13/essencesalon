# Essence Salon & Spa



> A premium, scalable, and responsive web application for salon and spa reservations, featuring real-time availability, secure administration, and dynamic service rendering.

## 🌟 Project Overview

Essence Salon & Spa is a modern web application designed for a high-end luxury salon based in Surat. The application provides an elegant, mobile-responsive client-facing interface (SPA) integrated with a robust Express.js backend and a SQLite/PostgreSQL fallback architecture. It boasts strict form validation, intelligent timezone handling, and auto-deploy capabilities on Vercel Edge networks.

## ✨ Features

- **Dynamic Booking System**: 30-minute interval constraints locked to Asia/Kolkata (IST) time.
- **Real-Time Validation**: Instant UI feedback (green/red borders) for phone and email formatting.
- **Serverless Ready**: Native compatibility with Vercel Edge deployments.
- **Zero-Downtime Data Fallback**: Built-in JSON fallback ensures 100% uptime even if the primary database connection fails.
- **Secure Admin Panel**: Password-protected dashboard for staff to view and manage appointments.
- **Progressive Web App (PWA)**: Mobile-optimized architecture with offline caching via Service Workers.
- **Luxurious UI/UX**: Custom CSS grid layouts, smooth reveal animations, and a rich black/gold aesthetic.

## 🛠 Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), Semantic HTML5, Custom CSS3 Grid/Flexbox
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Production) / SQLite (Local)
- **Deployment**: Vercel (CI/CD)
- **Linting & Formatting**: ESLint, Prettier

## 📂 Folder Structure

\`\`\`text
essence-salon/
├── api/                  # Vercel Serverless entry points
│   └── server.js         # API proxy for Express
├── backend/              # Express API Architecture
│   ├── config/           # Database connections & Fallback JSON
│   ├── routes/           # Express Routers (Staff, Services, Bookings)
│   ├── package.json      # Backend dependencies
│   └── server.js         # Main Express Application
├── frontend/             # Client-Side Application
│   ├── assets/           # Static files (CSS, JS, Images)
│   ├── index.html        # Main Client Interface
│   ├── admin.html        # Secure Admin Dashboard
│   └── sw.js             # Service Worker for PWA
├── dist/                 # Auto-generated build output directory
├── package.json          # Root orchestration script
├── vercel.json           # Vercel Edge configuration
├── .env.example          # Environment variables template
├── .gitignore            # Version control exclusions
├── eslint.config.mjs     # Linter configuration
├── .prettierrc           # Code formatting rules
└── README.md             # Project documentation
\`\`\`

## 🚀 Installation & Local Development

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/your-org/essencesalon.git
   cd essencesalon
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   # The root package.json automatically installs backend dependencies
   npm install
   \`\`\`

3. **Environment Setup:**
   Copy the example environment file and fill in your secrets.
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. **Run the Development Server:**
   \`\`\`bash
   cd backend
   npm start
   \`\`\`
   The API will be available at `http://localhost:3001` and the frontend will be statically served.

## ☁️ Deployment Guide (Vercel)

This project is highly optimized for **Vercel** with zero-config required.

1. Push your code to GitHub.
2. Import the repository in Vercel.
3. Vercel will automatically detect the root `package.json` and `vercel.json`.
4. Ensure the **Build Command** is `npm run build` and the **Output Directory** is `dist`.
5. Add your `DATABASE_URL` and `ADMIN_PASSWORD` in the Vercel Environment Variables settings.
6. Click **Deploy**.

## 🛡 Security & Best Practices

- **Strict Validations:** Client-side regex for emails and 10-digit Indian phone numbers.
- **No Hardcoded Secrets:** All sensitive credentials are managed via `process.env`.
- **Database Resilience:** Fallback data architecture prevents application crashes during DB timeouts.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

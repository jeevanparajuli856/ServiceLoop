# ServiceLoop - Complete Setup Guide

This guide will help you set up the ServiceLoop application from scratch, including frontend, backend, and all necessary configurations.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone and Install](#clone-and-install)
3. [Supabase Setup](#supabase-setup)
4. [Environment Variables](#environment-variables)
5. [Run the Application](#run-the-application)
6. [Project Structure](#project-structure)
7. [Optional: Create Sample Data](#optional-create-sample-data)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm installed ([Download Node.js](https://nodejs.org/))
- **A Supabase account** ([Sign up for free](https://supabase.com))
- **A Google AI (Gemini) API key** ([Get one here](https://makersuite.google.com/app/apikey))
- **Git** (for cloning the repository)

---

## Clone and Install

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd ServiceLoop
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React 18
- Vite
- Supabase Client
- React Router
- Framer Motion
- React Icons

---

## Supabase Setup

ServiceLoop uses Supabase for authentication, database, and Edge Functions. Follow the detailed guide:

👉 **[See SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete Supabase setup instructions**

### Quick Summary:

1. **Create a Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project
   - Note your Project URL and anon key

2. **Set Up Database Schema**
   - Go to SQL Editor in Supabase Dashboard
   - Run the SQL from `supabase/DATABASE_SCHEMA.sql` (or use the complete schema in SUPABASE_SETUP.md)
   - This creates all tables, RLS policies, functions, and indexes

3. **Deploy Edge Function**
   - Install Supabase CLI: `npm install -g supabase`
   - Login: `supabase login`
   - Link project: `supabase link --project-ref your-project-ref`
   - Deploy: `supabase functions deploy globalChatbot`
   - Set Gemini API key: `supabase secrets set GEMINI_API_KEY=your_key`

For detailed step-by-step instructions, see **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**.

---

## Environment Variables

### Step 1: Create `.env` File

Create a `.env` file in the project root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 2: Get Your Supabase Credentials

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Step 3: Add to `.gitignore`

**Important:** Never commit your `.env` file to version control!

Ensure `.env` is in your `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production
```

---

## Run the Application

### Development Mode

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

---

## Project Structure

```
ServiceLoop/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx       # Top navigation
│   │   ├── Footer.jsx       # Site footer
│   │   ├── GlobalChatbot.jsx # AI chatbot widget
│   │   ├── EventCard.jsx    # Event display card
│   │   ├── NonprofitCard.jsx # Nonprofit display card
│   │   └── ...
│   │
│   ├── pages/               # Page components (organized by feature)
│   │   ├── Home.jsx          # Landing page
│   │   ├── admin/           # Admin-related pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── OrganizationAdminPanel.jsx
│   │   │   └── MyOrganizationsAdmin.jsx
│   │   ├── dashboard/       # User dashboard pages
│   │   │   ├── Dashboard.jsx
│   │   │   └── MyOrganizations.jsx
│   │   ├── auth/            # Authentication pages
│   │   │   ├── Login.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── nonprofits/      # Nonprofit pages
│   │   │   ├── Nonprofits.jsx
│   │   │   └── NonprofitDetail.jsx
│   │   ├── events/          # Event pages
│   │   │   ├── Events.jsx
│   │   │   └── EventDetail.jsx
│   │   └── forum/           # Forum pages
│   │       ├── Forum.jsx
│   │       └── PostDetail.jsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js       # Authentication hook
│   │   └── useSuperAdmin.js
│   │
│   ├── services/            # Service layer
│   │   ├── adminService.js
│   │   └── orgAdminService.js
│   │
│   ├── utils/               # Utility functions
│   │   └── superAdmin.js
│   │
│   ├── styles/              # Global styles
│   │   └── global.css       # Design system
│   │
│   ├── assets/              # Static assets
│   │   ├── logo.png
│   │   └── home/            # Home page images
│   │
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── supabaseClient.js   # Supabase configuration
│
├── supabase/
│   ├── functions/           # Edge Functions
│   │   └── globalChatbot/   # AI chatbot function
│   │       └── index.ts
│   └── DATABASE_SCHEMA.sql # Database schema (optional)
│
├── public/                  # Public assets
├── .env                     # Environment variables (not in git)
├── package.json
├── vite.config.js
├── README.md
├── SETUP.md                 # This file
└── SUPABASE_SETUP.md        # Detailed Supabase setup
```

---

## Optional: Create Sample Data

After setting up Supabase, you can add sample data through the Supabase Dashboard:

### Add Sample Nonprofit

1. Go to **Table Editor** → **nonprofits**
2. Click **"Insert row"**
3. Fill in:
   - **name:** "Local Food Bank"
   - **mission:** "Helping fight hunger in our community"
   - **category:** "Health & Wellness"
   - **contact_email:** "info@foodbank.org"
   - **website:** "https://foodbank.org"

### Add Sample Event

1. Go to **Table Editor** → **events**
2. Click **"Insert row"**
3. Fill in:
   - **nonprofit_id:** (select from nonprofits dropdown)
   - **title:** "Community Food Drive"
   - **description:** "Join us for a day of giving back to the community"
   - **date:** (select a future date)
   - **location:** "Community Center, Main Street"

---

## Troubleshooting

### Common Issues

#### 1. "Failed to fetch" or Connection Errors

**Solution:**
- Verify `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase project is active (not paused)
- Verify API keys in Supabase Dashboard → Settings → API

#### 2. Chatbot Not Working

**Solution:**
- Verify Edge Function is deployed: `supabase functions list`
- Check function logs: `supabase functions logs globalChatbot`
- Verify `GEMINI_API_KEY` is set: `supabase secrets list`
- See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed troubleshooting

#### 3. Database Permission Errors

**Solution:**
- Verify RLS policies were created correctly
- Check if user is authenticated
- Verify super admin email matches in policies
- See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) → Troubleshooting

#### 4. Build Errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Check Node.js version (should be 18+)
node --version
```

#### 5. Module Not Found Errors

**Solution:**
- Verify all dependencies are installed: `npm install`
- Check import paths match the new organized structure
- Restart the development server

---

## Production Deployment

### Build for Production

```bash
npm run build
```

The `dist` folder will contain the production-ready build.

### Deploy to Vercel

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your Git repository

2. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Deploy**
   - Vercel will automatically detect Vite
   - Click "Deploy"

### Deploy to Netlify

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Import your Git repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Add Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **Deploy**
   - Click "Deploy site"

### Environment Variables for Production

Make sure to set these in your hosting platform:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

**Note:** Edge Functions and secrets are managed in Supabase Dashboard, not in your hosting platform.

---

## Features Overview

ServiceLoop includes:

- ✅ **User Authentication** - Email/password via Supabase Auth
- ✅ **Nonprofit Discovery** - Browse, search, and filter nonprofits
- ✅ **Organization Membership** - Join organizations and access exclusive content
- ✅ **Event Management** - View and sign up for volunteer events
- ✅ **Community Forum** - Global forum with posts and comments
- ✅ **AI Chatbot** - Google Gemini-powered assistant
- ✅ **Admin Dashboard** - Super admin and organization admin panels
- ✅ **Responsive Design** - Works on mobile, tablet, and desktop
- ✅ **Row Level Security** - Secure data access with RLS policies

---

## Next Steps

After completing setup:

1. ✅ Test user authentication (sign up, sign in)
2. ✅ Create sample nonprofits and events
3. ✅ Test organization creation requests
4. ✅ Verify admin panel functionality
5. ✅ Test chatbot integration
6. ✅ Customize design system in `src/styles/global.css`
7. ✅ Deploy to production

---

## Additional Resources

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Detailed Supabase setup guide
- **[README.md](./README.md)** - Project overview and features
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [React Router Documentation](https://reactrouter.com)

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for Supabase-specific issues
3. Check browser console for errors
4. Verify all environment variables are set correctly
5. Review Supabase Dashboard logs

---

**Last Updated:** November 2024  
**ServiceLoop Version:** 1.0.0

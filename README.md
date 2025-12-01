# ServiceLoop 🔄

A beautiful, modern web application connecting volunteers with nonprofits, events, and community forums. Built with React, Supabase, and Google AI.

![ServiceLoop](https://img.shields.io/badge/React-18.2-blue) ![Supabase](https://img.shields.io/badge/Supabase-2.38-green) ![Vite](https://img.shields.io/badge/Vite-5.0-purple)

## ✨ Features

- 🔐 **User Authentication** - Secure email/password authentication via Supabase
- 🏢 **Nonprofit Discovery** - Browse, search, and filter nonprofits by category
- 🤝 **Organization Membership** - Join organizations to access exclusive content
- 📅 **Event Management** - View and sign up for volunteer events
- 💬 **Community Forum** - Global forum with posts and comments
- 🤖 **AI Chatbot** - Google Gemini-powered assistant for help and guidance
- 📱 **Fully Responsive** - Beautiful UI that works on all devices
- 🎨 **Modern Design** - Clean, accessible interface with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([sign up free](https://supabase.com))
- A Google AI (Gemini) API key ([get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set up Supabase:**
   - Create a new Supabase project
   - Run the SQL migrations from `supabase/migrations/001_initial_schema.sql`
   - Deploy the Edge Function (see [SETUP.md](./SETUP.md) for details)

4. **Start the development server:**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the app!

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Top navigation
│   ├── Footer.jsx      # Site footer
│   ├── GlobalChatbot.jsx  # AI chatbot widget
│   ├── NonprofitCard.jsx  # Nonprofit display card
│   ├── EventCard.jsx   # Event display card
│   ├── PostCard.jsx    # Forum post card
│   └── ...
├── pages/              # Page components
│   ├── Home.jsx        # Landing page
│   ├── Nonprofits.jsx  # Browse nonprofits
│   ├── NonprofitDetail.jsx  # Nonprofit detail page
│   ├── Events.jsx      # Global events
│   ├── Forum.jsx       # Community forum
│   └── ...
├── hooks/              # Custom React hooks
│   └── useAuth.js      # Authentication hook
├── styles/             # Global styles
│   └── global.css      # Design system
└── supabaseClient.js   # Supabase configuration
```

## 🎨 Design System

- **Primary Color:** `#2563EB` (Blue)
- **Accent Color:** `#10B981` (Green)
- **Background:** `#F3F4F6` (Light Gray)
- **Typography:** Inter font family
- **Responsive:** Mobile-first design

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **AI:** Google Generative AI (Gemini)
- **Styling:** CSS with custom design system
- **Icons:** Emoji-based (can be replaced with icon library)

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[Database Schema](./supabase/migrations/001_initial_schema.sql)** - Complete database schema
- **[Edge Function](./supabase/functions/globalChatbot/index.ts)** - Chatbot implementation

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- User authentication via Supabase Auth
- Protected routes for authenticated content
- Secure API key management

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel/Netlify

1. Connect your Git repository
2. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy!

## 🤝 Contributing

This is a complete, production-ready application. Feel free to:
- Customize the design system
- Add new features
- Improve accessibility
- Optimize performance

## 📝 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com)
- Powered by [Google AI](https://ai.google.dev)
- Styled with modern CSS and best practices
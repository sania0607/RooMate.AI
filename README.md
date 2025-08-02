# RooMate 🏠

**Find Your Perfect Roommate with AI-Powered Matching**

RooMate is a modern roommate matching platform that connects people looking for compatible roommates using advanced AI algorithms and voice-based profile setup. Built with React, Node.js, and PostgreSQL, RooMate makes finding the right roommate easier than ever.

## 🌟 Features

### AI-Powered Compatibility Matching
- Advanced algorithm analyzes lifestyle preferences, interests, and habits
- Real-time compatibility scoring for better matches
- Detailed profile completion for accurate matching

### Voice Profile Setup
- Quick voice-based profile creation using Omnidim AI
- Natural conversation interface for effortless onboarding
- Automatic extraction of lifestyle preferences and interests

### Modern User Experience
- Beautiful, responsive UI with gradient designs
- Swipe-based matching system similar to dating apps
- Real-time messaging between matched users
- Comprehensive profile management

### Admin Panel
- User management and moderation tools
- Flagging system for reporting issues
- Analytics and statistics dashboard

### Room Tour Feature
- Browse available rooms with detailed listings
- Photo galleries and facility information
- Contact landlords directly through the platform

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Omnidim API key (for voice features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rooomate
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following:
```env
DATABASE_URL=your_postgresql_connection_string
OMNIDIM_API_KEY=your_omnidim_api_key
SESSION_SECRET=your_session_secret
PORT=5000
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

6. Build for production:
```bash
npm run build
```

7. Start production server:
```bash
npm start
```

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Wouter** for routing
- **Tailwind CSS** for styling
- **Shadcn UI** components
- **React Query** for data fetching
- **Lucide React** icons

### Backend
- **Node.js** with Express
- **TypeScript**
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **WebSocket** for real-time messaging
- **Passport.js** for authentication

### AI & Voice Features
- **Omnidim API** for voice processing
- Custom compatibility scoring algorithm

## 📁 Project Structure

```
rooMate/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API service functions
│   │   ├── lib/        # Utility functions
│   │   ├── App.tsx     # Main app component
│   │   └── main.tsx    # Entry point
├── server/              # Node.js backend
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic services
│   ├── seeds/          # Database seed data
│   ├── auth.ts         # Authentication logic
│   ├── db.ts           # Database connection
│   ├── storage.ts      # Data access layer
│   └── index.ts        # Server entry point
├── shared/              # Shared types and schemas
├── uploads/             # Uploaded files
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## 🔧 Key Components

### User Profiles
Detailed profiles with:
- Personal information (name, age, location)
- Lifestyle preferences (cleanliness, social level, sleep schedule)
- Interests and hobbies
- Roommate preferences
- Voice interview responses

### Matching System
- Swipe-based interface (like/dislike)
- AI-powered compatibility scoring
- Mutual match detection
- Match management

### Messaging
- Real-time chat between matches
- WebSocket-based communication
- Message history
- Unread message tracking

### Admin Panel
- User management
- Flagging system
- Analytics dashboard
- Content moderation

## 🎯 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/admin/login` - Admin login

### Profiles
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Create/update profile
- `POST /api/upload/profile-photo` - Upload profile photo

### Voice Features
- `POST /api/voice/process` - Process voice input
- `POST /api/omnidim/create-agent` - Create voice agent
- `POST /api/omnidim/start-call` - Start voice call
- `POST /api/omnidim/process-interview` - Process voice interview

### Matching
- `GET /api/swipe/candidates` - Get swipe candidates
- `POST /api/swipe` - Create swipe action
- `GET /api/matches` - Get user matches

### Messaging
- `GET /api/matches/:matchId/messages` - Get messages
- `POST /api/matches/:matchId/messages` - Send message

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get platform stats
- `POST /api/admin/flag-user` - Flag a user
- `POST /api/admin/ban-user` - Ban a user

## 📱 UI Pages

1. **Landing Page** - Introduction and login
2. **Home Dashboard** - Main user interface with stats
3. **Profile** - Profile management
4. **Voice Setup** - Voice-based profile creation
5. **Swipe** - Matching interface
6. **Discover** - Browse all users
7. **Matches** - View matches
8. **Messages** - Chat interface
9. **Notifications** - Notification center
10. **Room Tour** - Browse room listings
11. **Admin Panel** - Administrative interface

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

*Made with ❤️ for better roommate matching experiences*

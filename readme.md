# SkillFest Platform

A Next.js-based platform featuring a leaderboard system with admin access, user activity tracking, and design submission capabilities. Built for GitHub user AryanVBW.

## Features

- **User Authentication**: Secure login system with activity tracking
- **Leaderboard System**: Track and display user rankings based on contributions
- **Logo Submissions**: 
  - Submit logos via cloud storage links (Google Drive, iCloud, GitHub, Dropbox, OneDrive)
  - Automatic link validation
  - Admin review system
- **Admin Dashboard**:
  - User management
  - Activity monitoring
  - Submission reviews
  - Login history tracking

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- AWS S3 bucket for file storage

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# MongoDB
MONGODB_URI=your_mongodb_atlas_uri

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000


```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## API Endpoints

### Public Endpoints
- `GET /api/leaderboard` - Get current leaderboard
- `POST /api/submissions` - Submit a new design
- `GET /api/submissions` - Get user's submissions

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users` - Update user roles
- `GET /api/admin/activities` - View all activities
- `POST /api/admin/activities` - Get login history

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Deployment

1. Create a MongoDB Atlas cluster
2. Set up an AWS S3 bucket for file storage
3. Deploy to Vercel:
   - Fork this repository
   - Import to Vercel
   - Configure environment variables
   - Deploy!

## License

MIT

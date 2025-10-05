# 🌊 HydroBloom - Hydroponics Farm Management Dashboard

A cutting-edge web application for managing hydroponic farms with stunning neon-accented dark theme, bilingual support (English + Hindi), real-time monitoring, and role-based access control.

## Features

- **🎨 Stunning Dark Theme**: Modern black background with neon cyan, green, and pink accents
- **⚡ Neon Visual Effects**: Glowing borders, animated elements, and gradient text
- **🌐 Bilingual Interface**: Full English and Hindi localization
- **📊 Real-time Dashboard**: Live sensor data with glowing progress bars and neon indicators
- **🏢 Farm Management**: Manage polyhouses, zones, nurseries, and reservoirs
- **🔄 Lifecycle Tracking**: Crop lifecycle management with templates
- **📋 Task Management**: Kanban-style task board with drag & drop
- **🔔 Smart Alerts**: Configurable notifications via Email, WhatsApp, SMS
- **👥 User Management**: Role-based access control (Owner, Admin, Farm Manager, Viewer)
- **📈 Reports & Analytics**: Charts, exports, and insights
- **📱 Responsive Design**: Desktop-first, mobile-friendly interface

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** with custom neon theme configuration
- **Custom CSS animations** for neon glowing effects
- **React Router** for navigation
- **react-i18next** for internationalization
- **Headless UI** for accessible components
- **Heroicons** for icons
- **Recharts** for data visualization
- **React Beautiful DnD** for drag & drop

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** with Prisma ORM
- **JWT** authentication
- **Socket.io** for real-time updates
- **Helmet** for security
- **CORS** and rate limiting

### External Integrations
- **OpenWeatherMap** API for weather data
- **Twilio** for WhatsApp & SMS notifications
- **SendGrid** for email notifications

## Project Structure

```
Growloc/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── i18n/           # Internationalization
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── prisma/            # Database schema and migrations
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Growloc
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database and API keys

   # Generate Prisma client
   npx prisma generate

   # Run migrations (when database is ready)
   npx prisma migrate dev

   # Start development server
   npm run dev
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install --legacy-peer-deps

   # Start development server
   npm start
   ```

4. **Environment Variables**

   Backend `.env` file:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/growloc_db"
   JWT_SECRET=your_secret_key
   OPENWEATHER_API_KEY=your_api_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   SENDGRID_API_KEY=your_sendgrid_key
   ```

### Development

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

The frontend will proxy API requests to the backend during development.

## Key Pages & Features

### Dashboard (`/dashboard`)
- Summary tiles for key metrics
- Real-time sensor data (pH, EC levels)
- Weather information
- Quick actions for common tasks

### Tasks (`/tasks`)
- Kanban board with columns: Open, In Progress, In Review, Closed
- Drag & drop functionality
- Task assignment and priority management
- Due date tracking with overdue indicators

### Users (`/users`)
- User management with role-based access
- Support for Owner, Admin, Farm Manager, and Viewer roles
- User profile management with language preferences

### Alerts (`/alerts`)
- Configurable alert conditions
- Multi-channel notifications (Email, WhatsApp, SMS)
- Subscriber management
- Alert scheduling and repeat intervals

### Additional Pages
- **Polyhouses**: Manage farm structures and zones
- **Life Cycles**: Track crop growth stages and templates
- **Inventory**: Stock management and transactions
- **Reports**: Analytics and data export
- **Reservoirs**: Water management and treatment history

## Internationalization

The application supports English and Hindi languages:
- Switch languages using the header toggle
- All UI text is localized
- Date and number formatting follows locale conventions
- User language preference is saved

## Database Schema

Key models include:
- **Users**: Authentication and role management
- **Farms**: Farm information and access control
- **Polyhouses & Zones**: Physical farm structures
- **Templates & Lifecycles**: Crop management
- **Tasks**: Work assignment and tracking
- **Sensors**: IoT device data
- **Alerts**: Notification configurations
- **Inventory**: Stock and transaction management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please open an issue in the GitHub repository.

---

Built with ❤️ for modern hydroponic farming
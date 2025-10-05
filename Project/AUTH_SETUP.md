# 🔐 EcoFarmLogix Authentication & Onboarding Setup

## 📋 Overview

This document provides comprehensive setup instructions for the newly implemented authentication and onboarding system in EcoFarmLogix.

## 🚀 Features Implemented

### ✅ Authentication System
- **Multi-factor Authentication**: OTP via email/SMS + password fallback
- **Secure Registration**: Email/mobile verification with optional password
- **JWT Token Management**: 30-day tokens with automatic refresh
- **Rate Limiting**: OTP rate limiting (3 per hour) and API protection
- **Input Validation**: E.164 phone format, email validation, strong password requirements

### ✅ Onboarding Flow
- **Mandatory First-time Setup**: Asset configuration before dashboard access
- **Asset Management**: Polyhouse/Fertigation with unique MAC ID validation
- **User Invitation System**: Role-based invites with email/SMS
- **Auto-naming**: Smart asset naming (Polyhouse 1, Fertigation 2, etc.)
- **Progress Tracking**: Visual progress indicators and state persistence

### ✅ Security & UX
- **Route Protection**: Auth guards with onboarding checks
- **Mobile-first UI**: Responsive design with dark theme
- **Accessibility**: Screen reader support and keyboard navigation
- **Error Handling**: Comprehensive validation with user-friendly messages
- **Development Mode**: OTP bypass for local testing

## 🛠️ Setup Instructions

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required for Authentication
JWT_SECRET=your_super_secret_jwt_key_256_bits_minimum
OTP_SALT=your_otp_salt_key_change_in_production
FRONTEND_URL=http://localhost:3000

# Database (PostgreSQL required)
DATABASE_URL="postgresql://username:password@localhost:5432/ecofarmlogix_db"

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
FROM_EMAIL=noreply@EcoFarmLogix.com

# SMS Service (Twilio)
TWILIO_SID=AC_your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Development (bypasses OTP for testing)
BYPASS_OTP=true
NODE_ENV=development
```

#### Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init-auth-system

# Optional: View database in Prisma Studio
npx prisma studio
```

#### Start Backend Server
```bash
npm run dev
```
Server runs on: http://localhost:5000

### 2. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install --legacy-peer-deps
```

#### Environment Configuration
```bash
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key  # Optional
```

#### Start Frontend Development Server
```bash
npm start
```
Frontend runs on: http://localhost:3000

## 🔄 User Flow

### New User Registration
1. **Login Page** (`/login`) → Enter email/mobile → Send OTP
2. **OTP Verification** (`/otp-verify`) → Enter 6-digit code → Verify
3. **Registration** (`/register`) → Fill profile details → Create account
4. **Asset Setup** (`/onboarding/assets`) → Add assets with MAC IDs → Continue
5. **User Management** (`/onboarding/users`) → Invite team members → Complete
6. **Dashboard** (`/dashboard`) → Access main application

### Existing User Login
1. **Login Page** (`/login`) → OTP or Password login
2. **Dashboard** (`/dashboard`) → Direct access (if onboarding complete)

### Password Login Alternative
1. **Login Page** (`/login`) → "Login with Password"
2. **Password Login** (`/login/password`) → Enter credentials → Sign in

## 🧪 Testing

### Development OTP Bypass
With `BYPASS_OTP=true`, OTP codes are logged to console:
```
[DEV] OTP for user@example.com: 123456
[DEV] OTP for +1234567890: 123456
```

### Test User Scenarios

#### 1. First-time User
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"contact": "test@example.com"}'
```

#### 2. Asset Creation
```bash
curl -X POST http://localhost:5000/api/onboarding/assets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assets": [
      {"type": "POLYHOUSE", "name": "", "macid": "AA:BB:CC:DD:EE:FF"}
    ]
  }'
```

#### 3. User Invitation
```bash
curl -X POST http://localhost:5000/api/onboarding/invite-user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "colleague@example.com",
    "role": "FARM_MANAGER",
    "languagePref": "en"
  }'
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email/mobile
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/login` - Password-based login
- `POST /api/auth/register` - Create new account
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/complete-onboarding` - Mark onboarding complete

### Onboarding
- `POST /api/onboarding/assets` - Save user assets
- `GET /api/onboarding/assets` - Get user assets
- `POST /api/onboarding/invite-user` - Send user invitation
- `GET /api/onboarding/invites` - Get sent invitations
- `GET /api/onboarding/invite/:token` - Get invite details
- `POST /api/onboarding/invite/:token/accept` - Accept invitation

## 🔧 Customization

### Adding New Asset Types
1. Update Prisma schema (`backend/prisma/schema.prisma`):
```prisma
enum AssetType {
  POLYHOUSE
  FERTIGATION
  GREENHOUSE    // Add new type
  AQUAPONICS    // Add new type
}
```

2. Run migration:
```bash
npx prisma migrate dev --name add-new-asset-types
```

3. Update frontend components to handle new types

### Custom Authentication Providers
Extend `AuthService` to support additional providers:
```typescript
// backend/src/services/authService.ts
static async loginWithGoogle(token: string): Promise<LoginResponse> {
  // Implement Google OAuth integration
}
```

### Email/SMS Templates
Customize templates in `OtpService`:
```typescript
// backend/src/services/otpService.ts
private static async sendEmailOtp(email: string, otp: string) {
  // Customize email template
}
```

## 🚨 Security Considerations

### Production Deployment
1. **Environment Variables**: Use strong, unique secrets
2. **Database Security**: Enable SSL, use connection pooling
3. **Rate Limiting**: Configure appropriate limits for your use case
4. **HTTPS**: Enforce HTTPS in production
5. **JWT Security**: Use RS256 signing for distributed systems

### Recommended .env for Production
```env
NODE_ENV=production
JWT_SECRET=256_bit_random_string_change_this
OTP_SALT=another_256_bit_random_string
BYPASS_OTP=false
FRONTEND_URL=https://your-domain.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/ecofarmlogix
```

## 📞 Support

### Common Issues

1. **OTP Not Received**
   - Check SENDGRID_API_KEY and TWILIO credentials
   - Verify FROM_EMAIL is authorized in SendGrid
   - Check spam/junk folders

2. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Verify DATABASE_URL format
   - Check database user permissions

3. **Frontend API Errors**
   - Verify REACT_APP_API_BASE_URL points to backend
   - Check backend server is running on correct port
   - Inspect browser network tab for CORS issues

### Getting Help
- Check logs: Backend logs show detailed error information
- Use Prisma Studio to inspect database state
- Enable BYPASS_OTP for development testing
- Review network requests in browser DevTools

## 🎯 Next Steps

1. **Google Maps Integration**: Add location picker for registration
2. **Push Notifications**: Implement real-time alerts
3. **2FA**: Add TOTP-based two-factor authentication
4. **SSO**: Integrate with enterprise identity providers
5. **Audit Logging**: Track user actions for compliance
6. **Role Permissions**: Granular feature-based permissions

---

✅ **System Status**: Fully implemented and production-ready
🔒 **Security**: Enterprise-grade authentication with best practices
📱 **UX**: Mobile-first design with accessibility compliance
🚀 **Performance**: Optimized with caching and rate limiting
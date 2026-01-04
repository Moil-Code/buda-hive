# Buda Hive License Management System

A Next.js application for managing Moil/Buda Hive business platform licenses. Admins can purchase, assign, and activate licenses for users, with automated email notifications and activation workflows.

## Features

- 🔐 **Admin Authentication**: Secure login/signup restricted to @budaedc.com and @moilapp.com emails
- 📊 **License Dashboard**: Real-time overview of total, activated, and pending licenses
- ➕ **License Management**: Add, activate, and remove user licenses
- 📧 **Email Notifications**: Automated activation emails with secure tokens
- 🔄 **License Activation**: Users receive activation links to access Buda Hive platform
- 📈 **Usage Analytics**: Track license utilization and statistics
- 💳 **Purchase Integration**: Ready for external API integration for license purchasing
- 🎨 **Modern UI**: Beautiful, responsive admin dashboard
- 🔒 **Row-Level Security**: Supabase RLS policies for data protection
- 📱 **Mobile-Friendly**: Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **UI Components**: Lucide React icons
- **Styling**: Tailwind CSS with custom design system

## Supabase Configuration

### Important: Fix Production Redirect Issue

To prevent email confirmation links from redirecting to localhost in production:

1. **Go to your Supabase project dashboard**
2. **Navigate to Authentication > URL Configuration**
3. **Add your production domain to "Redirect URLs":**
   ```
   https://yourdomain.com/auth/callback
   http://localhost:3000/auth/callback
   ```
4. **Set "Site URL" to your production domain:**
   ```
   https://yourdomain.com
   ```

This ensures email confirmation links work correctly in production.

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account and project

### 1. Clone and Install

```bash
git clone <your-repo>
cd saas-starter
npm install
```

### 2. Environment Setup

Copy the environment template:
```bash
cp env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands from `database/license_schema.sql`

This will create:
- `admins` table (for admin users with email domain restrictions)
- `licenses` table (for license management and tracking)
- Row Level Security policies (admins can only manage their own licenses)
- Triggers for automatic admin creation and timestamp updates
- Activation token generation function
- Indexes for performance optimization

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to the login page.

### 5. Configure Email Settings

Add email configuration to your `.env.local`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@budaedc.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For Gmail, you'll need to create an [App Password](https://support.google.com/accounts/answer/185833).

### 6. Create Your First Admin Account

1. Go to `/admin/signup` to create an admin account
2. Use an email ending with `@budaedc.com` or `@moilapp.com`
3. Check your email for verification (if email confirmation is enabled)
4. Login at `/admin/login` and access the admin dashboard

### 7. Managing Licenses

Once logged in as an admin, you can:
1. **Add Licenses**: Enter user email addresses to create new licenses
2. **Activate Licenses**: Click "Activate" to send activation emails to users
3. **Resend Emails**: Resend activation emails if needed
4. **Remove Licenses**: Delete licenses that are no longer needed
5. **Track Statistics**: Monitor total, activated, and pending licenses

## Project Structure

```
buda-hive-license-management/
├── app/
│   ├── admin/
│   │   ├── dashboard/        # Admin dashboard for license management
│   │   ├── login/            # Admin login page
│   │   └── signup/           # Admin signup page
│   ├── activate/             # User license activation page
│   ├── api/
│   │   ├── admin/            # Admin auth API routes
│   │   │   ├── login/        # Admin login endpoint
│   │   │   ├── logout/       # Admin logout endpoint
│   │   │   └── signup/       # Admin signup endpoint
│   │   └── licenses/         # License management API routes
│   │       ├── add/          # Add new license
│   │       ├── activate/     # Activate license & send email
│   │       ├── list/         # List all licenses
│   │       ├── remove/       # Remove license
│   │       └── resend/       # Resend activation email
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/ui/            # Reusable UI components
├── emails/                   # Email templates
│   └── license-activation.tsx # License activation email
├── lib/
│   ├── supabase/            # Supabase client configuration
│   ├── email.ts             # Email sending utilities
│   └── utils.ts             # Utility functions
├── database/
│   └── license_schema.sql   # License management database schema
└── middleware.ts            # Authentication middleware
```

## Key Features

### Admin Authentication Flow
- Restricted signup to @budaedc.com and @moilapp.com domains
- Secure login with Supabase Auth
- Protected admin routes with middleware
- Automatic admin profile creation via database triggers

### License Management Workflow
1. **Admin adds license** → License created with unique activation token
2. **Admin activates license** → Automated email sent to user with activation link
3. **User clicks activation link** → Redirected to activation page
4. **User downloads app** → Signs up/logs in with their email
5. **User accesses Buda Hive** → Full platform access granted

### Database Schema
- **admins**: Admin users with email domain validation
- **licenses**: License records with activation tracking and tokens
- **Row-Level Security**: Ensures admins only access their own data

## API Endpoints

### Admin Authentication
- `POST /api/admin/signup` - Create admin account (restricted domains)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout

### License Management
- `POST /api/licenses/add` - Add new license for a user
- `GET /api/licenses/list` - List all licenses with statistics
- `POST /api/licenses/activate` - Activate license and send email
- `POST /api/licenses/resend` - Resend activation email
- `DELETE /api/licenses/remove` - Remove a license

## Customization

### Email Templates
Email templates are located in `/emails` and use React Email components:
- Customize the `LicenseActivationEmail` component for branding
- Update colors, logos, and messaging to match your brand
- Test emails using the preview mode: `npm run email:dev`

### Admin Dashboard
- Modify the dashboard UI in `/app/admin/dashboard/page.tsx`
- Update statistics cards, colors, and layout
- Add custom features like bulk license operations

### Purchase Integration
The "Purchase Licenses" button in the dashboard is ready for integration:
- Connect to your payment processor (Stripe, PayPal, etc.)
- Implement the external API endpoint for license purchasing
- Update the button handler to redirect to checkout

### Activation Page
Customize the user activation experience in `/app/activate/page.tsx`:
- Update branding and messaging
- Add custom onboarding steps
- Integrate with your mobile app download links

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
Ensure your platform supports:
- Node.js 18+
- Environment variables
- Next.js 16 features

## Environment Variables

Required environment variables for the application:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration (for license activation emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@budaedc.com

# Application URL (for activation links)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
1. Check the GitHub issues
2. Review Supabase documentation
3. Check Next.js documentation

## License

[Add your license here]

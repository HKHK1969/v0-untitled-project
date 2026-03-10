# Deployment Guide - Sourcing Ninja Pilot

## Overview
This guide covers the deployment process for the Sourcing Ninja pilot version.

## Prerequisites
- Vercel account with team access
- Supabase project configured
- Environment variables set up
- Domain configured (optional)

## Environment Variables

### Required Variables
\`\`\`bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
SUPABASE_JWT_SECRET=your_jwt_secret

# Deployment Configuration
NEXT_PUBLIC_DEPLOYMENT_STAGE=pilot
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Feature Flags
NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS=true
NEXT_PUBLIC_ENABLE_AI_ASSISTANT=true
NEXT_PUBLIC_ENABLE_SW=false

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_ga_id
\`\`\`

## Deployment Steps

### 1. Database Setup
Run the SQL scripts in order:
\`\`\`bash
# Connect to your Supabase project and run:
001_create_production_schema.sql
002_create_feedback_schema.sql
003_create_onboarding_schema.sql
004_create_analytics_schema.sql
\`\`\`

### 2. Vercel Deployment
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
\`\`\`

### 3. Domain Configuration (Optional)
1. Add custom domain in Vercel dashboard
2. Update NEXT_PUBLIC_APP_URL environment variable
3. Configure DNS records

### 4. Post-Deployment Verification
1. Check health endpoint: `/api/health`
2. Verify authentication flow
3. Test database connections
4. Confirm analytics tracking

## Pilot-Specific Configuration

### User Limits
- Maximum 50 pilot users
- 10,000 data rows per user
- Enhanced logging enabled

### Feature Flags
- Feedback system: Always enabled
- Onboarding: Always enabled
- Advanced analytics: Configurable
- AI assistant: Configurable

### Monitoring
- Health checks every 5 minutes
- Error tracking enabled
- Performance monitoring active
- User analytics collection

## Rollback Procedure
1. Revert to previous Vercel deployment
2. Restore database from backup if needed
3. Update environment variables if changed
4. Notify pilot users of any issues

## Support Contacts
- Technical Issues: support@sourcing-ninja.com
- Pilot Feedback: feedback@sourcing-ninja.com
- Emergency: urgent@sourcing-ninja.com

## Security Considerations
- All API endpoints protected with RLS
- Rate limiting enabled
- HTTPS enforced
- Security headers configured
- Session management implemented

## Performance Optimization
- Static assets cached
- Database queries optimized
- Image optimization enabled
- Service worker disabled (pilot)

## Backup Strategy
- Automated daily database backups
- Code versioning via Git
- Environment variable backups
- User data export capabilities

# Production Deployment Guide

This guide covers deploying the Apparel Supply Chain Tracker to production environments.

## Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm package manager
- Docker (optional, for containerized deployment)
- Vercel account (for Vercel deployment)

## Environment Variables

Copy `.env.example` to `.env.local` and configure all required variables:

\`\`\`bash
cp .env.example .env.local
\`\`\`

### Required Environment Variables

#### Database (Supabase/Postgres)
- `POSTGRES_URL` - PostgreSQL connection string
- `POSTGRES_PRISMA_URL` - Prisma-compatible connection string
- `POSTGRES_URL_NON_POOLING` - Non-pooling connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_JWT_SECRET` - JWT secret for Supabase auth

#### AI Integration (xAI/Grok)
- `XAI_API_KEY` - xAI API key for Grok integration

#### Next.js Public Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase anonymous key
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Development redirect URL for auth

## Build & Deploy

### Option 1: Vercel Deployment (Recommended)

1. **Connect to Vercel**
   \`\`\`bash
   vercel
   \`\`\`

2. **Configure Environment Variables**
   - Go to your Vercel project settings
   - Add all environment variables from `.env.example`
   - Ensure Supabase and xAI integrations are connected

3. **Deploy**
   \`\`\`bash
   vercel --prod
   \`\`\`

### Option 2: Docker Deployment

1. **Build Docker Image**
   \`\`\`bash
   docker build -t supply-chain-tracker .
   \`\`\`

2. **Run Container**
   \`\`\`bash
   docker run -p 3000:3000 \
     -e POSTGRES_URL="your-postgres-url" \
     -e SUPABASE_URL="your-supabase-url" \
     -e XAI_API_KEY="your-xai-key" \
     supply-chain-tracker
   \`\`\`

3. **Docker Compose (Optional)**
   \`\`\`yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       env_file:
         - .env.local
       restart: unless-stopped
   \`\`\`

### Option 3: Manual Deployment

1. **Install Dependencies**
   \`\`\`bash
   pnpm install
   \`\`\`

2. **Build Application**
   \`\`\`bash
   pnpm build
   \`\`\`

3. **Start Production Server**
   \`\`\`bash
   pnpm start
   \`\`\`

## Security Considerations

### 1. Environment Variables
- Never commit `.env.local` or `.env.production` to version control
- Use Vercel's environment variable management for production
- Rotate API keys and secrets regularly

### 2. Database Security
- Enable Row Level Security (RLS) in Supabase
- Use service role key only in server-side code
- Implement proper authentication and authorization

### 3. API Security
- Rate limit API endpoints
- Validate all user inputs
- Use HTTPS in production (enforced by security headers)

### 4. Security Headers
The application includes the following security headers:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Strict-Transport-Security` - Enforces HTTPS
- `Referrer-Policy` - Controls referrer information
- `Permissions-Policy` - Restricts browser features

## Performance Optimization

### 1. Caching Strategy
- The app uses MemoryManager for client-side caching
- Cache is automatically invalidated on data changes
- Consider adding Redis for server-side caching in high-traffic scenarios

### 2. Database Optimization
- Index frequently queried fields (customer names, dates, etc.)
- Use connection pooling (already configured with Supabase)
- Monitor query performance and optimize slow queries

### 3. Build Optimization
- Static assets are optimized during build
- SWC minification is enabled
- Consider enabling ISR (Incremental Static Regeneration) for static pages

## Monitoring & Logging

### 1. Error Tracking
- Integrate Sentry or similar error tracking service
- Monitor console errors in production
- Set up alerts for critical errors

### 2. Performance Monitoring
- Use Vercel Analytics for performance insights
- Monitor Core Web Vitals
- Track API response times

### 3. Database Monitoring
- Monitor Supabase dashboard for query performance
- Set up alerts for connection pool exhaustion
- Track database size and growth

## Backup & Recovery

### 1. Database Backups
- Supabase provides automatic daily backups
- Consider implementing additional backup strategy for critical data
- Test restore procedures regularly

### 2. Data Export
- Use the built-in export functionality to backup data
- Store exports in secure, redundant storage
- Document recovery procedures

## Troubleshooting

### Build Failures
- Check TypeScript errors: `pnpm tsc --noEmit`
- Check ESLint errors: `pnpm lint`
- Verify all environment variables are set

### Runtime Errors
- Check browser console for client-side errors
- Check Vercel logs for server-side errors
- Verify database connection and credentials

### Performance Issues
- Clear browser cache and localStorage
- Check network tab for slow API calls
- Monitor database query performance

## Maintenance

### Regular Tasks
- Update dependencies monthly: `pnpm update`
- Review and rotate API keys quarterly
- Monitor security advisories for dependencies
- Test backup and restore procedures

### Scaling Considerations
- Monitor Vercel usage and upgrade plan if needed
- Consider database read replicas for high read traffic
- Implement CDN for static assets if serving globally

## Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Check Supabase documentation: https://supabase.com/docs
- Open an issue in the project repository
- Contact Vercel support: https://vercel.com/help

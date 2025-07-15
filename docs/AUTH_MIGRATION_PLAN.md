# Authentication Migration Plan

## Overview
This document outlines the step-by-step plan to migrate from our current custom authentication system to proper Supabase authentication while maintaining data integrity and minimal downtime.

## Current State Summary
- **Custom authentication** with hardcoded credentials
- **Custom users table** with deterministic UUID generation
- **RLS policies** using `auth.uid()::uuid` type casting
- **localStorage sessions** with expiry timestamps
- **Working database connectivity** with user isolation

## Migration Goals
1. **Security**: Replace hardcoded credentials with proper auth
2. **Scalability**: Enable user registration and management
3. **Features**: Add email verification, password reset, social auth
4. **Maintenance**: Reduce custom code and use Supabase standards
5. **Compatibility**: Maintain existing user data and sessions

## Phase 1: Preparation and Analysis ✅

### Completed Tasks
- [x] Document current authentication system
- [x] Analyze gaps and security issues
- [x] Create migration strategy document
- [x] Identify affected components and files

### Key Findings
- Current system works but has security vulnerabilities
- Database connectivity is solid with proper RLS policies
- User isolation is working correctly
- Notes and shopping lists are properly secured

## Phase 2: Foundation Setup

### 2.1 Environment Configuration
```bash
# Add to .env.local
VITE_ENABLE_SUPABASE_AUTH=true
VITE_DEVELOPMENT_AUTH_BYPASS=false  # Only for development
```

### 2.2 Database Schema Updates
```sql
-- 1. Create profiles table (follows Supabase pattern)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create profile policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2.3 Update RLS Policies (Remove Type Casting)
```sql
-- Update existing policies to use standard auth.uid()
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
CREATE POLICY "Users can view their own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own notes" ON notes;
CREATE POLICY "Users can create their own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Repeat for all tables: notes, shopping_lists, shopping_list_items
```

## Phase 3: Data Migration

### 3.1 User Migration Script
```sql
-- Create migration script to move custom users to auth.users
-- This is complex and may require custom logic
-- For now, we'll keep both systems in parallel
```

### 3.2 User ID Mapping
```typescript
// Create mapping service for existing users
export const createUserIdMapping = async () => {
  // Map existing custom user IDs to new Supabase auth IDs
  // This will be used during transition period
};
```

## Phase 4: Authentication Service Update

### 4.1 New Authentication Context
```typescript
// Create new SupabaseAuthContext.tsx
interface SupabaseAuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: ProfileUpdates) => Promise<void>;
}
```

### 4.2 Gradual Migration Strategy
```typescript
// Hybrid approach - support both systems during transition
export const useHybridAuth = () => {
  const [authMethod, setAuthMethod] = useState<'custom' | 'supabase'>('custom');
  
  // Check if user exists in Supabase auth
  // If not, use custom auth
  // If yes, use Supabase auth
};
```

## Phase 5: Implementation Steps

### 5.1 Backend Changes
1. **Update database schema** with new tables and policies
2. **Create migration scripts** for existing users
3. **Test RLS policies** without type casting
4. **Update database service** to handle both auth methods

### 5.2 Frontend Changes
1. **Create new auth context** with Supabase integration
2. **Update login/signup forms** with proper validation
3. **Add email verification** flow
4. **Implement password reset** functionality
5. **Update user profile** management

### 5.3 Testing Strategy
1. **Unit tests** for auth service functions
2. **Integration tests** for database operations
3. **E2E tests** for complete auth flows
4. **Security testing** for RLS policies

## Phase 6: Feature Enhancements

### 6.1 Email Verification
```typescript
// Add email verification flow
const verifyEmail = async (token: string) => {
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email'
  });
  return !error;
};
```

### 6.2 Password Reset
```typescript
// Add password reset functionality
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  return !error;
};
```

### 6.3 Social Authentication
```typescript
// Add social auth providers
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  return !error;
};
```

## Phase 7: Deployment Strategy

### 7.1 Development Environment
1. **Test migration** on development database
2. **Validate all features** work correctly
3. **Performance testing** with new auth system
4. **Security audit** of new implementation

### 7.2 Staging Environment
1. **Deploy to staging** with feature flags
2. **User acceptance testing** with real workflows
3. **Load testing** with concurrent users
4. **Security penetration testing**

### 7.3 Production Deployment
1. **Gradual rollout** with percentage-based feature flags
2. **Monitor error rates** and performance metrics
3. **Rollback plan** if issues arise
4. **User communication** about changes

## Phase 8: Post-Migration

### 8.1 Cleanup Tasks
1. **Remove custom auth code** after successful migration
2. **Drop custom users table** (after data verified)
3. **Update documentation** with new auth flows
4. **Remove hardcoded credentials** from codebase

### 8.2 Monitoring and Maintenance
1. **Set up auth monitoring** dashboards
2. **Configure alerts** for auth failures
3. **Regular security audits** of auth system
4. **User feedback** collection and improvements

## Timeline Estimate

### Sprint 1 (Current)
- [x] Document current system
- [x] Create migration plan
- [ ] Set up development environment
- [ ] Create database schema updates

### Sprint 2
- [ ] Implement new auth context
- [ ] Update database services
- [ ] Create migration scripts
- [ ] Basic email/password auth

### Sprint 3
- [ ] Add email verification
- [ ] Implement password reset
- [ ] User profile management
- [ ] Testing and debugging

### Sprint 4
- [ ] Social authentication
- [ ] Security enhancements
- [ ] Performance optimization
- [ ] Deployment preparation

### Sprint 5
- [ ] Staging deployment
- [ ] User acceptance testing
- [ ] Production deployment
- [ ] Monitoring and cleanup

## Risk Assessment

### High Risk Items
1. **Data loss** during user migration
2. **Service downtime** during deployment
3. **Authentication failures** breaking app functionality
4. **RLS policy issues** causing data leaks

### Mitigation Strategies
1. **Backup all data** before migration
2. **Feature flags** for gradual rollout
3. **Extensive testing** in staging environment
4. **Rollback procedures** for quick recovery

## Success Metrics

### Technical Metrics
- [ ] 100% of users can authenticate successfully
- [ ] 0 authentication-related security vulnerabilities
- [ ] < 2 second authentication response time
- [ ] 99.9% authentication uptime

### User Experience Metrics
- [ ] Email verification flow completion rate > 90%
- [ ] Password reset success rate > 95%
- [ ] User satisfaction with auth experience > 4.5/5
- [ ] Support tickets related to auth < 5% of total

## Conclusion

This migration plan provides a comprehensive approach to transitioning from our current custom authentication system to proper Supabase authentication. The phased approach minimizes risk while ensuring we maintain functionality throughout the transition.

The key to success will be thorough testing, gradual rollout, and maintaining backward compatibility during the migration period. Once complete, we'll have a secure, scalable authentication system that follows industry best practices.

## Next Steps

1. **Review and approve** this migration plan
2. **Set up development environment** for testing
3. **Begin Phase 2** database schema updates
4. **Schedule regular check-ins** to monitor progress
5. **Prepare rollback procedures** for safety

This migration will significantly improve the security and scalability of our authentication system while maintaining the excellent user experience we've built.
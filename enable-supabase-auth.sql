-- Enable Supabase Auth for Beta Project
-- Run this in your beta Supabase SQL Editor

-- Check current auth settings
SELECT 'Current auth settings:' as info;

-- Enable email confirmations (but make them optional for testing)
-- This needs to be done in the Supabase Dashboard → Authentication → Settings

-- For now, let's create some test users directly in auth.users
-- This bypasses the signup flow for testing

-- Insert test users into auth.users (for immediate testing)
-- Note: This is a workaround - normally users sign up through the auth flow

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
) VALUES 
-- Son's account
(
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'matthias.j.hall@icloud.com',
    crypt('BetaTest123!', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NOW(),
    '',
    '',
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"email_verified":true}',
    false,
    NOW(),
    NOW(),
    null,
    null,
    '',
    '',
    NOW(),
    '',
    0,
    null,
    '',
    NOW()
),
-- Daughter's account  
(
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 
    'authenticated',
    'vh77913@students.hcde.org',
    crypt('BetaTest123!', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NOW(),
    '',
    '',
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"email_verified":true}',
    false,
    NOW(),
    NOW(),
    null,
    null,
    '',
    '',
    NOW(),
    '',
    0,
    null,
    '',
    NOW()
)
ON CONFLICT (email) DO NOTHING;

SELECT '✅ Test users created in auth.users - they can now sign in!' as result;
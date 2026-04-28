# Supabase Authentication Setup Guide

## 1. Get Your Supabase Credentials

### From Supabase Dashboard:
1. Go to https://supabase.com
2. Sign in to your account
3. Select your project
4. Go to **Settings** → **API**
5. Copy:
   - `Project URL` → paste as `VITE_SUPABASE_URL`
   - `Anon/Public key` → paste as `VITE_SUPABASE_ANON_KEY`

## 2. Update .env.local

Replace the values in `d:/nids/nids/.env.local`:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 3. Enable Authentication Providers in Supabase

### Email/Password Auth:
1. Go to **Authentication** → **Providers**
2. Click "Email"
3. Toggle ON
4. Click Save

### Google OAuth:
1. Go to **Authentication** → **Providers**
2. Click "Google"
3. Toggle ON
4. Add your OAuth credentials from Google Cloud Console
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials (Web application)
   - Add redirect URL: `https://your-project-url.supabase.co/auth/v1/callback`

### GitHub OAuth:
1. Go to **Authentication** → **Providers**
2. Click "GitHub"
3. Toggle ON
4. Add your OAuth credentials from GitHub
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create New OAuth App
   - Authorization callback URL: `https://your-project-url.supabase.co/auth/v1/callback`

## 4. Database Setup (Optional)

To store additional user info, create a table:
```sql
CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

## 5. Test Authentication

1. Start your dev server: `npm run dev`
2. Navigate to `/login`
3. Try signing in with email/password or OAuth providers
4. After successful login, you should be redirected to `/dashboard`

## 6. Protect Routes (Optional)

Create a Protected Route component in `src/components/ProtectedRoute.tsx`:

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

Use in App.tsx:
```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## Troubleshooting

- **Environment variables not loading**: Restart dev server after updating .env.local
- **OAuth redirect not working**: Verify redirect URLs match exactly in Supabase and OAuth provider
- **Email sign up not working**: Check email confirmation in Supabase settings
- **CORS errors**: Add your domain to Supabase allowed origins in Authentication settings

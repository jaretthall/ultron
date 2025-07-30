import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import LoadingSpinner from '../LoadingSpinner';

const UpdatePasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  useEffect(() => {
    const verifyToken = async () => {
      if (!tokenHash || type !== 'recovery') {
        setError('Invalid or missing reset token. Please request a new password reset.');
        setVerifying(false);
        return;
      }

      if (!supabase) {
        setError('Authentication service not available.');
        setVerifying(false);
        return;
      }

      try {
        // Verify the OTP token
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        });

        if (error) {
          console.error('Token verification error:', error);
          setError('Invalid or expired reset token. Please request a new password reset.');
        } else {
          console.log('✅ Token verified successfully');
          // Token is valid, user can now reset password
        }
      } catch (error) {
        console.error('Token verification exception:', error);
        setError('An error occurred verifying your reset token. Please try again.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [tokenHash, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    if (!supabase) {
      setError('Authentication service not available.');
      setLoading(false);
      return;
    }

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        setError(error.message || 'Failed to update password. Please try again.');
      } else {
        console.log('✅ Password updated successfully');
        setSuccess(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    } catch (error) {
      console.error('Password update exception:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 text-center">
          <LoadingSpinner />
          <p className="text-slate-300 mt-4">Verifying reset token...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 text-center">
          <div className="text-green-400 text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-white mb-4">Password Updated!</h1>
          <p className="text-slate-300 mb-6">
            Your password has been successfully updated. You'll be redirected to the login page in a few seconds.
          </p>
          <button 
            onClick={() => navigate('/', { replace: true })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            ULTRON
          </h1>
          <p className="text-slate-400 mt-2">AI-Powered Productivity Command Center</p>
        </div>

        {/* Reset Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Reset Your Password</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your new password"
                required
                minLength={8}
                disabled={loading}
              />
              <p className="text-xs text-slate-400 mt-1">Must be at least 8 characters long</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your new password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Updating Password...</span>
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-600">
            <p className="text-slate-400 text-sm text-center">
              Remember your password?{' '}
              <button 
                onClick={() => navigate('/')}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
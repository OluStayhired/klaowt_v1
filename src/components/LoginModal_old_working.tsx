import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../auth';
import { getSavedCredentials } from '../utils/userOperations';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const debugLog = (message: string, data?: any) => {
  console.log(`[BlueSky Auth] ${message}`, data || '');
};

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(false);
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  // Check for saved credentials when modal opens
  useEffect(() => {
    async function checkSavedCredentials() {
      if (!isOpen || !identifier) return;
      
      setIsCheckingCredentials(true);
      try {
        const savedPassword = await getSavedCredentials(identifier.replace('@', ''));
        if (savedPassword) {
          setPassword(savedPassword);
          setRememberMe(true);
          debugLog('Found saved credentials');
        }
      } catch (err) {
        console.error('Error checking saved credentials:', err);
      } finally {
        setIsCheckingCredentials(false);
      }
    }

    checkSavedCredentials();
  }, [isOpen, identifier]);

// In LoginModal.tsx, add this function:
const fetchSavedCredentials = async (handle: string) => {
  if (!handle) return;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('app_password')
      .eq('handle', handle)
      .eq('remember_me', true)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // Ignore "no rows returned" error
        console.error('Error fetching saved credentials:', error);
      }
      return;
    }

    if (data?.app_password) {
      setPassword(data.app_password);
      setRememberMe(true);
    }
  } catch (err) {
    console.error('Error checking saved credentials:', err);
  }
};

  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setValidationError('');
      clearError();
    }
  }, [isOpen, clearError]);

  // Close modal on successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  const validateForm = () => {
    if (!password.trim()) {
      setValidationError('App password is required');
      return false;
    }
    if (password.length < 8) {
      setValidationError('App password must be at least 8 characters');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    debugLog('Login form submitted', { identifier });
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(identifier, password, rememberMe);
      debugLog('Login successful');
    } catch (err: any) {
      debugLog('Login failed in form handler', err);
      if (err.message?.includes('Invalid handle format')) {
        setValidationError(err.message);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          disabled={isLoading || isCheckingCredentials}
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold mb-6">Login to BlueSky</h2>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Important:</p>
              <ol className="list-decimal ml-4 mt-1 space-y-1">
                <li>Use your full BlueSky handle (e.g., @username.bsky.social)</li>
                <li>Create a new app password from <a
                  href="https://bsky.app/settings/app-passwords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >BlueSky Settings</a></li>
                <li>Do not use your account password</li>
              </ol>
            </div>
          </div>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-4"
          method="post"
          autoComplete="on"
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Handle
            </label>
            <input
              type="text"
              name="username"
              id="username"
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                 setIdentifier(e.target.value);
                 // Add debounce to avoid too many requests
                 if (e.target.value) {
                 const handle = e.target.value.replace(/^@+/, '');
                 fetchSavedCredentials(handle);
                  }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="@username.bsky.social"
              disabled={isLoading || isCheckingCredentials}
              required
            />
          </div>

          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
              App Password
            </label>
            <input
              type="password"
              name="current-password"
              id="current-password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your app password"
              disabled={isLoading || isCheckingCredentials}
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              disabled={isLoading || isCheckingCredentials}
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
              Remember me
            </label>
          </div>

          {(error || validationError) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{validationError || error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isCheckingCredentials}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center space-x-2"
          >
            {isLoading || isCheckingCredentials ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isCheckingCredentials ? 'Checking credentials...' : 'Logging in...'}</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../auth';
import { getSavedCredentials } from '../utils/userOperations';
import BlueskyLogo from '../images/bluesky-logo.svg';
// Add these imports at the top if not already present
import { supabase } from '../lib/supabase';

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

  // Add debounce utility at the top of LoginModal.tsx
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const MIN_HANDLE_LENGTH = 7; // Add constant at top of file
  
//Start New Check Credentials Service
// Separate credential check service
const credentialCheckService = {
  // AbortController instance for cancelling requests
  controller: new AbortController(),

  // Reset the controller
  resetController() {
    this.controller.abort();
    this.controller = new AbortController();
  },

  // Check credentials function
  async checkCredentials(handle: string) {
    if (!handle) return null;

    try {
      // Reset controller for new request
      this.resetController();

      const { data, error } = await supabase
        .from('users')
        .select('app_password')
        .eq('handle', handle)
        .eq('remember_me', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        throw error;
      }

      return data?.app_password || null;
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return null;
      }
      console.error('Error checking credentials:', err);
      return null;
    }
  },

  // Cleanup function
  cleanup() {
    this.controller.abort();
  }
};

// Debounced version of credential check
const debouncedCheckCredentials = debounce(async (handle: string, setPassword: (pwd: string) => void) => {
  if (!shouldCheckCredentials(handle)) return;

  const savedPassword = await credentialCheckService.checkCredentials(handle);
  if (savedPassword) {
    setPassword(savedPassword);
    setRememberMe(true);
  }
}, 500);

// Handle input change with credential check
const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newHandle = e.target.value; //.replace(/^@+/, '');

   let newValue = newHandle;
  
  // If user starts typing without @, add it
  if (newValue && !newValue.startsWith('@')) {
    newValue = '@' + newValue;
  }
  setIdentifier(newHandle);

  // Strip @ for credential checking
  const handleForCheck = newValue.replace(/^@+/, '');

  // Only check credentials if handle meets requirements
  if (shouldCheckCredentials(newHandle)) {
    debouncedCheckCredentials(newHandle, setPassword);
  }
};

// Cleanup on unmount
useEffect(() => {
  return () => {
    credentialCheckService.cleanup();
  };
}, []);

//End Check Credentials Service  


//  
// Add validation function
const shouldCheckCredentials = (handle: string) => {
    // Remove @ for validation
  const cleanHandle = handle.replace(/^@+/, '');
  return handle.length >= MIN_HANDLE_LENGTH && 
         handle.includes('.'); // Basic handle format check
};

// Add AbortController for request cancellation
const abortController = new AbortController();

// Cleanup function in useEffect
useEffect(() => {
  return () => {
    abortController.abort(); // Cancel pending requests on unmount
  };
}, []);

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

    // Strip @ before sending to API
  const cleanIdentifier = identifier.replace(/^@+/, '');
    
    //debugLog('Login form submitted', { identifier });
    
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
        <h2 className="text-2xl font-bold mb-6">Login to BlueSky <img src={BlueskyLogo} alt="Bluesky" className="inline-block w-5 h-5" />
        </h2>
         
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Important:</p>
              <ol className="list-decimal ml-4 mt-1 space-y-1">
                <li>Use your full BlueSky handle <br/> (e.g. @username.bsky.social)</li>
                <li>Create a new app password <a
                  href="https://bsky.app/settings/app-passwords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                ><u><b>on Bluesky</b></u></a></li>
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
              onChange={handleIdentifierChange}
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
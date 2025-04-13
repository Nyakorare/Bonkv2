import { IonContent, IonPage } from '@ionic/react';
import { FaFingerprint, FaInfoCircle } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // Check if user has an account
          const { data: accountData, error: accountError } = await supabase
            .from('accounts')
            .select('id')
            .eq('email', session.user.email)
            .single();

          if (accountError || !accountData) {
            throw new Error('Account not found');
          }

          // If user is already logged in, redirect to dashboard
          history.push('/dashboard');
        }
      } catch (err) {
        console.error('Session check failed:', err);
        // Clear any existing auth token on error
        localStorage.removeItem('authToken');
      }
    };

    checkSession();
  }, [history]);

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      
      // Validate inputs
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      // Check if user has an account
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('email', email)
        .single();

      if (accountError) {
        throw accountError;
      }

      if (!accountData) {
        throw new Error('Account not found. Please register first.');
      }

      // Store user session and redirect
      localStorage.setItem('authToken', data.session?.access_token || '');
      history.push('/loading');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent 
        fullscreen 
        scrollY={false}
        style={{
          '--overflow': 'hidden',
          'height': '100vh',
          'width': '100vw'
        }}
      >
        {/* Header - fixed height */}
        <div className="flex justify-center items-center p-6 bg-[#5EC95F] relative h-16">
          <h1 className="text-white text-xl font-bold absolute">BANK OF KEEPS</h1>
          <FaInfoCircle
            className="text-black text-2xl absolute right-4 cursor-pointer"
            onClick={() => history.push('/info')}
          />
        </div>
        
        {/* Main Content - fills remaining space */}
        <div className="flex flex-col justify-between bg-[#5EC95F]" style={{ height: 'calc(100vh - 64px)' }}>
          {/* Logo Section */}
          <div className="flex flex-col items-center pt-4">
            <img src="/bonk.png" alt="Bonk Logo" className="w-48 h-48" />
          </div>
          
          {/* Login Form - centered */}
          <div className="flex-1 flex flex-col justify-center items-center w-full px-8">
            <div className="w-full max-w-md">
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-4 w-full p-3 rounded-md bg-white text-black placeholder-gray-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-6 w-full p-3 rounded-md bg-white text-black placeholder-gray-500"
              />
              <button
                className="bg-[#2C2C2C] text-white font-bold py-3 px-6 rounded-md shadow-md mb-4 w-full"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <p className="text-blue-500 text-sm mb-6 text-center underline cursor-pointer">
                Forgot password?
              </p>
              <hr className="w-full border-t-2 border-white mb-6" />
              <div className="flex justify-center">
                <FaFingerprint className="text-black text-6xl" />
              </div>
            </div>
          </div>
          
          {/* Sign Up Section - fixed at bottom */}
          <div className="pb-6 text-center">
            <p className="text-white">
              Don't have an account?{' '}
              <span
                className="underline text-blue-500 cursor-pointer"
                onClick={() => history.push('/register')}
              >
                Sign up
              </span>
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
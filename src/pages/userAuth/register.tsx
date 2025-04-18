import { IonContent, IonPage } from '@ionic/react';
import { FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../../supabaseClient';

const Register: React.FC = () => {
  const history = useHistory();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      setError('Please fill in all fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    // Basic email validation
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    try {
      setError('');
      setLoading(true);

      if (!validateForm()) return;

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            email_confirmed: true
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('This email is already registered. Please try logging in instead.');
        } else if (error.message.includes('password')) {
          setError('Password must be at least 6 characters long');
        } else {
          setError(`Registration failed: ${error.message}`);
        }
        return;
      }

      if (!data.user) {
        setError('Registration failed. Please try again.');
        return;
      }

      // Generate a random account number
      const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

      // Create account - REMOVED password_hash field
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .insert({
          email: formData.email,
          account_number: accountNumber
        })
        .select()
        .single();

      if (accountError) {
        console.error('Account creation error:', accountError);
        throw new Error(`Database error saving new user: ${accountError.message}`);
      }

      // Create profile with default avatar
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          account_id: accountData.id,
          first_name: formData.fullName.split(' ')[0],
          last_name: formData.fullName.split(' ').slice(1).join(' '),
          avatar_url: '/default-profile.png'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Error creating profile: ${profileError.message}`);
      }

      // Create initial balance
      const { error: balanceError } = await supabase
        .from('balances')
        .insert({
          account_id: accountData.id,
          available_balance: 50.00,
          total_balance: 50.00
        });

      if (balanceError) {
        console.error('Balance creation error:', balanceError);
        throw new Error(`Error creating balance: ${balanceError.message}`);
      }

      // Create initial transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          account_id: accountData.id,
          amount: 50.00,
          transaction_type: 'deposit',
          description: 'Initial deposit',
          status: 'completed',
          reference_id: `INIT-${Date.now()}`
        });

      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
        throw new Error(`Error creating transaction: ${transactionError.message}`);
      }

      // Sign in the user immediately after registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        setError('Registration successful but login failed. Please try logging in manually.');
        history.push('/login');
        return;
      }

      // Redirect to dashboard on successful registration and login
      history.push('/dashboard');

    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during registration');
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
          'height': '100vh'
        }}
      >
        {/* Header - fixed height */}
        <div className="flex justify-center items-center p-4 bg-[#5EC95F] relative h-16">
          <FaArrowLeft
            className="text-black text-2xl absolute left-4 cursor-pointer"
            onClick={() => history.goBack()}
          />
          <h1 className="text-white text-xl font-bold">BANK OF KEEPS</h1>
        </div>

        {/* Main Content - fills remaining space */}
        <div className="flex flex-col justify-between bg-[#5EC95F]" style={{ height: 'calc(100vh - 64px)' }}>
          {/* Logo Section */}
          <div className="flex flex-col items-center pt-4">
            <img src="/bonk.png" alt="Bonk Logo" className="w-40 h-40" />
          </div>
          
          {/* Registration Form */}
          <div className="flex-1 flex flex-col justify-center items-center w-full px-6">
            <div className="w-full max-w-md space-y-4">
              {error && (
                <div className="p-2 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {/* Full Name */}
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-3 rounded-md bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4AB54B]"
              />

              {/* Email */}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 rounded-md bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4AB54B]"
              />

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4AB54B]"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4AB54B]"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              {/* Register Button */}
              <button
                className="w-full bg-[#2C2C2C] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#3C3C3C] transition-colors"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Register'}
              </button>
            </div>
          </div>
          
          {/* Sign In Link - fixed at bottom */}
          <div className="pb-6 text-center">
            <p className="text-white">
              Already have an account?{' '}
              <span
                className="underline text-blue-300 cursor-pointer hover:text-blue-200 transition-colors"
                onClick={() => history.push('/login')}
              >
                Sign in
              </span>
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;
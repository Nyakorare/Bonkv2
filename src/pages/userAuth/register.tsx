import { IonContent, IonPage, IonModal, IonAlert } from '@ionic/react';
import { FaArrowLeft, FaEye, FaEyeSlash, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const Register: React.FC = () => {
  const history = useHistory();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [formValid, setFormValid] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  // Check email availability
  useEffect(() => {
    const checkEmail = async () => {
      if (formData.email.includes('@')) {
        const { data, error } = await supabase
          .from('accounts')
          .select('email')
          .eq('email', formData.email)
          .single();
        
        setEmailAvailable(!data);
      }
    };

    const timer = setTimeout(() => {
      if (formData.email) checkEmail();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email]);

  // Validate form
  useEffect(() => {
    setFormValid(
      formData.email.length > 0 &&
      emailAvailable &&
      formData.fullName.length >= 2 &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword &&
      acceptedTerms
    );
  }, [formData, emailAvailable, acceptedTerms]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createAccountRecords = async (userId: string, email: string) => {
    try {
      const fullNameParts = formData.fullName.split(' ');
      const firstName = fullNameParts[0];
      const lastName = fullNameParts.length > 1 ? fullNameParts.slice(1).join(' ') : '';
      
      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          account_id: userId,
          first_name: firstName,
          last_name: lastName
        }]);

      if (profileError) throw profileError;

      // Create balance record with initial 50 pesos
      const { error: balanceError } = await supabase
        .from('balances')
        .insert([{
          account_id: userId,
          available_balance: 50.00,
          total_balance: 50.00
        }]);

      if (balanceError) throw balanceError;

      // Create initial transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          account_id: userId,
          amount: 50.00,
          transaction_type: 'deposit',
          description: 'Welcome bonus for new account',
          status: 'completed',
          reference_id: `WELCOME-${Date.now()}`
        }]);

      if (transactionError) throw transactionError;

      return true;
    } catch (error) {
      console.error('Error creating account records:', error);
      throw error;
    }
  };

  const handleRegister = async () => {
    try {
      setError('');
      setLoading(true);
  
      if (!formValid) {
        setError('Please fill in all fields correctly and accept the terms');
        return;
      }
  
      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
  
      if (authError) {
        console.error('Full auth error:', authError);
        if (authError.status === 400) {
          setError('Invalid email or password format');
        } else if (authError.message.includes('already registered')) {
          setError('This email is already registered. Please try logging in.');
        } else {
          setError(`Registration failed: ${authError.message}`);
        }
        setLoading(false);
        return;
      }
  
      // Step 2: Only proceed if we have a user
      if (authData.user) {
        try {
          await createAccountRecords(authData.user.id, formData.email);
          setEmailSent(true);
          setShowConfirmationModal(true);
        } catch (dbError) {
          console.error('Database error:', dbError);
          // Attempt to clean up auth user if DB fails
          await supabase.auth.admin.deleteUser(authData.user.id);
          setError('Failed to create account records. Please try again.');
        }
      } else {
        setError('Registration confirmation required. Please check your email.');
      }
  
      setLoading(false);
    } catch (err) {
      console.error('Full registration error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setShowConfirmationModal(false);
    history.push('/login');
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
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-md bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4AB54B] ${
                    !emailAvailable ? 'border-red-500' : ''
                  }`}
                />
                {!emailAvailable && (
                  <p className="text-xs text-red-500 mt-1">Email already registered</p>
                )}
              </div>

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
                  className={`w-full p-3 rounded-md bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4AB54B] ${
                    formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mr-2 accent-[#5EC95F]"
                />
                <label htmlFor="accept-terms" className="text-sm text-white">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    Terms & Privacy Policy
                  </button>
                </label>
              </div>
              
              {/* Register Button */}
              <button
                className="w-full bg-[#2C2C2C] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#3C3C3C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRegister}
                disabled={!formValid || loading}
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Register'}
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

        {/* Terms Modal */}
        <IonModal isOpen={showTerms} onDidDismiss={() => setShowTerms(false)}>
          <div className="h-full flex flex-col bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Terms & Privacy Policy</h2>
              <button
                onClick={() => setShowTerms(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaInfoCircle className="text-2xl" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-6 p-4 rounded-lg bg-gray-50">
              <h3 className="font-bold mb-2">Terms of Service</h3>
              <p className="mb-4 text-sm text-gray-600">
                By creating an account, you agree to our Terms of Service. You are responsible for maintaining 
                the confidentiality of your account and password. You agree to accept responsibility for all 
                activities that occur under your account.
              </p>
              
              <h3 className="font-bold mb-2">Privacy Policy</h3>
              <p className="text-sm text-gray-600">
                We collect personal information to provide and improve our service. Your data will be protected 
                and never sold to third parties. We may use your email to send important notifications about 
                your account or service updates.
              </p>
            </div>
            
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="accept-terms-modal"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mr-2 accent-[#5EC95F]"
              />
              <label htmlFor="accept-terms-modal" className="text-sm text-gray-600">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
            
            <button
              className="w-full bg-[#5EC95F] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#4AB54B] transition-colors"
              onClick={() => setShowTerms(false)}
            >
              Close
            </button>
          </div>
        </IonModal>

        {/* Confirmation Modal */}
        <IonModal isOpen={showConfirmationModal} backdropDismiss={false}>
          <div className="flex flex-col items-center justify-center h-full p-6 bg-white">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <FaCheckCircle className="text-[#5EC95F] text-6xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
              <p className="text-gray-600 mb-4">
                A confirmation email has been sent to <span className="font-semibold">{formData.email}</span>. 
                Please check your inbox and follow the instructions to verify your account.
              </p>
              <p className="text-gray-600 mb-6">
                Once verified, you'll receive ₱50.00 as a welcome bonus in your account!
              </p>
              <button
                className="w-full bg-[#5EC95F] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#4AB54B] transition-colors"
                onClick={handleGoToLogin}
              >
                Return to Login
              </button>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Register;
import { IonContent, IonPage } from '@ionic/react';
import { FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';

const Register: React.FC = () => {
  const history = useHistory();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
              {/* Username */}
              <input
                type="text"
                placeholder="Username"
                className="w-full p-3 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#4AB54B]"
              />

              {/* First Name and Last Name */}
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-1/2 p-3 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#4AB54B]"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-1/2 p-3 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#4AB54B]"
                />
              </div>

              {/* Email */}
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#4AB54B]"
              />

              {/* Address */}
              <input
                type="text"
                placeholder="Address"
                className="w-full p-3 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#4AB54B]"
              />
              
              {/* Password with toggle */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full p-3 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#4AB54B] pr-10"
                />
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
              
              {/* Confirm Password with toggle */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  className="w-full p-3 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#4AB54B] pr-10"
                />
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
              
              {/* Register Button */}
              <button
                className="w-full bg-[#2C2C2C] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#3C3C3C] transition-colors"
                onClick={() => history.push('/otp')}
              >
                Register
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
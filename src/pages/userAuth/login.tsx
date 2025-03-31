import { IonContent, IonPage } from '@ionic/react';
import { FaFingerprint, FaInfoCircle } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent 
        fullscreen 
        scrollY={false} // Disable scrolling
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
              <input
                type="email"
                placeholder="Email"
                className="mb-4 w-full p-3 rounded-md bg-white"
              />
              <input
                type="password"
                placeholder="Password"
                className="mb-6 w-full p-3 rounded-md bg-white"
              />
              <button
                className="bg-[#2C2C2C] text-white font-bold py-3 px-6 rounded-md shadow-md mb-4 w-full"
                onClick={() => {
                  localStorage.setItem('authToken', 'sampleToken');
                  window.location.href = '/loading';
                }}
              >
                Login
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

export default Home;
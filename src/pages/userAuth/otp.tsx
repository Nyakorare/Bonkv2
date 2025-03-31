import { IonContent, IonPage } from '@ionic/react';
import { FaArrowLeft } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import bonkLogo from '/bonk.png';
import otpIcon from '/otp.png';


const OtpPage: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent 
        scrollY={false} 
        className="overflow-hidden"
        style={{
          '--ion-safe-area-bottom': '0px', // Remove default safe area
          '--ion-background-color': '#5EC95F' // Set background color
        }}
      >
        {/* Header */}
        <div className="flex justify-center items-center p-6 bg-[#5EC95F] relative safe-area-top">
          <FaArrowLeft
            className="text-black text-2xl absolute left-4 cursor-pointer"
            onClick={() => history.goBack()}
          />
          <img
            src={bonkLogo}
            alt="Bonk Logo"
            className="absolute h-12"
          />
        </div>
        {/* Main Content */}
        <div className="flex flex-col justify-center items-center h-[calc(100vh-80px)] bg-[#5EC95F] safe-area-bottom">
          {/* OTP Icon */}
          <img src={otpIcon} alt="OTP Icon" className="w-24 h-24 mb-6" />
          {/* 6-Pin Input Box */}
          <div className="flex space-x-2 mb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                className="w-10 h-10 text-center text-lg font-bold border border-gray-300 rounded-md bg-white"
              />
            ))}
          </div>
          {/* Resend Confirmation */}
          <p className="text-white">
            Resend Confirmation?{' '}
            <span
              className="underline text-blue-500 cursor-pointer"
              onClick={() => alert('Resend OTP triggered')}
            >
              Click Here
            </span>
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OtpPage;
import { IonContent, IonPage, IonModal } from '@ionic/react';
import { FaArrowLeft, FaWallet, FaQrcode, FaUniversity, FaCreditCard, FaStore } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';

const Deposit: React.FC = () => {
  const history = useHistory();
  const [accountNumber] = useState('1234567890'); // Default account number
  const [showQRModal, setShowQRModal] = useState(false); // State for QR modal

  return (
    <IonPage style={{ height: '100%', width: '100%' }}>
      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': '#5EC95F',
          height: '100%',
          width: '100%',
        }}
      >
        {/* Header - fixed height */}
        <div className="flex justify-center items-center p-4 bg-[#5EC95F] relative h-16">
          <FaArrowLeft
            className="text-black text-2xl absolute left-4 cursor-pointer"
            onClick={() => history.goBack()}
          />
          <img src="/bonk.png" alt="Bonk Logo" className="h-14" />
        </div>

        {/* Main content area - scrollable */}
        <div className="flex flex-col bg-[#5EC95F] px-4 w-full min-h-[calc(100%-64px)] pb-4">
          {/* Account Balance Container */}
          <div className="bg-white rounded-lg shadow-lg p-4 w-full mb-4">
            <div className="text-gray-800 text-lg font-bold text-center">
              Account Balance:
            </div>
            <div className="text-gray-700 text-xl font-bold text-center mt-1">
              ₱0.00
            </div>
          </div>

          {/* White Container */}
          <div className="bg-white rounded-lg shadow-lg p-6 w-full mb-4 space-y-6">
            {/* Input Fields */}
            <div className="space-y-6">
              {/* Account Number Label */}
              <div className="text-center text-gray-800 font-bold">
                Account Number
              </div>
              {/* Account Number */}
              <div className="relative flex justify-center">
                <FaWallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={accountNumber}
                  readOnly
                  className="w-full max-w-md p-3 pl-10 rounded-md bg-[#2C2C2C] text-white focus:outline-none text-center"
                />
              </div>
            </div>
          </div>

          {/* QR code section - moved above Contacts */}
          <div className="bg-white rounded-lg shadow-lg p-4 w-full mb-4">
            <h2 className="text-gray-800 font-bold mb-2">Receive Money Through QR</h2>
            <div className="flex justify-center mb-2">
              <FaQrcode className="text-9xl text-gray-500" /> {/* Increased size */}
            </div>
            <button
              className="w-full flex items-center justify-center bg-[#2C2C2C] text-white font-bold py-2 px-6 rounded-md shadow-md hover:bg-[#3C3C3C] transition-colors"
              onClick={() => setShowQRModal(true)} // Open modal
            >
              Generate QR Code
            </button>
          </div>

          {/* Deposit Options Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 w-full">
            <h2 className="text-gray-800 font-bold mb-2">Deposit Options</h2>
            <div className="space-y-4">
              <button
                className="w-full bg-[#4AB54B] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#3A9B3A] transition-colors flex items-center justify-center space-x-2"
                onClick={() => alert('Bank Transfer selected')}
              >
                <FaUniversity className="text-white" />
                <span>Bank Transfer</span>
              </button>
              <button
                className="w-full bg-[#4AB54B] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#3A9B3A] transition-colors flex items-center justify-center space-x-2"
                onClick={() => alert('Credit/Debit Card selected')}
              >
                <FaCreditCard className="text-white" />
                <span>Credit/Debit Card</span>
              </button>
              <button
                className="w-full bg-[#4AB54B] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#3A9B3A] transition-colors flex items-center justify-center space-x-2"
                onClick={() => alert('Over the Counter selected')}
              >
                <FaStore className="text-white" />
                <span>Over the Counter</span>
              </button>
            </div>
          </div>
        </div>

        {/* QR Modal */}
        <IonModal isOpen={showQRModal} onDidDismiss={() => setShowQRModal(false)}>
          <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
            <FaQrcode className="text-9xl text-gray-500" />
            <button
              className="w-full bg-[#4AB54B] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#3A9B3A] transition-colors"
              onClick={() => alert('QR Code generated!')}
            >
              Generate QR Code
            </button>
            <button
              className="w-full bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-md shadow-md hover:bg-gray-400 transition-colors"
              onClick={() => setShowQRModal(false)} // Close modal
            >
              Close
            </button>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Deposit;
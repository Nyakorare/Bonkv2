import { IonContent, IonPage, IonModal } from '@ionic/react';
import { FaArrowLeft, FaWallet, FaMoneyBillWave, FaQrcode, FaStickyNote } from 'react-icons/fa';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';

const Withdraw: React.FC = () => {
  const history = useHistory();
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const generatedAccountNumber = '1234567890'; // Example generated account number
  const availableBalance = '₱0.00'; // Updated available balance

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
        <div className="flex flex-col bg-[#5EC95F] px-4 w-full min-h-[calc(100%-64px)] pb-4 overflow-y-auto">
          {/* Available Balance Container */}
          <div className="bg-white rounded-lg shadow-lg p-4 w-full mb-4">
            <div className="w-full p-3 rounded-md bg-gray-100 text-gray-700 text-center font-bold text-lg">
              Available Balance:
            </div>
            <div className="w-full p-3 rounded-md bg-gray-100 text-gray-700 text-center font-bold text-xl">
              {availableBalance}
            </div>
          </div>

          {/* White Container */}
          <div className="bg-white rounded-lg shadow-lg p-6 w-full mb-4 space-y-6">
            {/* Account Number Display */}
            <div className="space-y-6">
              {/* Account Number Label */}
              <div className="text-center font-bold text-gray-700">
                Account Number
              </div>
              <div className="relative">
                <FaWallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <div className="w-full p-3 pl-10 rounded-md bg-gray-100 text-gray-700 text-center">
                  {generatedAccountNumber}
                </div>
              </div>
            </div>

            {/* Withdrawal Input */}
            <div className="space-y-6">
              {/* Bank Selection Dropdown */}
              <div className="space-y-6">
                <div className="relative">
                  <select
                    className="w-full p-3 rounded-md bg-gray-100 text-gray-700 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="" disabled selected>
                      Select Bank
                    </option>
                    <option value="bank1">Bank 1</option>
                    <option value="bank2">Bank 2</option>
                    <option value="bank3">Bank 3</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Enter amount to withdraw"
                    className="w-full p-3 rounded-md bg-gray-100 text-gray-700 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes Input */}
            <div className="space-y-6">
              <div className="relative">
                <FaStickyNote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Add notes (optional)"
                  className="w-full p-3 pl-10 h-20 rounded-md bg-gray-100 text-gray-700 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            <button
              className="w-full bg-[#4CAF50] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#45A049] transition-colors flex items-center justify-center space-x-2"
              onClick={() => alert('Withdrawal initiated!')}
            >
              <FaMoneyBillWave className="text-xl" />
              <span>Withdraw Now</span>
            </button>
            <button
              className="w-full bg-[#2C2C2C] text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-[#3C3C3C] transition-colors flex items-center justify-center space-x-2"
              onClick={() => setShowModal(true)} // Show modal on click
            >
              <FaQrcode className="text-xl" />
              <span>Withdraw via QR</span>
            </button>
          </div>
        </div>

        {/* QR Code Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <div className="flex flex-col items-center justify-center h-full p-6 space-y-6 bg-white">
            {/* QR Code Icon */}
            <FaQrcode className="text-6xl text-gray-500" />
            {/* Generate QR Code Button */}
            <button
              className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-green-600 transition-colors"
              onClick={() => alert('QR Code generated!')}
            >
              Generate QR Code
            </button>
            {/* Close Button */}
            <button
              className="w-full bg-red-500 text-white font-bold py-3 px-6 rounded-md shadow-md hover:bg-red-600 transition-colors"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Withdraw;
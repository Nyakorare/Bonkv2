import { IonContent, IonPage, IonModal, IonButton } from '@ionic/react';
import { FaArrowLeft, FaUser, FaDollarSign, FaQrcode, FaCopy } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';

const Transfer: React.FC = () => {
  const history = useHistory();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{ name: string; account: string } | null>(null);

  const contacts = [
    { name: 'John', account: '1234567890' },
    { name: 'Jane', account: '9876543210' },
    { name: 'Doe', account: '1122334455' },
    { name: 'Alice', account: '5566778899' },
    { name: 'Bob', account: '9988776655' },
    { name: 'Charlie', account: '4433221100' },
  ];

  const handleContactClick = (contact: { name: string; account: string }) => {
    setSelectedContact(contact);
    setShowContactModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Account number copied to clipboard!');
  };

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

        {/* Main content area */}
        <div className="flex flex-col bg-[#5EC95F] px-4 w-full min-h-[calc(100%-64px)] pb-4">
          {/* Transfer Option */}
          <div className="bg-white rounded-lg shadow-lg p-4 w-full mb-4">
            <h2 className="text-gray-800 font-bold mb-4 text-center">Transfer</h2>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center border border-gray-300 rounded-lg p-2 bg-gray-100">
                <FaUser className="text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="Account Number"
                  className="flex-1 outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg p-2 bg-gray-100">
                <FaDollarSign className="text-gray-500 mr-2" />
                <input
                  type="number"
                  placeholder="Amount"
                  className="flex-1 outline-none bg-transparent"
                />
              </div>
              <button className="bg-[#5EC95F] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#4caf50] transition">
                Transfer
              </button>
            </div>
          </div>

          {/* Contacts Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 w-full mb-4">
            <h2 className="text-gray-800 font-bold mb-4 text-center">Contacts</h2>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                  onClick={() => handleContactClick(contact)}
                >
                  <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden">
                    <img src="/default-profile.png" alt={`${contact.name}'s profile`} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm mt-1 font-bold">{contact.name}</p>
                  <p className="text-xs text-gray-500">@{contact.name.toLowerCase()}_123</p>
                </div>
              ))}
            </div>
          </div>

          {/* QR Transfer Option */}
          <div className="bg-white rounded-lg shadow-lg p-4 w-full flex flex-col items-center">
            <h2 className="text-gray-800 font-bold mb-4 text-center">Transfer/Pay through QR</h2>
            <FaQrcode className="text-gray-500 text-8xl mb-4" />
            <button
              className="bg-[#5EC95F] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#4caf50] transition"
              onClick={() => setShowQRModal(true)}
            >
              Open QR Scanner
            </button>
          </div>
        </div>

        {/* QR Scanner Modal */}
        <IonModal isOpen={showQRModal} onDidDismiss={() => setShowQRModal(false)}>
          <div className="flex flex-col items-center justify-center h-full bg-white">
            <h2 className="text-gray-800 font-bold mb-4">Scan QR Code</h2>
            <FaQrcode className="text-gray-500 text-8xl mb-6" />
            <div className="w-64 h-64 bg-gray-300 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">[QR Scanner]</p>
            </div>
            <IonButton
              color="danger"
              onClick={() => setShowQRModal(false)}
              className="mt-6 w-40 text-center"
            >
              Close
            </IonButton>
          </div>
        </IonModal>

        {/* Contact Modal */}
        <IonModal isOpen={showContactModal} onDidDismiss={() => setShowContactModal(false)}>
          <div className="flex flex-col items-center justify-center h-full bg-white p-4">
            {selectedContact && (
              <>
                <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden mb-4">
                  <img src="/default-profile.png" alt={`${selectedContact.name}'s profile`} className="w-full h-full object-cover" />
                </div>
                <h2 className="text-gray-800 font-bold mb-2">{selectedContact.name}</h2>
                <div className="flex items-center space-x-2 mb-4">
                  <p className="text-gray-600">{selectedContact.account}</p>
                  <FaCopy
                    className="text-gray-500 cursor-pointer"
                    onClick={() => copyToClipboard(selectedContact.account)}
                  />
                </div>
                <IonButton
                  color="danger"
                  onClick={() => setShowContactModal(false)}
                  className="w-40 text-center"
                >
                  Close
                </IonButton>
              </>
            )}
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Transfer;

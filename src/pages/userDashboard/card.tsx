import { IonContent, IonPage, IonModal } from '@ionic/react';
import { FaArrowLeft, FaExchangeAlt, FaSnowflake, FaPlus } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';

const CardPage: React.FC = () => {
  const history = useHistory();
  const [isCardFrozen, setIsCardFrozen] = useState(false);
  const [hasCard, setHasCard] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);

  // Mock card data with pesos currency
  const cardData = {
    cardNumber: '•••• •••• •••• 4242',
    expiryDate: '09/25',
    cvv: '123',
    cardHolder: 'Juan Dela Cruz',
    cardType: 'VISA',
    balance: '₱0',
    transactions: [
      { id: 1, merchant: 'Lazada', amount: -2499.50, date: '2023-05-15', category: 'Shopping' },
      { id: 2, merchant: 'Starbucks', amount: -175.75, date: '2023-05-14', category: 'Food & Drink' },
      { id: 3, merchant: 'Salary', amount: 25000.00, date: '2023-05-01', category: 'Income' },
      { id: 4, merchant: 'Netflix', amount: -349.00, date: '2023-04-28', category: 'Entertainment' },
      { id: 5, merchant: 'Petron', amount: -1500.00, date: '2023-04-25', category: 'Transportation' },
    ]
  };

  const toggleFreezeCard = () => {
    setIsCardFrozen(!isCardFrozen);
  };

  const createNewCard = () => {
    if (!hasCard) {
      setHasCard(true);
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
        <div className="flex justify-center items-center p-4 bg-[#5EC95F] sticky top-0 z-10 h-16">
          <FaArrowLeft
            className="absolute left-4 text-black text-2xl cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => history.push('/dashboard')}
          />
          <div>
          <img src="/bonk.png" alt="Bonk Logo" className="h-14" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col bg-gradient-to-b from-[#5EC95F] to-[#4AB54B]" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="flex-1 overflow-y-auto">
            {/* Title */}
            <div className="px-4 pt-4">
              <div className="flex items-center justify-center mb-2">
                <h1 className="text-2xl font-bold text-black">My Card</h1>
              </div>
            </div>

            {/* Card Display Section */}
            <div className="px-4 py-2">
              <div className={`relative rounded-2xl shadow-xl p-5 h-52 ${isCardFrozen ? 'bg-gray-400' : 'bg-gradient-to-r from-[#434343] to-[#000000]'}`}>
                {isCardFrozen && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 rounded-2xl flex items-center justify-center">
                    <div className="text-white text-2xl font-bold">CARD FROZEN</div>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div className="text-white text-lg font-bold">BANK OF KEEPS</div>
                  <div className="text-white text-lg font-bold">{cardData.cardType}</div>
                </div>
                
                <div className="mt-8 mb-4">
                  <div className="text-gray-300 text-sm">Card Number</div>
                  <div className="text-white text-xl font-mono tracking-wider">{cardData.cardNumber}</div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-gray-300 text-sm">Card Holder</div>
                    <div className="text-white text-lg">{cardData.cardHolder}</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-sm">Expires</div>
                    <div className="text-white text-lg">{cardData.expiryDate}</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-sm">CVV</div>
                    <div className="text-white text-lg">•••</div>
                  </div>
                </div>
              </div>
              
              {/* Balance Display */}
              <div className="bg-white rounded-xl shadow-lg p-4 mt-4">
                <div className="text-gray-600 text-sm">Available Balance</div>
                <div className="text-3xl font-bold text-[#5EC95F]">{cardData.balance}</div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="px-4 grid grid-cols-3 gap-3 mt-4">
              <button 
                className={`flex flex-col items-center justify-center p-3 rounded-xl ${isCardFrozen ? 'bg-red-100 text-red-600' : 'bg-white text-gray-800'}`}
                onClick={toggleFreezeCard}
              >
                <FaSnowflake className="text-xl mb-1" />
                <span className="text-xs font-medium">{isCardFrozen ? 'Unfreeze' : 'Freeze'}</span>
              </button>
              
              <button 
                className="flex flex-col items-center justify-center bg-white p-3 rounded-xl text-gray-800"
                onClick={() => setShowTransactions(true)}
              >
                <FaExchangeAlt className="text-xl mb-1" />
                <span className="text-xs font-medium">Transactions</span>
              </button>
              
              <button 
                className={`flex flex-col items-center justify-center p-3 rounded-xl ${hasCard ? 'bg-gray-200 text-gray-400' : 'bg-white text-gray-800'}`}
                onClick={createNewCard}
                disabled={hasCard}
              >
                <FaPlus className="text-xl mb-1" />
                <span className="text-xs font-medium">New Card</span>
              </button>
            </div>

            {/* Recent Transactions Preview */}
            <div className="px-4 py-4 mt-2">
              <h2 className="text-white text-xl font-bold mb-3">Recent Card Transactions</h2>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {cardData.transactions.slice(0, 3).map((txn) => (
                  <div key={txn.id} className="p-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{txn.merchant}</div>
                        <div className="text-gray-500 text-xs">{txn.date}</div>
                      </div>
                      <div className={`font-bold ${txn.amount > 0 ? 'text-[#5EC95F]' : 'text-red-500'}`}>
                        {txn.amount > 0 ? '+' : ''}₱{Math.abs(txn.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
                <div 
                  className="p-3 text-center text-[#5EC95F] font-medium cursor-pointer"
                  onClick={() => setShowTransactions(true)}
                >
                  View All Transactions
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Modal */}
          <IonModal isOpen={showTransactions} onDidDismiss={() => setShowTransactions(false)}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold">Transaction History</h2>
                <button 
                  onClick={() => setShowTransactions(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {cardData.transactions.map((txn) => (
                  <div key={txn.id} className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{txn.merchant}</div>
                        <div className="text-gray-500 text-sm">{txn.category}</div>
                        <div className="text-gray-400 text-xs mt-1">{txn.date}</div>
                      </div>
                      <div className={`text-lg font-bold ${txn.amount > 0 ? 'text-[#5EC95F]' : 'text-red-500'}`}>
                        {txn.amount > 0 ? '+' : ''}₱{Math.abs(txn.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CardPage;
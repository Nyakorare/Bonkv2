import { IonContent, IonPage, IonModal, IonAlert, IonLoading } from '@ionic/react';
import { FaArrowLeft, FaExchangeAlt, FaSnowflake, FaTrash, FaCreditCard, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface CardTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  reference_id: string;
}

interface Card {
  id: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
  card_holder: string;
  card_type: string;
  balance: number;
  is_frozen: boolean;
}

const CardPage: React.FC = () => {
  const history = useHistory();
  const [isCardFrozen, setIsCardFrozen] = useState(false);
  const [hasCard, setHasCard] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<Card | null>(null);
  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [accountBalance, setAccountBalance] = useState(0);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch card data and transactions
  useEffect(() => {
    fetchCardData();
  }, []);

  const fetchCardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        history.push('/login');
        return;
      }

      // Get the user's account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('email', user.email)
        .single();

      if (accountError) throw accountError;
      if (!account) throw new Error('No account found');

      // Get the user's balance from the balances table
      const { data: balanceData, error: balanceError } = await supabase
        .from('balances')
        .select('available_balance')
        .eq('account_id', account.id)
        .single();

      if (balanceError) throw balanceError;
      if (!balanceData) throw new Error('Balance not found');

      setAccountBalance(balanceData.available_balance);

      // Check if user has a card
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .select('*')
        .eq('account_id', account.id)
        .single();

      if (cardError && cardError.code !== 'PGRST116') {
        throw cardError;
      }

      if (card) {
        setHasCard(true);
        setCardData(card);
        setIsCardFrozen(card.is_frozen);
        
        // Fetch card transactions
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('account_id', account.id)
          .eq('transaction_type', 'card')
          .order('created_at', { ascending: false });

        if (transactionsError) throw transactionsError;
        setCardTransactions(transactions || []);
      } else {
        setHasCard(false);
      }
    } catch (err) {
      console.error('Error fetching card data:', err);
      setError('Failed to load card information');
    } finally {
      setLoading(false);
    }
  };

  const toggleFreezeCard = async () => {
    if (!cardData) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cards')
        .update({ is_frozen: !isCardFrozen })
        .eq('id', cardData.id);
      
      if (error) throw error;
      
    setIsCardFrozen(!isCardFrozen);
      setSuccessMessage(`Card ${!isCardFrozen ? 'frozen' : 'unfrozen'} successfully`);
      setShowSuccessAlert(true);
    } catch (err) {
      console.error('Error toggling card freeze:', err);
      setError('Failed to update card status');
    } finally {
      setLoading(false);
    }
  };

  const createNewCard = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        history.push('/login');
        return;
      }

      // Get the user's account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('email', user.email)
        .single();

      if (accountError) throw accountError;
      if (!account) throw new Error('No account found');

      // Generate a random card number (last 4 digits)
      const lastFourDigits = Math.floor(1000 + Math.random() * 9000).toString();
      const fullCardNumber = `1234 5678 9012 ${lastFourDigits}`;
      
      // Generate expiry date (2 years from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);
      const formattedExpiryDate = `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(-2)}`;
      
      // Generate CVV
      const cvv = Math.floor(100 + Math.random() * 900).toString();
      
      // Create new card
      const { data: newCard, error: createError } = await supabase
        .from('cards')
        .insert({
          account_id: account.id,
          card_number: fullCardNumber,
          expiry_date: formattedExpiryDate,
          cvv: cvv,
          card_holder: `${user.user_metadata?.first_name || 'User'} ${user.user_metadata?.last_name || ''}`,
          card_type: 'VISA',
          balance: 0,
          is_frozen: false
        })
        .select()
        .single();

      if (createError) throw createError;
      
      setCardData(newCard);
      setHasCard(true);
      setShowCreateCardModal(false);
      setSuccessMessage('Card created successfully');
      setShowSuccessAlert(true);
    } catch (err) {
      console.error('Error creating card:', err);
      setError('Failed to create card');
    } finally {
      setLoading(false);
    }
  };

  const deleteCard = async () => {
    if (!cardData) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardData.id);
      
      if (error) throw error;
      
      setHasCard(false);
      setCardData(null);
      setShowDeleteConfirm(false);
      setSuccessMessage('Card deleted successfully');
      setShowSuccessAlert(true);
    } catch (err) {
      console.error('Error deleting card:', err);
      setError('Failed to delete card');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const maskCardNumber = (cardNumber: string) => {
    const lastFourDigits = cardNumber.slice(-4);
    return `•••• •••• •••• ${lastFourDigits}`;
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

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <IonLoading isOpen={true} message="Loading..." />
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl shadow-lg p-4 mx-4 mt-4">
                <p className="text-red-500 text-center">{error}</p>
              </div>
            ) : hasCard && cardData ? (
              <>
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
                      <div className="text-white text-lg font-bold">{cardData.card_type}</div>
                </div>
                
                <div className="mt-8 mb-4">
                  <div className="text-gray-300 text-sm">Card Number</div>
                      <div className="text-white text-xl font-mono tracking-wider">
                        {showCardDetails ? cardData.card_number : maskCardNumber(cardData.card_number)}
                      </div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-gray-300 text-sm">Card Holder</div>
                        <div className="text-white text-lg">{cardData.card_holder}</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-sm">Expires</div>
                        <div className="text-white text-lg">{cardData.expiry_date}</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-sm">CVV</div>
                    <div className="text-white text-lg">{showCardDetails ? cardData.cvv : '•••'}</div>
                  </div>
                </div>
                
                {/* Eye button to toggle card details visibility */}
                <button 
                  className="absolute top-2 right-2 text-white bg-black bg-opacity-30 rounded-full p-2"
                  onClick={() => setShowCardDetails(!showCardDetails)}
                >
                  {showCardDetails ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              {/* Balance Display */}
              <div className="bg-white rounded-xl shadow-lg p-4 mt-4">
                <div className="text-gray-600 text-sm">Available Balance</div>
                    <div className="text-3xl font-bold text-[#5EC95F]">{formatCurrency(accountBalance)}</div>
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
                <span className="text-xs font-medium">Card Transactions</span>
              </button>
              
              <button 
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-100 text-red-600"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <FaTrash className="text-xl mb-1" />
                <span className="text-xs font-medium">Delete Card</span>
              </button>
            </div>

            {/* Recent Transactions Preview */}
            <div className="px-4 py-4 mt-2">
              <h2 className="text-white text-xl font-bold mb-3">Recent Card Transactions</h2>
                  {cardTransactions.length > 0 ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      {cardTransactions.slice(0, 3).map((txn) => (
                  <div key={txn.id} className="p-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <div>
                              <div className="font-medium">{txn.description}</div>
                              <div className="text-gray-500 text-xs">{formatDate(txn.created_at)}</div>
                      </div>
                      <div className={`font-bold ${txn.amount > 0 ? 'text-[#5EC95F]' : 'text-red-500'}`}>
                              {txn.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
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
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg p-4 text-center text-gray-500">
                      No card transactions yet
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="px-4 py-8 flex flex-col items-center justify-center">
                <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md">
                  <FaCreditCard className="text-5xl text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-800 mb-2">No Card Yet</h2>
                  <p className="text-gray-600 mb-6">Create a virtual card to make online purchases and manage your spending.</p>
                  <button 
                    className="bg-[#5EC95F] text-white py-3 px-6 rounded-xl font-bold w-full"
                    onClick={() => setShowCreateCardModal(true)}
                  >
                    Create Card
                  </button>
              </div>
            </div>
            )}
          </div>

          {/* Transactions Modal */}
          <IonModal isOpen={showTransactions} onDidDismiss={() => setShowTransactions(false)}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold">Card Transaction History</h2>
                <button 
                  onClick={() => setShowTransactions(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {cardTransactions.length > 0 ? (
                  cardTransactions.map((txn) => (
                  <div key={txn.id} className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                          <div className="font-medium">{txn.description}</div>
                          <div className="text-gray-500 text-sm">{txn.status}</div>
                          <div className="text-gray-400 text-xs mt-1">{formatDate(txn.created_at)}</div>
                      </div>
                      <div className={`text-lg font-bold ${txn.amount > 0 ? 'text-[#5EC95F]' : 'text-red-500'}`}>
                          {txn.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No card transactions found
                  </div>
                )}
              </div>
            </div>
          </IonModal>

          {/* Create Card Modal */}
          <IonModal isOpen={showCreateCardModal} onDidDismiss={() => setShowCreateCardModal(false)}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold">Create Virtual Card</h2>
                <button 
                  onClick={() => setShowCreateCardModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-xl shadow-lg p-5 mb-4">
                  <h3 className="text-lg font-bold mb-4">Card Details</h3>
                  <p className="text-gray-600 mb-4">
                    You are about to create a virtual card. This card will be linked to your account and can be used for online purchases.
                  </p>
                  <p className="text-gray-600 mb-4">
                    <strong>Note:</strong> You can only have one virtual card per account.
                  </p>
                </div>
                
                <button 
                  className="w-full bg-[#5EC95F] text-white py-4 rounded-xl font-bold"
                  onClick={createNewCard}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Card'}
                </button>
              </div>
            </div>
          </IonModal>

          {/* Delete Card Confirmation Modal */}
          <IonModal isOpen={showDeleteConfirm} onDidDismiss={() => setShowDeleteConfirm(false)}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold">Delete Card</h2>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-xl shadow-lg p-5 mb-4">
                  <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to delete your virtual card? This action cannot be undone.
                  </p>
                  <p className="text-gray-600 mb-4">
                    <strong>Warning:</strong> You will need to create a new card if you want to use virtual card features again.
                  </p>
                </div>
                
                <button 
                  className="w-full bg-red-500 text-white py-4 rounded-xl font-bold"
                  onClick={deleteCard}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete Card'}
                </button>
              </div>
            </div>
          </IonModal>

          {/* Success Alert */}
          <IonAlert
            isOpen={showSuccessAlert}
            onDidDismiss={() => setShowSuccessAlert(false)}
            header="Success"
            message={successMessage}
            buttons={['OK']}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CardPage;
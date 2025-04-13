import { IonContent, IonPage } from '@ionic/react';
import { FaChevronDown, FaArrowLeft } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer';
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  reference_id: string;
}

const TransactionHistory: React.FC = () => {
  const history = useHistory();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [selectedFilter, startDate, endDate]);

  const fetchTransactions = async () => {
    try {
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

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false });

      // Apply type filter
      if (selectedFilter !== 'all') {
        query = query.eq('transaction_type', selectedFilter);
      }

      // Apply date range filter
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'withdrawal', label: 'Withdrawals' }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <IonPage>
      <IonContent 
        style={{
          '--ion-background-color': '#ffffff',
          'height': '100vh',
          'overflow': 'hidden'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-center items-center p-4 bg-[#5EC95F] relative h-16">
            <FaArrowLeft
              className="text-black text-2xl absolute left-4 cursor-pointer"
              onClick={() => history.goBack()}
            />
            <img src="/bonk.png" alt="Bonk Logo" className="h-14" />
          </div>

          {/* Title and Filters Container */}
          <div className="bg-white p-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Transaction History</h1>
            
            {/* Filter Buttons */}
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    selectedFilter === filter.id
                      ? 'bg-[#5EC95F] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Date Filter */}
            <div className="flex space-x-2 mb-4">
              <div className="flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
                  placeholder="Start Date"
                />
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
                  placeholder="End Date"
                />
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading transactions...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No transactions found</p>
              </div>
            ) : (
              transactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-lg shadow-md p-4 mb-2"
                >
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleExpand(index)}
                  >
                    <div>
                      <span className="text-md text-gray-600">{transaction.description}</span>
                      <div className="text-sm text-gray-400">{formatDate(transaction.created_at)}</div>
                    </div>
                    <div className="flex items-center">
                      <span 
                        className={`text-md font-bold ${
                          transaction.transaction_type === 'deposit' ? 'text-green-500' : transaction.transaction_type === 'withdrawal' ? 'text-red-500' : 'text-blue-500'
                        }`}
                      >
                        ₱ {Math.abs(transaction.amount).toFixed(2)}
                      </span>
                      <FaChevronDown 
                        className={`ml-2 transition-transform ${
                          expandedIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                  {expandedIndex === index && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Status: {transaction.status}</p>
                      <p>Type: {transaction.transaction_type}</p>
                      <p>Reference: {transaction.reference_id}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TransactionHistory;
import { IonContent, IonPage } from '@ionic/react';
import { useState } from 'react';
import { FaChevronDown, FaArrowLeft } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';

const TransactionHistory: React.FC = () => {
    const history = useHistory();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const transactions = Array.from({ length: 10 }).map((_, i) => ({
        id: i + 1,
        description: `Transaction ${i + 1}`,
        amount: (i + 1) * 100 * (i % 2 === 0 ? 1 : -1), // Alternate positive and negative amounts
        date: `2023-10-${i + 1}`,
        details: `Details for Transaction ${i + 1}`
    }));

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'deposit', label: 'Deposits' },
        { id: 'withdraw', label: 'Withdrawals' },
        { id: 'transfer', label: 'Transfers' }
    ];

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
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
                        {transactions.map((transaction, index) => (
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
                                        <div className="text-sm text-gray-400">{transaction.date}</div>
                                    </div>
                                    <div className="flex items-center">
                                        <span 
                                            className={`text-md font-bold ${
                                                transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
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
                                        {transaction.details}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default TransactionHistory;
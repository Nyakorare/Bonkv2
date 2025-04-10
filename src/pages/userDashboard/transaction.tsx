import { IonContent, IonPage } from '@ionic/react';
import { useState } from 'react';
import { FaChevronDown, FaArrowLeft } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';

const TransactionHistory: React.FC = () => {
    const history = useHistory();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const transactions = Array.from({ length: 10 }).map((_, i) => ({
        id: i + 1,
        description: `Transaction ${i + 1}`,
        amount: (i + 1) * 100 * (i % 2 === 0 ? 1 : -1), // Alternate positive and negative amounts
        date: `2023-10-${i + 1}`,
        details: `Details for Transaction ${i + 1}`
    }));

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
                    <div className="bg-[#5EC95F] p-4">
                        {/* Title */}
                        <div className="text-center text-xl font-bold text-white">
                            Transaction History
                        </div>

                        {/* Filters */}
                        <div className="flex justify-center mt-2 space-x-4">
                            {/* Date Filter */}
                            <input 
                                type="date" 
                                className="border border-gray-200 rounded-md p-2 text-sm text-black"
                                onChange={(e) => console.log('Selected date:', e.target.value)} 
                            />
                            {/* Transaction Type Filter */}
                            <select 
                                className="border border-gray-200 rounded-md p-2 text-sm text-black"
                                onChange={(e) => console.log('Selected type:', e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
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
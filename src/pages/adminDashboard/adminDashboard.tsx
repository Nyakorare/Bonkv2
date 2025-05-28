import { IonContent, IonPage, IonLoading, IonAlert, IonModal } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaSearch, FaUsers, FaHistory, FaCheck, FaTimes, FaSignOutAlt, FaUserCircle, FaMoneyBillWave, FaExchangeAlt } from 'react-icons/fa';
import bonkLogo from '/bonk.png';

interface Transaction {
    id: number;
    account_id: string;
    amount: number;
    transaction_type: string;
    description: string;
    status: string;
    reference_id: string;
    created_at: string;
    account: {
        account_number: string;
        email: string;
    };
}

interface User {
    id: string;
    email: string;
    account_number: string;
    first_name: string;
    last_name: string;
    available_balance: number;
    total_balance: number;
}

interface TransactionHistory extends Transaction {
    account: {
        account_number: string;
        email: string;
    };
}

const AdminDashboard: React.FC = () => {
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTransactions: 0
    });
    const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [showTransactionsModal, setShowTransactionsModal] = useState(false);
    const [allTransactions, setAllTransactions] = useState<TransactionHistory[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user || user.email !== 'gamerboy282004@yahoo.com') {
                history.push('/home');
                return;
            }

            await Promise.all([
                fetchDashboardStats(),
                fetchPendingTransactions()
            ]);
        } catch (err) {
            console.error('Error checking admin access:', err);
            setError('Access denied');
            history.push('/home');
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            // Get total users count
            const { count: usersCount } = await supabase
                .from('accounts')
                .select('*', { count: 'exact', head: true });

            // Get total transactions count
            const { count: transactionsCount } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true });

            setStats({
                totalUsers: usersCount || 0,
                totalTransactions: transactionsCount || 0
            });
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError('Failed to load dashboard statistics');
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('accounts')
                .select(`
                    id,
                    email,
                    account_number,
                    profiles(first_name, last_name),
                    balances(available_balance, total_balance)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedUsers = data.map(user => ({
                id: user.id,
                email: user.email,
                account_number: user.account_number,
                first_name: user.profiles?.[0]?.first_name || '',
                last_name: user.profiles?.[0]?.last_name || '',
                available_balance: user.balances?.[0]?.available_balance || 0,
                total_balance: user.balances?.[0]?.total_balance || 0
            }));

            setUsers(formattedUsers);
            setShowUsersModal(true);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        }
    };

    const fetchPendingTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    account:accounts(account_number, email)
                `)
                .not('status', 'eq', 'completed')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendingTransactions(data || []);
        } catch (err) {
            console.error('Error fetching pending transactions:', err);
            setError('Failed to load pending transactions');
        }
    };

    const fetchAllTransactions = async () => {
        try {
            setIsLoadingTransactions(true);
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    account:accounts(account_number, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllTransactions(data || []);
            setShowTransactionsModal(true);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError('Failed to load transactions');
        } finally {
            setIsLoadingTransactions(false);
        }
    };

    const filteredTransactions = allTransactions.filter(transaction =>
        transaction.reference_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleTransactionAction = async (transactionId: number, action: 'approve' | 'reject') => {
        try {
            setIsProcessing(true);
            const transaction = pendingTransactions.find(t => t.id === transactionId);
            if (!transaction) throw new Error('Transaction not found');

            if (action === 'approve') {
                // Update transaction status
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update({ status: 'completed' })
                    .eq('id', transactionId);

                if (updateError) throw updateError;

                // Update account balance
                const { error: balanceError } = await supabase
                    .from('balances')
                    .update({
                        available_balance: transaction.amount,
                        total_balance: transaction.amount
                    })
                    .eq('account_id', transaction.account_id);

                if (balanceError) throw balanceError;
            } else {
                // Reject transaction
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update({ status: 'rejected' })
                    .eq('id', transactionId);

                if (updateError) throw updateError;
            }

            // Refresh data
            await Promise.all([
                fetchDashboardStats(),
                fetchPendingTransactions()
            ]);

            setShowTransactionModal(false);
            setSelectedTransaction(null);
        } catch (err) {
            console.error('Error processing transaction:', err);
            setError(err instanceof Error ? err.message : 'Failed to process transaction');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            history.push('/home');
        } catch (err) {
            console.error('Error logging out:', err);
            setError('Failed to log out');
        }
    };

    if (loading) {
        return (
            <IonPage>
                <IonLoading isOpen={true} message="Loading..." />
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonContent fullscreen>
                {/* Header */}
                <div className="flex justify-between items-center p-4 bg-[#5EC95F] relative">
                    <div className="absolute left-4">
                        <h1 className="text-white text-xl font-bold flex items-center">
                            <FaUserCircle className="mr-2" /> Admin Dashboard
                        </h1>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <img src={bonkLogo} alt="Bonk Logo" className="h-8 w-8" />
                    </div>
                    <div className="absolute right-4">
                        <button
                            onClick={handleLogout}
                            className="bg-white text-[#5EC95F] px-4 py-2 rounded-lg font-medium flex items-center"
                        >
                            <FaSignOutAlt className="mr-2" /> Logout
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-4 bg-[#5EC95F] min-h-[calc(100vh-64px)]">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-xl shadow-lg p-4">
                            <h3 className="text-gray-600 text-sm flex items-center">
                                <FaUsers className="mr-2" /> Total Users
                            </h3>
                            <p className="text-2xl font-bold text-black">{stats.totalUsers}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-4">
                            <h3 className="text-gray-600 text-sm flex items-center">
                                <FaMoneyBillWave className="mr-2" /> Total Transactions
                            </h3>
                            <p className="text-2xl font-bold text-black">{stats.totalTransactions}</p>
                        </div>
                    </div>

                    {/* Pending Transactions */}
                    <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                        <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                            <FaExchangeAlt className="mr-2" /> Non-Completed Transactions
                        </h2>
                        {pendingTransactions.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No pending transactions</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingTransactions.map((transaction) => (
                                            <tr key={transaction.id} className="border-t">
                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                    {new Date(transaction.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                    {transaction.account.account_number}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-900 capitalize">
                                                    {transaction.transaction_type}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                    ₱{Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                    {transaction.description}
                                                </td>
                                                <td className="px-4 py-2 text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        transaction.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {transaction.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-sm">
                                                    {transaction.status === 'pending' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTransaction(transaction);
                                                                setShowTransactionModal(true);
                                                            }}
                                                            className="text-[#5EC95F] hover:text-[#4CAF50] font-medium"
                                                        >
                                                            Review
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Admin Actions */}
                    <div className="bg-white rounded-xl shadow-lg p-4">
                        <h2 className="text-xl font-bold text-black mb-4">Admin Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                className="bg-[#5EC95F] text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center"
                                onClick={fetchUsers}
                            >
                                <FaUsers className="mr-2" /> Manage Users
                            </button>
                            <button
                                className="bg-[#5EC95F] text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center"
                                onClick={fetchAllTransactions}
                            >
                                <FaHistory className="mr-2" /> View All Transactions
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transaction Review Modal */}
                <IonModal isOpen={showTransactionModal} onDidDismiss={() => {
                    setShowTransactionModal(false);
                    setSelectedTransaction(null);
                }}>
                    <div className="p-6 bg-[#5EC95F] min-h-full">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                            <FaExchangeAlt className="mr-2" /> Review Transaction
                        </h2>
                        {selectedTransaction && (
                            <div className="space-y-4 bg-white rounded-xl p-4">
                                <div>
                                    <p className="text-gray-600">Account Number</p>
                                    <p className="font-medium">{selectedTransaction.account.account_number}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Email</p>
                                    <p className="font-medium">{selectedTransaction.account.email}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Transaction Type</p>
                                    <p className="font-medium capitalize">{selectedTransaction.transaction_type}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Amount</p>
                                    <p className="font-medium">
                                        ₱{Math.abs(selectedTransaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Description</p>
                                    <p className="font-medium">{selectedTransaction.description}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Date</p>
                                    <p className="font-medium">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                                </div>
                                <div className="flex space-x-4 pt-4">
                                    <button
                                        className="flex-1 bg-red-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center"
                                        onClick={() => handleTransactionAction(selectedTransaction.id, 'reject')}
                                        disabled={isProcessing}
                                    >
                                        <FaTimes className="mr-2" /> {isProcessing ? 'Processing...' : 'Reject'}
                                    </button>
                                    <button
                                        className="flex-1 bg-[#5EC95F] text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center"
                                        onClick={() => handleTransactionAction(selectedTransaction.id, 'approve')}
                                        disabled={isProcessing}
                                    >
                                        <FaCheck className="mr-2" /> {isProcessing ? 'Processing...' : 'Approve'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </IonModal>

                {/* Users Modal */}
                <IonModal isOpen={showUsersModal} onDidDismiss={() => setShowUsersModal(false)}>
                    <div className="p-6 bg-[#5EC95F] min-h-full">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                            <FaUsers className="mr-2" /> User Management
                        </h2>
                        <div className="overflow-x-auto bg-white rounded-xl p-4">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account Number</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-t">
                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                {user.first_name} {user.last_name}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                {user.email}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                {user.account_number}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                ₱{user.available_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            className="mt-4 w-full bg-[white] text-black font-bold py-3 px-4 rounded-lg shadow-lg"
                            onClick={() => setShowUsersModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </IonModal>

                {/* Transactions History Modal */}
                <IonModal isOpen={showTransactionsModal} onDidDismiss={() => setShowTransactionsModal(false)}>
                    <div className="flex flex-col h-full bg-[#5EC95F]">
                        {/* Fixed Header */}
                        <div className="p-6 pb-2">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                                <FaHistory className="mr-2" /> Transaction History
                            </h2>
                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    placeholder="Search by Reference ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
                                />
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6">
                            <div className="bg-white rounded-xl p-4">
                                {/* Transactions Table */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference ID</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoadingTransactions ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-2 text-center text-gray-500">
                                                        Loading transactions...
                                                    </td>
                                                </tr>
                                            ) : filteredTransactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-2 text-center text-gray-500">
                                                        No transactions found
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredTransactions.map((transaction) => (
                                                    <tr key={transaction.id} className="border-t">
                                                        <td className="px-4 py-2 text-sm text-gray-900">
                                                            {new Date(transaction.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-900">
                                                            {transaction.reference_id}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-900">
                                                            {transaction.account.account_number}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-900 capitalize">
                                                            {transaction.transaction_type}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-900">
                                                            ₱{Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                transaction.status === 'completed' 
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : transaction.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {transaction.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-6 pt-2">
                            <button
                                className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center"
                                onClick={() => setShowTransactionsModal(false)}
                            >
                                <FaTimes className="mr-2" /> Close
                            </button>
                        </div>
                    </div>
                </IonModal>

                {/* Error Alert */}
                <IonAlert
                    isOpen={!!error}
                    onDidDismiss={() => setError(null)}
                    header="Error"
                    message={error || ''}
                    buttons={['OK']}
                />
            </IonContent>
        </IonPage>
    );
};

export default AdminDashboard; 
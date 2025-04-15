import { IonContent, IonPage, IonAlert, IonLoading, IonRefresher, IonRefresherContent } from '@ionic/react';
import { FaSignOutAlt, FaMoneyBillWave, FaWallet, FaExchangeAlt, FaCreditCard, FaChartLine, FaCog, FaUniversity } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import bonkLogo from '/bonk.png';
import { supabase } from '../../supabaseClient';
import { handleLogout, resetSessionTimeout } from '../../utils/auth';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer';
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  reference_id: string;
}

interface Account {
  id: string;
  account_number: string;
}

interface Profile {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface Balance {
  available_balance: number;
  total_balance: number;
}

const Dashboard: React.FC = () => {
    const history = useHistory();
    const [showLogoutAlert, setShowLogoutAlert] = useState(false);
    const [showBackAlert, setShowBackAlert] = useState(false);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [profileImage, setProfileImage] = useState('/default-profile.png');
    const [balance, setBalance] = useState(0);
    const [accountNumber, setAccountNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const adImages = ['/ad1.png', '/ad2.png', '/ad3.png'];
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    // Set up session timeout
    useEffect(() => {
        resetSessionTimeout();

        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        const resetTimeout = () => resetSessionTimeout();

        activityEvents.forEach(event => {
            window.addEventListener(event, resetTimeout);
        });

        return () => {
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetTimeout);
            });
        };
    }, []);

    // Prevent going back to login
    useEffect(() => {
        const unblock = history.block((location, action) => {
            if (action === 'POP' && location.pathname === '/login') {
                setShowBackAlert(true);
                return false;
            }
            return true;
        });

        return () => unblock();
    }, [history]);

    // Handle back button press
    useEffect(() => {
        const handleBackButton = (e: PopStateEvent) => {
            if (window.location.pathname === '/login') {
                e.preventDefault();
                setShowBackAlert(true);
            }
        };

        window.addEventListener('popstate', handleBackButton);
        return () => window.removeEventListener('popstate', handleBackButton);
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { data: account, error: accountError } = await supabase
                .from('accounts')
                .select('id, account_number')
                .eq('email', user.email)
                .single();

            if (accountError) throw accountError;
            if (!account) throw new Error('Account not found');

            setAccountNumber(account.account_number);

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url')
                .eq('account_id', account.id)
                .single();

            if (profileError) throw profileError;
            if (!profileData) throw new Error('Profile not found');

            setFirstName(profileData.first_name);
            setProfileImage(profileData.avatar_url || '/default-profile.png');

            const { data: balanceData, error: balanceError } = await supabase
                .from('balances')
                .select('available_balance, total_balance')
                .eq('account_id', account.id)
                .single();

            if (balanceError) throw balanceError;
            if (!balanceData) throw new Error('Balance not found');

            setBalance(balanceData.available_balance);

            // Get today's date at midnight
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const { data: transactionsData, error: transactionsError } = await supabase
                .from('transactions')
                .select('*')
                .eq('account_id', account.id)
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .order('created_at', { ascending: false })
                .limit(3);

            if (transactionsError) throw transactionsError;
            setTransactions(transactionsData || []);

        } catch (err) {
            console.error('Error fetching user data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setCurrentAdIndex((prevIndex) => (prevIndex + 1) % adImages.length);
                setFade(true);
            }, 500);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleLogoutClick = async () => {
        try {
            setLoading(true);
            await handleLogout();
        } catch (err) {
            console.error('Error logging out:', err);
            setError('Failed to logout');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatTransactionAmount = (amount: number, type: string) => {
        const formattedAmount = formatCurrency(Math.abs(amount));
        if (type === 'deposit') return `+${formattedAmount}`;
        if (type === 'withdrawal') return `-${formattedAmount}`;
        return amount > 0 ? `+${formattedAmount}` : `-${formattedAmount}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    // Add touch event handlers for swipe detection
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current && touchEndX.current) {
            const swipeDistance = touchEndX.current - touchStartX.current;
            const minSwipeDistance = 100; // Minimum distance for a swipe to be considered

            if (Math.abs(swipeDistance) > minSwipeDistance) {
                setShowLogoutAlert(true);
            }
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    const handleRefresh = async (event: CustomEvent) => {
        try {
            await fetchUserData();
        } catch (err) {
            console.error('Error refreshing data:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh data');
        } finally {
            event.detail.complete();
        }
    };

    if (loading) {
        return (
            <IonLoading
                isOpen={true}
                message="Loading dashboard..."
            />
        );
    }

    if (error) {
        return (
            <IonPage>
                <IonContent className="ion-padding">
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-[#5EC95F] text-white px-4 py-2 rounded"
                        >
                            Retry
                        </button>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

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
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent
                        pullingIcon="lines"
                        refreshingSpinner="lines"
                        pullingText="Pull to refresh"
                        refreshingText="Refreshing..."
                    />
                </IonRefresher>

                {/* Header */}
                <div className="flex justify-center items-center p-4 bg-[#5EC95F] relative h-16">
                    <FaSignOutAlt
                        className="text-black text-2xl absolute left-4 cursor-pointer"
                        onClick={() => setShowLogoutAlert(true)}
                    />
                    <img src="/bonk.png" alt="Bonk Logo" className="h-12 w-auto" />
                </div>

                {/* Main Content */}
                <div className="flex flex-col h-full">
                    {/* Welcome Section */}
                    <div className="flex flex-col items-center mt-2 px-4">
                        {/* Profile and Settings */}
                        <div className="w-full max-w-md flex items-center space-x-4">
                            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-300 bg-white">
                                <img 
                                    src={profileImage} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = '/default-profile.png';
                                    }}
                                />
                            </div>
                            <span className="text-2xl font-bold">
                                <span className="text-black">Welcome, </span>
                                <span className="text-white" style={{ WebkitTextStroke: '1px black' }}>
                                    {firstName}
                                </span>
                            </span>
                            <FaCog className="text-3xl text-black cursor-pointer ml-auto" onClick={() => history.push('/settings')} />
                        </div>

                        {/* Balance Card */}
                        <div className="mt-4 w-full max-w-md p-4 bg-white rounded-lg shadow-md flex items-center">
                            <div className="flex-1">
                                <span className="text-lg text-gray-600">Account Balance</span>
                                <div className="text-2xl font-bold text-black">{formatCurrency(balance)}</div>
                                <div className="text-sm text-gray-500 mt-1">Account: {accountNumber}</div>
                            </div>
                            <button 
                                className="h-12 w-12 bg-[#5EC95F] text-white rounded-full flex items-center justify-center shadow-md text-2xl"
                                onClick={() => history.push('/deposit')}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons Grid */}
                    <div className="mt-2 px-4" style={{ height: '30%' }}>
                        <div className="bg-white rounded-lg shadow-md p-2 grid grid-cols-3 gap-2 h-full">
                            {[ 
                                { icon: <FaMoneyBillWave className="text-2xl text-black" />, label: "Deposit", action: () => history.push('/deposit') },
                                { icon: <FaWallet className="text-2xl text-black" />, label: "Withdraw", action: () => history.push('/withdraw') },
                                { icon: <FaUniversity className="text-2xl text-black" />, label: "Pay/Transfer", action: () => history.push('/transfer') },
                                { icon: <FaExchangeAlt className="text-2xl text-black" />, label: "Transactions", action: () => history.push('/transactions') },
                                { icon: <FaCreditCard className="text-2xl text-black" />, label: "Card", action: () => history.push('/card') },
                                { icon: <FaChartLine className="text-2xl text-black" />, label: "Investment", action: () => history.push('/investment') },
                            ].map((item, index) => (
                                <button 
                                    key={index}
                                    className="h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center p-1 hover:bg-gray-200 transition-colors"
                                    onClick={item.action}
                                >
                                    {item.icon}
                                    <span className="text-xs mt-1 text-black font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ad Banner */}
                    <div className="px-4 pb-2">
                        <img 
                            src={adImages[currentAdIndex]} 
                            alt="Advertisement"
                            className={`w-full h-48 object-cover rounded-lg shadow-md transition-opacity duration-500 ${
                                fade ? 'opacity-100' : 'opacity-0'
                            }`}
                        />
                    </div>

                    {/* Transaction History Panel */}
                    <div className="bg-white rounded-t-xl shadow-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-black text-lg">Recent Transactions</h3>
                            <button 
                                className="text-blue-500 text-md font-medium"
                                onClick={() => history.push('/transactions')}
                            >
                                See More
                            </button>
                        </div>
                        {transactions.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-gray-500">No recent transactions</p>
                            </div>
                        ) : (
                            transactions.map((transaction) => (
                                <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded mb-2">
                                    <div>
                                        <span className="text-md text-gray-600">{transaction.description}</span>
                                        <div className="text-xs text-gray-400">
                                            {formatDate(transaction.created_at)}
                                        </div>
                                    </div>
                                    <span className={`text-md font-bold ${
                                        transaction.transaction_type === 'deposit' ? 'text-green-500' : 
                                        transaction.transaction_type === 'withdrawal' ? 'text-red-500' : 
                                        transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                        {formatTransactionAmount(transaction.amount, transaction.transaction_type)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Logout Alert */}
                <IonAlert
                    isOpen={showLogoutAlert}
                    onDidDismiss={() => setShowLogoutAlert(false)}
                    header="Logout"
                    message="Are you sure you want to logout?"
                    buttons={[
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            handler: () => setShowLogoutAlert(false)
                        },
                        {
                            text: 'Logout',
                            handler: handleLogoutClick
                        }
                    ]}
                />

                {/* Back Button Alert */}
                <IonAlert
                    isOpen={showBackAlert}
                    onDidDismiss={() => setShowBackAlert(false)}
                    header="Logout"
                    message="Going back will log you out. Do you want to continue?"
                    buttons={[
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            handler: () => setShowBackAlert(false)
                        },
                        {
                            text: 'Logout',
                            handler: handleLogoutClick
                        }
                    ]}
                />

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

export default Dashboard;
import { IonContent, IonPage, IonAlert } from '@ionic/react';
import { FaSignOutAlt, FaMoneyBillWave, FaWallet, FaExchangeAlt, FaCreditCard, FaChartLine, FaCog, FaUniversity } from 'react-icons/fa'; // Updated to FaUniversity
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom'; // Import useHistory
import bonkLogo from '/bonk.png';
import { supabase } from '../../supabaseClient';

interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  reference_number: string;
}

const Dashboard: React.FC = () => {
    const history = useHistory(); // Initialize useHistory
    const [showLogoutAlert, setShowLogoutAlert] = useState(false);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [profileImage, setProfileImage] = useState('/default-profile.png');
    const [balance, setBalance] = useState(0);
    const adImages = ['/ad1.png', '/ad2.png', '/ad3.png']; // Removed leading slash
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('No user found');

                // Fetch profile data
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (profileError) throw profileError;

                if (profile) {
                    const nameParts = profile.full_name.split(' ');
                    setFirstName(nameParts[0]);
                    setProfileImage(profile.avatar_url || '/default-profile.png');
                }

                // Fetch account balance
                const { data: account, error: accountError } = await supabase
                    .from('accounts')
                    .select('id, balance')
                    .eq('user_id', user.id)
                    .single();

                if (accountError) throw accountError;

                if (account) {
                    setBalance(account.balance || 0);
                }

                // Fetch recent transactions
                const { data: transactionsData, error: transactionsError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('account_id', account.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (transactionsError) throw transactionsError;

                if (transactionsData) {
                    setTransactions(transactionsData);
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
            }
        };

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

    const handleLogout = () => setShowLogoutAlert(true);
    const confirmLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            localStorage.removeItem('authToken');
            history.push('/loading');
        } catch (err) {
            console.error('Error signing out:', err);
            // Fallback to direct navigation if there's an error
            window.location.href = '/login';
        }
    };

    return (
        <IonPage>
            <IonContent 
                scrollY={false}
                style={{
                    '--ion-background-color': '#5EC95F',
                    'height': '100vh',
                    'overflow': 'hidden'
                }}
            >
                {/* Fixed Layout Container */}
                <div className="flex flex-col h-full">
                    {/* Fixed Header */}
                    <div className="flex justify-center items-center p-4 bg-[#5EC95F] h-16">
                        <FaSignOutAlt
                            className="text-black text-3xl absolute left-4 cursor-pointer"
                            onClick={handleLogout}
                        />
                        <img src={bonkLogo} alt="Bonk Logo" className="h-12" />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
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
                                    <div className="text-2xl font-bold text-black">₱ {balance.toFixed(2)}</div>
                                </div>
                                <button 
                                    className="h-12 w-12 bg-[#5EC95F] text-white rounded-full flex items-center justify-center shadow-md text-2xl"
                                    onClick={() => history.push('/deposit')}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons Grid - Made more compact */}
                        <div className="mt-2 px-4" style={{ height: '30%' }}>
                            <div className="bg-white rounded-lg shadow-md p-2 grid grid-cols-3 gap-2 h-full">
                                {[ 
                                    { icon: <FaMoneyBillWave className="text-2xl text-black" />, label: "Deposit", action: () => history.push('/deposit') },
                                    { icon: <FaWallet className="text-2xl text-black" />, label: "Withdraw", action: () => history.push('/withdraw') },
                                    { icon: <FaUniversity className="text-2xl text-black" />, label: "Pay/  Transfer", action: () => history.push('/transfer') },
                                    { icon: <FaExchangeAlt className="text-2xl text-black" />, label: "Transactions", action: () => history.push('/transactions') },
                                    { icon: <FaCreditCard className="text-2xl text-black" />, label: "Card", action: () => history.push('/card') },
                                    { icon: <FaChartLine className="text-2xl text-black" />, label: "Investment", action: () => history.push('/investment') },
                                ].map((item, index) => (
                                    <button 
                                        key={index}
                                        className="h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center p-1"
                                        onClick={item.action} // Add onClick for buttons with actions
                                    >
                                        {item.icon}
                                        <span className="text-xs mt-1 text-black font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Spacer between buttons and ad */}
                        <div className="flex-1"></div>

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
                    </div>

                    {/* Fixed Transaction History Panel */}
                    <div className="bg-white rounded-t-xl shadow-lg p-4 h-1/4">
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
                                            {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    <span className={`text-md font-bold ${
                                        transaction.type === 'deposit' ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                        ₱ {Math.abs(transaction.amount).toFixed(2)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Logout Confirmation */}
                <IonAlert
                    isOpen={showLogoutAlert}
                    onDidDismiss={() => setShowLogoutAlert(false)}
                    header="Logout"
                    message="Are you sure you want to logout?"
                    buttons={[
                        { text: 'Cancel', role: 'cancel' },
                        { text: 'Logout', handler: confirmLogout }
                    ]}
                />
            </IonContent>
        </IonPage>
    );
};

export default Dashboard;
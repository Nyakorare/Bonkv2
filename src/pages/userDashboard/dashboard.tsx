import { IonContent, IonPage, IonAlert } from '@ionic/react';
import { FaSignOutAlt, FaMoneyBillWave, FaWallet, FaExchangeAlt, FaCreditCard, FaChartLine, FaCog, FaPiggyBank } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import bonkLogo from '/bonk.png';

const Dashboard: React.FC = () => {
    const [showLogoutAlert, setShowLogoutAlert] = useState(false);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const adImages = ['/ad1.png', '/ad2.png', '/ad3.png'];

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
    const confirmLogout = () => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
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
                            className="text-black text-2xl absolute left-4 cursor-pointer"
                            onClick={handleLogout}
                        />
                        <img src={bonkLogo} alt="Bonk Logo" className="h-10" />
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Welcome Section */}
                        <div className="flex flex-col items-center mt-2 px-4">
                            {/* Profile and Settings */}
                            <div className="w-full max-w-md flex justify-between items-center">
                                <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-300 bg-white">
                                    <img 
                                        src="/profile-icon.png" 
                                        alt="Profile" 
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = '/default-profile.png';
                                        }}
                                    />
                                </div>
                                <span className="text-xl font-bold">
                                    <span className="text-black">Welcome, </span>
                                    <span className="text-white" style={{ WebkitTextStroke: '1px black' }}>
                                        Glenn
                                    </span>
                                </span>
                                <FaCog className="text-2xl text-black cursor-pointer" />
                            </div>

                            {/* Balance Card */}
                            <div className="mt-4 w-full max-w-md p-4 bg-white rounded-lg shadow-md flex items-center">
                                <div className="flex-1">
                                    <span className="text-sm text-gray-600">Account Balance</span>
                                    <div className="text-xl font-bold text-black">₱ 0.00</div>
                                </div>
                                <button className="h-10 w-10 bg-[#5EC95F] text-white rounded-full flex items-center justify-center shadow-md">
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons Grid */}
                        <div className="mt-4 px-4">
                            <div className="bg-white rounded-lg shadow-md p-4 grid grid-cols-3 gap-3">
                                {[
                                    { icon: <FaMoneyBillWave className="text-2xl text-black" />, label: "Deposit" },
                                    { icon: <FaWallet className="text-2xl text-black" />, label: "Withdraw" },
                                    { icon: <FaPiggyBank className="text-2xl text-black" />, label: "Save" },
                                    { icon: <FaExchangeAlt className="text-2xl text-black" />, label: "Transactions" },
                                    { icon: <FaCreditCard className="text-2xl text-black" />, label: "Card" },
                                    { icon: <FaChartLine className="text-2xl text-black" />, label: "Investment" }
                                ].map((item, index) => (
                                    <button 
                                        key={index}
                                        className="h-20 bg-gray-100 rounded-lg flex flex-col items-center justify-center"
                                    >
                                        {item.icon}
                                        <span className="text-xs mt-1 text-black">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Ad Banner */}
                        <div className="mt-4 px-4">
                            <img 
                                src={adImages[currentAdIndex]} 
                                alt="Advertisement"
                                className={`w-full h-32 object-cover rounded-lg shadow-md transition-opacity duration-500 ${
                                    fade ? 'opacity-100' : 'opacity-0'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Fixed Transaction History Panel */}
                    <div className="bg-white rounded-t-xl shadow-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-black">Recent Transactions</h3>
                            <button className="text-blue-500 text-sm font-medium">See More</button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span className="text-sm text-gray-600">Transaction {i+1}</span>
                                    <span className="text-sm font-bold">₱ {(i+1)*100}.00</span>
                                </div>
                            ))}
                        </div>
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
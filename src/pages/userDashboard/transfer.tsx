import { IonContent, IonPage, IonAlert, IonLoading } from '@ionic/react';
import { FaArrowLeft } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const Transfer: React.FC = () => {
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showConfirmAlert, setShowConfirmAlert] = useState(false);
    const [recipientName, setRecipientName] = useState<string | null>(null);
    const [currentBalance, setCurrentBalance] = useState<number>(0);
    const [formData, setFormData] = useState({
        accountNumber: '',
        amount: '',
        description: ''
    });

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('No user found');

                const { data: account, error: accountError } = await supabase
                    .from('accounts')
                    .select('id')
                    .eq('email', user.email)
                    .single();

                if (accountError) throw accountError;

                const { data: balance, error: balanceError } = await supabase
                    .from('balances')
                    .select('available_balance')
                    .eq('account_id', account.id)
                    .single();

                if (balanceError) throw balanceError;
                setCurrentBalance(balance.available_balance);
            } catch (err) {
                console.error('Error fetching balance:', err);
                setError('Failed to load balance');
            }
        };

        fetchBalance();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateTransfer = async () => {
        try {
            setError(null);
            setLoading(true);

            // Validate amount
            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid amount');
            }

            if (amount < 50) {
                throw new Error('Minimum transfer amount is ₱50.00');
            }

            if (amount > currentBalance) {
                throw new Error('Insufficient balance');
            }

            // Check if recipient account exists
            const { data: recipientAccount, error: recipientError } = await supabase
                .from('accounts')
                .select('id, email')
                .eq('account_number', formData.accountNumber)
                .single();

            if (recipientError || !recipientAccount) {
                throw new Error('Recipient account not found');
            }

            // Get recipient's name
            const { data: recipientProfile, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('account_id', recipientAccount.id)
                .single();

            if (profileError || !recipientProfile) {
                throw new Error('Could not verify recipient');
            }

            setRecipientName(`${recipientProfile.first_name} ${recipientProfile.last_name}`);
            setShowConfirmAlert(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Validation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            // Get sender's account
            const { data: senderAccount, error: senderError } = await supabase
                .from('accounts')
                .select('id')
                .eq('email', user.email)
                .single();

            if (senderError) throw senderError;

            // Get recipient's account
            const { data: recipientAccount, error: recipientError } = await supabase
                .from('accounts')
                .select('id')
                .eq('account_number', formData.accountNumber)
                .single();

            if (recipientError) throw recipientError;

            const amount = parseFloat(formData.amount);

            // Start transaction
            const { error: transactionError } = await supabase.rpc('transfer_money', {
                sender_id: senderAccount.id,
                recipient_id: recipientAccount.id,
                amount: amount,
                description: formData.description || 'Transfer'
            });

            if (transactionError) throw transactionError;

            setSuccess(true);
            // Add a small delay to show the success message
            setTimeout(() => {
                // Force a hard refresh of the dashboard
                window.location.href = '/dashboard';
            }, 2000);
        } catch (err) {
            console.error('Transfer error:', err);
            setError(err instanceof Error ? err.message : 'Transfer failed');
        } finally {
            setLoading(false);
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
                {/* Header */}
                <div className="flex justify-center items-center p-4 bg-[#5EC95F] relative h-16">
                    <FaArrowLeft
                        className="text-black text-2xl absolute left-4 cursor-pointer"
                        onClick={() => history.push('/dashboard')}
                    />
                    <h1 className="text-white text-xl font-bold">Transfer Money</h1>
                </div>

                {/* Main Content */}
                <div className="flex flex-col bg-[#5EC95F] h-full">
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Balance Card */}
                        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                            <p className="text-gray-600">Available Balance</p>
                            <p className="text-2xl font-bold text-black">
                                ₱{currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>

                        {/* Transfer Form */}
                        <div className="bg-white rounded-xl shadow-lg p-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-gray-700 font-medium">Recipient Account Number</label>
                                <input
                                    type="text"
                                    name="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Enter account number"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-gray-700 font-medium">Amount</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Enter amount (minimum ₱50)"
                                    min="50"
                                    step="0.01"
                                />
                                <p className="text-sm text-gray-500">Minimum transfer amount: ₱50.00</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-gray-700 font-medium">Description (Optional)</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Enter description"
                                />
                            </div>

                            <button
                                className="w-full bg-[#5EC95F] text-white font-bold py-3 px-4 rounded-lg shadow-lg"
                                onClick={validateTransfer}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Transfer'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Confirmation Alert */}
                <IonAlert
                    isOpen={showConfirmAlert}
                    onDidDismiss={() => setShowConfirmAlert(false)}
                    header="Confirm Transfer"
                    message={`Are you sure you want to transfer ₱${parseFloat(formData.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ${recipientName}?`}
                    buttons={[
                        { text: 'Cancel', role: 'cancel' },
                        { text: 'Confirm', handler: handleTransfer }
                    ]}
                />

                {/* Success Alert */}
                <IonAlert
                    isOpen={success}
                    onDidDismiss={() => setSuccess(false)}
                    header="Success"
                    message="Transfer completed successfully!"
                    buttons={['OK']}
                />

                {/* Error Alert */}
                <IonAlert
                    isOpen={!!error}
                    onDidDismiss={() => setError(null)}
                    header="Error"
                    message={error || ''}
                    buttons={['OK']}
                />

                {/* Loading Indicator */}
                <IonLoading isOpen={loading} message="Processing transfer..." />
            </IonContent>
        </IonPage>
    );
};

export default Transfer;

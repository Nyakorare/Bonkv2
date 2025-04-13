import { IonContent, IonPage, IonAlert } from '@ionic/react';
import { FaArrowLeft, FaExchangeAlt } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const Transfer: React.FC = () => {
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [accountNumber, setAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [balance, setBalance] = useState(0);
    const [recipientName, setRecipientName] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [transferDetails, setTransferDetails] = useState<{
        recipientAccount: string;
        amount: number;
        description: string;
    } | null>(null);

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

                const { data: balanceData, error: balanceError } = await supabase
                    .from('balances')
                    .select('available_balance')
                    .eq('account_id', account.id)
                    .single();

                if (balanceError) throw balanceError;

                setBalance(balanceData.available_balance);
            } catch (err) {
                console.error('Error fetching balance:', err);
                setError('Failed to load balance');
            }
        };

        fetchBalance();
    }, []);

    const validateInputs = () => {
        if (!accountNumber || !amount || !description) {
            setError('Please fill in all fields');
            return false;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return false;
        }

        if (amountNum > balance) {
            setError('Insufficient balance');
            return false;
        }

        if (accountNumber.length !== 10) {
            setError('Account number must be 10 digits');
            return false;
        }

        return true;
    };

    const getRecipientDetails = async (accountNumber: string) => {
        try {
            const { data, error } = await supabase
                .from('accounts')
                .select('id, first_name, last_name')
                .eq('account_number', accountNumber)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching recipient details:', error);
            return null;
        }
    };

    const handleTransfer = async () => {
        if (!validateInputs()) return;

        try {
            setLoading(true);
            setError('');

            // Get recipient details
            const recipientDetails = await getRecipientDetails(accountNumber);
            if (!recipientDetails) {
                setError('Recipient account not found');
                return;
            }

            setRecipientName(`${recipientDetails.first_name} ${recipientDetails.last_name}`);
            setTransferDetails({
                recipientAccount: accountNumber,
                amount: parseFloat(amount),
                description
            });
            setShowConfirmDialog(true);
        } catch (error) {
            console.error('Error preparing transfer:', error);
            setError('Failed to prepare transfer');
        } finally {
            setLoading(false);
        }
    };

    const confirmTransfer = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!transferDetails) return;

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
                .eq('account_number', transferDetails.recipientAccount)
                .single();

            if (recipientError) throw recipientError;

            // Start a transaction
            const { data: transaction, error: transactionError } = await supabase.rpc('transfer_money', {
                sender_id: senderAccount.id,
                recipient_id: recipientAccount.id,
                amount: transferDetails.amount,
                description: transferDetails.description
            });

            if (transactionError) throw transactionError;

            setSuccess(true);
            setTimeout(() => {
                history.push('/dashboard');
            }, 2000);

        } catch (err) {
            console.error('Error confirming transfer:', err);
            setError('Failed to complete transfer');
        } finally {
            setLoading(false);
            setShowConfirmDialog(false);
        }
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
                        <h1 className="text-white text-xl font-bold">Transfer Money</h1>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {success ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="text-green-500 text-6xl mb-4">✓</div>
                                <h2 className="text-2xl font-bold text-black mb-2">Transfer Successful!</h2>
                                <p className="text-gray-600 text-center">
                                    Your transfer of ₱{parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                                    has been completed successfully.
                                </p>
                            </div>
                        ) : (
                            <div className="max-w-md mx-auto">
                                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Recipient Account Number
                                        </label>
                                        <input
                                            type="text"
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                            placeholder="Enter 10-digit account number"
                                            maxLength={10}
                                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="Enter amount"
                                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Available Balance: ₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Enter description"
                                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5EC95F]"
                                        />
                                    </div>

                                    {error && (
                                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleTransfer}
                                        disabled={loading}
                                        className="w-full bg-[#5EC95F] text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-[#4AB54B] transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Transfer'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Confirmation Dialog */}
                <IonAlert
                    isOpen={showConfirmDialog}
                    onDidDismiss={() => setShowConfirmDialog(false)}
                    header="Confirm Transfer"
                    message={`
                        Are you sure you want to transfer ₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                        to ${recipientName} (Account: ${accountNumber})?
                    `}
                    buttons={[
                        { text: 'Cancel', role: 'cancel' },
                        { text: 'Confirm', handler: confirmTransfer }
                    ]}
                />
            </IonContent>
        </IonPage>
    );
};

export default Transfer;

import { IonContent, IonPage, IonAlert, IonLoading, IonModal } from '@ionic/react';
import { FaArrowLeft, FaQrcode } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { BrowserQRCodeReader } from '@zxing/browser';

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
    
    // QR Code Generation States
    const [showQRModal, setShowQRModal] = useState(false);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [scannedData, setScannedData] = useState<{
        accountNumber: string;
        amount: number;
        referenceNumber: string;
        balance: number;
        type: 'deposit' | 'withdrawal' | 'transfer';
    } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [myAccountNumber, setMyAccountNumber] = useState<string>('');
    const [qrData, setQrData] = useState<string>('');
    const [qrAmount, setQrAmount] = useState<string>('');
    const [qrDescription, setQrDescription] = useState<string>('');
    
    // QR Scanner Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReader = useRef<BrowserQRCodeReader | null>(null);
    const hasScanned = useRef(false);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('No user found');

                const { data: account, error: accountError } = await supabase
                    .from('accounts')
                    .select('id, account_number')
                    .eq('email', user.email)
                    .single();

                if (accountError) throw accountError;
                
                setMyAccountNumber(account.account_number);

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

    // QR Scanner Effect
    useEffect(() => {
        if (isScanning && videoRef.current && isCameraReady && !hasScanned.current) {
            try {
                console.log('Initializing QR scanner...');
                codeReader.current = new BrowserQRCodeReader();
                if (videoRef.current) {
                    console.log('Starting QR code detection...');
                    codeReader.current.decodeFromVideoDevice(
                        undefined,
                        videoRef.current,
                        (result) => {
                            if (result && !hasScanned.current) {
                                console.log('QR Code detected:', result.getText());
                                hasScanned.current = true;
                                handleQRScan(result.getText());
                                setIsScanning(false);
                                setShowScannerModal(false);
                            } else {
                                console.log('Scanning for QR code...');
                            }
                        }
                    );
                }
            } catch (err) {
                console.error('Error initializing QR scanner:', err);
                alert('Error initializing QR scanner. Please try again.');
                setIsScanning(false);
                setShowScannerModal(false);
            }
        }

        return () => {
            console.log('Cleaning up QR scanner...');
            if (codeReader.current) {
                codeReader.current = null;
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            hasScanned.current = false;
        };
    }, [isScanning, isCameraReady]);

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

            // Generate a unique reference ID with timestamp and random number
            const timestamp = Date.now();
            const randomNum = Math.floor(Math.random() * 10000);
            const referenceId = `TRF-${timestamp}-${randomNum}`;

            // Get sender's current balance
            const { data: senderBalance, error: senderBalanceError } = await supabase
                .from('balances')
                .select('available_balance, total_balance')
                .eq('account_id', senderAccount.id)
                .single();

            if (senderBalanceError) throw senderBalanceError;

            // Get recipient's current balance
            const { data: recipientBalance, error: recipientBalanceError } = await supabase
                .from('balances')
                .select('available_balance, total_balance')
                .eq('account_id', recipientAccount.id)
                .single();

            if (recipientBalanceError) throw recipientBalanceError;

            // Check if sender has sufficient balance
            if (senderBalance.available_balance < amount) {
                throw new Error('Insufficient balance');
            }

            // Calculate new balances
            const newSenderBalance = senderBalance.available_balance - amount;
            const newRecipientBalance = recipientBalance.available_balance + amount;

            // Update sender's balance
            const { error: updateSenderError } = await supabase
                .from('balances')
                .update({ 
                    available_balance: newSenderBalance,
                    total_balance: newSenderBalance
                })
                .eq('account_id', senderAccount.id);

            if (updateSenderError) throw updateSenderError;

            // Update recipient's balance
            const { error: updateRecipientError } = await supabase
                .from('balances')
                .update({ 
                    available_balance: newRecipientBalance,
                    total_balance: newRecipientBalance
                })
                .eq('account_id', recipientAccount.id);

            if (updateRecipientError) throw updateRecipientError;

            // Create transaction record for sender
            const { error: senderTransactionError } = await supabase
                .from('transactions')
                .insert({
                    account_id: senderAccount.id,
                    amount: -amount,
                    transaction_type: 'transfer',
                    description: formData.description || `Transfer to ${formData.accountNumber}`,
                    status: 'completed',
                    reference_id: referenceId
                });

            if (senderTransactionError) throw senderTransactionError;

            // Create transaction record for recipient
            const { error: recipientTransactionError } = await supabase
                .from('transactions')
                .insert({
                    account_id: recipientAccount.id,
                amount: amount,
                    transaction_type: 'transfer',
                    description: formData.description || `Transfer from ${myAccountNumber}`,
                    status: 'completed',
                    reference_id: `${referenceId}-R`
            });

            if (recipientTransactionError) throw recipientTransactionError;

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

    // Generate QR Code
    const generateQRCode = () => {
        if (!myAccountNumber) {
            setError('Account information not available');
            return;
        }

        // Generate a unique reference number with timestamp and random number
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000);
        const referenceNumber = `QR-${timestamp}-${randomNum}`;
        
        // Create QR data with transaction type
        const qrData = JSON.stringify({
            accountNumber: myAccountNumber,
            referenceNumber: referenceNumber,
            type: 'transfer',
            amount: formData.amount || '0',
            description: formData.description || ''
        });
        
        setQrData(qrData);
        setShowQRModal(true);
    };

    // Start Camera for QR Scanning
    const startCamera = async () => {
        try {
            console.log('Starting camera initialization...');
            hasScanned.current = false;
            
            // Check if we're on a mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            console.log('Device type:', isMobile ? 'Mobile' : 'Desktop');
            
            // Clean up any existing stream
            if (videoRef.current && videoRef.current.srcObject) {
                console.log('Cleaning up existing camera stream...');
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log('Stopped track:', track.label);
                });
                videoRef.current.srcObject = null;
            }

            // Reset QR code reader
            if (codeReader.current) {
                console.log('Resetting QR code reader...');
                codeReader.current = null;
            }

            // Try different camera constraints
            const constraints = [
                {
                    video: {
                        facingMode: isMobile ? 'environment' : 'user',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                },
                {
                    video: {
                        facingMode: isMobile ? 'environment' : 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                },
                {
                    video: {
                        facingMode: isMobile ? 'environment' : 'user'
                    }
                },
                {
                    video: true
                }
            ];

            let stream;
            let lastError;

            // Try each constraint until one works
            for (const constraint of constraints) {
                try {
                    console.log('Trying camera with constraints:', JSON.stringify(constraint));
                    stream = await navigator.mediaDevices.getUserMedia(constraint);
                    console.log('Camera access granted with constraints:', JSON.stringify(constraint));
                    break;
                } catch (err) {
                    console.log('Failed with constraint:', JSON.stringify(constraint), err);
                    lastError = err;
                    // Clean up any partial stream
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                    }
                }
            }

            if (!stream) {
                throw lastError || new Error('Failed to access camera with any constraints');
            }

            if (videoRef.current) {
                console.log('Setting up video element...');
                videoRef.current.srcObject = stream;
                setIsCameraReady(true);
                setIsScanning(true);

                // Initialize QR code reader
                console.log('Initializing QR code reader...');
                codeReader.current = new BrowserQRCodeReader();
                codeReader.current.decodeFromVideoDevice(
                    undefined,
                    videoRef.current,
                    (result) => {
                        if (result && !hasScanned.current) {
                            console.log('QR Code detected:', result.getText());
                            hasScanned.current = true;
                            handleQRScan(result.getText());
                            setIsScanning(false);
                            setShowScannerModal(false);
                        }
                    }
                );
                console.log('QR code reader initialized and scanning started');
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    console.error('Camera access was denied');
                    alert('Camera access was denied. Please allow camera access in your device settings.');
                } else if (err.name === 'NotFoundError') {
                    console.error('No camera found');
                    alert('No camera found on this device.');
                } else if (err.name === 'NotReadableError') {
                    console.error('Camera is in use');
                    // Try to force cleanup and retry
                    if (videoRef.current && videoRef.current.srcObject) {
                        const stream = videoRef.current.srcObject as MediaStream;
                        stream.getTracks().forEach(track => {
                            track.stop();
                            console.log('Force stopped track:', track.label);
                        });
                        videoRef.current.srcObject = null;
                    }
                    alert('Camera access error. Please try again in a few seconds.');
                } else {
                    console.error('Unknown camera error:', err.message);
                    alert('Error accessing camera: ' + err.message);
                }
            } else {
                console.error('Unknown error occurred');
                alert('An unknown error occurred while accessing the camera.');
            }
            setIsScanning(false);
            setShowScannerModal(false);
        }
    };

    // Handle QR Scan
    const handleQRScan = async (scannedData: string) => {
        try {
            console.log('Processing scanned QR data:', scannedData);
            const { accountNumber, amount, referenceNumber, type, description } = JSON.parse(scannedData);
            
            // Validate amount
            if (amount <= 0) {
                throw new Error('Invalid amount: Amount must be greater than zero');
            }

            // Check if this reference number has already been used
            const { data: existingTransaction, error: transactionError } = await supabase
                .from('transactions')
                .select('id')
                .eq('reference_id', referenceNumber)
                .single();

            if (existingTransaction) {
                throw new Error('This QR code has already been used');
            }

            // Get the scanned account's data
            const { data: scannedAccount, error: accountError } = await supabase
                .from('accounts')
                .select('id, account_number')
                .eq('account_number', accountNumber)
                .single();

            if (accountError) throw accountError;

            // Get the scanned account's balance
            const { data: scannedBalance, error: balanceError } = await supabase
                .from('balances')
                .select('available_balance')
                .eq('account_id', scannedAccount.id)
                .single();

            if (balanceError) throw balanceError;

            // Validate and normalize transaction type
            let transactionType: 'deposit' | 'withdrawal' | 'transfer';
            if (type === 'deposit' || type === 'withdrawal') {
                transactionType = type;
            } else {
                transactionType = 'transfer';
            }

            // For withdrawals, check if the scanned account has sufficient balance
            if (transactionType === 'withdrawal') {
                if (scannedBalance.available_balance < amount) {
                    throw new Error('Insufficient balance for withdrawal');
                }
            }

            console.log('QR data processed successfully:', {
                accountNumber,
                amount,
                referenceNumber,
                balance: scannedBalance.available_balance,
                type: transactionType
            });

            // Instead of showing confirmation modal, populate the transfer form
            setFormData({
                accountNumber: accountNumber,
                amount: amount.toString(),
                description: description || ''
            });
            
            // Close the scanner modal
            setShowScannerModal(false);
            setIsScanning(false);
            setIsCameraReady(false);
            
            // Clean up camera resources
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log('Stopped track:', track.label);
                });
                videoRef.current.srcObject = null;
            }
            if (codeReader.current) {
                codeReader.current = null;
            }
            
            // Show success message
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            console.error('Error processing QR scan:', err);
            alert(err instanceof Error ? err.message : 'Error processing QR scan. Please try again.');
        }
    };

    return (
        <IonPage>
            <IonContent 
                fullscreen
                scrollY={true}
                style={{
                    '--overflow': 'auto',
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
                <div className="flex flex-col bg-[#5EC95F] min-h-full">
                    <div className="flex-1 p-4">
                        {/* Balance Card */}
                        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                            <p className="text-gray-600">Available Balance</p>
                            <p className="text-2xl font-bold text-black">
                                ₱{currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>

                        {/* Transfer Form */}
                        <div className="bg-white rounded-xl shadow-lg p-4 space-y-4 mb-4">
                            <div className="space-y-2">
                                <label className="text-gray-700 font-medium">Recipient Account Number</label>
                                <input
                                    type="text"
                                    name="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-lg bg-white text-black"
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
                                    className="w-full p-2 border rounded-lg bg-white text-black"
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
                                    className="w-full p-2 border rounded-lg bg-white text-black"
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

                        {/* QR Code Generation Section */}
                        <div className="bg-white rounded-xl shadow-lg p-4 space-y-4 mb-4">
                            <h2 className="text-xl font-bold text-black">Generate QR Code for Transfer</h2>
                            <p className="text-gray-600">Create a QR code that others can scan to transfer money to your account.</p>
                            
                            <button
                                className="w-full bg-[#5EC95F] text-white font-bold py-3 px-4 rounded-lg shadow-lg"
                                onClick={generateQRCode}
                            >
                                Generate QR Code
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
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            handler: () => setShowConfirmAlert(false)
                        },
                        {
                            text: 'Confirm',
                            handler: handleTransfer
                        }
                    ]}
                />

                {/* QR Code Modal */}
                <IonModal isOpen={showQRModal} onDidDismiss={() => setShowQRModal(false)}>
                    <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
                        <h2 className="text-2xl font-bold text-black mb-4">Scan to Transfer</h2>
                        <div className="bg-white p-4 rounded-lg shadow-lg">
                            {qrData && (
                                <QRCodeSVG
                                    value={qrData}
                                    size={250}
                                    level="H"
                                    includeMargin={true}
                                />
                            )}
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600">Account: {myAccountNumber}</p>
                            <p className="text-gray-600">Scan this QR code from the dashboard to transfer money to this account.</p>
                        </div>
                        <button
                            className="bg-[#5EC95F] text-white font-bold py-3 px-8 rounded-md w-full max-w-md"
                            onClick={() => setShowQRModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </IonModal>

                {/* Scanner Modal */}
                <IonModal isOpen={showScannerModal} onDidDismiss={() => {
                    console.log('Scanner modal closed, cleaning up...');
                    setShowScannerModal(false);
                    setIsScanning(false);
                    setIsCameraReady(false);
                    if (videoRef.current && videoRef.current.srcObject) {
                        const stream = videoRef.current.srcObject as MediaStream;
                        stream.getTracks().forEach(track => {
                            track.stop();
                            console.log('Stopped track:', track.label);
                        });
                        videoRef.current.srcObject = null;
                    }
                    if (codeReader.current) {
                        codeReader.current = null;
                    }
                }}>
                    <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
                        <div className="flex justify-center mb-4 w-full h-[60vh]">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover rounded-lg"
                                autoPlay
                                playsInline
                                muted
                            />
                        </div>
                        <div className="text-sm text-black mb-4 text-center">
                            Position the QR code within the frame
                        </div>
                        <div className="flex space-x-4 w-full max-w-md">
                            <button
                                className="flex-1 bg-[#5EC95F] text-white font-bold py-3 px-8 rounded-md"
                                onClick={startCamera}
                            >
                                Start Scan
                            </button>
                            <button
                                className="flex-1 bg-gray-600 text-white font-bold py-3 px-8 rounded-md"
                                onClick={() => {
                                    console.log('Cancel button clicked, cleaning up...');
                                    setShowScannerModal(false);
                                    setIsScanning(false);
                                    setIsCameraReady(false);
                                    if (videoRef.current && videoRef.current.srcObject) {
                                        const stream = videoRef.current.srcObject as MediaStream;
                                        stream.getTracks().forEach(track => {
                                            track.stop();
                                            console.log('Stopped track:', track.label);
                                        });
                                        videoRef.current.srcObject = null;
                                    }
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </IonModal>

                {/* Success Modal */}
                <IonModal isOpen={showSuccessModal} onDidDismiss={() => {
                    setShowSuccessModal(false);
                    setShowScannerModal(false);
                }}>
                    <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-black">Transaction Completed</h2>
                        <p className="text-gray-600 text-center">Your transaction has been successfully processed.</p>
                        <button
                            className="bg-[#5EC95F] text-white font-bold py-3 px-8 rounded-md w-full max-w-md"
                            onClick={() => {
                                setShowSuccessModal(false);
                                setShowScannerModal(false);
                            }}
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </IonModal>

                {/* Success Alert */}
                <IonAlert
                    isOpen={success}
                    onDidDismiss={() => setSuccess(false)}
                    header="Success"
                    message="QR code scanned successfully! Transfer details have been added to the form."
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
                <IonLoading
                    isOpen={loading}
                    message="Processing..."
                />
            </IonContent>
        </IonPage>
    );
};

export default Transfer;

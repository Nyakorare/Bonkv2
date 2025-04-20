import { IonContent, IonPage, IonAlert, IonLoading, IonRefresher, IonRefresherContent, IonModal } from '@ionic/react';
import { FaSignOutAlt, FaMoneyBillWave, FaWallet, FaExchangeAlt, FaCreditCard, FaChartLine, FaCog, FaUniversity, FaQrcode, FaStore, FaCopy, FaDownload } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import bonkLogo from '/bonk.png';
import { supabase } from '../../supabaseClient';
import { handleLogout, resetSessionTimeout } from '../../utils/auth';
import { QRCodeSVG } from 'qrcode.react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';

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
    const [showQRModal, setShowQRModal] = useState(false);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isMobileDevice, setIsMobileDevice] = useState(false);
    const [showFileInput, setShowFileInput] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [scannedData, setScannedData] = useState<{
        accountNumber: string;
        amount: number;
        referenceNumber: string;
        balance: number;
        type: 'deposit' | 'withdrawal' | 'transfer';
    } | null>(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReader = useRef<BrowserQRCodeReader | null>(null);
    const hasScanned = useRef(false);
    const [transactionDetails, setTransactionDetails] = useState<{
        receiverAccountNumber: string;
        receiverName: string;
        amount: number;
        description: string;
        referenceNumber: string;
        type: 'deposit' | 'withdrawal' | 'transfer';
    } | null>(null);
    const [qrData, setQrData] = useState<string | null>(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [transferAmount, setTransferAmount] = useState('');
    const [transferDescription, setTransferDescription] = useState('');

    // Set up session timeout
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                history.push('/login');
            }
        };

        // Check session immediately
        checkSession();

        // Set up interval to check session every minute
        const interval = setInterval(checkSession, 60000);

        return () => clearInterval(interval);
    }, [history]);

    // Prevent going back to login
    useEffect(() => {
        const unblock = history.block((location, action) => {
            if (action === 'POP' && location.pathname === '/login') {
                setShowBackAlert(true);
                return false;
            }
            return;
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

    useEffect(() => {
        // Check if we're on a mobile device
        const checkMobileDevice = () => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsMobileDevice(isMobile);
            console.log('Device type:', isMobile ? 'Mobile' : 'Desktop');
        };
        
        checkMobileDevice();
        
        // Add resize listener to update mobile detection on orientation change
        window.addEventListener('resize', checkMobileDevice);
        
        return () => {
            window.removeEventListener('resize', checkMobileDevice);
        };
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // If no user found, redirect to login
                history.push('/login');
                return;
            }

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
            if (err instanceof Error && err.message === 'No user found') {
                history.push('/login');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            }
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

    const startCamera = async () => {
        try {
            console.log('Starting camera initialization...');
            hasScanned.current = false;
            
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
                        facingMode: isMobileDevice ? 'environment' : 'user',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                },
                {
                    video: {
                        facingMode: isMobileDevice ? 'environment' : 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                },
                {
                    video: {
                        facingMode: isMobileDevice ? 'environment' : 'user'
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
                    // Show file input option for mobile devices when camera access is denied
                    if (isMobileDevice) {
                        setShowFileInput(true);
                    }
                } else if (err.name === 'NotFoundError') {
                    console.error('No camera found');
                    alert('No camera found on this device.');
                    // Show file input option for mobile devices when no camera is found
                    if (isMobileDevice) {
                        setShowFileInput(true);
                    }
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
                    // Show file input option for mobile devices when camera is in use
                    if (isMobileDevice) {
                        setShowFileInput(true);
                    }
                } else {
                    console.error('Unknown camera error:', err.message);
                    alert('Error accessing camera: ' + err.message);
                    // Show file input option for mobile devices on unknown errors
                    if (isMobileDevice) {
                        setShowFileInput(true);
                    }
                }
            } else {
                console.error('Unknown error occurred');
                alert('An unknown error occurred while accessing the camera.');
                // Show file input option for mobile devices on unknown errors
                if (isMobileDevice) {
                    setShowFileInput(true);
                }
            }
            setIsScanning(false);
        }
    };

    // Clean up camera resources when component unmounts
    useEffect(() => {
        return () => {
            console.log('Cleaning up camera resources...');
            if (codeReader.current) {
                codeReader.current = null;
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log('Stopped track:', track.label);
                });
                videoRef.current.srcObject = null;
            }
            hasScanned.current = false;
        };
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
        if (type === 'deposit') return `-${formattedAmount}`;
        if (type === 'withdrawal') return `+${formattedAmount}`;
        if (type === 'transfer') return amount > 0 ? `+${formattedAmount}` : `-${formattedAmount}`;
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

    const handleQRScan = async (result: string) => {
        try {
            if (!result) return;

            const scannedData = JSON.parse(result);
            const { accountNumber, referenceNumber, type, amount, description } = scannedData;

            // Determine transaction type based on reference number
            let transactionType: 'deposit' | 'withdrawal' | 'transfer';
            
            // Generate a unique reference number with timestamp and random string
            const generateUniqueReference = (prefix: string) => {
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(2, 8);
                return `${prefix}-${timestamp}-${random}`;
            };

            // Check if reference number starts with OTCW or OTCD
            if (referenceNumber && typeof referenceNumber === 'string') {
                if (referenceNumber.startsWith('OTCW')) {
                    transactionType = 'withdrawal';
                } else if (referenceNumber.startsWith('OTCD')) {
                    transactionType = 'deposit';
                } else {
                    // For transfers, use the type from the QR code or default to 'transfer'
                    transactionType = type && ['deposit', 'withdrawal', 'transfer'].includes(type) 
                        ? type as 'deposit' | 'withdrawal' | 'transfer' 
                        : 'transfer';
                }
            } else {
                // For transfers, use the type from the QR code or default to 'transfer'
                transactionType = type && ['deposit', 'withdrawal', 'transfer'].includes(type) 
                    ? type as 'deposit' | 'withdrawal' | 'transfer' 
                    : 'transfer';
            }

            // Validate account number
            if (!accountNumber) {
                throw new Error('Invalid QR code: Missing account number');
            }

            // Get receiver's account
            const { data: receiverAccount, error: receiverError } = await supabase
                .from('accounts')
                .select('*')
                .eq('account_number', accountNumber)
                .single();

            if (receiverError || !receiverAccount) {
                throw new Error('Receiver account not found');
            }

            // For withdrawals, check if the scanned account has sufficient balance
            if (transactionType === 'withdrawal') {
                if (receiverAccount.available_balance < parseFloat(amount || '0')) {
                    throw new Error('Insufficient balance for withdrawal');
                }
            }

            // Generate a unique reference number based on transaction type
            let finalReferenceNumber = referenceNumber;
            if (!finalReferenceNumber || !finalReferenceNumber.startsWith('TRF')) {
                const prefix = transactionType === 'transfer' ? 'TRF' : 
                             transactionType === 'withdrawal' ? 'OTCW' : 'OTCD';
                finalReferenceNumber = generateUniqueReference(prefix);
            }

            // Set transaction details
            setTransactionDetails({
                receiverAccountNumber: accountNumber,
                receiverName: receiverAccount.account_name,
                amount: parseFloat(amount || '0'),
                description: description || '',
                referenceNumber: finalReferenceNumber,
                type: transactionType
            });

            // Close scanner and show confirmation or transfer form
            setShowScannerModal(false);
            
            if (transactionType === 'transfer') {
                // For transfers, show the form to enter amount and description
                setShowTransferForm(true);
            } else {
                // For deposits and withdrawals, show confirmation directly
                setShowConfirmationModal(true);
            }

        } catch (error) {
            console.error('QR scan error:', error);
            setError(error instanceof Error ? error.message : 'Failed to process QR code');
            setShowScannerModal(false);
            setShowErrorModal(true);
        }
    };

    const handleTransferSubmit = () => {
        if (!transferAmount || parseFloat(transferAmount) <= 0) {
            setError('Please enter a valid amount');
            setShowErrorModal(true);
            return;
        }
        
        // Generate a unique reference number for transfers
        const generateUniqueReference = (prefix: string) => {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            return `${prefix}-${timestamp}-${random}`;
        };
        
        // Generate a unique reference number for transfers
        const finalReferenceNumber = generateUniqueReference('TRF');
        
        // Update transaction details with the entered amount and description
        if (transactionDetails) {
            setTransactionDetails({
                ...transactionDetails,
                amount: parseFloat(transferAmount),
                description: transferDescription || 'Transfer',
                referenceNumber: finalReferenceNumber
            });
        }
        
        // Close transfer form and show confirmation
        setShowTransferForm(false);
        setShowConfirmationModal(true);
    };

    const handleRefreshTransaction = async () => {
        try {
            setIsRefreshing(true);
            
            // Get current user's account
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { data: currentAccount, error: accountError } = await supabase
                .from('accounts')
                .select('id, account_number')
                .eq('email', user.email)
                .single();

            if (accountError) throw accountError;

            // Check if the transaction is completed
            if (transactionDetails) {
                const { data: transaction, error } = await supabase
                    .from('transactions')
                    .select('status, amount, transaction_type')
                    .eq('reference_id', transactionDetails.referenceNumber)
                    .single();

                if (!error && transaction) {
                    if (transaction.status === 'completed') {
                        // Transaction is completed, show success modal
                        setShowConfirmationModal(false);
                        setShowSuccessModal(true);
                        
                        // Update local balance
                        const { data: balanceData, error: balanceError } = await supabase
                            .from('balances')
                            .select('available_balance, total_balance')
                            .eq('account_id', currentAccount.id)
                            .single();
                            
                        if (!balanceError && balanceData) {
                            setBalance(balanceData.available_balance);
                        }
                        
                        // Reset transaction details
                        setTransactionDetails(null);
                        setQrData(null);
                        
                        // Remove the automatic page reload
                        // setTimeout(() => {
                        //     window.location.reload();
                        // }, 1500);
                    } else {
                        // Transaction is still pending, show appropriate message
                        alert('Transaction is still processing. Please try again in a few moments.');
                    }
                } else {
                    // Transaction not found, it might still be processing
                    alert('Transaction status not found. Please try again in a few moments.');
                }
            }
        } catch (err) {
            console.error('Error refreshing transaction:', err);
            alert('Error refreshing transaction status. Please try again.');
        } finally {
            setIsRefreshing(false);
        }
    };

    const generateUniqueReference = (prefix: string) => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}-${timestamp}-${random}`;
    };

    const handleConfirmTransaction = async () => {
        try {
            if (!transactionDetails) return;

            // Get current user's account
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { data: currentAccount, error: accountError } = await supabase
                .from('accounts')
                .select('id, account_number')
                .eq('email', user.email)
                .single();

            if (accountError) throw accountError;

            // Get receiver's account
            const { data: receiverAccount, error: receiverError } = await supabase
                .from('accounts')
                .select('id')
                .eq('account_number', transactionDetails.receiverAccountNumber)
                .single();

            if (receiverError) throw receiverError;

            // Get current balances
            const { data: senderBalance, error: senderBalanceError } = await supabase
                .from('balances')
                .select('available_balance, total_balance')
                .eq('account_id', currentAccount.id)
                .single();

            if (senderBalanceError) throw senderBalanceError;

            const { data: receiverBalance, error: receiverBalanceError } = await supabase
                .from('balances')
                .select('available_balance, total_balance')
                .eq('account_id', receiverAccount.id)
                .single();

            if (receiverBalanceError) throw receiverBalanceError;

            // Generate new unique reference numbers for both transactions
            const senderReferenceId = generateUniqueReference(transactionDetails.type === 'transfer' ? 'TRF' : 
                                                           transactionDetails.type === 'withdrawal' ? 'OTCW' : 'OTCD');
            const receiverReferenceId = generateUniqueReference(transactionDetails.type === 'transfer' ? 'TRF' : 
                                                             transactionDetails.type === 'withdrawal' ? 'OTCW' : 'OTCD');

            // For withdrawals, the scanned account (receiver) is the one giving money to the scanner (sender)
            if (transactionDetails.type === 'withdrawal') {
                // Validate receiver's balance for withdrawal
                if (receiverBalance.available_balance < transactionDetails.amount) {
                    throw new Error('Insufficient balance for withdrawal');
                }

                // Calculate new balances for withdrawal
                const newReceiverBalance = receiverBalance.available_balance - transactionDetails.amount;
                const newSenderBalance = senderBalance.available_balance + transactionDetails.amount;

                // Update receiver's balance (the one being withdrawn from)
                const { error: receiverUpdateError } = await supabase
                    .from('balances')
                    .update({ 
                        available_balance: newReceiverBalance,
                        total_balance: newReceiverBalance
                    })
                    .eq('account_id', receiverAccount.id);

                if (receiverUpdateError) throw receiverUpdateError;

                // Update sender's balance (the one receiving the withdrawal)
                const { error: senderUpdateError } = await supabase
                    .from('balances')
                    .update({ 
                        available_balance: newSenderBalance,
                        total_balance: newSenderBalance
                    })
                    .eq('account_id', currentAccount.id);

                if (senderUpdateError) throw senderUpdateError;

                // Create transaction record for receiver (the one being withdrawn from)
                const { error: receiverTransactionError } = await supabase
                    .from('transactions')
                    .insert({
                        account_id: receiverAccount.id,
                        amount: -transactionDetails.amount,
                        transaction_type: 'withdrawal',
                        description: `Withdrawal to ${currentAccount.account_number}`,
                        status: 'completed',
                        reference_id: receiverReferenceId
                    });

                if (receiverTransactionError) throw receiverTransactionError;

                // Create transaction record for sender (the one receiving the withdrawal)
                const { error: senderTransactionError } = await supabase
                    .from('transactions')
                    .insert({
                        account_id: currentAccount.id,
                        amount: transactionDetails.amount,
                        transaction_type: 'withdrawal',
                        description: `Withdrawal from ${receiverAccount.id}`,
                        status: 'completed',
                        reference_id: senderReferenceId
                    });

                if (senderTransactionError) throw senderTransactionError;

                // Update local state with new balance
                setBalance(newSenderBalance);
            } else {
                // Handle deposits and transfers
                // Validate sender's balance
                if (senderBalance.available_balance < transactionDetails.amount) {
                    throw new Error('Insufficient balance for this transaction');
                }

                // Calculate new balances
                const newSenderBalance = senderBalance.available_balance - transactionDetails.amount;
                const newReceiverBalance = receiverBalance.available_balance + transactionDetails.amount;

                // Update sender's balance
                const { error: senderUpdateError } = await supabase
                    .from('balances')
                    .update({ 
                        available_balance: newSenderBalance,
                        total_balance: newSenderBalance
                    })
                    .eq('account_id', currentAccount.id);

                if (senderUpdateError) throw senderUpdateError;

                // Update receiver's balance
                const { error: receiverUpdateError } = await supabase
                    .from('balances')
                    .update({ 
                        available_balance: newReceiverBalance,
                        total_balance: newReceiverBalance
                    })
                    .eq('account_id', receiverAccount.id);

                if (receiverUpdateError) throw receiverUpdateError;

                // Create transaction record for sender
                const { error: senderTransactionError } = await supabase
                    .from('transactions')
                    .insert({
                        account_id: currentAccount.id,
                        amount: -transactionDetails.amount,
                        transaction_type: transactionDetails.type,
                        description: `${transactionDetails.type === 'deposit' ? 'Deposit to' : 'Transfer to'} ${transactionDetails.receiverAccountNumber}`,
                        status: 'completed',
                        reference_id: senderReferenceId
                    });

                if (senderTransactionError) throw senderTransactionError;

                // Create transaction record for receiver
                const { error: receiverTransactionError } = await supabase
                    .from('transactions')
                    .insert({
                        account_id: receiverAccount.id,
                        amount: transactionDetails.amount,
                        transaction_type: transactionDetails.type,
                        description: `${transactionDetails.type === 'deposit' ? 'Deposit from' : 'Transfer from'} ${currentAccount.account_number}`,
                        status: 'completed',
                        reference_id: receiverReferenceId
                    });

                if (receiverTransactionError) throw receiverTransactionError;

                // Update local state with new balance
                setBalance(newSenderBalance);
            }

            // Show success modal and clean up states
            setShowConfirmationModal(false);
            setShowSuccessModal(true);
            setTransactionDetails(null);
            setQrData(null);
            setTransferAmount('');
            setTransferDescription('');
            
        } catch (err) {
            console.error('Error confirming transaction:', err);
            // Only show error modal if there's an actual error
            if (err instanceof Error) {
                setError(err.message);
                setShowErrorModal(true);
            }
        }
    };

    const handleCancelTransaction = async () => {
        try {
            // Clean up camera resources
            if (videoRef.current) {
                const stream = videoRef.current.srcObject as MediaStream;
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                videoRef.current.srcObject = null;
            }

            // Reset states
            setShowConfirmationModal(false);
            setShowTransferForm(false);
            setShowScannerModal(false);
            setIsCameraReady(false);
            setIsScanning(false);
            setTransactionDetails(null);
            setQrData(null);
            setTransferAmount('');
            setTransferDescription('');

            // Navigate back to dashboard and refresh
            history.push('/dashboard');
            window.location.reload();

        } catch (error) {
            console.error('Error cancelling transaction:', error);
            setError('Failed to cancel transaction');
            setShowErrorModal(true);
        }
    };

    // Handle file input for QR code images
    const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            // Create a new QR code reader
            const reader = new BrowserQRCodeReader();
            
            // Read the file as a data URL
            const reader2 = new FileReader();
            reader2.onload = async (e) => {
                if (!e.target?.result) return;
                
                try {
                    // Decode the QR code from the image
                    const result = await reader.decodeFromImageUrl(e.target.result as string);
                    if (result) {
                        console.log('QR Code detected from image:', result.getText());
                        handleQRScan(result.getText());
                        setShowScannerModal(false);
                    }
                } catch (err) {
                    console.error('Error decoding QR code from image:', err);
                    alert('Could not detect a valid QR code in the image. Please try another image.');
                } finally {
                    // Reset the file input
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            };
            
            reader2.readAsDataURL(file);
        } catch (err) {
            console.error('Error processing file:', err);
            alert('Error processing the image. Please try another image.');
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
                        style={{
                            '--background': 'transparent',
                            '--color': 'black',
                            '--height': '60px',
                            '--margin-top': '0px'
                        }}
                    />
                </IonRefresher>

                {/* Header */}
                <div className="flex justify-center items-center p-4 bg-[#5EC95F] relative h-20 shadow-md sticky top-0 z-50">
                    <FaSignOutAlt
                        className="text-black text-2xl absolute left-4 cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => setShowLogoutAlert(true)}
                    />
                    <img src="/bonk.png" alt="Bonk Logo" className="h-16 w-auto drop-shadow-lg" />
                </div>

                {/* Main Content */}
                <div className="flex flex-col min-h-screen pt-4">
                    {/* Welcome Section */}
                    <div className="flex flex-col items-center px-4 space-y-4">
                        {/* Profile and Settings */}
                        <div className="w-full max-w-md flex items-center space-x-4 bg-white p-4 rounded-lg shadow-md">
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
                            <FaCog className="text-3xl text-black cursor-pointer ml-auto hover:scale-110 transition-transform" onClick={() => history.push('/settings')} />
                        </div>

                        {/* Balance Card */}
                        <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md flex items-center">
                            <div className="flex-1">
                                <span className="text-lg text-gray-600">Account Balance</span>
                                <div className="text-2xl font-bold text-black">{formatCurrency(balance)}</div>
                                <div className="text-sm text-gray-500 mt-1">Account: {accountNumber}</div>
                            </div>
                            <button 
                                className="h-12 w-12 bg-[#5EC95F] text-white rounded-full flex items-center justify-center shadow-md text-2xl hover:scale-110 transition-transform"
                                onClick={() => history.push('/deposit')}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons Grid */}
                    <div className="mt-4 px-4">
                        <div className="bg-white rounded-lg shadow-md p-4 grid grid-cols-3 gap-4">
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
                                    className="h-24 bg-gray-100 rounded-lg flex flex-col items-center justify-center p-2 hover:bg-gray-200 transition-colors hover:scale-105"
                                    onClick={item.action}
                                >
                                    {item.icon}
                                    <span className="text-xs mt-2 text-black font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ad Banner */}
                    <div className="px-4 py-4">
                        <img 
                            src={adImages[currentAdIndex]} 
                            alt="Advertisement"
                            className={`w-full h-48 object-cover rounded-lg shadow-md transition-opacity duration-500 ${
                                fade ? 'opacity-100' : 'opacity-0'
                            }`}
                        />
                    </div>

                    {/* Transaction History Panel */}
                    <div className="bg-white rounded-t-xl shadow-lg p-4 mt-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-black text-lg">Recent Transactions</h3>
                            <button 
                                className="text-blue-500 text-md font-medium hover:underline"
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
                                <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-3 hover:bg-gray-100 transition-colors">
                                    <div>
                                        <span className="text-md text-gray-600">{transaction.description}</span>
                                        <div className="text-xs text-gray-400">
                                            {formatDate(transaction.created_at)}
                                        </div>
                                    </div>
                                    <span className={`text-md font-bold ${
                                        transaction.transaction_type === 'deposit' ? 'text-red-500' : 
                                        transaction.transaction_type === 'withdrawal' ? 'text-green-500' : 
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

                {/* Sticky QR Scan Button */}
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={() => {
                            setShowScannerModal(true);
                            setIsCameraReady(false);
                            setIsScanning(false);
                        }}
                        className="bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 transition-colors hover:scale-110"
                    >
                        <FaQrcode className="text-2xl" />
                    </button>
                </div>

                {/* Transfer Form Modal */}
                <IonModal isOpen={showTransferForm} onDidDismiss={() => {
                    setShowTransferForm(false);
                    setTransferAmount('');
                    setTransferDescription('');
                }}>
                    <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
                        <h2 className="text-2xl font-bold text-black mb-4">Enter Transfer Details</h2>
                        {transactionDetails && (
                            <div className="w-full max-w-md bg-gray-50 p-4 rounded-lg mb-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Type:</span>
                                        <span className="font-medium text-black capitalize">{transactionDetails.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Account Number:</span>
                                        <span className="font-medium text-black">{transactionDetails.receiverAccountNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Account Name:</span>
                                        <span className="font-medium text-black">{transactionDetails.receiverName}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="w-full max-w-md space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                                    Amount
                                </label>
                                <input
                                    id="amount"
                                    type="number"
                                    value={transferAmount}
                                    onChange={(e) => setTransferAmount(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-black bg-white leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                                    Description (Optional)
                                </label>
                                <input
                                    id="description"
                                    type="text"
                                    value={transferDescription}
                                    onChange={(e) => setTransferDescription(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-black bg-white leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="Enter description"
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    className="flex-1 bg-[#5EC95F] text-white font-bold py-3 px-8 rounded-md"
                                    onClick={handleTransferSubmit}
                                >
                                    Continue
                                </button>
                                <button
                                    className="flex-1 bg-gray-600 text-white font-bold py-3 px-8 rounded-md"
                                    onClick={() => {
                                        setShowTransferForm(false);
                                        setTransferAmount('');
                                        setTransferDescription('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </IonModal>

                {/* Confirmation Modal */}
                <IonModal isOpen={showConfirmationModal} onDidDismiss={() => {
                    setShowConfirmationModal(false);
                    setTransactionDetails(null);
                    setQrData(null);
                    setTransferAmount('');
                    setTransferDescription('');
                }}>
                    <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
                        <h2 className="text-2xl font-bold text-black mb-4">Confirm Transaction</h2>
                        {transactionDetails && (
                            <div className="w-full max-w-md bg-gray-50 p-4 rounded-lg">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Type:</span>
                                        <span className="font-medium text-black capitalize">{transactionDetails.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Account Number:</span>
                                        <span className="font-medium text-black">{transactionDetails.receiverAccountNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Account Name:</span>
                                        <span className="font-medium text-black">{transactionDetails.receiverName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Amount:</span>
                                        <span className="font-medium text-black">{formatCurrency(transactionDetails.amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Description:</span>
                                        <span className="font-medium text-black">{transactionDetails.description || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Reference Number:</span>
                                        <span className="font-medium text-black">{transactionDetails.referenceNumber}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col space-y-4 w-full max-w-md">
                            <button
                                className="bg-[#5EC95F] text-white font-bold py-3 px-8 rounded-md"
                                onClick={() => {
                                    // Show double-check confirmation
                                    if (window.confirm('Please verify that all transaction details are correct. This action cannot be undone. Do you want to proceed?')) {
                                        handleConfirmTransaction();
                                    }
                                }}
                            >
                                Confirm
                            </button>
                            <button
                                className="bg-gray-600 text-white font-bold py-3 px-8 rounded-md"
                                onClick={() => {
                                    console.log('Cancel button clicked, cleaning up...');
                                    // Clear all scanned data and states
                                    setScannedData(null);
                                    setTransactionDetails(null);
                                    setQrData(null);
                                    setTransferAmount('');
                                    setTransferDescription('');
                                    
                                    // Reset scanner states
                                    setShowScannerModal(false);
                                    setIsScanning(false);
                                    setIsCameraReady(false);
                                    setShowFileInput(false);
                                    
                                    // Stop QR code scanning
                                    if (codeReader.current) {
                                        console.log('Stopping QR code reader...');
                                        codeReader.current = null;
                                    }
                                    
                                    // Clean up camera resources
                                    if (videoRef.current && videoRef.current.srcObject) {
                                        const stream = videoRef.current.srcObject as MediaStream;
                                        stream.getTracks().forEach(track => {
                                            track.stop();
                                        });
                                        videoRef.current.srcObject = null;
                                    }
                                    
                                    // Reset scan flag
                                    hasScanned.current = false;
                                    
                                    // Navigate back to dashboard and refresh
                                    history.push('/dashboard');
                                    window.location.reload();
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
                    setTransferAmount('');
                    setTransferDescription('');
                    window.location.reload();
                }}>
                    <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-black">Transaction Successful</h2>
                        <div className="text-gray-600 text-center space-y-2">
                            <p>Your transfer has been completed successfully.</p>
                            <p className="text-sm">The recipient will receive the funds shortly.</p>
                            <p className="text-sm">You can view the transaction details in your transaction history.</p>
                        </div>
                        <button
                            className="bg-[#5EC95F] text-white font-bold py-3 px-8 rounded-md w-full max-w-md"
                            onClick={() => {
                                setShowSuccessModal(false);
                                setShowScannerModal(false);
                                setTransferAmount('');
                                setTransferDescription('');
                                window.location.reload();
                            }}
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </IonModal>

                {/* Error Modal */}
                <IonModal isOpen={showErrorModal} onDidDismiss={() => {
                    setShowErrorModal(false);
                    setError(null);
                }}>
                    <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-black">Error</h2>
                        <p className="text-gray-600 text-center">{error}</p>
                        <button
                            className="bg-gray-600 text-white font-bold py-3 px-8 rounded-md w-full max-w-md"
                            onClick={() => {
                                setShowErrorModal(false);
                                setError(null);
                            }}
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
                    setShowFileInput(false);
                    
                    // Stop QR code scanning
                    if (codeReader.current) {
                        console.log('Stopping QR code reader...');
                        codeReader.current = null;
                    }
                    
                    // Clean up camera resources
                    if (videoRef.current && videoRef.current.srcObject) {
                        const stream = videoRef.current.srcObject as MediaStream;
                        stream.getTracks().forEach(track => {
                            track.stop();
                            console.log('Stopped track:', track.label);
                        });
                        videoRef.current.srcObject = null;
                    }
                    
                    // Reset scan flag
                    hasScanned.current = false;
                }}>
                    <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
                        {!showFileInput ? (
                            <>
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
                                            // Clear all scanned data and states
                                            setScannedData(null);
                                            setTransactionDetails(null);
                                            setQrData(null);
                                            setTransferAmount('');
                                            setTransferDescription('');
                                            
                                            // Reset scanner states
                                            setShowScannerModal(false);
                                            setIsScanning(false);
                                            setIsCameraReady(false);
                                            setShowFileInput(false);
                                            
                                            // Stop QR code scanning
                                            if (codeReader.current) {
                                                console.log('Stopping QR code reader...');
                                                codeReader.current = null;
                                            }
                                            
                                            // Clean up camera resources
                                            if (videoRef.current && videoRef.current.srcObject) {
                                                const stream = videoRef.current.srcObject as MediaStream;
                                                stream.getTracks().forEach(track => {
                                                    track.stop();
                                                });
                                                videoRef.current.srcObject = null;
                                            }
                                            
                                            // Reset scan flag
                                            hasScanned.current = false;
                                            
                                            // Navigate back to dashboard and refresh
                                            history.push('/dashboard');
                                            window.location.reload();
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                                {isMobileDevice && (
                                    <div className="mt-4 w-full max-w-md">
                                        <button
                                            className="w-full bg-blue-500 text-white font-bold py-3 px-8 rounded-md"
                                            onClick={() => setShowFileInput(true)}
                                        >
                                            Upload QR Image Instead
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center justify-center w-full h-[60vh] bg-gray-100 rounded-lg mb-4">
                                    <FaQrcode className="text-6xl text-gray-400 mb-4" />
                                    <p className="text-black text-center mb-4">
                                        Upload an image containing a QR code
                                    </p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileInput}
                                        ref={fileInputRef}
                                        className="hidden"
                                    />
                                    <button
                                        className="bg-blue-500 text-white font-bold py-3 px-8 rounded-md mb-4"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Select Image
                                    </button>
                                </div>
                                <div className="flex space-x-4 w-full max-w-md">
                                    <button
                                        className="flex-1 bg-[#5EC95F] text-white font-bold py-3 px-8 rounded-md"
                                        onClick={() => setShowFileInput(false)}
                                    >
                                        Use Camera
                                    </button>
                                    <button
                                        className="flex-1 bg-gray-600 text-white font-bold py-3 px-8 rounded-md"
                                        onClick={() => {
                                            setShowScannerModal(false);
                                            setShowFileInput(false);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </IonModal>
            </IonContent>
        </IonPage>
    );
};

export default Dashboard;
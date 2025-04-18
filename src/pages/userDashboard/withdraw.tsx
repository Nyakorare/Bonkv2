import { IonContent, IonPage, IonModal } from '@ionic/react';
import { FaArrowLeft, FaWallet, FaQrcode, FaUniversity, FaStore, FaCopy, FaDownload } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { BrowserQRCodeReader } from '@zxing/browser';

const Withdraw: React.FC = () => {
  const history = useHistory();
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [showOTCModal, setShowOTCModal] = useState(false);
  const [otcExpiryTime, setOtcExpiryTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isOTCWithdrawComplete, setIsOTCWithdrawComplete] = useState(false);
  const [otcReferenceNumber, setOtcReferenceNumber] = useState('');
  const [showConfirmationQR, setShowConfirmationQR] = useState(false);
  const [confirmerAccount, setConfirmerAccount] = useState<string>('');
  const [confirmerBalance, setConfirmerBalance] = useState<number>(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState({
    date: '',
    time: '',
    amount: '',
    referenceNumber: '',
    status: ''
  });
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserQRCodeReader | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScannerConfirmModal, setShowScannerConfirmModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        // Fetch account data
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id, account_number')
          .eq('email', user.email)
          .single();

        if (accountError) throw accountError;

        if (account) {
          setAccountNumber(account.account_number);
        }

        // Fetch balance
        const { data: balanceData, error: balanceError } = await supabase
          .from('balances')
          .select('available_balance')
          .eq('account_id', account.id)
          .single();

        if (balanceError) throw balanceError;

        if (balanceData) {
          setBalance(balanceData.available_balance);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (selectedOption) {
      setShowConfirmModal(true);
    }
  }, [selectedOption]);

  useEffect(() => {
    if (selectedOption === 'counter' && showOTCModal) {
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 15);
      setOtcExpiryTime(expiryTime);
      setOtcReferenceNumber(`OTCW-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [selectedOption, showOTCModal]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otcExpiryTime) {
      timer = setInterval(() => {
        const now = new Date();
        const diff = otcExpiryTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('Expired');
          clearInterval(timer);
          setShowOTCModal(false);
          setSelectedOption('');
          setIsOTCWithdrawComplete(false);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otcExpiryTime]);

  useEffect(() => {
    if (isScanning && videoRef.current) {
      codeReader.current = new BrowserQRCodeReader();
      codeReader.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result) {
            handleConfirmerScan(result.getText());
            setIsScanning(false);
          }
        }
      );
    }

    return () => {
      if (codeReader.current) {
        codeReader.current = null;
      }
    };
  }, [isScanning]);

  const handleConfirmWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount < 50) {
      alert('Minimum withdraw amount is ₱50');
      return;
    }
    if (amount > balance) {
      alert('Insufficient balance');
      return;
    }
    setShowConfirmModal(false);
    if (selectedOption === 'counter') {
      setShowOTCModal(true);
    }
  };

  const handleConfirmerScan = async (scannedData: string) => {
    try {
      // Parse the scanned data (assuming it's a JSON string with account number)
      const { accountNumber: confirmerAccountNumber, referenceNumber } = JSON.parse(scannedData);
      
      // Check if this is a valid OTC withdrawal QR code
      if (!referenceNumber || !referenceNumber.startsWith('OTCW')) {
        alert('Invalid QR code: This is not a valid withdrawal QR code');
        return;
      }
      
      // Fetch confirmer's balance
      const { data: confirmerData, error: confirmerError } = await supabase
        .from('accounts')
        .select('id, account_number')
        .eq('account_number', confirmerAccountNumber)
        .single();

      if (confirmerError) throw confirmerError;

      const { data: confirmerBalanceData, error: balanceError } = await supabase
        .from('balances')
        .select('available_balance')
        .eq('account_id', confirmerData.id)
        .single();

      if (balanceError) throw balanceError;

      setConfirmerAccount(confirmerAccountNumber);
      setConfirmerBalance(confirmerBalanceData.available_balance);

      // Check if confirmer has enough balance
      if (confirmerBalanceData.available_balance < parseFloat(withdrawAmount)) {
        alert('Confirmer does not have enough balance');
        return;
      }

      // Show scanner confirmation modal
      setShowScannerConfirmModal(true);
      setIsScanning(false);
    } catch (err) {
      console.error('Error processing confirmation:', err);
      alert('Error processing confirmation. Please try again.');
    }
  };

  const handleScannerConfirm = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get current account
      const { data: currentAccount, error: accountError } = await supabase
        .from('accounts')
        .select('id, account_number')
        .eq('email', user.email)
        .single();

      if (accountError) throw accountError;

      // Get confirmer's account
      const { data: confirmerAccountData, error: confirmerError } = await supabase
        .from('accounts')
        .select('id')
        .eq('account_number', confirmerAccount)
        .single();

      if (confirmerError) throw confirmerError;

      // Get current balances
      const { data: senderBalance, error: senderBalanceError } = await supabase
        .from('balances')
        .select('available_balance, total_balance')
        .eq('account_id', currentAccount.id)
        .single();

      if (senderBalanceError) throw senderBalanceError;

      const { data: confirmerBalance, error: confirmerBalanceError } = await supabase
        .from('balances')
        .select('available_balance, total_balance')
        .eq('account_id', confirmerAccountData.id)
        .single();

      if (confirmerBalanceError) throw confirmerBalanceError;

      // Validate sender's balance
      if (senderBalance.available_balance < parseFloat(withdrawAmount)) {
        throw new Error('You do not have enough balance');
      }

      // Calculate new balances
      const newSenderBalance = senderBalance.available_balance - parseFloat(withdrawAmount);
      const newConfirmerBalance = confirmerBalance.available_balance + parseFloat(withdrawAmount);

      // Update sender's balance
      const { error: senderUpdateError } = await supabase
        .from('balances')
        .update({ 
          available_balance: newSenderBalance,
          total_balance: newSenderBalance
        })
        .eq('account_id', currentAccount.id);

      if (senderUpdateError) throw senderUpdateError;

      // Update confirmer's balance
      const { error: confirmerUpdateError } = await supabase
        .from('balances')
        .update({ 
          available_balance: newConfirmerBalance,
          total_balance: newConfirmerBalance
        })
        .eq('account_id', confirmerAccountData.id);

      if (confirmerUpdateError) throw confirmerUpdateError;

      // Create transaction record for sender
      const { error: senderTransactionError } = await supabase
        .from('transactions')
        .insert({
          account_id: currentAccount.id,
          amount: -parseFloat(withdrawAmount),
          transaction_type: 'withdrawal',
          description: `Withdrawal to ${confirmerAccount}`,
          status: 'completed',
          reference_id: otcReferenceNumber
        });

      if (senderTransactionError) throw senderTransactionError;

      // Create transaction record for confirmer
      const { error: confirmerTransactionError } = await supabase
        .from('transactions')
        .insert({
          account_id: confirmerAccountData.id,
          amount: parseFloat(withdrawAmount),
          transaction_type: 'withdrawal',
          description: `Withdrawal from ${currentAccount.account_number}`,
          status: 'completed',
          reference_id: otcReferenceNumber
        });

      if (confirmerTransactionError) throw confirmerTransactionError;

      // Update local state
      setBalance(newSenderBalance);
      setShowScannerConfirmModal(false);
      setShowReceipt(true);
      
      // Set receipt data
      const now = new Date();
      setReceiptData({
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        amount: withdrawAmount,
        referenceNumber: otcReferenceNumber,
        status: 'Completed'
      });
      
      // Reset states
      setWithdrawAmount('');
      setOtcReferenceNumber('');
      setIsOTCWithdrawComplete(true);
      
      // Refresh the page after successful transaction
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (err) {
      console.error('Error confirming withdrawal:', err);
      alert(err instanceof Error ? err.message : 'Error confirming withdrawal. Please try again.');
    }
  };

  const saveReceipt = () => {
    const receiptContent = `
      BONK BANK
      Withdraw Receipt
      -------------------------
      Date: ${receiptData.date}
      Time: ${receiptData.time}
      Amount: ₱${parseFloat(receiptData.amount).toFixed(2)}
      Reference Number: ${receiptData.referenceNumber}
      Status: ${receiptData.status}
      -------------------------
      Thank you for banking with us!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `withdraw_receipt_${receiptData.referenceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      // Check if the transaction is completed
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('status')
        .eq('reference_number', otcReferenceNumber)
        .single();

      if (!error && transaction && transaction.status === 'completed') {
        setShowOTCModal(false);
        setShowReceipt(true);
        setIsOTCWithdrawComplete(true);
        // Refresh user data to update balance
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: account } = await supabase
            .from('accounts')
            .select('id')
            .eq('email', user.email)
            .single();
          
          if (account) {
            const { data: balanceData } = await supabase
              .from('balances')
              .select('available_balance')
              .eq('account_id', account.id)
              .single();
            
            if (balanceData) {
              setBalance(balanceData.available_balance);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error refreshing status:', err);
      alert('Error refreshing transaction status. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

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
      >
        {/* Header - fixed height */}
        <div className="flex justify-center items-center p-4 bg-[#5EC95F] relative h-16">
          <FaArrowLeft
            className="text-black text-2xl absolute left-4 cursor-pointer"
            onClick={() => history.push('/dashboard')}
          />
          <img src="/bonk.png" alt="Bonk Logo" className="h-14" />
        </div>

        {/* Main content area - scrollable */}
        <div className="flex flex-col bg-[#5EC95F] px-4 w-full min-h-[calc(100%-64px)] pb-4">
          {/* Account Balance Container */}
          <div className="bg-white rounded-lg shadow-lg p-4 w-full mb-4">
            <div className="text-black text-lg font-bold text-center">
              Account Balance:
            </div>
            <div className="text-black text-xl font-bold text-center mt-1">
              ₱{balance.toFixed(2)}
            </div>
          </div>

          {/* White Container */}
          <div className="bg-white rounded-lg shadow-lg p-6 w-full mb-4 space-y-6">
            {/* Input Fields */}
            <div className="space-y-6">
              {/* Account Number Label */}
              <div className="text-center text-black font-bold">
                Account Number
              </div>
              {/* Account Number */}
              <div className="relative flex justify-center">
                <FaWallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                <input
                  type="text"
                  value={loading ? 'Loading...' : accountNumber}
                  readOnly
                  className="w-full p-3 rounded-md bg-white text-black focus:outline-none border border-gray-300 text-center"
                />
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-600"
                  onClick={() => {
                    if (accountNumber) {
                      navigator.clipboard.writeText(accountNumber);
                    }
                  }}
                >
                  <FaCopy className="text-lg" />
                </button>
              </div>
            </div>
          </div>

          {/* Withdraw Options Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 w-full mb-4">
            <h2 className="text-black font-bold mb-2">Withdraw Options</h2>
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-full p-3 rounded-md bg-white text-black focus:outline-none border border-gray-300"
            >
              <option value="" disabled>Select Withdraw Method</option>
              <option value="bank" disabled>Bank Transfer (Currently Unavailable)</option>
              <option value="counter">Over the Counter</option>
            </select>
          </div>
        </div>

        {/* Confirmation Modal */}
        <IonModal isOpen={showConfirmModal} onDidDismiss={() => {
          setShowConfirmModal(false);
          setSelectedOption('');
        }}>
          <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
            <h2 className="text-xl font-bold text-black mb-4">Confirm Withdraw Method</h2>
            <div className="text-center space-y-4">
              <p className="text-black">
                You have selected: <span className="font-bold">{selectedOption === 'bank' ? 'Bank Transfer' : 'Over the Counter'}</span>
              </p>
              {selectedOption === 'counter' && (
                <div className="w-full">
                  <label className="block text-black text-sm font-bold mb-2">
                    Withdraw Amount (Min: ₱50, Max: ₱{balance.toFixed(2)})
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="50"
                    max={balance}
                    className="w-full p-3 rounded-md bg-white text-black focus:outline-none border border-gray-300"
                  />
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                className="bg-gray-800 text-white font-bold py-2 px-6 rounded-md"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedOption('');
                }}
              >
                Cancel
              </button>
              <button
                className="bg-gray-700 text-white font-bold py-2 px-6 rounded-md"
                onClick={handleConfirmWithdraw}
                disabled={selectedOption === 'counter' && !withdrawAmount}
              >
                Confirm
              </button>
            </div>
          </div>
        </IonModal>

        {/* OTC Withdraw Modal */}
        <IonModal isOpen={showOTCModal} onDidDismiss={() => {
          setShowOTCModal(false);
          setSelectedOption('');
          setIsOTCWithdrawComplete(false);
          setShowConfirmationQR(false);
        }}>
          <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
            <h2 className="text-xl font-bold text-black mb-4">OTC Withdraw Status</h2>
            <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md border border-gray-200">
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-black">
                  {timeLeft}
                </div>
                <div className="text-black">
                  Please complete your withdrawal within the time limit
                </div>

                {/* QR Section */}
                <div className="bg-gray-100 p-4 rounded-md border border-gray-300">
                  {!showConfirmationQR ? (
                    <div>
                      <div className="font-bold text-black mb-2">Your QR Code</div>
                      <div className="flex justify-center mb-4">
                        <div className="w-48 h-48 bg-white p-2 rounded-md">
                          <QRCodeSVG
                            value={JSON.stringify({
                              accountNumber,
                              amount: withdrawAmount,
                              referenceNumber: otcReferenceNumber
                            })}
                            size={192}
                            level="H"
                            includeMargin={true}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-black mb-4">
                        Show this QR code to the other person/teller to complete the withdrawal
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-black mb-2">Confirmation Details</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-black">Confirmer Account:</span>
                          <span className="font-bold text-black">{confirmerAccount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black">Confirmer Balance:</span>
                          <span className="font-bold text-black">₱{confirmerBalance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black">Status:</span>
                          <span className="font-bold text-black">Confirmed</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-100 p-4 rounded-md border border-gray-300">
                  <div className="font-bold text-black">Withdrawal Details</div>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-black">Account Number:</span>
                      <span className="font-bold text-black">{accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Amount:</span>
                      <span className="font-bold text-black">₱{parseFloat(withdrawAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Reference Number:</span>
                      <span className="font-bold text-black">{otcReferenceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Status:</span>
                      <span className="font-bold text-black">
                        {isOTCWithdrawComplete ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-4 w-full max-w-md">
              <button
                className="mt-6 bg-gray-800 text-white font-bold py-2 px-6 rounded-md"
                onClick={() => {
                  setShowOTCModal(false);
                  setSelectedOption('');
                  setIsOTCWithdrawComplete(false);
                  setShowConfirmationQR(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </IonModal>

        {/* Receipt Modal */}
        <IonModal isOpen={showReceipt} onDidDismiss={() => setShowReceipt(false)}>
          <div className="flex flex-col items-center justify-center h-full bg-white p-6 space-y-6">
            <h2 className="text-xl font-bold text-black mb-4">Withdraw Receipt</h2>
            <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md border border-gray-200">
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-black mb-4">BONK BANK</div>
                <div className="bg-gray-100 p-4 rounded-md border border-gray-300">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-black">Date:</span>
                      <span className="font-bold text-black">{receiptData.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Time:</span>
                      <span className="font-bold text-black">{receiptData.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Amount:</span>
                      <span className="font-bold text-black">₱{parseFloat(receiptData.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Reference Number:</span>
                      <span className="font-bold text-black">{receiptData.referenceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">Status:</span>
                      <span className="font-bold text-black">{receiptData.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-black mt-4">
                  Thank you for banking with us!
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                className="bg-gray-800 text-white font-bold py-2 px-6 rounded-md"
                onClick={() => setShowReceipt(false)}
              >
                Close
              </button>
              <button
                className="bg-gray-700 text-white font-bold py-2 px-6 rounded-md flex items-center"
                onClick={saveReceipt}
              >
                <FaDownload className="mr-2" />
                Save Receipt
              </button>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Withdraw;
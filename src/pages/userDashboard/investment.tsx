import { IonContent, IonPage, IonModal, IonSegment, IonSegmentButton, IonAlert, IonLoading, IonInput, IonButton, IonCheckbox, IonTextarea } from '@ionic/react';
import { 
  FaArrowLeft, 
  FaChartLine, 
  FaPiggyBank, 
  FaCoins, 
  FaHandHoldingUsd,
  FaChartPie,
  FaShieldAlt,
  FaMoneyBillWave,
  FaBuilding,
  FaGlobeAmericas,
  FaPlus,
  FaFileSignature
} from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ReactElement } from 'react';
import { supabase } from '../../supabaseClient';

interface Investment {
  id: number;
  name: string;
  type: string;
  icon: ReactElement;
  return_rate: number;
  risk_level: string;
  min_investment: number;
  description: string;
}

interface PerformanceData {
  month: string;
  return: number;
}

interface InvestmentData {
  portfolioValue: string;
  totalReturns: string;
  investments: Investment[];
  performanceHistory: PerformanceData[];
}

interface InvestmentProfile {
  id: string;
  account_id: string;
  balance: number;
  total_invested: number;
  total_returns: number;
  created_at: string;
}

interface InvestmentTransaction {
  id: string;
  account_id: string;
  amount: number;
  transaction_type: 'investment_deposit' | 'investment_withdrawal';
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  reference_id: string;
}

interface InvestmentAgreement {
  id: string;
  account_id: string;
  agreement_text: string;
  signed_at: string;
  version: string;
}

interface InvestmentHolding {
  id: string;
  account_id: string;
  investment_id: number;
  amount: number;
  purchase_price: number;
  purchase_date: string;
}

const InvestmentPage: React.FC = () => {
  const history = useHistory();
  const [activeSegment, setActiveSegment] = useState<string>('opportunities');
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [investmentProfile, setInvestmentProfile] = useState<InvestmentProfile | null>(null);
  const [accountBalance, setAccountBalance] = useState(0);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [investmentTransactions, setInvestmentTransactions] = useState<InvestmentTransaction[]>([]);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementText, setAgreementText] = useState('');
  const [hasAgreement, setHasAgreement] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [investmentHoldings, setInvestmentHoldings] = useState<InvestmentHolding[]>([]);
  const [investmentOptions, setInvestmentOptions] = useState<Investment[]>([]);
  const [agreementDeclined, setAgreementDeclined] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState('');

  // Mock performance history data
  const performanceHistory: PerformanceData[] = [
    { month: 'Jan', return: 2.1 },
    { month: 'Feb', return: 3.5 },
    { month: 'Mar', return: 1.8 },
    { month: 'Apr', return: 4.2 },
    { month: 'May', return: 3.9 },
  ];

  useEffect(() => {
    fetchInvestmentData();
  }, []);

  // Add a new effect to handle agreement decline
  useEffect(() => {
    if (agreementDeclined) {
      // Redirect to dashboard after a short delay
      const timer = setTimeout(() => {
        history.push('/dashboard');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [agreementDeclined, history]);

  const fetchInvestmentData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        history.push('/login');
        return;
      }

      // Get the user's account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('email', user.email)
        .single();

      if (accountError) throw accountError;
      if (!account) throw new Error('No account found');

      setAccountId(account.id);
      
      // Get the user's balance from the balances table
      const { data: balanceData, error: balanceError } = await supabase
        .from('balances')
        .select('available_balance')
        .eq('account_id', account.id)
        .single();

      if (balanceError) throw balanceError;
      if (!balanceData) throw new Error('Balance not found');
      
      setAccountBalance(balanceData.available_balance);

      // Fetch investment options
      const { data: options, error: optionsError } = await supabase
        .from('investment_options')
        .select('*');

      if (optionsError) throw optionsError;

      // Map investment options to include icons
      const mappedOptions = options.map(option => ({
        ...option,
        icon: getInvestmentIcon(option.type)
      }));

      setInvestmentOptions(mappedOptions);

      // Check if user has signed an investment agreement
      const { data: agreement, error: agreementError } = await supabase
        .from('investment_agreements')
        .select('*')
        .eq('account_id', account.id)
        .single();

      if (agreementError && agreementError.code !== 'PGRST116') {
        throw agreementError;
      }

      setHasAgreement(!!agreement);
      if (agreement) {
        setAgreementText(agreement.agreement_text);
      } else {
        // If no agreement exists, show the agreement modal
        setShowAgreementModal(true);
      }

      // Check if user has an investment profile
      const { data: profile, error: profileError } = await supabase
        .from('investment_profiles')
        .select('*')
        .eq('account_id', account.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profile) {
        setInvestmentProfile(profile);
        
        // Fetch investment transactions
        const { data: transactions, error: transactionsError } = await supabase
          .from('investment_transactions')
          .select('*')
          .eq('account_id', account.id)
          .order('created_at', { ascending: false });

        if (transactionsError) throw transactionsError;
        setInvestmentTransactions(transactions || []);
        
        // Fetch investment holdings
        const { data: holdings, error: holdingsError } = await supabase
          .from('investment_holdings')
          .select('*')
          .eq('account_id', account.id);

        if (holdingsError) throw holdingsError;
        setInvestmentHoldings(holdings || []);
      }
    } catch (err) {
      console.error('Error fetching investment data:', err);
      setError('Failed to load investment information');
    } finally {
      setLoading(false);
    }
  };

  const getInvestmentIcon = (type: string): ReactElement => {
    switch (type) {
      case 'Equities':
        return <FaChartLine className="text-blue-500" />;
      case 'Fixed Income':
        return <FaShieldAlt className="text-green-500" />;
      case 'REIT':
        return <FaBuilding className="text-purple-500" />;
      case 'Foreign Currency':
        return <FaGlobeAmericas className="text-yellow-500" />;
      default:
        return <FaCoins className="text-gray-500" />;
    }
  };

  const createInvestmentProfile = async (accountId: string) => {
    try {
      setLoading(true);
      
      // Create investment profile
      const { data: newProfile, error: createError } = await supabase
        .from('investment_profiles')
        .insert({
          account_id: accountId,
          balance: 0,
          total_invested: 0,
          total_returns: 0
        })
        .select()
        .single();

      if (createError) throw createError;
      setInvestmentProfile(newProfile);
      setShowAgreementModal(false);
      setSuccessMessage('Investment profile created successfully');
      setShowSuccessAlert(true);
      
      // Refresh data
      await fetchInvestmentData();
    } catch (err) {
      console.error('Error creating investment profile:', err);
      setError('Failed to create investment profile');
    } finally {
      setLoading(false);
    }
  };

  const signAgreement = async () => {
    if (!accountId || !agreementAccepted) return;
    
    try {
      setLoading(true);
      
      // Create investment agreement
      const { data: agreement, error: agreementError } = await supabase
        .from('investment_agreements')
        .insert({
          account_id: accountId,
          agreement_text: agreementText,
          signed_at: new Date().toISOString(),
          version: '1.0'
        })
        .select()
        .single();
      
      if (agreementError) throw agreementError;
      
      // Create investment profile
      await createInvestmentProfile(accountId);
      
      setSuccessMessage('Investment agreement signed successfully');
      setShowSuccessAlert(true);
      
      // Close the agreement modal
      setShowAgreementModal(false);
      
      // Refresh data
      await fetchInvestmentData();
    } catch (err) {
      console.error('Error signing agreement:', err);
      setError('Failed to sign investment agreement');
    } finally {
      setLoading(false);
    }
  };

  // Add a function to handle agreement decline
  const declineAgreement = () => {
    setShowAgreementModal(false);
    setAgreementDeclined(true);
    setSuccessMessage('You have declined the investment agreement. Redirecting to dashboard...');
    setShowSuccessAlert(true);
  };

  const addFundsToInvestment = async () => {
    if (!investmentProfile || !addFundsAmount || isNaN(Number(addFundsAmount)) || Number(addFundsAmount) <= 0) {
      return;
    }

    const amount = Number(addFundsAmount);
    
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        history.push('/login');
        return;
      }

      // Get the user's account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('email', user.email)
        .single();

      if (accountError) throw accountError;
      if (!account) throw new Error('No account found');

      // Get the user's balance from the balances table
      const { data: balanceData, error: balanceError } = await supabase
        .from('balances')
        .select('available_balance')
        .eq('account_id', account.id)
        .single();

      if (balanceError) throw balanceError;
      if (!balanceData) throw new Error('Balance not found');

      // Check if user has enough balance
      if (balanceData.available_balance < amount) {
        setError('Insufficient funds in your account');
        return;
      }

      // Instead of using the RPC function, handle the transfer directly
      
      // 1. Update the user's balance in the balances table
      const newBalance = balanceData.available_balance - amount;
      const { error: updateBalanceError } = await supabase
        .from('balances')
        .update({ available_balance: newBalance, total_balance: newBalance })
        .eq('account_id', account.id);
        
      if (updateBalanceError) throw updateBalanceError;
      
      // 2. Update the investment profile balance
      const newInvestmentBalance = investmentProfile.balance + amount;
      const { error: updateInvestmentError } = await supabase
        .from('investment_profiles')
        .update({ balance: newInvestmentBalance })
        .eq('id', investmentProfile.id);
        
      if (updateInvestmentError) throw updateInvestmentError;
      
      // 3. Create a transaction record
      const referenceId = `INV-${Date.now()}`;
      const { error: transactionError } = await supabase
        .from('investment_transactions')
        .insert({
          account_id: account.id,
          amount: amount,
          transaction_type: 'investment_deposit',
          description: 'Added funds to investment balance',
          status: 'completed',
          reference_id: referenceId
        });
        
      if (transactionError) throw transactionError;
      
      // 4. Create a regular transaction record
      const { error: regularTransactionError } = await supabase
        .from('transactions')
        .insert({
          account_id: account.id,
          amount: -amount,
          transaction_type: 'transfer',
          description: 'Transfer to investment balance',
          status: 'completed',
          reference_id: referenceId
        });
        
      if (regularTransactionError) throw regularTransactionError;
      
      // Update local state
      setInvestmentProfile({
        ...investmentProfile,
        balance: newInvestmentBalance
      });
      
      setShowAddFundsModal(false);
      setAddFundsAmount('');
      setSuccessMessage(`Successfully added ${formatCurrency(amount)} to your investment balance`);
      setShowSuccessAlert(true);
      
      // Refresh data
      await fetchInvestmentData();
    } catch (err) {
      console.error('Error adding funds to investment:', err);
      setError('Failed to add funds to investment');
    } finally {
      setLoading(false);
    }
  };

  const investInStock = async () => {
    if (!selectedInvestment || !investmentProfile || !investAmount || 
        isNaN(Number(investAmount)) || Number(investAmount) <= 0) {
      return;
    }

    const amount = Number(investAmount);
    
    try {
      setLoading(true);
      
      // Check if user has enough balance in investment profile
      if (investmentProfile.balance < amount) {
        setError('Insufficient funds in your investment balance');
        return;
      }
      
      // Check if amount meets minimum investment
      if (amount < selectedInvestment.min_investment) {
        setError(`Minimum investment amount is ${formatCurrency(selectedInvestment.min_investment)}`);
        return;
      }
      
      // Create investment holding
      const { data: holding, error: holdingError } = await supabase
        .from('investment_holdings')
        .insert({
          account_id: investmentProfile.account_id,
          investment_id: selectedInvestment.id,
          amount: amount,
          purchase_price: amount, // In a real app, this would be the current price of the investment
          purchase_date: new Date().toISOString()
        })
        .select()
        .single();
        
      if (holdingError) throw holdingError;
      
      // Update investment profile balance
      const { error: updateProfileError } = await supabase
        .from('investment_profiles')
        .update({ 
          balance: investmentProfile.balance - amount,
          total_invested: investmentProfile.total_invested + amount
        })
        .eq('id', investmentProfile.id);
        
      if (updateProfileError) throw updateProfileError;
      
      // Create investment transaction
      const referenceId = `INV-${Date.now()}`;
      const { error: transactionError } = await supabase
        .from('investment_transactions')
        .insert({
          account_id: investmentProfile.account_id,
          amount: -amount, // Negative amount for investment
          transaction_type: 'investment_withdrawal',
          description: `Investment in ${selectedInvestment.name}`,
          status: 'completed',
          reference_id: referenceId
        });
        
      if (transactionError) throw transactionError;
      
      // Refresh data
      await fetchInvestmentData();
      
      setShowInvestModal(false);
      setInvestAmount('');
      setSelectedInvestment(null);
      setSuccessMessage(`Successfully invested ${formatCurrency(amount)} in ${selectedInvestment.name}`);
      setShowSuccessAlert(true);
    } catch (err) {
      console.error('Error investing in stock:', err);
      setError('Failed to invest in stock');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) {
      return '₱0.00';
    }
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getRiskColor = (risk: string): string => {
    switch(risk) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const checkoutFromInvestment = async () => {
    if (!investmentProfile || !checkoutAmount || isNaN(Number(checkoutAmount)) || Number(checkoutAmount) <= 0) {
      return;
    }

    const amount = Number(checkoutAmount);
    
    try {
      setLoading(true);
      
      // Check if user has enough balance in investment profile
      if (investmentProfile.balance < amount) {
        setError('Insufficient funds in your investment balance');
        return;
      }
      
      // Check minimum checkout amount
      if (amount < 50) {
        setError('Minimum checkout amount is ₱50');
        return;
      }
      
      // Get the user's account
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        history.push('/login');
        return;
      }

      // Get the user's account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('email', user.email)
        .single();

      if (accountError) throw accountError;
      if (!account) throw new Error('No account found');

      // Get the user's balance from the balances table
      const { data: balanceData, error: balanceError } = await supabase
        .from('balances')
        .select('available_balance')
        .eq('account_id', account.id)
        .single();

      if (balanceError) throw balanceError;
      if (!balanceData) throw new Error('Balance not found');
      
      // 1. Update the user's balance in the balances table
      const newBalance = balanceData.available_balance + amount;
      const { error: updateBalanceError } = await supabase
        .from('balances')
        .update({ available_balance: newBalance, total_balance: newBalance })
        .eq('account_id', account.id);
        
      if (updateBalanceError) throw updateBalanceError;
      
      // 2. Update the investment profile balance
      const newInvestmentBalance = investmentProfile.balance - amount;
      const { error: updateInvestmentError } = await supabase
        .from('investment_profiles')
        .update({ balance: newInvestmentBalance })
        .eq('id', investmentProfile.id);
        
      if (updateInvestmentError) throw updateInvestmentError;
      
      // 3. Create an investment transaction record
      const referenceId = `INV-CHECKOUT-${Date.now()}`;
      const { error: transactionError } = await supabase
        .from('investment_transactions')
        .insert({
          account_id: account.id,
          amount: -amount,
          transaction_type: 'investment_withdrawal',
          description: 'Checkout from investment balance',
          status: 'completed',
          reference_id: referenceId
        });
        
      if (transactionError) throw transactionError;
      
      // 4. Create a regular transaction record
      const { error: regularTransactionError } = await supabase
        .from('transactions')
        .insert({
          account_id: account.id,
          amount: amount,
          transaction_type: 'transfer',
          description: 'Transfer from investment balance',
          status: 'completed',
          reference_id: referenceId
        });
        
      if (regularTransactionError) throw regularTransactionError;
      
      // Update local state
      setInvestmentProfile({
        ...investmentProfile,
        balance: newInvestmentBalance
      });
      
      setShowCheckoutModal(false);
      setCheckoutAmount('');
      setSuccessMessage(`Successfully checked out ${formatCurrency(amount)} to your main account`);
      setShowSuccessAlert(true);
      
      // Refresh data
      await fetchInvestmentData();
    } catch (err) {
      console.error('Error checking out from investment:', err);
      setError('Failed to checkout from investment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent 
        fullscreen
        scrollY={true}
        className="ion-content-fullscreen"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#5EC95F] p-4 flex justify-center items-center h-16 shadow-sm">
          <button 
            onClick={() => history.push('/dashboard')}
            className="absolute left-4 text-white hover:opacity-80 transition-opacity"
          >
            <FaArrowLeft className="text-2xl" />
          </button>
          <div className="flex items-center">
            <img src="/bonk.png" alt="Bonk Logo" className="h-8 mr-2" />
            <h1 className="text-xl font-bold text-white">Investments</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gradient-to-b from-[#5EC95F] to-[#4AB54B] min-h-[calc(100vh-64px)] pb-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <IonLoading isOpen={true} message="Loading..." />
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-lg p-4 mx-4 mt-4">
              <p className="text-red-500 text-center">{error}</p>
            </div>
          ) : !hasAgreement ? (
            <div className="p-4">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <FaFileSignature className="text-5xl text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Investment Agreement Required</h2>
                <p className="text-gray-600 mb-6">
                  Before you can start investing, you need to review and sign our investment agreement.
                </p>
                <button 
                  className="bg-[#5EC95F] text-white py-3 px-6 rounded-xl font-bold w-full mb-3"
                  onClick={() => setShowAgreementModal(true)}
                >
                  Review Agreement
                </button>
                <button 
                  className="bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-bold w-full"
                  onClick={declineAgreement}
                >
                  Decline & Return to Dashboard
                </button>
              </div>
            </div>
          ) : !investmentProfile ? (
            <div className="p-4">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <FaPiggyBank className="text-5xl text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Create Investment Profile</h2>
                <p className="text-gray-600 mb-6">
                  You've signed the agreement. Now let's create your investment profile to get started.
                </p>
                <button 
                  className="bg-[#5EC95F] text-white py-3 px-6 rounded-xl font-bold w-full"
                  onClick={() => accountId && createInvestmentProfile(accountId)}
                >
                  Create Profile
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Portfolio Summary */}
              <div className="p-4">
                <div className="bg-white rounded-xl shadow-lg p-5 text-black">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <FaPiggyBank className="mr-2" />
                        Investment Balance
                      </div>
                      <div className="text-xl font-bold">{investmentProfile ? formatCurrency(investmentProfile.balance) : '₱0'}</div>
                    </div>
                    <div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <FaChartLine className="mr-2" />
                        Total Returns
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        {investmentProfile ? 
                          `${investmentProfile.total_returns >= 0 ? '+' : ''}${formatCurrency(investmentProfile.total_returns)}` : 
                          '+₱0'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Add Funds Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button 
                      className="w-full bg-[#5EC95F] text-white py-3 rounded-xl font-bold flex items-center justify-center mb-3"
                      onClick={() => setShowAddFundsModal(true)}
                    >
                      <FaPlus className="mr-2" /> Add Funds
                    </button>
                    <button 
                      className="w-full bg-white text-[#5EC95F] border border-[#5EC95F] py-3 rounded-xl font-bold flex items-center justify-center"
                      onClick={() => setShowCheckoutModal(true)}
                    >
                      <FaMoneyBillWave className="mr-2" /> Checkout
                    </button>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      Account Balance: {formatCurrency(accountBalance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Segment Control */}
              <div className="px-4 mt-2">
                <IonSegment 
                  value={activeSegment} 
                  onIonChange={e => setActiveSegment(e.detail.value as string)}
                  className="bg-white rounded-xl shadow"
                >
                  <IonSegmentButton value="opportunities" className="rounded-l-lg">
                    <div className="flex items-center justify-center py-2 px-1">
                      <FaCoins className="mr-2 text-[#5EC95F]" />
                      <span className="text-sm font-medium text-black">Opportunities</span>
                    </div>
                  </IonSegmentButton>
                  <IonSegmentButton value="portfolio" className="rounded-r-lg">
                    <div className="flex items-center justify-center py-2 px-1">
                      <FaChartPie className="mr-2 text-[#5EC95F]" />
                      <span className="text-sm font-medium text-black">My Portfolio</span>
                    </div>
                  </IonSegmentButton>
                </IonSegment>
              </div>

              {/* Content based on segment */}
              <div className="p-4">
                {activeSegment === 'opportunities' ? (
                  <>
                    <h2 className="text-white text-xl font-bold mb-3 flex items-center">
                      <FaCoins className="mr-2" /> Investment Opportunities
                    </h2>
                    <div className="space-y-4">
                      {investmentOptions.map((investment) => (
                        <div 
                          key={investment.id} 
                          className="bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all text-black"
                          onClick={() => setSelectedInvestment(investment)}
                        >
                          <div className="flex items-start">
                            <div className="p-2 bg-gray-100 rounded-lg mr-3">
                              {investment.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-bold text-lg">{investment.name}</div>
                                  <div className="text-gray-500 text-sm">{investment.type}</div>
                                </div>
                                <div className="text-green-600 font-bold">{investment.return_rate}%</div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                                <div className="flex items-center">
                                  <FaShieldAlt className="text-gray-400 mr-2" />
                                  <div>
                                    <div className="text-gray-500 text-xs">Risk</div>
                                    <div className={`text-sm font-medium ${getRiskColor(investment.risk_level)}`}>
                                      {investment.risk_level}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <FaMoneyBillWave className="text-gray-400 mr-2" />
                                  <div>
                                    <div className="text-gray-500 text-xs">Minimum</div>
                                    <div className="text-sm font-medium">{formatCurrency(investment.min_investment)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-white text-xl font-bold mb-3 flex items-center">
                      <FaChartPie className="mr-2" /> My Investment Portfolio
                    </h2>
                    <div className="bg-white rounded-xl shadow-lg p-4 mb-4 text-black">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold flex items-center">
                          <FaChartLine className="mr-2 text-[#5EC95F]" /> Performance
                        </div>
                        <div className="text-green-600 text-sm flex items-center">
                          +3.9% this month
                        </div>
                      </div>
                      <div className="h-40 bg-gray-50 rounded-lg flex items-end justify-between px-3 py-2">
                        {performanceHistory.map((month, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div 
                              className="w-6 bg-gradient-to-t from-[#5EC95F] to-[#8AFF8B] rounded-t-sm"
                              style={{ height: `${month.return * 10}px` }}
                            ></div>
                            <div className="text-xs text-gray-500 mt-1">{month.month}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <h3 className="text-white font-bold mb-2">Investment Transactions</h3>
                    {investmentTransactions.length > 0 ? (
                      <div className="space-y-3">
                        {investmentTransactions.map((txn) => (
                          <div key={txn.id} className="bg-white rounded-xl shadow-lg p-4 text-black">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold">{txn.description}</div>
                                <div className="text-gray-500 text-sm">{formatDate(txn.created_at)}</div>
                                <div className="text-gray-400 text-xs mt-1">Status: {txn.status}</div>
                              </div>
                              <div className={`text-lg font-bold ${txn.amount > 0 ? 'text-[#5EC95F]' : 'text-red-500'}`}>
                                {txn.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-lg p-4 text-center text-gray-500">
                        No investment transactions yet
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Investment Detail Modal */}
        <IonModal 
          isOpen={!!selectedInvestment} 
          onDidDismiss={() => setSelectedInvestment(null)}
          className="investment-modal"
        >
          {selectedInvestment && (
            <div className="h-full flex flex-col bg-gray-50">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm">
                <h2 className="text-xl font-bold flex items-center text-black">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    {selectedInvestment.icon}
                  </div>
                  {selectedInvestment.name}
                </h2>
                <button 
                  onClick={() => setSelectedInvestment(null)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-xl shadow-sm p-5 mb-4 text-black">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-500 text-sm">Expected Return</div>
                      <div className="text-2xl font-bold text-green-600">{selectedInvestment.return_rate}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Risk Level</div>
                      <div className={`text-2xl font-bold ${getRiskColor(selectedInvestment.risk_level)}`}>
                        {selectedInvestment.risk_level}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Minimum Investment</div>
                      <div className="text-xl font-bold">{formatCurrency(selectedInvestment.min_investment)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Type</div>
                      <div className="text-xl font-bold">{selectedInvestment.type}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-bold mb-3 text-lg flex items-center text-black">
                    <FaCoins className="mr-2 text-[#5EC95F]" /> Description
                  </h3>
                  <p className="text-gray-700 bg-white p-4 rounded-lg shadow-sm">
                    {selectedInvestment.description}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-bold mb-3 text-lg flex items-center text-black">
                    <FaChartLine className="mr-2 text-[#5EC95F]" /> Performance
                  </h3>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="h-40 flex items-end justify-between">
                      {[10, 20, 30, 25, 35].map((value, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div 
                            className="w-4 bg-gradient-to-t from-[#5EC95F] to-[#8AFF8B] rounded-t-sm"
                            style={{ height: `${value}px` }}
                          ></div>
                          <div className="text-xs text-gray-500 mt-1">Q{index+1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button 
                  className="w-full bg-[#5EC95F] hover:bg-[#4AB54B] text-white py-4 rounded-xl font-bold flex items-center justify-center shadow-lg mt-4 transition-colors"
                  onClick={() => setShowInvestModal(true)}
                >
                  <FaHandHoldingUsd className="mr-3 text-xl" /> 
                  <span className="text-lg">Invest Now</span>
                </button>
              </div>
            </div>
          )}
        </IonModal>

        {/* Add Funds Modal */}
        <IonModal isOpen={showAddFundsModal} onDidDismiss={() => setShowAddFundsModal(false)}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm">
              <h2 className="text-xl font-bold text-black">Add Funds to Investment</h2>
              <button 
                onClick={() => setShowAddFundsModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white rounded-xl shadow-sm p-5 mb-4 text-black">
                <h3 className="text-lg font-bold mb-4">Transfer Funds</h3>
                <p className="text-gray-600 mb-4">
                  Add funds from your account balance to your investment balance.
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Available Balance:</strong> {formatCurrency(accountBalance)}
                </p>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Amount
                  </label>
                  <IonInput
                    type="number"
                    value={addFundsAmount}
                    onIonChange={e => setAddFundsAmount(e.detail.value || '')}
                    placeholder="Enter amount"
                    className="border border-gray-300 rounded-lg p-2 w-full"
                  />
                </div>
              </div>
              
              <IonButton 
                expand="block"
                className="w-full bg-[#5EC95F] text-white py-4 rounded-xl font-bold"
                onClick={addFundsToInvestment}
                disabled={!addFundsAmount || isNaN(Number(addFundsAmount)) || Number(addFundsAmount) <= 0 || Number(addFundsAmount) > accountBalance}
              >
                Add Funds
              </IonButton>
            </div>
          </div>
        </IonModal>

        {/* Investment Agreement Modal */}
        <IonModal isOpen={showAgreementModal} onDidDismiss={() => setShowAgreementModal(false)}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm">
              <h2 className="text-xl font-bold text-black">Investment Agreement</h2>
              <button 
                onClick={() => setShowAgreementModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white rounded-xl shadow-sm p-5 mb-4 text-black">
                <h3 className="text-lg font-bold mb-4">Terms and Conditions</h3>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-96 overflow-y-auto">
                  <p className="text-gray-700 mb-4">
                    By signing this agreement, you acknowledge and agree to the following terms and conditions:
                  </p>
                  <ol className="list-decimal pl-5 text-gray-700 space-y-2">
                    <li>You understand that investments carry risks, and past performance is not indicative of future results.</li>
                    <li>You confirm that you have read and understood all the investment options available to you.</li>
                    <li>You acknowledge that you are responsible for making your own investment decisions.</li>
                    <li>You understand that the value of your investments can go down as well as up.</li>
                    <li>You agree to comply with all applicable laws and regulations regarding investments.</li>
                    <li>You confirm that the information you have provided is accurate and complete.</li>
                    <li>You understand that fees may apply to certain investment transactions.</li>
                    <li>You acknowledge that we are not providing financial advice, and you should seek professional advice if needed.</li>
                  </ol>
                  <p className="text-gray-700 mt-4">
                    This agreement is effective as of the date you sign it and will remain in effect until terminated by either party.
                  </p>
                </div>
                <div className="flex items-center mb-4">
                  <IonCheckbox 
                    checked={agreementAccepted}
                    onIonChange={e => setAgreementAccepted(e.detail.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">
                    I have read and agree to the terms and conditions above
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button 
                  className={`w-full py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center ${
                    agreementAccepted 
                      ? 'bg-[#5EC95F] text-white hover:bg-[#4AB54B] shadow-lg' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={signAgreement}
                  disabled={!agreementAccepted}
                >
                  <FaFileSignature className="mr-2" />
                  Sign Agreement
                </button>
                
                <button 
                  className="w-full py-4 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
                  onClick={declineAgreement}
                >
                  <FaArrowLeft className="mr-2" />
                  Decline Agreement
                </button>
              </div>
            </div>
          </div>
        </IonModal>

        {/* Invest Modal */}
        <IonModal isOpen={showInvestModal} onDidDismiss={() => setShowInvestModal(false)}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm">
              <h2 className="text-xl font-bold text-black">Invest in {selectedInvestment?.name}</h2>
              <button 
                onClick={() => setShowInvestModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white rounded-xl shadow-sm p-5 mb-4 text-black">
                <h3 className="text-lg font-bold mb-4">Investment Details</h3>
                <p className="text-gray-600 mb-4">
                  Enter the amount you want to invest in {selectedInvestment?.name}.
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Available Investment Balance:</strong> {investmentProfile ? formatCurrency(investmentProfile.balance) : '₱0'}
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Minimum Investment:</strong> {selectedInvestment ? formatCurrency(selectedInvestment.min_investment) : '₱0'}
                </p>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Investment Amount
                  </label>
                  <IonInput
                    type="number"
                    value={investAmount}
                    onIonChange={e => setInvestAmount(e.detail.value || '')}
                    placeholder="Enter amount"
                    className="border border-gray-300 rounded-lg p-2 w-full"
                  />
                </div>
              </div>
              
              <button 
                className={`w-full py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center ${
                  !investAmount || isNaN(Number(investAmount)) || Number(investAmount) <= 0 || 
                  !investmentProfile || Number(investAmount) > investmentProfile.balance || 
                  !selectedInvestment || Number(investAmount) < selectedInvestment.min_investment
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#5EC95F] text-white hover:bg-[#4AB54B] shadow-lg'
                }`}
                onClick={investInStock}
                disabled={!investAmount || isNaN(Number(investAmount)) || Number(investAmount) <= 0 || 
                         !investmentProfile || Number(investAmount) > investmentProfile.balance || 
                         !selectedInvestment || Number(investAmount) < selectedInvestment.min_investment}
              >
                <FaHandHoldingUsd className="mr-2" />
                Confirm Investment
              </button>
            </div>
          </div>
        </IonModal>

        {/* Checkout Modal */}
        <IonModal isOpen={showCheckoutModal} onDidDismiss={() => setShowCheckoutModal(false)}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm">
              <h2 className="text-xl font-bold text-black">Checkout from Investment</h2>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white rounded-xl shadow-sm p-5 mb-4 text-black">
                <h3 className="text-lg font-bold mb-4">Transfer Funds</h3>
                <p className="text-gray-600 mb-4">
                  Transfer funds from your investment balance to your main account balance.
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Available Investment Balance:</strong> {investmentProfile ? formatCurrency(investmentProfile.balance) : '₱0'}
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Minimum Checkout Amount:</strong> ₱50
                </p>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Amount
                  </label>
                  <IonInput
                    type="number"
                    value={checkoutAmount}
                    onIonChange={e => setCheckoutAmount(e.detail.value || '')}
                    placeholder="Enter amount"
                    className="border border-gray-300 rounded-lg p-2 w-full"
                  />
                </div>
              </div>
              
              <IonButton 
                expand="block"
                className="w-full bg-[#5EC95F] text-white py-4 rounded-xl font-bold"
                onClick={checkoutFromInvestment}
                disabled={!checkoutAmount || isNaN(Number(checkoutAmount)) || Number(checkoutAmount) <= 0 || 
                         !investmentProfile || Number(checkoutAmount) > investmentProfile.balance || 
                         Number(checkoutAmount) < 50}
              >
                Checkout
              </IonButton>
            </div>
          </div>
        </IonModal>

        {/* Success Alert */}
        <IonAlert
          isOpen={showSuccessAlert}
          onDidDismiss={() => {
            setShowSuccessAlert(false);
          }}
          header="Success"
          message={successMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default InvestmentPage;
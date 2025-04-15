import { IonContent, IonPage, IonModal, IonSegment, IonSegmentButton } from '@ionic/react';
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
  FaGlobeAmericas
} from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import { ReactElement } from 'react';

interface Investment {
  id: number;
  name: string;
  type: string;
  icon: ReactElement;
  amount: number;
  return: number;
  risk: string;
  minInvestment: number;
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

const InvestmentPage: React.FC = () => {
  const history = useHistory();
  const [activeSegment, setActiveSegment] = useState<string>('opportunities');
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  // Mock investment data with icons
  const investmentData: InvestmentData = {
    portfolioValue: '₱0',
    totalReturns: '+₱0 (+0%)',
    investments: [
      { 
        id: 1, 
        name: 'Philippine Stocks', 
        type: 'Equities', 
        icon: <FaChartLine className="text-blue-500" />,
        amount: 24500.00, 
        return: 12.5, 
        risk: 'Medium', 
        minInvestment: 5000,
        description: 'Invest in shares of top Philippine companies. Potential for high returns but with market volatility.'
      },
      { 
        id: 2, 
        name: 'Government Bonds', 
        type: 'Fixed Income', 
        icon: <FaShieldAlt className="text-green-500" />,
        amount: 18000.00, 
        return: 5.2, 
        risk: 'Low', 
        minInvestment: 10000,
        description: 'Government-issued bonds with fixed interest payments. Lower risk with stable returns.'
      },
      { 
        id: 3, 
        name: 'Real Estate Fund', 
        type: 'REIT', 
        icon: <FaBuilding className="text-purple-500" />,
        amount: 32000.00, 
        return: 8.7, 
        risk: 'Medium', 
        minInvestment: 5000,
        description: 'Real Estate Investment Trusts that own income-generating properties. Earn from rental income and property appreciation.'
      },
      { 
        id: 4, 
        name: 'USD Money Market', 
        type: 'Foreign Currency', 
        icon: <FaGlobeAmericas className="text-yellow-500" />,
        amount: 7950.75, 
        return: 3.1, 
        risk: 'Low', 
        minInvestment: 1000,
        description: 'Invest in USD-denominated instruments. Protect against peso depreciation while earning interest.'
      },
    ],
    performanceHistory: [
      { month: 'Jan', return: 2.1 },
      { month: 'Feb', return: 3.5 },
      { month: 'Mar', return: 1.8 },
      { month: 'Apr', return: 4.2 },
      { month: 'May', return: 3.9 },
    ]
  };

  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const getRiskColor = (risk: string): string => {
    switch(risk) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-gray-500';
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
          {/* Portfolio Summary */}
          <div className="p-4">
            <div className="bg-white rounded-xl shadow-lg p-5 text-black">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <FaPiggyBank className="mr-2" />
                    Portfolio Value
                  </div>
                  <div className="text-xl font-bold">{investmentData.portfolioValue}</div>
                </div>
                <div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <FaChartLine className="mr-2" />
                    Total Returns
                  </div>
                  <div className="text-xl font-bold text-green-600">{investmentData.totalReturns}</div>
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
                  {investmentData.investments.map((investment) => (
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
                            <div className="text-green-600 font-bold">{investment.return}%</div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                            <div className="flex items-center">
                              <FaShieldAlt className="text-gray-400 mr-2" />
                              <div>
                                <div className="text-gray-500 text-xs">Risk</div>
                                <div className={`text-sm font-medium ${getRiskColor(investment.risk)}`}>
                                  {investment.risk}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <FaMoneyBillWave className="text-gray-400 mr-2" />
                              <div>
                                <div className="text-gray-500 text-xs">Minimum</div>
                                <div className="text-sm font-medium">{formatCurrency(investment.minInvestment)}</div>
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
                    {investmentData.performanceHistory.map((month, index) => (
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
                
                <h3 className="text-white font-bold mb-2">My Investments</h3>
                <div className="space-y-3">
                  {investmentData.investments.filter(inv => inv.amount > 0).map((investment) => (
                    <div key={investment.id} className="bg-white rounded-xl shadow-lg p-4 text-black">
                      <div className="flex items-start">
                        <div className="p-2 bg-gray-100 rounded-lg mr-3">
                          {investment.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold">{investment.name}</div>
                              <div className="text-gray-500 text-sm">{investment.type}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(investment.amount)}</div>
                              <div className={`text-sm ${investment.return >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {investment.return >= 0 ? '+' : ''}{investment.return}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
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
                      <div className="text-2xl font-bold text-green-600">{selectedInvestment.return}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Risk Level</div>
                      <div className={`text-2xl font-bold ${getRiskColor(selectedInvestment.risk)}`}>
                        {selectedInvestment.risk}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Minimum Investment</div>
                      <div className="text-xl font-bold">{formatCurrency(selectedInvestment.minInvestment)}</div>
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
                
                <button className="w-full bg-[#5EC95F] hover:bg-[#4AB54B] text-white py-4 rounded-xl font-bold flex items-center justify-center shadow-lg mt-4 transition-colors">
                  <FaHandHoldingUsd className="mr-3 text-xl" /> 
                  <span className="text-lg">Invest Now</span>
                </button>
              </div>
            </div>
          )}
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default InvestmentPage;
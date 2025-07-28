'use client';

import Image from 'next/image';
import { ConnectButton } from '@/components/ConnectButton';
import { DepositCard } from '@/components/DepositCard';
import LineChart from '@/components/LineChart';
import AutomationBanner from '@/components/AutomationBanner';
import NetworkSwitcher from '@/components/NetworkSwitcher';
import CCIPStatusModal from '@/components/CCIPStatusModal';
import CCIPTransfer from '@/components/CCIPTransfer';
import PredictionPanel from '@/components/PredictionPanel';
import { useState } from 'react';

// Real yield data is now fetched via useRealYieldData hook in LineChart component

export default function Home() {
  const [ccipModalOpen, setCcipModalOpen] = useState(false);
  const [ccipMessageId, setCcipMessageId] = useState<string | null>(null);
  const [ccipSourceChain, setCcipSourceChain] = useState<number | undefined>();
  const [ccipDestinationChain, setCcipDestinationChain] = useState<number | undefined>();
  const [ccipAmount, setCcipAmount] = useState<string | undefined>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center">
                                 <div className="w-10 h-10 mr-3 flex items-center justify-center">
                   <Image 
                     src="/polyliquid.png" 
                     alt="PolyLiquid Logo" 
                     width={40}
                     height={40}
                     className="object-contain"
                   />
                 </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">PolyLiquid</h1>
                  <span className="text-sm text-gray-500">Liquid Staking Token Vault</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NetworkSwitcher />
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Automation Status Banner */}
      <AutomationBanner />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Institutional-Grade LST Yield Management
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Optimize your liquid staking token yields through automated rebalancing based on 
            real-time market data and algorithmic strategies.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-700">Live Market Data</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-700">On-Chain Oracles</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-700">Cross-Chain Infrastructure</span>
            </div>
          </div>
        </div>

        {/* Real Yield Chart */}
        <div className="mb-12">
          <LineChart />
        </div>

        {/* Live Data Sources */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Data Sources & Infrastructure
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Transparent, institutional-grade data sources ensuring accuracy and reliability for yield optimization.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lido API */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">L</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Lido Protocol API</h4>
                  <p className="text-sm text-gray-500">Official stETH yield data</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Asset:</span>
                  <span className="font-medium">stETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Source:</span>
                  <span className="font-medium">eth-api.lido.fi</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
            </div>

            {/* DeFiLlama API */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">D</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">DeFiLlama API</h4>
                  <p className="text-sm text-gray-500">Multi-protocol yield data</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Assets:</span>
                  <span className="font-medium">rETH, sAVAX</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Source:</span>
                  <span className="font-medium">yields.llama.fi</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
            </div>

            {/* On-Chain Oracle */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-semibold">O</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">RealYieldOracle</h4>
                  <p className="text-sm text-gray-500">On-chain data verification</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Network:</span>
                  <span className="font-medium">Avalanche</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">Smart Contract</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-green-600 font-medium">Deployed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Flow Summary */}
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Data Integration Summary</h4>
                <p className="text-sm text-gray-500">
                  Multi-source data aggregation with automatic failover and validation
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-500">Uptime</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">3</div>
                <div className="text-xs text-gray-500">Data Sources</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">5min</div>
                <div className="text-xs text-gray-500">Update Frequency</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">Auto</div>
                <div className="text-xs text-gray-500">Failover</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">Real-time</div>
                <div className="text-xs text-gray-500">Validation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Cards */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Supported Assets
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Deposit your liquid staking tokens to begin earning optimized yields through our automated vault system.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            <DepositCard tokenSymbol="stETH" />
            <DepositCard tokenSymbol="rETH" />
            <DepositCard tokenSymbol="sAVAX" />
          </div>
        </div>

        {/* CCIP Transfer and Prediction Panel */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Advanced Features
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Cross-chain asset management and market intelligence for institutional-grade yield optimization.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CCIPTransfer
              onTransferInitiated={(messageId, sourceChain, destinationChain, amount) => {
                setCcipMessageId(messageId);
                setCcipSourceChain(sourceChain);
                setCcipDestinationChain(destinationChain);
                setCcipAmount(amount);
                setCcipModalOpen(true);
              }}
            />
            <PredictionPanel />
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Platform Capabilities
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade infrastructure designed for institutional yield management.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Automated Rebalancing
              </h4>
              <p className="text-gray-600">
                Algorithm-driven portfolio optimization based on real-time yield differentials and market conditions.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Multi-Chain Architecture
              </h4>
              <p className="text-gray-600">
                Seamless deployment across Ethereum, Avalanche, and other supported networks for maximum opportunities.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Security & Audits
              </h4>
              <p className="text-gray-600">
                Built with security-first principles using audited smart contracts and comprehensive risk management.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Integration */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Infrastructure Partners
            </h3>
            <p className="text-gray-600">Enterprise-grade technology stack powering PolyLiquid</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 font-bold">CL</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Chainlink CCIP</h4>
              <p className="text-sm text-gray-600">Cross-chain infrastructure</p>
              <div className="mt-2 text-xs text-green-600 font-medium">Production Ready</div>
            </div>

            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-green-600 font-bold">DS</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Data Streams</h4>
              <p className="text-sm text-gray-600">Real-time yield data</p>
              <div className="mt-2 text-xs text-green-600 font-medium">Live Integration</div>
            </div>

            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-purple-600 font-bold">CF</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Chainlink Functions</h4>
              <p className="text-sm text-gray-600">Custom computation</p>
              <div className="mt-2 text-xs text-green-600 font-medium">Active</div>
            </div>

            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-orange-600 font-bold">PM</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Polymarket</h4>
              <p className="text-sm text-gray-600">Market intelligence</p>
              <div className="mt-2 text-xs text-green-600 font-medium">Connected</div>
            </div>
          </div>
        </div>
      </main>

      {/* CCIP Modal */}
      <CCIPStatusModal
        isOpen={ccipModalOpen}
        onClose={() => setCcipModalOpen(false)}
        messageId={ccipMessageId}
        sourceChainId={ccipSourceChain}
        destinationChainId={ccipDestinationChain}
        amount={ccipAmount}
        token="PLY"
      />
    </div>
  );
} 
'use client';

import { ConnectButton } from '@/components/ConnectButton';
import { DepositCard } from '@/components/DepositCard';
import { LineChart } from '@/components/LineChart';
import AutomationBanner from '@/components/AutomationBanner';
import NetworkSwitcher from '@/components/NetworkSwitcher';
import CCIPStatusModal from '@/components/CCIPStatusModal';
import CCIPTransfer from '@/components/CCIPTransfer';
import PredictionPanel from '@/components/PredictionPanel';
import { useState } from 'react';

// Mock yield data for demonstration
const mockYieldData = {
  stETH: [3.2, 3.5, 3.1, 3.8, 4.2, 3.9, 4.1, 4.5],
  rETH: [3.8, 4.1, 3.7, 4.3, 4.6, 4.2, 4.4, 4.8],
  sAVAX: [5.2, 5.8, 5.1, 6.2, 6.8, 6.1, 6.5, 7.2],
};

export default function Home() {
  const [ccipModalOpen, setCcipModalOpen] = useState(false);
  const [ccipMessageId, setCcipMessageId] = useState<string | null>(null);
  const [ccipSourceChain, setCcipSourceChain] = useState<number | undefined>();
  const [ccipDestinationChain, setCcipDestinationChain] = useState<number | undefined>();
  const [ccipAmount, setCcipAmount] = useState<string | undefined>();

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="glass-card border-0 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center animate-fade-in">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <div>
                  <h1 className="heading-md gradient-text font-bold">PolyLiquid</h1>
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Multi-Asset LST Vault</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 animate-fade-in">
              <NetworkSwitcher />
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Automation Status Banner */}
      <AutomationBanner />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="max-w-4xl mx-auto">
            <h2 className="heading-xl gradient-text mb-6">
              Maximize Your LST Yields
            </h2>
            <p className="text-xl leading-relaxed mb-8 max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Deposit your liquid staking tokens (stETH, rETH, sAVAX) into our automated vault 
              that rebalances based on yield opportunities and market predictions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="glass-card px-6 py-3 rounded-full">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  🔗 Powered by Chainlink
                </span>
              </div>
              <div className="glass-card px-6 py-3 rounded-full">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  📊 Polymarket Integration
                </span>
              </div>
              <div className="glass-card px-6 py-3 rounded-full">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  ⚡ Real-time Data
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Yield Chart */}
        <div className="mb-16 animate-scale-in">
          <LineChart aprs={mockYieldData} />
        </div>

        {/* Deposit Cards */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="heading-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Deposit Your Assets
            </h3>
            <p className="text-body max-w-2xl mx-auto">
              Start earning enhanced yields by depositing your liquid staking tokens into our intelligent vault system.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <DepositCard tokenSymbol="stETH" />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <DepositCard tokenSymbol="rETH" />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <DepositCard tokenSymbol="sAVAX" />
            </div>
          </div>
        </div>

        {/* CCIP Transfer and Prediction Panel */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="heading-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Cross-Chain & Market Intelligence
            </h3>
            <p className="text-body max-w-2xl mx-auto">
              Transfer assets across chains seamlessly and leverage market predictions to optimize your yield strategy.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 justify-items-center">
            <div className="animate-slide-up w-full max-w-md">
              <CCIPTransfer
                onTransferInitiated={(messageId, sourceChain, destinationChain, amount) => {
                  setCcipMessageId(messageId);
                  setCcipSourceChain(sourceChain);
                  setCcipDestinationChain(destinationChain);
                  setCcipAmount(amount);
                  setCcipModalOpen(true);
                }}
              />
            </div>
            <div className="animate-slide-up w-full max-w-md" style={{ animationDelay: '0.1s' }}>
              <PredictionPanel />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="heading-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Why Choose PolyLiquid
            </h3>
            <p className="text-body max-w-2xl mx-auto">
              Built with cutting-edge technology to provide the best DeFi experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center p-8 animate-scale-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" 
                   style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="heading-md mb-4" style={{ color: 'var(--text-primary)' }}>
                Automated Rebalancing
              </h4>
              <p className="text-body">
                Smart algorithms automatically rebalance your portfolio based on yield differentials and market conditions.
              </p>
            </div>
            
            <div className="card text-center p-8 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" 
                   style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="heading-md mb-4" style={{ color: 'var(--text-primary)' }}>
                Multi-Chain Support
              </h4>
              <p className="text-body">
                Deploy across Ethereum, Avalanche, and other supported networks for maximum yield opportunities.
              </p>
            </div>
            
            <div className="card text-center p-8 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" 
                   style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="heading-md mb-4" style={{ color: 'var(--text-primary)' }}>
                Secure & Audited
              </h4>
              <p className="text-body">
                Built with security-first principles using battle-tested smart contracts and comprehensive testing.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Integration Showcase */}
        <div className="card-elevated p-10 animate-scale-in">
          <div className="text-center mb-10">
            <h3 className="heading-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Powered by Cutting-Edge Technology
            </h3>
            <p className="text-body">Innovative integrations that make PolyLiquid possible</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Chainlink Integration */}
            <div className="glass-card p-6 rounded-lg text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                   style={{ background: 'linear-gradient(135deg, #375bd2 0%, #2c4aa0 100%)' }}>
                🔗
              </div>
              <h4 className="heading-md mb-3" style={{ color: 'var(--text-primary)' }}>
                Chainlink CCIP
              </h4>
              <p className="text-body mb-4">
                Cross-chain asset transfers with enterprise-grade security and reliability
              </p>
              <div className="status-success">
                Live Integration
              </div>
            </div>

            {/* Data Streams */}
            <div className="glass-card p-6 rounded-lg text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                   style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                📊
              </div>
              <h4 className="heading-md mb-3" style={{ color: 'var(--text-primary)' }}>
                Chainlink Data Streams
              </h4>
              <p className="text-body mb-4">
                Real-time LST yield data for automated rebalancing and optimization
              </p>
              <div className="status-success">
                Real-time Data
              </div>
            </div>

            {/* Chainlink Functions */}
            <div className="glass-card p-6 rounded-lg text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                   style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                ⚡
              </div>
              <h4 className="heading-md mb-3" style={{ color: 'var(--text-primary)' }}>
                Chainlink Functions
              </h4>
              <p className="text-body mb-4">
                Custom computation and external API integration for market predictions
              </p>
              <div className="status-success">
                Custom Logic
              </div>
            </div>

            {/* Polymarket API */}
            <div className="glass-card p-6 rounded-lg text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                   style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                🎯
              </div>
              <h4 className="heading-md mb-3" style={{ color: 'var(--text-primary)' }}>
                Polymarket Integration
              </h4>
              <p className="text-body mb-4">
                Live prediction markets data for intelligent yield strategy optimization
              </p>
              <div className="status-success">
                Market Intelligence
              </div>
            </div>

            {/* Automation */}
            <div className="glass-card p-6 rounded-lg text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                   style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                🤖
              </div>
              <h4 className="heading-md mb-3" style={{ color: 'var(--text-primary)' }}>
                Chainlink Automation
              </h4>
              <p className="text-body mb-4">
                Autonomous vault management with intelligent rebalancing triggers
              </p>
              <div className="status-success">
                Fully Automated
              </div>
            </div>

            {/* Multi-Chain */}
            <div className="glass-card p-6 rounded-lg text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                   style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                🌐
              </div>
              <h4 className="heading-md mb-3" style={{ color: 'var(--text-primary)' }}>
                Multi-Chain Architecture
              </h4>
              <p className="text-body mb-4">
                Seamless operation across Ethereum, Avalanche, and other networks
              </p>
              <div className="status-success">
                Cross-Chain Ready
              </div>
            </div>
          </div>

          {/* Innovation Highlights */}
          <div className="mt-12 glass-card p-6 rounded-lg">
            <div className="text-center mb-6">
              <h4 className="heading-md mb-2" style={{ color: 'var(--text-primary)' }}>
                🚀 Innovation Highlights
              </h4>
              <p className="text-body">What makes PolyLiquid unique in the DeFi ecosystem</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🔮</div>
                <h5 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Predictive Rebalancing
                </h5>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  First LST vault to use prediction markets for yield optimization
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h5 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Real-time Data
                </h5>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Live yield feeds integrated directly into smart contracts
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-2">🌉</div>
                <h5 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Cross-Chain Native
                </h5>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Built from the ground up for multi-chain DeFi
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-4 glass-card px-6 py-3 rounded-full">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                🏆 Built for Hackathon Excellence
              </span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Live Demo Ready
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                  <span className="text-white font-bold">P</span>
                </div>
                <span className="heading-md gradient-text">PolyLiquid</span>
              </div>
              <p className="text-body max-w-md">
                The future of liquid staking is here. Maximize your yields with intelligent automation and cross-chain capabilities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Protocol</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Governance</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Audits</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Community</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 mt-8 text-center" style={{ borderColor: 'var(--border)' }}>
            <p style={{ color: 'var(--text-tertiary)' }}>
              &copy; 2024 PolyLiquid. Built for the future of DeFi.
            </p>
          </div>
        </div>
      </footer>

      {/* CCIP Status Modal */}
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
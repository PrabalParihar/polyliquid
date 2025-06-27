'use client';

import { useChainId, useSwitchChain } from 'wagmi';
import { sepolia, avalancheFuji } from 'wagmi/chains';
import { useState } from 'react';

const ChainIcon = ({ chainId }: { chainId: number }) => {
  switch (chainId) {
    case sepolia.id:
      return (
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
             style={{ background: 'linear-gradient(135deg, #627eea 0%, #5a67d8 100%)' }}>
          🔷
        </div>
      );
    case avalancheFuji.id:
      return (
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
             style={{ background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)' }}>
          🔺
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
             style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }}>
          ⚪
        </div>
      );
  }
};

const getChainName = (chainId: number) => {
  switch (chainId) {
    case sepolia.id:
      return 'Sepolia';
    case avalancheFuji.id:
      return 'Avalanche Fuji';
    default:
      return 'Unknown';
  }
};

const getChainGradient = (chainId: number) => {
  switch (chainId) {
    case sepolia.id:
      return 'linear-gradient(135deg, #627eea 0%, #5a67d8 100%)';
    case avalancheFuji.id:
      return 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)';
    default:
      return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
  }
};

export default function NetworkSwitcher() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);

  const supportedChains = [sepolia, avalancheFuji];
  const currentChain = supportedChains.find(chain => chain.id === chainId);
  const otherChains = supportedChains.filter(chain => chain.id !== chainId);

  const handleSwitchChain = async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch chain:', error);
    }
  };

  return (
    <div className="relative">
      {/* Current Chain Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`
          flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-sm text-white
          transition-all duration-200 btn-primary
          ${isPending ? 'loading-pulse' : 'hover:scale-105 hover:shadow-lg'}
        `}
        style={{ background: getChainGradient(chainId) }}
      >
        <ChainIcon chainId={chainId} />
        <span>{getChainName(chainId)}</span>
        {isPending ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-64 glass-card rounded-lg overflow-hidden z-20 animate-scale-in">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-lg">🌐</span>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Switch Network
                </h3>
              </div>
              
              {/* Current Network */}
              <div className="mb-4">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  Current Network
                </p>
                <div className="glass-card p-3 rounded-lg border-l-4" 
                     style={{ borderLeftColor: getChainGradient(chainId).split(' ')[1] }}>
                  <div className="flex items-center gap-3">
                    <ChainIcon chainId={chainId} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {currentChain?.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Chain ID: {chainId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Networks */}
              {otherChains.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    Available Networks
                  </p>
                  <div className="space-y-2">
                    {otherChains.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => handleSwitchChain(chain.id)}
                        disabled={isPending}
                        className="w-full glass-card p-3 rounded-lg hover:backdrop-brightness-110 transition-all duration-200 disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <ChainIcon chainId={chain.id} />
                          <div className="text-left">
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {chain.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {chain.id === sepolia.id ? 'Ethereum Testnet' : 'Avalanche Testnet'}
                            </p>
                          </div>
                          <div className="ml-auto">
                            <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t p-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Network Status: Active
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs px-2 py-1 rounded btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Compact version for mobile/header
export function CompactNetworkSwitcher() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const getTargetChain = () => {
    return chainId === sepolia.id ? avalancheFuji.id : sepolia.id;
  };

  const handleQuickSwitch = () => {
    switchChain({ chainId: getTargetChain() });
  };

  return (
    <button
      onClick={handleQuickSwitch}
      disabled={isPending}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-xs text-white
        transition-all duration-200 btn-secondary
        ${isPending ? 'loading-pulse' : 'hover:scale-105 hover:shadow-md'}
      `}
      style={{ background: getChainGradient(chainId) }}
      title={`Switch to ${getChainName(getTargetChain())}`}
    >
      <ChainIcon chainId={chainId} />
      {isPending ? (
        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8 5a1 1 0 011 1v3h3a1 1 0 110 2H9v3a1 1 0 11-2 0v-3H4a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
} 
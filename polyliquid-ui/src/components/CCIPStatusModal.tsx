'use client';

import { useState, useEffect } from 'react';
import { useCCIPStatus, type CCIPStatus } from '../hooks/useCCIPStatus';

interface CCIPStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string | null;
  sourceChainId?: number;
  destinationChainId?: number;
  amount?: string;
  token?: string;
}

const StatusIcon = ({ status }: { status: CCIPStatus }) => {
  switch (status) {
    case 'PENDING':
      return (
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      );
    case 'IN_PROGRESS':
      return (
        <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      );
    case 'SUCCESS':
      return (
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'FAILED':
      return (
        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
      );
  }
};

const ProgressBar = ({ status, attempts }: { status: CCIPStatus; attempts: number }) => {
  const getProgress = () => {
    switch (status) {
      case 'PENDING':
        return Math.min(20 + (attempts * 2), 40);
      case 'IN_PROGRESS':
        return Math.min(40 + (attempts * 3), 80);
      case 'SUCCESS':
        return 100;
      case 'FAILED':
        return 100;
      default:
        return 0;
    }
  };

  const progress = getProgress();
  const isComplete = status === 'SUCCESS' || status === 'FAILED';
  const progressColor = status === 'FAILED' ? 'bg-red-500' : status === 'SUCCESS' ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${progressColor} ${
          !isComplete ? 'animate-pulse' : ''
        }`}
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

const ChainBadge = ({ chainName }: { chainName: string }) => {
  const getChainColor = (chain: string) => {
    switch (chain.toLowerCase()) {
      case 'sepolia':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'fuji':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getChainColor(chainName)}`}>
      {chainName.charAt(0).toUpperCase() + chainName.slice(1)}
    </span>
  );
};

export default function CCIPStatusModal({
  isOpen,
  onClose,
  messageId,
  sourceChainId,
  destinationChainId,
  amount,
  token = 'PLY'
}: CCIPStatusModalProps) {
  const { message, status, isPolling, error, attempts } = useCCIPStatus(
    messageId,
    sourceChainId,
    destinationChainId
  );

  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (!isPolling) return;
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPolling]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = (status: CCIPStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Submitting to CCIP...';
      case 'IN_PROGRESS':
        return 'Processing cross-chain transfer...';
      case 'SUCCESS':
        return 'Transfer completed successfully!';
      case 'FAILED':
        return 'Transfer failed';
      default:
        return 'Checking status...';
    }
  };

  if (!isOpen || !messageId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">Cross-Chain Transfer</h3>
                <p className="text-white/80 text-sm">CCIP Status</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Transfer Details */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <ChainBadge chainName={message?.sourceChain || 'unknown'} />
                <p className="text-xs text-gray-500 mt-1">From</p>
              </div>
              <div className="flex-1 mx-4">
                <svg className="w-full h-6" viewBox="0 0 100 20" fill="none">
                  <path d="M10 10L90 10" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
                    </marker>
                  </defs>
                </svg>
              </div>
              <div className="text-center">
                <ChainBadge chainName={message?.destinationChain || 'unknown'} />
                <p className="text-xs text-gray-500 mt-1">To</p>
              </div>
            </div>

            {amount && (
              <div className="text-center bg-gray-50 rounded-lg p-3">
                <p className="text-lg font-bold text-gray-900">{amount} {token}</p>
                <p className="text-sm text-gray-500">Transfer Amount</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <StatusIcon status={status} />
              <div>
                <p className="font-medium text-gray-900">{getStatusText(status)}</p>
                {isPolling && (
                  <p className="text-sm text-gray-500" suppressHydrationWarning>
                    Time elapsed: {formatTime(timeElapsed)} • Attempt {attempts}
                  </p>
                )}
              </div>
            </div>
            <ProgressBar status={status} attempts={attempts} />
          </div>

          {/* Message ID */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Message ID</p>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs break-all">
              {messageId}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {status === 'SUCCESS' && (
              <button
                onClick={onClose}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Close
              </button>
            )}
            {(status === 'FAILED') && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.open(`https://ccip.chain.link/msg/${messageId}`, '_blank')}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  View Explorer
                </button>
              </>
            )}
            {(status === 'PENDING' || status === 'IN_PROGRESS') && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Close & Track Later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
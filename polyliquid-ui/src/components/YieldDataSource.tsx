'use client';

import { useState } from 'react';
import { useRealYieldData } from '@/hooks/useRealYieldData';
import { useYieldData } from '@/hooks/useYieldData';

interface YieldDataSourceProps {
  onSourceChange?: (source: 'mock' | 'real') => void;
}

export default function YieldDataSource({ onSourceChange }: YieldDataSourceProps) {
  const [useRealData, setUseRealData] = useState(true);
  
  const realYieldData = useRealYieldData();
  const mockYieldData = useYieldData();
  
  const currentData = useRealData ? realYieldData : mockYieldData;

  const handleToggle = () => {
    const newSource = useRealData ? 'mock' : 'real';
    setUseRealData(!useRealData);
    onSourceChange?.(newSource);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'api': return '🌐';
      case 'onchain': return '⛓️';
      case 'fallback': return '🔄';
      default: return '📊';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'api': return 'Live API';
      case 'onchain': return 'On-Chain';
      case 'fallback': return 'Fallback';
      default: return 'Mock';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">📊</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Yield Data Source</h3>
            <p className="text-sm text-gray-500">
              {useRealData ? 'Using real LST yield data' : 'Using mock data for testing'}
            </p>
          </div>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${!useRealData ? 'text-blue-600' : 'text-gray-500'}`}>
            Mock
          </span>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              useRealData ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useRealData ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${useRealData ? 'text-blue-600' : 'text-gray-500'}`}>
            Real
          </span>
        </div>
      </div>

      {/* Data Status */}
      <div className="grid grid-cols-3 gap-4">
        {currentData.yieldData.map((data) => (
          <div key={data.symbol} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{data.symbol}</span>
              <div className="flex items-center gap-1">
                {useRealData && 'source' in data && (
                  <>
                    <span className="text-xs">
                      {getSourceIcon(data.source)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getSourceLabel(data.source)}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                {data.apr.toFixed(2)}%
              </span>
              {data.isLoading ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-xs text-green-600">✅ Live</span>
              )}
            </div>
            
            {useRealData && 'lastUpdate' in data && (
              <div className="text-xs text-gray-500 mt-1">
                Updated: {new Date(data.lastUpdate).toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {currentData.error && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="text-sm text-yellow-800">{currentData.error}</span>
          </div>
        </div>
      )}

      {/* Real Data Sources */}
      {useRealData && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Data Sources</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div>🌐 <strong>stETH:</strong> Lido API (stake.lido.fi)</div>
            <div>🌐 <strong>rETH:</strong> DeFiLlama Yields API</div>
            <div>🌐 <strong>sAVAX:</strong> DeFiLlama Yields API</div>
            <div>⛓️ <strong>Fallback:</strong> On-chain oracle calculations</div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={currentData.refetch}
          disabled={currentData.isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <span className={currentData.isLoading ? 'animate-spin' : ''}>🔄</span>
          Refresh Data
        </button>
        
        <div className="text-xs text-gray-500">
          Auto-refresh: {useRealData ? '5 min' : '30 sec'}
        </div>
      </div>
    </div>
  );
} 
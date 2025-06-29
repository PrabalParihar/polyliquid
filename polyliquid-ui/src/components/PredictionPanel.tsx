'use client';

import { usePolymarketData } from '@/hooks/usePolymarketData';
import { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export default function PredictionPanel() {
  const { polymarketData, refetch } = usePolymarketData();
  const sparklineRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  // Calculate data divergence between onchain and REST API
  const divergence = Math.abs(polymarketData.onchainProbability - polymarketData.restApiProbability);
  const isDivergent = divergence > 5; // Alert if >5% difference

  // Format last updated time
  const lastUpdatedTime = new Date(polymarketData.lastUpdated).toLocaleTimeString();

  // Create sparkline chart
  useEffect(() => {
    if (!sparklineRef.current || polymarketData.trend.length === 0) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = sparklineRef.current.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: polymarketData.trend.map((_, i) => `${i}`),
        datasets: [{
          data: polymarketData.trend,
          borderColor: polymarketData.trend[polymarketData.trend.length - 1] > polymarketData.trend[0] 
            ? '#10B981' : '#EF4444',
          backgroundColor: 'transparent',
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        },
        scales: {
          x: {
            display: false
          },
          y: {
            display: false,
            min: Math.min(...polymarketData.trend) - 2,
            max: Math.max(...polymarketData.trend) + 2,
          }
        },
        elements: {
          point: {
            radius: 0
          }
        }
      }
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [polymarketData.trend]);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const handleHedgeClick = () => {
    // Deep-link to Polymarket (using the token ID)
    const polymarketUrl = `https://polymarket.com/event/crypto-yields-prediction?tid=${polymarketData.marketId}`;
    window.open(polymarketUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="card p-8 w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center mr-4">
            <span className="text-white text-xl">📊</span>
          </div>
          <div>
            <h3 className="heading-md" style={{ color: 'var(--text-primary)' }}>
              Market Sentiment
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Live from Polymarket
            </p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="btn-secondary text-sm px-4 py-2"
          disabled={polymarketData.isLoading}
        >
          {polymarketData.isLoading ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Probability Gauge */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          {/* Circular Progress */}
          <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="rgba(156, 163, 175, 0.2)"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={polymarketData.onchainProbability > 60 ? "#10B981" : "#EF4444"}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${polymarketData.onchainProbability * 2.51} 251.2`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {polymarketData.onchainProbability.toFixed(1)}%
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Probability
            </span>
          </div>
        </div>
        <div className="mt-4 glass-card px-4 py-2 rounded-full inline-block">
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Last updated: {lastUpdatedTime}
          </span>
        </div>
      </div>

      {/* Data Sources Comparison */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Data Sources
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Onchain Oracle
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {polymarketData.onchainProbability.toFixed(1)}%
            </div>
          </div>
          <div className="glass-card p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Polymarket API
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {polymarketData.restApiProbability.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Data Divergence Warning */}
      {isDivergent && (
        <div className="mb-6 glass-card p-4 rounded-lg border-l-4 border-yellow-400">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h5 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Data Divergence Detected
              </h5>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {divergence.toFixed(1)}% difference between sources
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trend Sparkline */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            24h Trend
          </h4>
          <div className="flex items-center">
            <span className={`text-sm font-medium mr-2 ${
              polymarketData.trend[polymarketData.trend.length - 1] > polymarketData.trend[0] 
                ? 'text-green-600' : 'text-red-600'
            }`}>
              {polymarketData.trend[polymarketData.trend.length - 1] > polymarketData.trend[0] ? '↗' : '↘'} 
              {Math.abs(polymarketData.trend[polymarketData.trend.length - 1] - polymarketData.trend[0]).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <div className="h-16 w-full">
            <canvas ref={sparklineRef} />
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="mb-8 glass-card p-4 rounded-lg">
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Market Insights
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Market Confidence
            </span>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              polymarketData.onchainProbability > 70 ? 'status-success' : 
              polymarketData.onchainProbability > 50 ? 'status-warning' : 'status-error'
            }`}>
              {polymarketData.onchainProbability > 70 ? 'High' : 
               polymarketData.onchainProbability > 50 ? 'Medium' : 'Low'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Volatility
            </span>
            <span className="text-sm font-medium">
              {Math.max(...polymarketData.trend) - Math.min(...polymarketData.trend) > 10 ? 'High' : 'Low'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleHedgeClick}
          className="w-full btn-primary"
        >
          <span className="flex items-center justify-center">
            <span className="mr-2">🎯</span>
            Hedge on Polymarket
          </span>
        </button>
        
        <button className="w-full btn-secondary">
          <span className="flex items-center justify-center">
            <span className="mr-2">📈</span>
            View Analytics
          </span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Powered by Chainlink Functions & Polymarket API
        </p>
      </div>
    </div>
  );
} 
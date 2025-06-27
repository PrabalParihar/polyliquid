'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface YieldData {
  stETH: number[];
  rETH: number[];
  sAVAX: number[];
}

interface LineChartProps {
  aprs: YieldData;
  labels?: string[];
}

export function LineChart({ aprs, labels }: LineChartProps) {
  // Default labels if not provided (last 7 days)
  const defaultLabels = labels || [
    '7 days ago',
    '6 days ago',
    '5 days ago',
    '4 days ago',
    '3 days ago',
    '2 days ago',
    'Yesterday',
    'Today'
  ];

  const data = {
    labels: defaultLabels,
    datasets: [
      {
        label: 'stETH APR',
        data: aprs.stETH,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'rETH APR',
        data: aprs.rETH,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'sAVAX APR',
        data: aprs.sAVAX,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 24,
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#374151',
        },
      },
      title: {
        display: true,
        text: 'LST Yield Comparison (APR %)',
        font: {
          size: 20,
          weight: 'bold',
        },
        color: '#111827',
        padding: {
          bottom: 30,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#f3f4f6',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
          weight: 'normal',
        },
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time Period',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#6b7280',
        },
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12,
            weight: 'normal',
          },
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'APR (%)',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#6b7280',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        beginAtZero: false,
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12,
            weight: 'normal',
          },
          callback: function(value) {
            return `${value}%`;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    elements: {
      point: {
        hoverBackgroundColor: 'white',
        hoverBorderWidth: 3,
      },
    },
  };

  return (
    <div className="card p-8">
      <div className="h-96 mb-8">
        <Line data={data} options={options} />
      </div>
      
      {/* Current APR Summary */}
      <div className="border-t pt-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="text-center mb-6">
          <h4 className="heading-md mb-2" style={{ color: 'var(--text-primary)' }}>
            Current APR Performance
          </h4>
          <p className="text-body">Live yield rates across supported LST tokens</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center rounded-lg">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-xl"
                 style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              🔥
            </div>
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              {aprs.stETH[aprs.stETH.length - 1]?.toFixed(2)}%
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              stETH Current APR
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Ethereum Liquid Staking
            </div>
            <div className="mt-3">
              {aprs.stETH[aprs.stETH.length - 1] > aprs.stETH[aprs.stETH.length - 2] ? (
                <span className="status-success">
                  ↗ Trending Up
                </span>
              ) : (
                <span className="status-warning">
                  ↘ Trending Down
                </span>
              )}
            </div>
          </div>
          
          <div className="glass-card p-6 text-center rounded-lg">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-xl"
                 style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
              🚀
            </div>
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              {aprs.rETH[aprs.rETH.length - 1]?.toFixed(2)}%
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              rETH Current APR
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Rocket Pool Staking
            </div>
            <div className="mt-3">
              {aprs.rETH[aprs.rETH.length - 1] > aprs.rETH[aprs.rETH.length - 2] ? (
                <span className="status-success">
                  ↗ Trending Up
                </span>
              ) : (
                <span className="status-warning">
                  ↘ Trending Down
                </span>
              )}
            </div>
          </div>
          
          <div className="glass-card p-6 text-center rounded-lg">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-xl"
                 style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              ❄️
            </div>
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
              {aprs.sAVAX[aprs.sAVAX.length - 1]?.toFixed(2)}%
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              sAVAX Current APR
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Avalanche Staking
            </div>
            <div className="mt-3">
              {aprs.sAVAX[aprs.sAVAX.length - 1] > aprs.sAVAX[aprs.sAVAX.length - 2] ? (
                <span className="status-success">
                  ↗ Trending Up
                </span>
              ) : (
                <span className="status-warning">
                  ↘ Trending Down
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Additional Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Highest Performer
                </div>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {aprs.sAVAX[aprs.sAVAX.length - 1] > Math.max(aprs.stETH[aprs.stETH.length - 1], aprs.rETH[aprs.rETH.length - 1]) ? 'sAVAX' : 
                   aprs.rETH[aprs.rETH.length - 1] > aprs.stETH[aprs.stETH.length - 1] ? 'rETH' : 'stETH'}
                </div>
              </div>
              <div className="text-2xl">🏆</div>
            </div>
          </div>
          
          <div className="glass-card p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Average APR
                </div>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {((aprs.stETH[aprs.stETH.length - 1] + aprs.rETH[aprs.rETH.length - 1] + aprs.sAVAX[aprs.sAVAX.length - 1]) / 3).toFixed(2)}%
                </div>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
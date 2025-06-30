import { NextResponse } from 'next/server';

interface PoolData {
  pool: string;
  project: string;
  symbol: string;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  tvlUsd: number;
  chain: string;
}

interface DeFiLlamaResponse {
  status: string;
  data: PoolData[];
}

export async function GET() {
  try {
    console.log('🔄 Fetching LST yields from DeFiLlama...');
    
    // Fetch from DeFiLlama yields API
    const response = await fetch('https://yields.llama.fi/pools', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PolyLiquid/1.0',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }

    const data: DeFiLlamaResponse = await response.json();
    
    // Extract LST yields - search for known pools
    const stETHPool = data.data?.find((pool: PoolData) => 
      (pool.symbol?.toLowerCase().includes('steth') || 
       pool.pool?.toLowerCase().includes('steth') ||
       pool.project?.toLowerCase().includes('lido')) &&
      pool.chain?.toLowerCase() === 'ethereum'
    );

    const rETHPool = data.data?.find((pool: PoolData) => 
      (pool.symbol?.toLowerCase().includes('reth') || 
       pool.pool?.toLowerCase().includes('reth') ||
       pool.project?.toLowerCase().includes('rocket')) &&
      pool.chain?.toLowerCase() === 'ethereum'
    );

    const sAVAXPool = data.data?.find((pool: PoolData) => 
      (pool.symbol?.toLowerCase().includes('savax') || 
       pool.pool?.toLowerCase().includes('savax') ||
       pool.project?.toLowerCase().includes('benqi')) &&
      pool.chain?.toLowerCase() === 'avalanche'
    );

    const yields = {
      stETH: stETHPool?.apy || stETHPool?.apyBase || 2.64,
      rETH: rETHPool?.apy || rETHPool?.apyBase || 2.55,
      sAVAX: sAVAXPool?.apy || sAVAXPool?.apyBase || 5.21,
    };
    
    console.log('✅ LST yields from DeFiLlama:', yields);

    return NextResponse.json({
      ...yields,
      source: 'defiLlama',
      timestamp: Date.now(),
      pools: {
        stETH: stETHPool?.pool,
        rETH: rETHPool?.pool,
        sAVAX: sAVAXPool?.pool,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ DeFiLlama API error:', errorMessage);
    
    // Return fallback data with realistic yields
    return NextResponse.json({
      stETH: 2.64,
      rETH: 2.55,
      sAVAX: 5.21,
      source: 'fallback',
      timestamp: Date.now(),
      error: errorMessage,
    }, { status: 200 });
  }
} 
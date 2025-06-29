import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching LST yields from DeFiLlama...');
    
    // Fetch from DeFiLlama yields API
    const response = await fetch('https://yields.llama.fi/pools', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PolyLiquid/1.0',
      },
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract relevant LST pools
    const lstPools = data.data?.filter((pool: any) => {
      const symbol = pool.symbol?.toLowerCase() || '';
      const project = pool.project?.toLowerCase() || '';
      
      return (
        symbol.includes('steth') || 
        symbol.includes('reth') || 
        symbol.includes('savax') ||
        project.includes('lido') ||
        project.includes('rocket') ||
        project.includes('benqi')
      );
    }) || [];

    // Process and map to our tokens
    const yields: Record<string, number> = {};
    
    // Find stETH yields
    const stethPool = lstPools.find((p: any) => 
      p.symbol?.toLowerCase().includes('steth') || 
      p.project?.toLowerCase().includes('lido')
    );
    if (stethPool) {
      yields.stETH = parseFloat(stethPool.apy || stethPool.apyBase || '4.5');
    }

    // Find rETH yields  
    const rethPool = lstPools.find((p: any) => 
      p.symbol?.toLowerCase().includes('reth') || 
      p.project?.toLowerCase().includes('rocket')
    );
    if (rethPool) {
      yields.rETH = parseFloat(rethPool.apy || rethPool.apyBase || '4.8');
    }

    // Find sAVAX yields
    const savaxPool = lstPools.find((p: any) => 
      p.symbol?.toLowerCase().includes('savax') || 
      p.project?.toLowerCase().includes('benqi')
    );
    if (savaxPool) {
      yields.sAVAX = parseFloat(savaxPool.apy || savaxPool.apyBase || '7.2');
    }

    console.log('✅ LST yields from DeFiLlama:', yields);

    return NextResponse.json({
      yields,
      source: 'defiLlama',
      timestamp: Date.now(),
      pools: lstPools.length,
      ...yields, // Spread yields to top level for easier access
    });

  } catch (error: any) {
    console.error('❌ DeFiLlama API error:', error.message);
    
    // Return fallback yields
    return NextResponse.json({
      yields: {
        stETH: 4.5,
        rETH: 4.8,
        sAVAX: 7.2,
      },
      stETH: 4.5,
      rETH: 4.8,
      sAVAX: 7.2,
      source: 'fallback',
      timestamp: Date.now(),
      error: error.message,
    }, { status: 200 });
  }
} 
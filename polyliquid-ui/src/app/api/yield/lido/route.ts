import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔄 Fetching stETH yield from Lido API...');
    
    // Fetch from Lido's official API - Simple Moving Average APR for 7 days
    const response = await fetch('https://eth-api.lido.fi/v1/protocol/steth/apr/sma', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PolyLiquid/1.0',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Lido API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Lido API returns data in format: { data: { smaApr: number } }
    const apr = parseFloat(data.data?.smaApr || data.smaApr || data.apr || '4.5');
    
    console.log('✅ stETH APR from Lido:', apr);

    return NextResponse.json({
      apr,
      source: 'lido',
      timestamp: Date.now(),
      raw: data,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Lido API error:', errorMessage);
    
    // Return fallback data
    return NextResponse.json({
      apr: 4.5, // Fallback yield
      source: 'fallback',
      timestamp: Date.now(),
      error: errorMessage,
    }, { status: 200 }); // Still return 200 to avoid breaking the frontend
  }
} 
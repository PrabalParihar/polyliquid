import { NextRequest, NextResponse } from 'next/server';

const GRAPHQL_ENDPOINTS = {
  11155111: 'https://api.thegraph.com/subgraphs/name/chainlink/automation-sepolia',
  43113: 'https://api.thegraph.com/subgraphs/name/chainlink/automation-fuji',
} as const;

export async function POST(request: NextRequest) {
  try {
    const { chainId, targetContract } = await request.json();
    
    const endpoint = GRAPHQL_ENDPOINTS[chainId as keyof typeof GRAPHQL_ENDPOINTS];
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Unsupported chain ID' },
        { status: 400 }
      );
    }

    const query = `
      query GetUpkeeps($target: String!) {
        upkeeps(where: { target: $target }) {
          id
          registry {
            id
          }
          target
          admin
          balance
          minBalance
          executeGas
          maxValidBlocknumber
          lastPerformBlockNumber
          amountSpent
          paused
          offchainConfig
          performedTransactions(first: 10, orderBy: blockNumber, orderDirection: desc) {
            id
            blockNumber
            blockTimestamp
            transactionHash
          }
        }
      }
    `;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { target: targetContract.toLowerCase() },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return NextResponse.json(
        { error: 'GraphQL query failed', details: data.errors },
        { status: 500 }
      );
    }

    // Transform the data to match our interface
    const upkeeps = data.data?.upkeeps || [];
    if (upkeeps.length === 0) {
      return NextResponse.json({
        lastPerformedBlockNumber: null,
        lastPerformedTime: null,
        upkeepId: null,
        isActive: false,
        balance: null,
        performedCount: 0,
        error: 'No upkeeps found for this contract',
      });
    }

    const upkeep = upkeeps[0];
    const lastTransaction = upkeep.performedTransactions?.[0];

    return NextResponse.json({
      lastPerformedBlockNumber: lastTransaction?.blockNumber || null,
      lastPerformedTime: lastTransaction?.blockTimestamp ? 
        parseInt(lastTransaction.blockTimestamp) * 1000 : null,
      upkeepId: upkeep.id,
      isActive: !upkeep.paused,
      balance: upkeep.balance,
      performedCount: upkeep.performedTransactions?.length || 0,
      error: null,
    });

  } catch (error) {
    console.error('Automation status API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch automation status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
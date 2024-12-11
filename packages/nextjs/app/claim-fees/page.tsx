"use client";

import { useState, useEffect } from "react";
import { useAccount, useContractRead, usePublicClient } from "wagmi";
import { Address, isAddress, PublicClient } from "viem";

// ERC20 ABI (just what we need)
const ERC20_ABI = [
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Uniswap V3 NFT Position Manager ABI (just the parts we need)
const POSITION_MANAGER_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "positions",
    "outputs": [
      {"internalType": "uint96", "name": "nonce", "type": "uint96"},
      {"internalType": "address", "name": "operator", "type": "address"},
      {"internalType": "address", "name": "token0", "type": "address"},
      {"internalType": "address", "name": "token1", "type": "address"},
      {"internalType": "uint24", "name": "fee", "type": "uint24"},
      {"internalType": "int24", "name": "tickLower", "type": "int24"},
      {"internalType": "int24", "name": "tickUpper", "type": "int24"},
      {"internalType": "uint128", "name": "liquidity", "type": "uint128"},
      {"internalType": "uint256", "name": "feeGrowthInside0LastX128", "type": "uint256"},
      {"internalType": "uint256", "name": "feeGrowthInside1LastX128", "type": "uint256"},
      {"internalType": "uint128", "name": "tokensOwed0", "type": "uint128"},
      {"internalType": "uint128", "name": "tokensOwed1", "type": "uint128"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Uniswap V3 Factory ABI (just what we need)
const FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "tokenA", "type": "address"},
      {"internalType": "address", "name": "tokenB", "type": "address"},
      {"internalType": "uint24", "name": "fee", "type": "uint24"}
    ],
    "name": "getPool",
    "outputs": [{"internalType": "address", "name": "pool", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const LOCKER_ABI = [
  {
    "inputs": [
      {"internalType": "address","name": "_recipient","type": "address"},
      {"internalType": "uint256","name": "_tokenId","type": "uint256"}
    ],
    "name": "collectFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

interface LockerInfo {
  tokenAddress: string;
  lockerAddress: string;
  tokenId: string;
}

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

// Contract addresses on Base
const POSITION_MANAGER_ADDRESS = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const CLANKER_V1_ADDRESS = "0x9B84fcE5Dcd9a38d2D01d5D72373F6b6b067c3e1";

// Event topic for TokenCreated
const TOKEN_CREATED_TOPIC = "0x0e9d60e5c5597233717659e7b39411e0a61e7177252521b9c6f515f75f6fef01";

// Example token for demonstration
const EXAMPLE_TOKEN = {
  address: "0x214535AfB6f037A5da77d3187CA210742D3eA181",
  name: "Video Test Token",
  symbol: "VTEST",
} as const;

// Known creation block for video test token
const VIDEO_TEST_CREATION_BLOCK = 5632427n;

// Clanker V1 deployment block
const CLANKER_V1_START_BLOCK = 22963092n;

// Cache structure in localStorage
interface CacheEntry {
  lockerAddress: Address;
  tokenId: string;
  timestamp: number;
}

const CACHE_KEY = 'clanker_v1_lockers';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getFromCache = (tokenAddress: string): CacheEntry | null => {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) return null;
    
    const cacheData = JSON.parse(cache) as Record<string, CacheEntry>;
    const entry = cacheData[tokenAddress.toLowerCase()];
    
    if (!entry) return null;
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      return null;
    }
    
    return entry;
  } catch (e) {
    return null;
  }
};

const saveToCache = (tokenAddress: string, lockerAddress: Address, tokenId: string) => {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    const cacheData = cache ? JSON.parse(cache) : {};
    
    cacheData[tokenAddress.toLowerCase()] = {
      lockerAddress,
      tokenId,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Failed to save to cache:', e);
  }
};

interface LockerResult {
  lockerAddress: Address;
  tokenId: string;
  tokenAddress: Address;
}

const findLockerFromCreation = async (
  tokenAddress: Address, 
  client: PublicClient,
  knownBlock?: number,
  setProgress?: (progress: string) => void
) => {
  try {
    setProgress?.("Starting search...");
    
    if (knownBlock) {
      // If we know the block, search just that block and a small range after it
      const startBlock = BigInt(knownBlock - 5); // Search a few blocks before too
      const endBlock = BigInt(knownBlock + 5); 
      
      setProgress?.(`Searching blocks ${startBlock} to ${endBlock}...`);
      
      // First, let's look for any logs involving our token
      const tokenLogs = await client.getLogs({
        address: tokenAddress,
        fromBlock: startBlock,
        toBlock: endBlock,
      });

      console.log(`Found ${tokenLogs.length} logs for token in blocks ${startBlock} to ${endBlock}`);
      
      // Get all transactions that involve our token
      const txHashes = [...new Set(tokenLogs.map(log => log.transactionHash))];
      console.log("Transactions involving token:", txHashes);

      for (const hash of txHashes) {
        const txReceipt = await client.getTransactionReceipt({ hash });
        console.log(`Checking transaction ${hash} in block ${txReceipt.blockNumber}`);

        // Look through all logs in chronological order
        for (let i = 0; i < txReceipt.logs.length - 1; i++) {
          const log = txReceipt.logs[i];
          const nextLog = txReceipt.logs[i + 1];

          // Look for consecutive logs from the same contract where:
          // 1. First log has 2 topics
          // 2. Second log has 1 topic
          // 3. Both have the same data value
          if (
            log.address === nextLog.address &&
            log.topics.length === 2 &&
            nextLog.topics.length === 1 &&
            log.data === nextLog.data
          ) {
            console.log("Found potential locker logs:", {
              address: log.address,
              data: log.data,
              topics1: log.topics,
              topics2: nextLog.topics
            });

            // This is our locker pattern
            const lockerAddress = log.address as Address;
            const tokenId = BigInt(log.data).toString();

            console.log("Found locker details:", {
              lockerAddress,
              tokenId,
              block: txReceipt.blockNumber,
              transactionHash: hash
            });

            setProgress?.("Found!");
            return { lockerAddress, tokenId, tokenAddress };
          }
        }

        // If we didn't find the pattern, log all transaction logs for debugging
        console.log("All logs in transaction:", txReceipt.logs.map(l => ({
          address: l.address,
          topics: l.topics,
          data: l.data
        })));
      }
      
      throw new Error(`Token not found in block ${knownBlock}`);
    }
    
    // If no known block, do the full search
    const blockNumber = await client.getBlockNumber();
    const step = 10000n;
    const totalBlocks = blockNumber - CLANKER_V1_START_BLOCK;
    
    // Search forward from start block
    for (let i = CLANKER_V1_START_BLOCK; i < blockNumber; i += step) {
      const endBlock = i + step < blockNumber ? i + step : blockNumber;
      const progress = Number(((i - CLANKER_V1_START_BLOCK) * 100n) / totalBlocks).toFixed(1);
      setProgress?.(`Searching blocks ${i} to ${endBlock} (${progress}% complete)...`);
      
      try {
        // Get all logs from the Clanker contract
        const logs = await client.getLogs({
          address: CLANKER_V1_ADDRESS,
          fromBlock: i,
          toBlock: endBlock,
        });

        console.log(`Found ${logs.length} logs in blocks ${i} to ${endBlock}`);

        for (const log of logs) {
          // Get the full transaction receipt
          const txReceipt = await client.getTransactionReceipt({
            hash: log.transactionHash,
          });

          // Look for any logs involving our token address
          const tokenLogs = txReceipt.logs.filter(txLog => 
            txLog.address.toLowerCase() === tokenAddress.toLowerCase()
          );

          if (tokenLogs.length > 0) {
            console.log("Found transaction with token:", log.transactionHash);
            console.log("Token logs in transaction:", tokenLogs.length);
            
            // Find the locker NFT mint in this transaction
            const lockerLogs = txReceipt.logs.filter(txLog => {
              const isNftMint = txLog.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
                               txLog.topics[1] === "0x0000000000000000000000000000000000000000000000000000000000000000";
              const isClankerContract = txLog.address.toLowerCase() === CLANKER_V1_ADDRESS.toLowerCase();
              
              if (isNftMint && isClankerContract) {
                console.log("Found NFT mint:", {
                  from: txLog.topics[1],
                  to: `0x${txLog.topics[2].slice(26)}`,
                  tokenId: BigInt(txLog.topics[3]).toString()
                });
                return true;
              }
              return false;
            });

            if (lockerLogs.length) {
              const lockerLog = lockerLogs[0];
              if (!lockerLog.topics[2] || !lockerLog.topics[3]) {
                throw new Error("Invalid NFT transfer event format");
              }

              const lockerAddress = `0x${lockerLog.topics[2].slice(26)}` as Address;
              const tokenId = BigInt(lockerLog.topics[3]).toString();

              console.log("Found locker details:", {
                lockerAddress,
                tokenId,
                block: txReceipt.blockNumber,
                transactionHash: log.transactionHash
              });

              setProgress?.("Found!");
              return { 
                lockerAddress, 
                tokenId,
                tokenAddress 
              };
            } else {
              console.log("No locker NFT mint found in transaction");
              console.log("All logs in transaction:", txReceipt.logs.map(l => ({
                address: l.address,
                topics: l.topics
              })));
            }
          }
        }
      } catch (error) {
        console.warn(`Error searching blocks ${i} to ${endBlock}, continuing...`, error);
        continue;
      }
    }

    throw new Error(`Token not found in Clanker V1 events: ${tokenAddress}`);
  } catch (e) {
    setProgress?.("Error: " + (e instanceof Error ? e.message : "Unknown error"));
    throw e;
  }
};

// Helper function to retry failed RPC calls
const retryOperation = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export default function ClaimFees() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [blockNumber, setBlockNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<LockerResult | null>(null);
  
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();

  const handleLookup = async () => {
    if (!isAddress(tokenAddress)) {
      setError("Invalid token address");
      return;
    }
    if (!publicClient) {
      setError("No public client available");
      return;
    }

    setError(null);
    setLoading(true);
    setProgress(null);
    setResult(null);

    try {
      const knownBlock = blockNumber ? parseInt(blockNumber) : undefined;
      const result = await findLockerFromCreation(
        tokenAddress as Address, 
        publicClient, 
        knownBlock,
        setProgress
      );
      setResult(result);
    } catch (e) {
      console.error("Error looking up locker:", e);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Get position info when we have a tokenId
  const { data: positionInfo } = useContractRead({
    address: POSITION_MANAGER_ADDRESS,
    abi: POSITION_MANAGER_ABI,
    functionName: "positions",
    args: result ? [BigInt(result.tokenId)] : undefined,
  });

  // Get pool address when we have position info
  const { data: poolAddress } = useContractRead({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getPool",
    args: positionInfo ? [positionInfo[2], positionInfo[3], positionInfo[4]] : undefined,
  });

  const getTokenInfo = async (tokenAddress: Address): Promise<TokenInfo> => {
    if (!publicClient) throw new Error("No public client available");

    const [decimals, symbol] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "symbol",
      }),
    ]);

    return {
      address: tokenAddress,
      symbol: symbol as string,
      decimals: decimals as number,
    };
  };

  // Update token info when position info changes
  const [token0Info, setToken0Info] = useState<TokenInfo | null>(null);
  const [token1Info, setToken1Info] = useState<TokenInfo | null>(null);

  useEffect(() => {
    if (!positionInfo || !publicClient) return;

    const updateTokenInfo = async () => {
      try {
        const [token0, token1] = await Promise.all([
          getTokenInfo(positionInfo[2] as Address),
          getTokenInfo(positionInfo[3] as Address),
        ]);
        setToken0Info(token0);
        setToken1Info(token1);
      } catch (e) {
        console.error("Error fetching token info:", e);
      }
    };

    updateTokenInfo();
  }, [positionInfo, publicClient]);

  const handleClaimFees = async () => {
    if (!userAddress) {
      setError("Please connect your wallet");
      return;
    }

    if (!result) {
      setError("Please lookup a locker first");
      return;
    }

    try {
      setLoading(true);
      setError("");
      // We'll implement the actual claim later
      console.log("Would claim fees with:", {
        locker: result.lockerAddress,
        tokenId: result.tokenId,
        recipient: userAddress
      });
    } catch (e) {
      console.error("Error claiming fees:", e);
      setError("Error claiming fees. Make sure you have the right permissions.");
    } finally {
      setLoading(false);
    }
  };

  const formatTokenAmount = (amount: bigint, decimals: number) => {
    return (Number(amount) / 10 ** decimals).toFixed(decimals > 10 ? 6 : decimals);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-6 bg-base-100 shadow-lg rounded-lg p-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Claim Fees</h2>
          <p className="text-sm opacity-80">
            Enter a token address to find its locker and claim fees.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="label">
              <span className="label-text">Token Address</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered w-full"
              value={tokenAddress}
              onChange={e => setTokenAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Block Number (optional)</span>
              <span className="label-text-alt">Leave empty to search all blocks</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 23547886"
              className="input input-bordered w-full"
              value={blockNumber}
              onChange={e => setBlockNumber(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>

          {error && (
            <div className="text-error text-sm">{error}</div>
          )}

          {progress && (
            <div className="text-info text-sm">{progress}</div>
          )}

          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              onClick={handleLookup}
              disabled={loading || !tokenAddress}
            >
              {loading ? "Looking up..." : "Look up Locker"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="flex flex-col gap-4 mt-4 p-4 bg-base-200 rounded-lg">
            <h3 className="text-lg font-bold">Locker Found</h3>
            <div className="flex flex-col gap-2">
              <p className="text-sm">
                <span className="font-bold">Token:</span>{" "}
                <span className="font-mono">{result.tokenAddress}</span>
              </p>
              <p className="text-sm">
                <span className="font-bold">Locker:</span>{" "}
                <span className="font-mono">{result.lockerAddress}</span>
              </p>
              <p className="text-sm">
                <span className="font-bold">Token ID:</span> {result.tokenId}
              </p>
            </div>

            <button
              className="btn btn-primary mt-2"
              onClick={handleClaimFees}
              disabled={loading}
            >
              {loading ? "Claiming..." : "Claim Fees"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
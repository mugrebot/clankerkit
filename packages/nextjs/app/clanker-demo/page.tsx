"use client";

import { useEffect, useState } from "react";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

interface TokenInfo {
  tokenAddress: string;
  lpAddress: string;
  creator: string;
  timestamp: bigint;
}

export default function ClankerDemo() {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState<(TokenInfo & { symbol: string })[]>([]);

  const { data: clankerDemo } = useScaffoldContract({
    contractName: "ClankerDemo",
  });

  const fetchTokens = async () => {
    if (!clankerDemo) return;

    try {
      // Get all token infos
      const tokenInfos = await clankerDemo.read.getAllTokens();

      // Get all symbols
      const symbols: string[] = [];
      let i = 0;
      const maxAttempts = 100; // Safety limit
      
      while (i < maxAttempts) {
        try {
          const symbol = await clankerDemo.read.tokenSymbols([BigInt(i)]);
          if (!symbol || symbol === "") break;
          symbols.push(symbol);
          i++;
        } catch (error) {
          break;
        }
      }

      // Combine token infos with symbols
      const tokensWithSymbols = tokenInfos.map((token: TokenInfo, index: number) => ({
        ...token,
        symbol: symbols[index] || `Token ${index}`,
      }));

      setTokens(tokensWithSymbols);
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [clankerDemo]);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clankerDemo) return;

    try {
      setIsLoading(true);
      const tx = await clankerDemo.write.deployToken([tokenName, tokenSymbol]);
      await tx.wait();
      setTokenName("");
      setTokenSymbol("");
      await fetchTokens();
    } catch (error) {
      console.error("Failed to deploy token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistributeFees = async (symbol: string) => {
    if (!clankerDemo || !feeAmount) return;

    try {
      setIsLoading(true);
      const tx = await clankerDemo.write.simulateFeeDist([symbol, BigInt(feeAmount)]);
      await tx.wait();
      setFeeAmount("");
      await fetchTokens();
    } catch (error) {
      console.error("Failed to distribute fees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center pt-10">
      <div className="px-5">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Clanker Demo</span>
          <span className="block text-2xl mb-2">Deploy tokens and create LP positions</span>
        </h1>

        <div className="flex flex-col gap-y-6 lg:flex-row items-start gap-x-8">
          {/* Token Deployment Section */}
          <div className="flex flex-col gap-y-6 bg-base-100 shadow-lg p-6 rounded-3xl w-full lg:w-1/2">
            <div className="flex flex-col gap-y-2">
              <span className="text-2xl font-bold">Deploy New Token</span>
              <p className="text-base-content">
                Deploy a new token and automatically create an LP position with a 60/40 fee split.
              </p>
            </div>

            <form onSubmit={handleDeploy} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm">Token Name:</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="input input-bordered"
                  placeholder="My Token"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm">Token Symbol:</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  className="input input-bordered"
                  placeholder="TKN"
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                disabled={isLoading}
              >
                Deploy Token
              </button>
            </form>
          </div>

          {/* Token List & Fee Distribution Section */}
          <div className="flex flex-col gap-y-6 bg-base-100 shadow-lg p-6 rounded-3xl w-full lg:w-1/2">
            <div className="flex flex-col gap-y-2">
              <span className="text-2xl font-bold">Your Tokens</span>
              <p className="text-base-content">View your tokens and simulate fee distribution.</p>
            </div>

            <div className="flex flex-col gap-4">
              {tokens.map((token, index) => (
                <div key={index} className="bg-base-200 p-4 rounded-lg">
                  <h3 className="font-bold">{token.symbol}</h3>
                  <p className="text-sm">Address: {token.tokenAddress}</p>
                  <p className="text-sm">LP: {token.lpAddress}</p>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      placeholder="Fee amount"
                      className="input input-bordered input-sm flex-grow"
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                    />
                    <button
                      onClick={() => handleDistributeFees(token.symbol)}
                      className="btn btn-sm"
                      disabled={isLoading}
                    >
                      Distribute
                    </button>
                  </div>
                </div>
              ))}
              {tokens.length === 0 && (
                <p className="text-center text-base-content/60">No tokens deployed yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

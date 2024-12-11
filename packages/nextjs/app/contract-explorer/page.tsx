"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

const CLANKER_V0_ADDRESS = "0x250c9FB2b411B48273f69879007803790A6AeA47";
const CLANKER_V1_ADDRESS = "0x9B84fcE5Dcd9a38d2D01d5D72373F6b6b067c3e1";

const ContractExplorer: NextPage = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<"v0" | "v1">("v1");
  const [contractInfo, setContractInfo] = useState({
    v0: {
      taxRate: 0,
      protocolCut: 0,
      lpFeesCut: 0,
      taxCollector: "",
      weth: "",
      liquidityLocker: "",
      defaultLockingPeriod: BigInt(0),
    },
    v1: {
      taxRate: 0,
      protocolCut: 0,
      lpFeesCut: 0,
      taxCollector: "",
      weth: "",
      liquidityLocker: "",
      defaultLockingPeriod: BigInt(0),
      deprecated: false,
      bundleFeeSwitch: false,
    },
  });

  // Contract instances
  const { data: clankerV0 } = useScaffoldContract({
    contractName: "ClankerV0",
    address: CLANKER_V0_ADDRESS,
  });

  const { data: clankerV1 } = useScaffoldContract({
    contractName: "ClankerV1",
    address: CLANKER_V1_ADDRESS,
  });

  const fetchContractInfo = async () => {
    if (!clankerV0 || !clankerV1) return;

    try {
      // Fetch V0 info
      const [
        v0TaxRate,
        v0ProtocolCut,
        v0LpFeesCut,
        v0TaxCollector,
        v0Weth,
        v0LiquidityLocker,
        v0DefaultLockingPeriod,
      ] = await Promise.all([
        clankerV0.read.taxRate(),
        clankerV0.read.protocolCut(),
        clankerV0.read.lpFeesCut(),
        clankerV0.read.taxCollector(),
        clankerV0.read.weth(),
        clankerV0.read.liquidityLocker(),
        clankerV0.read.defaultLockingPeriod(),
      ]);

      // Fetch V1 info
      const [
        v1TaxRate,
        v1ProtocolCut,
        v1LpFeesCut,
        v1TaxCollector,
        v1Weth,
        v1LiquidityLocker,
        v1DefaultLockingPeriod,
        v1Deprecated,
        v1BundleFeeSwitch,
      ] = await Promise.all([
        clankerV1.read.taxRate(),
        clankerV1.read.protocolCut(),
        clankerV1.read.lpFeesCut(),
        clankerV1.read.taxCollector(),
        clankerV1.read.weth(),
        clankerV1.read.liquidityLocker(),
        clankerV1.read.defaultLockingPeriod(),
        clankerV1.read.deprecated(),
        clankerV1.read.bundleFeeSwitch(),
      ]);

      setContractInfo({
        v0: {
          taxRate: Number(v0TaxRate),
          protocolCut: Number(v0ProtocolCut),
          lpFeesCut: Number(v0LpFeesCut),
          taxCollector: v0TaxCollector,
          weth: v0Weth,
          liquidityLocker: v0LiquidityLocker,
          defaultLockingPeriod: v0DefaultLockingPeriod,
        },
        v1: {
          taxRate: Number(v1TaxRate),
          protocolCut: Number(v1ProtocolCut),
          lpFeesCut: Number(v1LpFeesCut),
          taxCollector: v1TaxCollector,
          weth: v1Weth,
          liquidityLocker: v1LiquidityLocker,
          defaultLockingPeriod: v1DefaultLockingPeriod,
          deprecated: v1Deprecated,
          bundleFeeSwitch: v1BundleFeeSwitch,
        },
      });
    } catch (error) {
      console.error("Failed to fetch contract info:", error);
    }
  };

  useEffect(() => {
    fetchContractInfo();
  }, [clankerV0, clankerV1]);

  const renderContractInfo = (version: "v0" | "v1") => {
    const info = contractInfo[version];
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Tax Info</h3>
            <p>Tax Rate: {info.taxRate}%</p>
            <p>Protocol Cut: {info.protocolCut}%</p>
            <p>LP Fees Cut: {info.lpFeesCut}%</p>
          </div>
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Contract Addresses</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm">Tax Collector:</span>
                <Address address={info.taxCollector} />
              </div>
              <div>
                <span className="text-sm">WETH:</span>
                <Address address={info.weth} />
              </div>
              <div>
                <span className="text-sm">Liquidity Locker:</span>
                <Address address={info.liquidityLocker} />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-base-200 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Locking Info</h3>
          <p>Default Locking Period: {Number(info.defaultLockingPeriod)} seconds</p>
          {version === "v1" && (
            <>
              <p>Deprecated: {info.deprecated ? "Yes" : "No"}</p>
              <p>Bundle Fee Switch: {info.bundleFeeSwitch ? "Enabled" : "Disabled"}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center pt-10">
      <div className="px-5 w-full max-w-7xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Clanker Contract Explorer</span>
          <span className="block text-2xl mb-2">Compare and interact with Clanker contracts</span>
        </h1>

        <div className="tabs tabs-boxed justify-center mb-8">
          <button
            className={`tab ${activeTab === "v0" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("v0")}
          >
            Clanker V0
          </button>
          <button
            className={`tab ${activeTab === "v1" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("v1")}
          >
            Clanker V1
          </button>
        </div>

        <div className="bg-base-100 shadow-lg rounded-3xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Contract Info</h2>
            <Address address={activeTab === "v0" ? CLANKER_V0_ADDRESS : CLANKER_V1_ADDRESS} />
          </div>
          {renderContractInfo(activeTab)}
        </div>

        {/* TODO: Add interactive features like fee claiming */}
      </div>
    </div>
  );
};

export default ContractExplorer; 
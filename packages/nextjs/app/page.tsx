"use client";

import Link from "next/link";
import type { NextPage } from "next";

const mainChallenges = [
  {
    title: "1. Deploy Your Own Clanker",
    description: "Deploy a factory contract that can create Clanker tokens",
    steps: [
      "Generate burner wallet with yarn generate",
      "Get Base Sepolia ETH from Coinbase faucet",
      "Deploy your Clanker factory with yarn deploy",
      "Update contract in externalContracts.ts",
      "Now you can create tokens through your factory!",
    ],
    links: [
      {
        text: "🚰 Get ETH from Coinbase Faucet",
        url: "https://portal.cdp.coinbase.com/products/faucet",
        primary: true,
      },
      {
        text: "🤖️ Study Existing Factory",
        url: "/debug",
        primary: true,
      },
      {
        text: "View other faucets",
        url: "https://docs.base.org/docs/tools/network-faucets/",
      },
    ],
  },
  {
    title: "2. Enable Fee Claims",
    description: "Call collectFees on the LP locker contract",
    steps: [
      "Find a token's locker using the Lookup tool",
      "Note the locker address and token ID from the output",
      "Call collectFees(tokenId) on the locker contract",
      "Hint: The locker address is an LP Locker contract!",
    ],
    links: [
      {
        text: "🔍 Open Locker Lookup",
        url: "/claim-fees",
        primary: true,
      },
      {
        text: "View Contract Explorer",
        url: "/contract-explorer",
      },
    ],
  },
];

const bonusChallenges = [
  {
    title: "🌟 Port from clank.fun",
    description: "Contribute to the ecosystem by porting your favorite component",
    steps: [
      "Visit clank.fun and explore its features",
      "Find a component you'd like to port",
      "Start small - maybe add a new feature",
      "Submit a PR to contribute!",
    ],
    links: [
      {
        text: "🌐 Visit clank.fun",
        url: "https://clank.fun",
        primary: true,
      },
      {
        text: "View source on GitHub",
        url: "https://github.com/nicktikhonov/clankfun",
      },
    ],
  },
];

const Home: NextPage = () => {
  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">Welcome to ClankerKit</span>
            <span className="block text-2xl mb-2">Your gateway to Clanker development</span>
          </h1>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto mb-8">
            <Link href="/clanker-demo" className="btn btn-primary shadow-neon">
              🤖 Try Demo
            </Link>
            <Link href="/claim-fees" className="btn btn-primary shadow-neon">
              🔍 Locker Lookup
            </Link>
            <Link href="/contract-explorer" className="btn btn-primary shadow-neon">
              📝 Contract Explorer
            </Link>
            <a 
              href="https://clank.fun" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary shadow-neon"
            >
              🌐 clank.fun
            </a>
          </div>

          {/* Main Challenges */}
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Main Challenges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {mainChallenges.map((challenge, index) => (
                <div key={index} className="bg-base-100 shadow-lg rounded-3xl px-6 py-6 flex flex-col">
                  <h3 className="text-xl font-bold mb-3">{challenge.title}</h3>
                  <p className="text-sm opacity-80 mb-4">{challenge.description}</p>
                  
                  <div className="flex-grow">
                    <ol className="list-decimal list-inside space-y-2 text-sm mb-6">
                      {challenge.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-base-content/80">{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex flex-col gap-2 mt-auto">
                    {challenge.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link.url}
                        target={link.url.startsWith("http") ? "_blank" : undefined}
                        rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                        className={`btn btn-sm ${
                          link.primary ? "btn-primary shadow-neon" : "btn-ghost"
                        }`}
                      >
                        {link.text}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bonus Challenges */}
            <h2 className="text-2xl font-bold mb-6 text-center">Bonus Challenges</h2>
            <div className="grid grid-cols-1 gap-6">
              {bonusChallenges.map((challenge, index) => (
                <div key={index} className="bg-base-100 shadow-lg rounded-3xl px-6 py-6 flex flex-col">
                  <h3 className="text-xl font-bold mb-3">{challenge.title}</h3>
                  <p className="text-sm opacity-80 mb-4">{challenge.description}</p>
                  
                  <div className="flex-grow">
                    <ol className="list-decimal list-inside space-y-2 text-sm mb-6">
                      {challenge.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-base-content/80">{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex flex-col gap-2 mt-auto">
                    {challenge.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link.url}
                        target={link.url.startsWith("http") ? "_blank" : undefined}
                        rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                        className={`btn btn-sm ${
                          link.primary ? "btn-primary shadow-neon" : "btn-ghost"
                        }`}
                      >
                        {link.text}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

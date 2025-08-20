import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import * as dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: "../../.env" });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {},
  namedAccounts: {
    deployer: 0
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

// Only add Sei testnet if private key is available
if (process.env.SEI_PRIVATE_KEY && process.env.SEI_PRIVATE_KEY !== 'your_private_key_here') {
  config.networks!["sei-testnet"] = {
    url: process.env.SEI_RPC_URL || "https://evm-rpc-testnet.sei-apis.com",
    accounts: [process.env.SEI_PRIVATE_KEY],
    chainId: parseInt(process.env.SEI_CHAIN_ID || "1328"),
    gasPrice: 20000000000, // 20 gwei
    timeout: 60000
  };
} else {
  console.log("⚠️ SEI_PRIVATE_KEY not set - Sei testnet network disabled");
}

export default config;

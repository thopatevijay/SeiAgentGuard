# SeiAgentGuard

## 🛡️ AI Agent Security Proxy for Sei Blockchain

SeiAgentGuard is a comprehensive security middleware platform that protects autonomous AI agents operating on the Sei blockchain.It provides real-time threat detection, policy enforcement, and immutable audit trails at machine speed.

### 🎯 Problem Statement

- **94.1% of LLMs** exhibit vulnerabilities to attack vectors
- **No specialized protection** exists for onchain autonomous agents
- **MCP security attacks** including tool poisoning and puppet attacks are unaddressed
- **Real-time security gaps** where traditional AppSec tools can't interpret prompts

### 🚀 Solution

SeiAgentGuard addresses these challenges through:

- **Real-Time Threat Detection**: AI-powered analysis using specialized NLP models
- **Policy Enforcement Layer**: Smart contract-based governance with sub-400ms response
- **Immutable Audit Trails**: Complete transparency through blockchain-based logging
- **Framework-Agnostic Integration**: Compatible with all major AI agent frameworks

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Agent      │────│  SeiAgentGuard  │────│   LLM Provider  │
│   Application   │    │   Proxy Layer   │    │   (OpenAI, etc) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Sei Blockchain │
                    │   Audit Trail   │
                    └─────────────────┘
```

### Core Components

1. **Security Proxy Layer**: Intercepts all AI agent interactions
2. **Multi-Layer Threat Detection**: BERT-based prompt injection detection
3. **Policy Engine**: YAML-configured security rules
4. **Smart Contract Governance**: Onchain policy enforcement
5. **Real-Time Dashboard**: Security monitoring and analytics

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Blockchain**: Sei Network, Solidity
- **Security**: AWS SageMaker, Lambda, ECS
- **Integrations**: Dynamic, Crossmint, Alchemy
- **AI Frameworks**: LangGraph, AutoGen, ElizaOS

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Git
- VS Code IDE
- AWS Account (for ML models)
- Sei Network wallet

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/seiagentguard.git
cd seiagentguard
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Sei Network Configuration
SEI_RPC_URL=https://sei-rpc.com
SEI_PRIVATE_KEY=your_private_key_here
SEI_CONTRACT_ADDRESS=0x...

# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
SAGEMAKER_ENDPOINT=your_endpoint

# Sponsor Tool Integration
DYNAMIC_ENVIRONMENT_ID=your_dynamic_env_id
CROSSMINT_API_KEY=your_crossmint_key
ALCHEMY_API_KEY=your_alchemy_key

# Security Configuration
SECURITY_LEVEL=enterprise
THREAT_DETECTION_ENABLED=true
BLOCKCHAIN_LOGGING=true
```

### 3. Development Setup

```bash
# Install dependencies
npm run setup

# Deploy smart contracts (testnet)
npm run deploy:testnet

# Start development server
npm run dev
```

### 4. Testing

```bash
# Run security tests
npm run test:security

# Run integration tests
npm run test:integration

# Simulate attacks
npm run test:attacks
```

## 📦 Project Structure

```
seiagentguard/
├── packages/
│   ├── core/                  # Core security engine
│   ├── sdk/                   # Developer SDK
│   ├── dashboard/             # Next.js dashboard
│   ├── contracts/             # Solidity contracts
│   └── integrations/          # Framework integrations
├── apps/
│   ├── api/                   # Express API server
│   ├── web/                   # Next.js frontend
│   └── docs/                  # Documentation site
├── tools/
│   ├── scripts/               # Development scripts
│   └── tests/                 # Test utilities
└── docs/                      # Additional documentation
```

## 🔧 Development

### Core Components

#### Security Proxy Implementation

```typescript
// packages/core/src/proxy.ts
export class SecurityProxy {
  async interceptRequest(request: AgentRequest): Promise<SecurityResponse> {
    // Threat detection
    const threats = await this.threatDetector.analyze(request);
    
    // Policy evaluation
    const decision = await this.policyEngine.evaluate(threats);
    
    // Blockchain logging
    await this.auditLogger.log(decision);
    
    return decision;
  }
}
```

#### Framework Integration

```typescript
// packages/integrations/langgraph/index.ts
export function secureAgent(agent: LangGraphAgent): SecureAgent {
  return new Proxy(agent, {
    apply: async (target, thisArg, args) => {
      const securityCheck = await seiAgentGuard.validate(args);
      if (!securityCheck.allowed) {
        throw new SecurityError(securityCheck.reason);
      }
      return target.apply(thisArg, args);
    }
  });
}
```

### Smart Contract Deployment

```bash
# Deploy to Sei testnet
npx hardhat deploy --network sei-testnet

# Deploy to Sei mainnet
npx hardhat deploy --network sei-mainnet

# Verify contracts
npx hardhat verify --network sei-testnet DEPLOYED_ADDRESS
```

## 🔌 Integration Guide

### Basic SDK Usage

```typescript
import { SeiAgentGuard } from '@seiagentguard/sdk';

const guard = new SeiAgentGuard({
  seiConfig: {
    rpcUrl: process.env.SEI_RPC_URL,
    privateKey: process.env.SEI_PRIVATE_KEY
  },
  policyLevel: 'enterprise'
});

// Protect an agent
const secureAgent = guard.protectAgent(yourAgent);
```

### Framework-Specific Integrations

#### LangGraph

```typescript
import { secureAgent } from '@seiagentguard/langgraph';

const myAgent = createLangGraphAgent(config);
const secureMyAgent = secureAgent(myAgent);
```

#### AutoGen

```typescript
import { SecureGroupChatManager } from '@seiagentguard/autogen';

const manager = new SecureGroupChatManager({
  sei_config: seiConfig,
  security_level: 'high'
});
```

#### ElizaOS

```typescript
// Add to elizaos config
{
  "plugins": {
    "@seiagentguard/eliza-plugin": {
      "enabled": true,
      "config": {
        "threat_detection": "high",
        "blockchain_logging": true
      }
    }
  }
}
```

## 🔍 Security Features

### Threat Detection

- **Prompt Injection Detection**: BERT-based NLP models
- **Behavioral Analysis**: Anomaly detection algorithms
- **MCP Vulnerability Scanning**: Tool poisoning prevention
- **Cross-Agent Correlation**: Network-wide threat intelligence

### Policy Enforcement

```yaml
# security-policies.yaml
policies:
  prompt_injection:
    enabled: true
    severity: "critical"
    action: "block"
    
  tool_access:
    whitelist_mode: true
    allowed_tools: ["web_search", "calculator"]
    
  blockchain_enforcement:
    log_all_events: true
    sei_finality_timeout: 400
```

### Audit Trail

All security events are immutably logged on Sei blockchain:

- Threat detections
- Policy violations
- Agent actions
- System responses

## 📊 Dashboard

Access the security dashboard at `http://localhost:3000/dashboard`

Features:
- Real-time threat monitoring
- Agent health scores
- Policy management
- Incident response
- Compliance reporting

## 🧪 Testing

### Security Test Suite

```bash
# Run comprehensive security tests
npm run test:security

# Test specific attack vectors
npm run test:prompt-injection
npm run test:tool-misuse
npm run test:behavioral-anomalies
```

### Performance Testing

```bash
# Test response times (<400ms requirement)
npm run test:performance

# Load testing
npm run test:load
```

## 🚀 Deployment

### Production Deployment

```bash
# Build production bundle
npm run build

# Deploy to AWS
npm run deploy:aws

# Deploy smart contracts to mainnet
npm run deploy:mainnet
```

### Environment Setup

1. **AWS Infrastructure**: ECS, Lambda, SageMaker
2. **Sei Network**: Mainnet contract deployment
3. **Monitoring**: CloudWatch, Datadog integration
4. **CI/CD**: GitHub Actions workflow

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow security coding standards

## 📚 Documentation

- [API Reference](./docs/api.md)
- [Security Guide](./docs/security.md)
- [Integration Examples](./docs/examples.md)
- [Deployment Guide](./docs/deployment.md)

## 🏆 Hackathon Information

**Track**: Tooling and Infrastructure ($75k prize pool)  
**Theme**: Build the future of onchain autonomous intelligence at machine speed on Sei  
**Integration**: Leverages AWS, Alchemy, Crossmint, Dynamic, Sei MCP Server

### Judging Criteria Alignment

- ✅ **Onchain Intelligence**: Smart contract governance and blockchain audit trails
- ✅ **Autonomous Systems**: Self-defending AI agents with minimal human intervention
- ✅ **Machine Speed**: Sub-400ms security response leveraging Sei's performance
- ✅ **Tooling & Infrastructure**: Foundational security layer for AI agent development

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.seiagentguard.com](https://docs.seiagentguard.com)
- **Discord**: [SeiAgentGuard Community](https://discord.gg/seiagentguard)
- **Issues**: [GitHub Issues](https://github.com/yourusername/seiagentguard/issues)
- **Email**: support@seiagentguard.com

## 🙏 Acknowledgments

- **Sei Network**: For high-performance blockchain infrastructure
- **AWS**: For ML model hosting and compute infrastructure
- **Sponsor Partners**: Dynamic, Crossmint, Alchemy for integration support

---

**Built with ❤️ for the future of secure AI agents on Sei blockchain**

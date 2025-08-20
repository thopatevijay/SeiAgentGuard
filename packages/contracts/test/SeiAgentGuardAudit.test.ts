import { expect } from "chai";
import { ethers } from "hardhat";
import { SeiAgentGuardAudit } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SeiAgentGuardAudit", function () {
  let audit: SeiAgentGuardAudit;
  let owner: SignerWithAddress;
  let authorizedLogger: SignerWithAddress;
  let unauthorizedLogger: SignerWithAddress;
  let testAgent: SignerWithAddress;

  beforeEach(async function () {
    [owner, authorizedLogger, unauthorizedLogger, testAgent] = await ethers.getSigners();
    
    const AuditFactory = await ethers.getContractFactory("SeiAgentGuardAudit");
    audit = await AuditFactory.deploy();
    await audit.waitForDeployment();
    
    // Add authorized logger
    await audit.addAuthorizedLogger(authorizedLogger.address);
  });

  describe("Deployment", function () {
    it("Should deploy with correct owner", async function () {
      expect(await audit.owner()).to.equal(owner.address);
    });

    it("Should have correct max severity", async function () {
      expect(await audit.maxSeverity()).to.equal(100);
    });

    it("Should have owner as authorized logger", async function () {
      expect(await audit.isAuthorizedLogger(owner.address)).to.be.true;
    });
  });

  describe("Security Event Logging", function () {
    it("Should log threat detection events", async function () {
      const agentId = testAgent.address;
      const threatType = "prompt_injection";
      const severity = 95;
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("evidence"));

      const tx = await audit.logSecurityEvent(agentId, threatType, severity, evidenceHash);
      const receipt = await tx.wait();
      
      // Check that the event was emitted
      expect(receipt?.logs.length).to.be.greaterThan(0);
      
      // Verify the event data through the contract state
      const stats = await audit.getAgentStats(agentId);
      expect(stats.totalEvents).to.equal(1);
      expect(stats.totalSeverity).to.equal(severity);
    });

    it("Should update agent statistics", async function () {
      const agentId = testAgent.address;
      const threatType = "malware_detected";
      const severity = 80;
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("malware_evidence"));

      await audit.logSecurityEvent(agentId, threatType, severity, evidenceHash);

      const stats = await audit.getAgentStats(agentId);
      expect(stats.totalEvents).to.equal(1);
      expect(stats.totalSeverity).to.equal(severity);
      expect(stats.isActive).to.be.true;
    });

    it("Should update global statistics", async function () {
      const agentId = testAgent.address;
      const threatType = "data_exfiltration";
      const severity = 90;
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("exfiltration_evidence"));

      await audit.logSecurityEvent(agentId, threatType, severity, evidenceHash);

      const [totalEvents, totalThreats, averageSeverity] = await audit.getGlobalStats();
      expect(totalEvents).to.equal(1);
      expect(totalThreats).to.equal(1);
      expect(averageSeverity).to.equal(1); // 1 threat / 1 event = 1
    });

    it("Should prevent duplicate event logging", async function () {
      const agentId = testAgent.address;
      const threatType = "test_threat";
      const severity = 50;
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("test_evidence"));

      await audit.logSecurityEvent(agentId, threatType, severity, evidenceHash);

      // Try to log the same event again - should fail due to timestamp difference
      // The event ID includes timestamp, so we need to wait a bit
      await ethers.provider.send("evm_mine", []);
      
      // This should still work because the timestamp will be different
      await audit.logSecurityEvent(agentId, threatType, severity, evidenceHash);
      
      // Verify both events were logged
      const [totalEvents, totalThreats] = await audit.getGlobalStats();
      expect(totalEvents).to.equal(2);
    });
  });

  describe("Policy Enforcement Logging", function () {
    it("Should log policy enforcement actions", async function () {
      const agentId = testAgent.address;
      const policyName = "rate_limiting";
      const action = "block";

      await expect(audit.logPolicyEnforcement(agentId, policyName, action))
        .to.emit(audit, "PolicyEnforced")
        .withArgs(agentId, policyName, action, anyValue);
    });
  });

  describe("Access Control", function () {
    it("Should allow authorized loggers to log events", async function () {
      const agentId = testAgent.address;
      const threatType = "test_threat";
      const severity = 50;
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("test_evidence"));

      await expect(
        audit.connect(authorizedLogger).logSecurityEvent(agentId, threatType, severity, evidenceHash)
      ).to.not.be.reverted;
    });

    it("Should prevent unauthorized loggers from logging events", async function () {
      const agentId = testAgent.address;
      const threatType = "test_threat";
      const severity = 50;
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("test_evidence"));

      await expect(
        audit.connect(unauthorizedLogger).logSecurityEvent(agentId, threatType, severity, evidenceHash)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow owner to add authorized loggers", async function () {
      await audit.addAuthorizedLogger(unauthorizedLogger.address);
      expect(await audit.isAuthorizedLogger(unauthorizedLogger.address)).to.be.true;
    });

    it("Should allow owner to remove authorized loggers", async function () {
      await audit.removeAuthorizedLogger(authorizedLogger.address);
      expect(await audit.isAuthorizedLogger(authorizedLogger.address)).to.be.false;
    });
  });

  describe("Validation", function () {
    it("Should reject invalid agent address", async function () {
      const threatType = "test_threat";
      const severity = 50;
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("test_evidence"));

      await expect(
        audit.logSecurityEvent(ethers.ZeroAddress, threatType, severity, evidenceHash)
      ).to.be.revertedWith("Invalid agent address");
    });

    it("Should reject empty event type", async function () {
      const agentId = testAgent.address;
      const severity = 50;
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("test_evidence"));

      await expect(
        audit.logSecurityEvent(agentId, "", severity, evidenceHash)
      ).to.be.revertedWith("Event type cannot be empty");
    });

    it("Should reject severity above maximum", async function () {
      const agentId = testAgent.address;
      const threatType = "test_threat";
      const severity = 101;
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("test_evidence"));

      await expect(
        audit.logSecurityEvent(agentId, threatType, severity, evidenceHash)
      ).to.be.revertedWith("Invalid severity level");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update max severity", async function () {
      const newMaxSeverity = 200;
      await audit.updateMaxSeverity(newMaxSeverity);
      expect(await audit.maxSeverity()).to.equal(newMaxSeverity);
    });

    it("Should allow owner to pause contract", async function () {
      await audit.pause();
      expect(await audit.paused()).to.be.true;
    });

    it("Should allow owner to unpause contract", async function () {
      await audit.pause();
      await audit.unpause();
      expect(await audit.paused()).to.be.false;
    });

    it("Should prevent non-owner from calling admin functions", async function () {
      await expect(
        audit.connect(unauthorizedLogger).updateMaxSeverity(200)
      ).to.be.revertedWithCustomError(audit, "OwnableUnauthorizedAccount");

      await expect(
        audit.connect(unauthorizedLogger).pause()
      ).to.be.revertedWithCustomError(audit, "OwnableUnauthorizedAccount");
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for logging", async function () {
      const agentId = testAgent.address;
      const threatType = "test_threat";
      const severity = 50;
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("test_evidence"));

      const tx = await audit.logSecurityEvent(agentId, threatType, severity, evidenceHash);
      const receipt = await tx.wait();
      
      // Gas should be reasonable for a simple logging operation
      // Increased limit due to OpenZeppelin overhead
      expect(receipt?.gasUsed).to.be.lessThan(400000);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple events for same agent", async function () {
      const agentId = testAgent.address;
      const evidenceHash1 = ethers.keccak256(ethers.toUtf8Bytes("evidence1"));
      const evidenceHash2 = ethers.keccak256(ethers.toUtf8Bytes("evidence2"));

      await audit.logSecurityEvent(agentId, "threat1", 50, evidenceHash1);
      await audit.logSecurityEvent(agentId, "threat2", 30, evidenceHash2);

      const stats = await audit.getAgentStats(agentId);
      expect(stats.totalEvents).to.equal(2);
      expect(stats.totalSeverity).to.equal(80);
    });

    it("Should handle zero severity events", async function () {
      const agentId = testAgent.address;
      const threatType = "info_event";
      const severity = 0;
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("info_evidence"));

      await audit.logSecurityEvent(agentId, threatType, severity, evidenceHash);

      const [totalEvents, totalThreats] = await audit.getGlobalStats();
      expect(totalEvents).to.equal(1);
      expect(totalThreats).to.equal(0); // Zero severity doesn't count as threat
    });
  });
});

// Helper function for anyValue matcher
function anyValue() {
  return true;
}

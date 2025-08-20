// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SeiAgentGuardAudit
 * @dev Smart contract for logging security events and policy enforcement on Sei blockchain
 * @custom:security-contact security@seiagentguard.com
 */
contract SeiAgentGuardAudit is Ownable, Pausable {
    
    // Events
    event ThreatDetected(
        address indexed agentId,
        string indexed threatType,
        uint256 severity,
        bytes32 evidenceHash,
        uint256 timestamp
    );
    
    event PolicyEnforced(
        address indexed agentId,
        string indexed policyName,
        string action,
        uint256 timestamp
    );
    
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);
    
    // Structs
    struct SecurityEvent {
        address agent;
        string eventType;
        uint256 severity;
        bytes32 evidenceHash;
        uint256 blockNumber;
        uint256 timestamp;
        bool exists;
    }
    
    struct AgentStats {
        uint256 totalEvents;
        uint256 totalSeverity;
        uint256 lastEventTime;
        bool isActive;
    }
    
    // State variables
    mapping(bytes32 => SecurityEvent) public securityEvents;
    mapping(address => AgentStats) public agentStats;
    mapping(address => bool) public authorizedLoggers;
    
    uint256 public totalEvents;
    uint256 public totalThreats;
    uint256 public maxSeverity = 100;
    
    // Modifiers
    modifier onlyAuthorizedLogger() {
        require(authorizedLoggers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier validSeverity(uint256 severity) {
        require(severity <= maxSeverity, "Invalid severity level");
        _;
    }
    
    // Constructor
    constructor() Ownable(msg.sender) {
        authorizedLoggers[msg.sender] = true;
    }
    
    /**
     * @dev Log a security event to the blockchain
     * @param agentId The address of the AI agent
     * @param eventType The type of security event
     * @param severity Severity level (0-100)
     * @param evidenceHash Hash of the evidence data
     */
    function logSecurityEvent(
        address agentId,
        string memory eventType,
        uint256 severity,
        bytes32 evidenceHash
    ) external onlyAuthorizedLogger whenNotPaused validSeverity(severity) {
        require(agentId != address(0), "Invalid agent address");
        require(bytes(eventType).length > 0, "Event type cannot be empty");
        
        bytes32 eventId = keccak256(abi.encodePacked(
            agentId, 
            eventType, 
            block.timestamp, 
            evidenceHash
        ));
        
        // Ensure unique event ID
        require(!securityEvents[eventId].exists, "Event already logged");
        
        SecurityEvent memory newEvent = SecurityEvent({
            agent: agentId,
            eventType: eventType,
            severity: severity,
            evidenceHash: evidenceHash,
            blockNumber: block.number,
            timestamp: block.timestamp,
            exists: true
        });
        
        securityEvents[eventId] = newEvent;
        
        // Update agent statistics
        AgentStats storage stats = agentStats[agentId];
        stats.totalEvents++;
        stats.totalSeverity += severity;
        stats.lastEventTime = block.timestamp;
        stats.isActive = true;
        
        // Update global statistics
        totalEvents++;
        if (severity > 0) {
            totalThreats++;
        }
        
        emit ThreatDetected(agentId, eventType, severity, evidenceHash, block.timestamp);
    }
    
    /**
     * @dev Log policy enforcement action
     * @param agentId The address of the AI agent
     * @param policyName Name of the policy that was enforced
     * @param action The action taken (allow, block, warn, modify)
     */
    function logPolicyEnforcement(
        address agentId,
        string memory policyName,
        string memory action
    ) external onlyAuthorizedLogger whenNotPaused {
        require(agentId != address(0), "Invalid agent address");
        require(bytes(policyName).length > 0, "Policy name cannot be empty");
        require(bytes(action).length > 0, "Action cannot be empty");
        
        emit PolicyEnforced(agentId, policyName, action, block.timestamp);
    }
    
    /**
     * @dev Get security event details
     * @param eventId The unique identifier of the event
     * @return SecurityEvent struct with event details
     */
    function getSecurityEvent(bytes32 eventId) external view returns (SecurityEvent memory) {
        require(securityEvents[eventId].exists, "Event not found");
        return securityEvents[eventId];
    }
    
    /**
     * @dev Get agent risk score (cumulative severity)
     * @param agentId The address of the AI agent
     * @return The cumulative risk score
     */
    function getAgentRiskScore(address agentId) external view returns (uint256) {
        return agentStats[agentId].totalSeverity;
    }
    
    /**
     * @dev Get agent statistics
     * @param agentId The address of the AI agent
     * @return AgentStats struct with agent statistics
     */
    function getAgentStats(address agentId) external view returns (AgentStats memory) {
        return agentStats[agentId];
    }
    
    /**
     * @dev Get global statistics
     * @return _totalEvents Total number of security events
     * @return _totalThreats Total number of threat events
     * @return _averageSeverity Average severity across all events
     */
    function getGlobalStats() external view returns (
        uint256 _totalEvents,
        uint256 _totalThreats,
        uint256 _averageSeverity
    ) {
        _totalEvents = totalEvents;
        _totalThreats = totalThreats;
        _averageSeverity = totalEvents > 0 ? totalThreats / totalEvents : 0;
    }
    
    // Admin functions
    
    /**
     * @dev Add authorized logger address
     * @param logger The address to authorize
     */
    function addAuthorizedLogger(address logger) external onlyOwner {
        require(logger != address(0), "Invalid address");
        authorizedLoggers[logger] = true;
    }
    
    /**
     * @dev Remove authorized logger address
     * @param logger The address to remove authorization from
     */
    function removeAuthorizedLogger(address logger) external onlyOwner {
        authorizedLoggers[logger] = false;
    }
    
    /**
     * @dev Update maximum severity level
     * @param newMaxSeverity New maximum severity level
     */
    function updateMaxSeverity(uint256 newMaxSeverity) external onlyOwner {
        require(newMaxSeverity > 0, "Max severity must be positive");
        maxSeverity = newMaxSeverity;
    }
    
    /**
     * @dev Pause contract (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Check if address is authorized logger
     * @param logger The address to check
     * @return True if authorized
     */
    function isAuthorizedLogger(address logger) external view returns (bool) {
        return authorizedLoggers[logger] || logger == owner();
    }
}

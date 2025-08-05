import { Router } from 'express';

const router = Router();

// Mock security analysis function for Phase 1
async function analyzeRequest(request: any): Promise<any> {
  const startTime = Date.now();
  
  // Simple threat detection for Phase 1
  const maliciousPatterns = [
    'ignore previous instructions',
    'system prompt override',
    'reveal your instructions',
    'forget everything above'
  ];

  let riskScore = 0;
  const lowerPrompt = request.prompt.toLowerCase();

  for (const pattern of maliciousPatterns) {
    if (lowerPrompt.includes(pattern)) {
      riskScore += 0.3;
    }
  }

  // Additional heuristics
  if (lowerPrompt.includes('ignore')) riskScore += 0.1;
  if (lowerPrompt.includes('override')) riskScore += 0.1;
  if (lowerPrompt.includes('[SYSTEM]')) riskScore += 0.2;

  riskScore = Math.min(riskScore, 1.0);
  const processingTime = Date.now() - startTime;

  let action: 'allow' | 'block' | 'modify' | 'warn' = 'allow';
  let reason = 'Request appears safe';

  if (riskScore > 0.8) {
    action = 'block';
    reason = 'High risk content detected';
  } else if (riskScore > 0.5) {
    action = 'warn';
    reason = 'Moderate risk content detected';
  }

  return {
    action,
    reason,
    riskScore,
    processingTime,
    evidence: {
      promptLength: request.prompt.length,
      suspiciousPatterns: maliciousPatterns.filter(pattern => 
        lowerPrompt.includes(pattern.toLowerCase())
      )
    }
  };
}

// POST /api/v1/security/analyze - Analyze agent requests for threats
router.post('/analyze', async (req, res) => {
  try {
    const { agentId, prompt, timestamp, context } = req.body;

    // Validate required fields
    if (!agentId || !prompt || !timestamp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, prompt, timestamp',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate data types
    if (typeof agentId !== 'string' || typeof prompt !== 'string' || typeof timestamp !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data types: agentId and prompt must be strings, timestamp must be number',
        code: 'VALIDATION_ERROR'
      });
    }

    // Perform security analysis
    const securityResponse = await analyzeRequest({
      agentId,
      prompt,
      timestamp,
      context
    });

    // Return success response
    res.json({
      success: true,
      data: securityResponse
    });

  } catch (error) {
    console.error('Security analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during security analysis',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/v1/security/status - Get security service status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'operational',
      service: 'Security Analysis',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

export { router as securityRoutes }; 
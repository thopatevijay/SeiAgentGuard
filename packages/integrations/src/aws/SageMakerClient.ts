import { SageMakerRuntimeClient, InvokeEndpointCommand } from '@aws-sdk/client-sagemaker-runtime';

export interface MLPredictionResult {
  threatProbability: number;
  confidence: number;
  modelVersion: string;
  processingTime: number;
  modelMetadata: {
    endpointName: string;
    region: string;
    lastUpdated: string;
  };
}

export interface ModelHealth {
  endpointStatus: string;
  instanceCount: number;
  lastInference: string;
  averageLatency: number;
}

export class SageMakerClient {
  private client: SageMakerRuntimeClient;
  private endpointName: string;
  private timeout: number;
  private region: string;
  
  constructor(region: string, endpointName: string, timeout: number = 30000) {
    this.region = region;
    this.endpointName = endpointName;
    this.timeout = timeout;
    
    this.client = new SageMakerRuntimeClient({ 
      region,
      maxAttempts: 3,
      requestHandler: {
        httpOptions: {
          timeout: timeout
        }
      }
    });
  }
  
  /**
   * Make prediction using SageMaker endpoint
   */
  async predict(prompt: string): Promise<MLPredictionResult> {
    const startTime = Date.now();
    
    try {
      // Prepare input data for the model
      const inputData = this.prepareInput(prompt);
      
      const command = new InvokeEndpointCommand({
        EndpointName: this.endpointName,
        ContentType: 'application/json',
        Body: JSON.stringify(inputData),
      });
      
      const response = await this.client.send(command);
      const responseBody = JSON.parse(Buffer.from(response.Body).toString());
      
      return {
        threatProbability: responseBody.threat_probability || 0,
        confidence: responseBody.confidence || 0,
        modelVersion: responseBody.model_version || 'bert-v1',
        processingTime: Date.now() - startTime,
        modelMetadata: {
          endpointName: this.endpointName,
          region: this.region,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`SageMaker prediction failed: ${error.message}`);
    }
  }
  
  /**
   * Batch prediction for multiple prompts
   */
  async batchPredict(prompts: string[]): Promise<MLPredictionResult[]> {
    const results: MLPredictionResult[] = [];
    
    for (const prompt of prompts) {
      try {
        const result = await this.predict(prompt);
        results.push(result);
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Batch prediction failed for prompt: ${error.message}`);
        // Add fallback result
        results.push({
          threatProbability: 0.5,
          confidence: 0.3,
          modelVersion: 'fallback',
          processingTime: 0,
          modelMetadata: {
            endpointName: this.endpointName,
            region: this.region,
            lastUpdated: new Date().toISOString()
          }
        });
      }
    }
    
    return results;
  }
  
  /**
   * Health check for SageMaker endpoint
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check with minimal data
      await this.predict('health check');
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get model health information
   */
  async getModelHealth(): Promise<ModelHealth> {
    try {
      // This would typically call AWS SDK to get endpoint details
      // For now, return mock data
      return {
        endpointStatus: 'InService',
        instanceCount: 2,
        lastInference: new Date().toISOString(),
        averageLatency: 150
      };
    } catch (error) {
      console.error('Failed to get model health:', error);
      return {
        endpointStatus: 'Unknown',
        instanceCount: 0,
        lastInference: new Date().toISOString(),
        averageLatency: 0
      };
    }
  }
  
  /**
   * Update model endpoint
   */
  async updateEndpoint(newEndpointName: string): Promise<boolean> {
    try {
      this.endpointName = newEndpointName;
      console.log(`Updated SageMaker endpoint to: ${newEndpointName}`);
      return true;
    } catch (error) {
      console.error('Failed to update endpoint:', error);
      return false;
    }
  }
  
  /**
   * Get model performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    totalInferences: number;
    averageLatency: number;
    errorRate: number;
    throughput: number;
  }> {
    try {
      // This would typically call CloudWatch metrics
      // For now, return mock data
      return {
        totalInferences: 15420,
        averageLatency: 145,
        errorRate: 0.02,
        throughput: 45.2
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        totalInferences: 0,
        averageLatency: 0,
        errorRate: 0,
        throughput: 0
      };
    }
  }
  
  /**
   * Prepare input data for the ML model
   */
  private prepareInput(prompt: string): any {
    // This would format the input according to your model's requirements
    // Common formats include:
    // - Raw text for BERT models
    // - Tokenized input for transformer models
    // - Feature vectors for traditional ML models
    
    return {
      text: prompt,
      timestamp: new Date().toISOString(),
      model_input_format: 'text',
      preprocessing: {
        lowercase: true,
        remove_special_chars: false,
        max_length: 512
      }
    };
  }
  
  /**
   * Validate input data
   */
  private validateInput(prompt: string): boolean {
    if (!prompt || typeof prompt !== 'string') {
      return false;
    }
    
    if (prompt.length > 10000) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get model configuration
   */
  getModelConfig(): {
    endpointName: string;
    region: string;
    timeout: number;
    maxRetries: number;
  } {
    return {
      endpointName: this.endpointName,
      region: this.region,
      timeout: this.timeout,
      maxRetries: 3
    };
  }
}

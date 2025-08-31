import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });

export async function getSecret(parameterName: string): Promise<string> {
  try {
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    });
    
    const response = await ssmClient.send(command);
    return response.Parameter?.Value || '';
  } catch (error) {
    console.error(`Failed to get parameter ${parameterName}:`, error);
    throw error;
  }
}

export async function loadSecrets() {
  if (process.env.NODE_ENV === 'production') {
    try {
      const [databaseUrl, jwtSecret, openaiApiKey] = await Promise.all([
        getSecret('/sprintsync/database-url'),
        getSecret('/sprintsync/jwt-secret'),
        getSecret('/sprintsync/openai-api-key'),
      ]);

      process.env.DATABASE_URL = databaseUrl;
      process.env.JWT_SECRET = jwtSecret;
      process.env.OPENAI_API_KEY = openaiApiKey;

      console.log('✅ Secrets loaded from Parameter Store');
    } catch (error) {
      console.error('❌ Failed to load secrets from Parameter Store:', error);
      throw error;
    }
  }
}
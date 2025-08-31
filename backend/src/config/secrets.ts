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
      console.log('🔄 Loading secrets from Parameter Store...');
      
      const [databaseUrl, jwtSecret, openaiApiKey] = await Promise.all([
        getSecret('/sprintsync/database-url'),
        getSecret('/sprintsync/jwt-secret'),
        getSecret('/sprintsync/openai-api-key'),
      ]);

      // Log the values (safely) to verify they're loaded
      console.log('📊 Secret loading results:');
      console.log('- DATABASE_URL loaded:', !!databaseUrl, 'length:', databaseUrl?.length || 0);
      console.log('- JWT_SECRET loaded:', !!jwtSecret, 'length:', jwtSecret?.length || 0);
      console.log('- OPENAI_API_KEY loaded:', !!openaiApiKey, 'length:', openaiApiKey?.length || 0);

      process.env.DATABASE_URL = databaseUrl;
      process.env.JWT_SECRET = jwtSecret;
      process.env.OPENAI_API_KEY = openaiApiKey;

      // Verify environment variables are set
      console.log('🔍 Environment variables after loading:');
      console.log('- process.env.DATABASE_URL set:', !!process.env.DATABASE_URL);
      console.log('- process.env.JWT_SECRET set:', !!process.env.JWT_SECRET);
      console.log('- process.env.OPENAI_API_KEY set:', !!process.env.OPENAI_API_KEY);

      console.log('✅ Secrets loaded from Parameter Store');
    } catch (error) {
      console.error('❌ Failed to load secrets from Parameter Store:', error);
      throw error;
    }
  }
}
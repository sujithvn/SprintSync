import app from './server';
import { loadSecrets } from './config/secrets';


async function startServer() {
  try {
    // Load secrets in production
    if (process.env.NODE_ENV === 'production') {
      console.log('🔐 Production mode detected - loading secrets...');
      await loadSecrets();
      
      // Verify critical environment variables are set
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL not set after loading secrets');
      }
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not set after loading secrets');
      }
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not set after loading secrets');
      }

      console.log('✅ All required secrets verified');
      
      // Skip database connection test at startup to avoid health check failures
      // Database connection will be tested when first API call is made
      console.log('⏭️  Skipping database connection test at startup for faster health checks');
    }
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on PORT ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      if (process.env.NODE_ENV === 'production') {
        console.log('🔒 Using Parameter Store for secrets');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
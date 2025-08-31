import app from './server';
import { loadSecrets } from './config/secrets';


async function startServer() {
  try {
    // Load secrets in production
    if (process.env.NODE_ENV === 'production') {
      await loadSecrets();
    }
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on PORT ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
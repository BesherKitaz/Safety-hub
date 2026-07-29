
import { createServer } from 'http';
import app from './app';
import { expireDueCertifications } from './controllers/certificationsControllers';





const server = createServer(app);

const PORT = 3001;


server.listen(3001, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
  void expireDueCertifications().catch((error) => {
    console.error('Initial certification expiry check failed:', error);
  });
});

const certificationExpiryTimer = setInterval(() => {
  void expireDueCertifications().catch((error) => {
    console.error('Scheduled certification expiry check failed:', error);
  });
}, 60_000);
certificationExpiryTimer.unref();

import { createServer } from 'http';
import app from './app';
import { expireDueCertifications } from './controllers/certificationsControllers';

const server = createServer(app);

const PORT = Number(process.env.PORT) || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);

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
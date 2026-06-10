
import { createServer } from 'http';
import app from './app';





const server = createServer(app);

const PORT = 3001;


server.listen(3001, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
});

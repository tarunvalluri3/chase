import 'dotenv/config';
import app from './app.js';
import { startNotificationScheduler } from './jobs/notificationScheduler.js';

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Chase server listening on port ${PORT}`);
  startNotificationScheduler();
});

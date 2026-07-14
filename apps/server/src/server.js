import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const port = Number(process.env.API_PORT || 3001);
const app = createApp();

app.listen(port, () => {
  process.stdout.write(`API listening on http://localhost:${port}\n`);
});

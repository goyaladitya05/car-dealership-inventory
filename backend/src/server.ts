import 'dotenv/config';

import app from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});

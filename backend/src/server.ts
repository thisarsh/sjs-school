import 'dotenv/config';
import { validateEnv } from './config/env';

// Fail early if environment is misconfigured
validateEnv();

import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});

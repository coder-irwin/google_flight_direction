import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') }); // Load env variables

import { airportService } from './services/AirportService';
import { routeCombiner } from './services/RouteCombiner';

async function test() {
  await airportService.initialize();
  const res = await routeCombiner.computeRoutes({
    origin: 'New Delhi',
    destination: 'Mumbai',
    modes: ['flight']
  });
  console.log(JSON.stringify(res, null, 2));
}

test().catch(console.error);

import { airportService } from './services/AirportService';

async function test() {
  console.log('Initializing airportService...');
  await airportService.initialize();
  console.log('Successfully loaded airports. Count:', (airportService as any).airports?.length);
  
  console.log('Searching for "del"...');
  const results = airportService.searchAirports('del');
  console.log('Search results:', results);
}

test().catch(err => {
  console.error('Test script encountered an error:', err);
});

import {writeFile} from 'node:fs/promises';

try {
  const response = await fetch('https://6zdivjvubh.execute-api.eu-north-1.amazonaws.com/v1/home', {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const {schemaVersion, trips, position, cabin, device} = await response.json();
  if (schemaVersion !== 1 || !Array.isArray(trips) || !device?.receivedAt ||
      !cabin?.observedAt || !position?.observedAt) {
    throw new Error('Incomplete public snapshot');
  }
  const seed = {schemaVersion, trips, position, cabin, device};
  await writeFile(new URL('../assets/home-seed.js', import.meta.url),
    `window.KiseroHomeSeed = ${JSON.stringify(seed)};\n`);
} catch (error) {
  console.warn(`Keeping the bundled homepage snapshot (${error.message})`);
}

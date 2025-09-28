import { promises as fs } from 'fs';
import { parseScript } from './src/lib/parsers';

const run = async () => {
  const buffer = await fs.readFile('Test Screenplays\\Fractured.pdf');
  const res = await parseScript(buffer, 'Fractured.pdf', 'application/pdf');
  console.log(JSON.stringify({
    success: res.success,
    blocked: res.blocked,
    compliance: res.compliance,
    scenes: res.data?.scenes.length,
    sampleScene: res.data?.scenes[0],
    totalCharacters: res.data?.characters.length,
    intExtCounts: res.meta?.custom?.intExtCounts
  }, null, 2));
};

run().catch((err) => {
  console.error(err);
});


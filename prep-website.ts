
// import qcw module
import {readYML, unIgnoreFiles, makeListings } from "./qc-functions.ts"

// set parameters
const configPath = '_config.yml';
const tempFilesDir = '';
const quartoProfile = Deno.env.get("QUARTO_PROFILE");

// load config and schedule files
const config = await readYML(configPath);
const schedule = await readYML("schedule.yml");

// pre-render steps
if (quartoProfile == "partial-site") {
  await unIgnoreFiles(schedule);
}

await makeListings(schedule, config, tempFilesDir);

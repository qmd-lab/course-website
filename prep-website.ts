
// import qcw module
import {readYML, unIgnoreFiles, makeSchedule, makeListings } from "./qc-functions.ts"

// set parameters
const configPath = '_config.yml';
const tempFilesDir = '';
const quartoProfile = Deno.env.get("QUARTO_PROFILE");
let renderType = "full";
if (quartoProfile == "partial-site") {
  renderType = "partial";
}

// load config
const config = await readYML(configPath);

// pre-render steps
if (quartoProfile == "partial-site") {
  await unIgnoreFiles(schedule);
}

const schedule = await makeSchedule(config, tempFilesDir, renderType);
await makeListings(schedule, config, tempFilesDir);

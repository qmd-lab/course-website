
// Import functions from course website module
import { readYML, propagateDates, setDraftVals, writeSchedule, writeDraftList, writeAutoNav, writeAutoListings, writeThisWeek } from "./cw-module.ts";

// Set parameters
const configPath = '_config.yml';
const tempFilesDir = './cw_files';
const tempFilesDirOffset = "..";

// Run functions
let config = await readYML(configPath);
config = await propagateDates(config);
config = await setDraftVals(config);
//await cleanTempDir(config, tempFilesDir);
await writeSchedule(config, tempFilesDir);
await writeDraftList(config, tempFilesDir);
await writeAutoNav(config, tempFilesDir);
await writeAutoListings(config, tempFilesDir, tempFilesDirOffset);
await writeThisWeek(config, tempFilesDir);


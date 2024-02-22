
// Import functions from course website module
import { readYML, removeTempDir } from "./cw-module.ts";

// Set parameters
const configPath = '_config.yml';
const tempFilesDir = './cw_files';

// Run functions
const config = await readYML(configPath);
await removeTempDir(config, tempFilesDir);


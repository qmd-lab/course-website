
import { parse, stringify } from "https://deno.land/std/encoding/yaml.ts";
import { join, dirname, basename } from "https://deno.land/std/path/mod.ts";

const configPath = '_config.yml'; // Path to your config YAML file
const schedulePath = 'schedule.yml';
const quartoProfile = Deno.env.get("QUARTO_PROFILE");


// ------------------------------------------- //
//  Remove temp files generated during render  //
// ------------------------------------------- //
// This remove all -content.yml files, schedule.yml, and sidebar-nav.yml

async function makeListingsPaths(schedulePath: string) {
    let yamlContent: string;
    
    try {
        yamlContent = await Deno.readTextFile(schedulePath);
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return {};
        } else {
            throw error; // Re-throw the error if it's not a NotFound error
        }
    }
    
    const schedule = parse(yamlContent) as Array<any>;
    const typeLists: Record<string, Array<{ path: string }>> = {};
    const outputPaths: Record<string, string> = {};
    const scheduleDir = dirname(schedulePath);

    for (const week of schedule) {
        for (const day of week.days) {
            if (day.items && Array.isArray(day.items)) {
                for (const item of day.items) {
                    if (item.render) {
                        const type = item.type.toLowerCase();
                        if (!typeLists[type]) {
                            typeLists[type] = [];
                        }
                        typeLists[type].push({ path: item.href });
                    }
                }
            }
        }
    }

    for (const [type, items] of Object.entries(typeLists)) {
        const outputPath = join(scheduleDir, `${type}-contents.yml`);
        outputPaths[type] = outputPath;
    }
    
    return outputPaths;
}

async function removeFiles(listingsOutputPaths: Record<string, string>, schedulePath: string) {
    // Remove files at listingsOutputPaths
    for (const path of Object.values(listingsOutputPaths)) {
        try {
            await Deno.remove(path);
            console.log(`  - Removed file: ${path}`);
        } catch (error) {
            console.error(`  - Error removing file ${path}:`, error.message);
        }
    }

    // Remove the schedule file
    try {
        await Deno.remove(schedulePath);
        console.log(`  - Removed file: ${schedulePath}`);
    } catch (error) {
        console.error(`  - Error removing file ${schedulePath}:`, error.message);
    }

    // Remove the sidebar-nav.yml file
    const sidebarNavPath = join(dirname(schedulePath), 'sidebar-nav.yml');
    try {
        await Deno.remove(sidebarNavPath);
        console.log(`  - Removed file: ${sidebarNavPath}`);
    } catch (error) {
        console.error(`  - Error removing file ${sidebarNavPath}:`, error.message);
    }
}

const listingsOutputPaths = await makeListingsPaths(schedulePath);

console.log("> Cleaning up temporary files ...");
await removeFiles(listingsOutputPaths, schedulePath);







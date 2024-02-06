
import { parse, stringify } from "https://deno.land/std/yaml/mod.ts";
import { join, dirname, basename } from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";

const configPath = '_config.yml';
const tempFilesDir = '';
const renderType = Deno.args[0];

if (renderType !== "partial" && renderType !== "full") {
    console.error("Error: The first argument must be 'partial' or 'full'.");
    Deno.exit(1);
}

console.log("> Beginning ", renderType, " render.")
const config = await readConfig(configPath);
const schedule = await makeSchedule(config, tempFilesDir, renderType);
await makeAdaptiveNav(config, tempFilesDir, schedule);
// await ignoreFiles(schedule)
// await runQuartoRender()


// -------------------------------- //
//     Prepare partial schedule     //
// -------------------------------- //
// Make schedule.yml where each item defaults to render: true
// This is overridden and set to false for items where date > live-as-of date
// That is overridden by a pre-existing render value that exists in _config.yml

async function readConfig(configPath: string): Promise<any> {
    const yamlContent = await Deno.readTextFile(configPath);
    return parse(yamlContent);
}

function convertDateToISOFormat(dateStr: string, timezone: string): string {
    const [month, day, year] = dateStr.split('/').map(num => num.padStart(2, '0'));
    return `20${year}-${month}-${day}T00:00:00${timezone}`;
}

function getRenderVal(item: any, renderType: string, thresholdDate: Date, timezone: string): boolean {
    // default to true
    let renderValue = true;

    if (renderType === "partial") {
      
        const itemDate = new Date(convertDateToISOFormat(item.date, timezone));
        
        // override if using render-as-of
        if (itemDate > thresholdDate) {
            renderValue = false;
        }

        // override default and render-as-of if render value specified in config.yml
        if (item.hasOwnProperty('render')) {
            renderValue = item.render;
        }
    }

    return renderValue;
}

async function makeSchedule(config: any, tempFilesDir: string, renderType: string) {
    console.log("> Making ", renderType, " schedule...")
    
    const renderAsOfStr = config["partial-render"]["render-as-of"];
    const timezone = config["partial-render"]["timezone"];
    const thresholdDate = new Date(convertDateToISOFormat(renderAsOfStr, timezone));

    // propagate dates from day to items
    config.schedule.forEach((week: any) => {
        week.days.forEach((day: any) => {
            day.items.forEach((item: any) => {
                // If the item does not have a date, use the day's date
                if (!item.hasOwnProperty('date')) {
                    item.date = day.date;
                }
            });
        });
    });

    // set render values for every item
    const schedule = config.schedule.map(week => ({
        ...week,
        days: week.days.map(day => ({
            ...day,
            items: day.items ? day.items.map(item => ({
                ...item,
                render: getRenderVal(item, renderType, thresholdDate, timezone)
            })) : []
        }))
    }));

    const scheduleFilePath = join(Deno.cwd(), tempFilesDir, "schedule.yml");
    await Deno.mkdir(tempFilesDir, { recursive: true });
    await Deno.writeTextFile(scheduleFilePath, stringify(schedule));
    
    return schedule;
}


// ---------------------------------------- //
//   Make this-week.yml from schedule.yml   //
// ---------------------------------------- //




// ---------------------------------------- //
//  Make adaptive-nav.yml from schedule.yml  //
// ---------------------------------------- //

async function makeAdaptiveNav(config: any, tempFilesDir: string, schedule: any) {
    
    if (!config.hasOwnProperty('adaptive-nav')) {
        return; 
    }
    
    if (config['adaptive-nav'].hasOwnProperty('sidebar') && 
        config['adaptive-nav'].hasOwnProperty('hybrid-sidebar')) {
      console.error("'adaptive-nav' can have either 'sidebar' or 'hybrid-sidebar', not both.")
      return;
    }
    
    console.log("> Making adaptive nav...")
    let adaptiveNav = { website: {} };
    
    // to do - add navbar and hybrid-navbar
    
    // sidebar nav
    if (config['adaptive-nav'].hasOwnProperty('sidebar')) {
        let sidebarContents = [];
        const sidebarTypes = config['adaptive-nav']['sidebar'];
        
        sidebarTypes.forEach(sidebarType => {
            const type = sidebarType.type;
            let typeHrefs: string[] = [];

            schedule.forEach(week => {
               week.days.forEach(day => {
                    day.items.forEach(item => {
                        if (item.type === type && item.render) {
                            typeHrefs.push(item.href);
                        }
                    });
                });
            });
            
            sidebarContents.push({ section: type, contents: typeHrefs });
        });
    
        adaptiveNav.website.sidebar = { contents: sidebarContents };
    }
    
    // hybrid-sidebar nav
    if (config['adaptive-nav'].hasOwnProperty('hybrid-sidebar')) {
        let sidebarContents = [];
        const sidebarTypes = config['adaptive-nav']['hybrid-sidebar'];
        
        sidebarTypes.forEach(sidebarType => {
            const type = sidebarType.type;
            let typeHrefs: string[] = [];

            schedule.forEach(week => {
               week.days.forEach(day => {
                    day.items.forEach(item => {
                        if (item.type === type && item.render) {
                            typeHrefs.push(item.href);
                        }
                    });
                });
            });
            
            sidebarContents.push({ title: type, contents: typeHrefs });
        });
    
        adaptiveNav.website.sidebar = sidebarContents;
    }
    
    const adaptiveNavPath = join(Deno.cwd(), tempFilesDir, "adaptive-nav.yml");
    await Deno.writeTextFile(adaptiveNavPath, stringify(adaptiveNav));
}


// -------------------------------- //
//  Ignore files based on schedule  //
// -------------------------------- //

async function ignoreFiles(schedule: any) {
    console.log("> Ignoring Files")
    
    for (const week of schedule) {
        for (const day of week.days) {
            if (day.items) {
                for (const item of day.items) {
                    if (item.render === false) {
                        const oldPath = item.href;
                        const dir = dirname(oldPath);
                        const filename = basename(oldPath);
                        const newPath = join(dir, `_${filename}`);

                        try {
                            await Deno.rename(oldPath, newPath);
                            console.log(`  - Renamed: ${oldPath} to ${newPath}`);
                        } catch (error) {
                            console.error(`  - Error renaming ${oldPath} to ${newPath}:`, error.message);
                        }
                    }
                }
            }
        }
    }
}


// -------------------------------- //
//       Render partial site        //
// -------------------------------- //

async function runQuartoRender() {
    console.log("> Rendering documents...")    
    
    const process = Deno.run({
        cmd: ["quarto", "render", "--profile", "partial-site"],
        stdout: "inherit",
        stderr: "inherit",
    });

    const { code } = await process.status();

    if (code !== 0) {
        console.error('Error: Quarto render process exited with code', code);
    }

    process.close();
}



// Import external libraries
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { parse, stringify } from "https://deno.land/std/yaml/mod.ts";
import { join, dirname, basename } from "https://deno.land/std/path/mod.ts";

// ---------------------------- //
//     Function definitions     //
// ---------------------------- //

export async function propagateDates(config: any) {
    // propagate dates from day to items
    config.schedule.forEach((week: any) => {
        week.days.forEach((day: any) => {
            if (day.items && Array.isArray(day.items)) {
                day.items.forEach((item: any) => {
                    // If the item does not have a date, use the day's date
                    if (!item.hasOwnProperty('date')) {
                        item.date = day.date;
                    }
                });
            }
        });
    });
  
  return config;
}

export async function setDraftVals(config: any) {
    const draftAfterStr = config["partial-site"]["draft-after"];
    const timezone = config["partial-site"]["timezone"];
    const thresholdDate = new Date(convertDateToISOFormat(draftAfterStr, timezone));

    // set draft values for every item
    config.schedule = config.schedule.map(week => ({
        ...week,
        days: week.days.map(day => ({
            ...day,
            items: day.items ? day.items.map(item => ({
                ...item,
                draft: getDraftVal(item, thresholdDate, timezone)
            })) : []
        }))
    }));
    
    return config;
}

// ---------------------------- //
//     Prepare schedule.yml     //
// ---------------------------- //
// Make schedule.yml where each item defaults to draft: false
// This is overridden and set to true for items where date > live-as-of date
// That is overridden by a pre-existing draft value that exists in _config.yml
  
export async function writeSchedule(config: any, tempFilesDir: string) {
    console.log("> Making schedule.yml...")
    const scheduleFilePath = join(Deno.cwd(), tempFilesDir, "schedule.yml");
    
    await Deno.mkdir(tempFilesDir, { recursive: true });
    await Deno.writeTextFile(scheduleFilePath, stringify(config.schedule));
}

export async function writeDraftList(config: any, tempFilesDir: string) {
    console.log("> Making draft-list.yml...")
    const draftHrefs: string[] = [];

    // Iterate through the schedule to find items with draft: true
    config.schedule.forEach((week: any) => {
      week.days.forEach((day: any) => {
        day.items?.forEach((item: any) => {
          if (item.draft) {
           draftHrefs.push(item.href);
          }
        });
      });
    });
    
    const draftList = {
      website: {
        drafts: draftHrefs
      }
    };

    const draftListFilePath = join(Deno.cwd(), tempFilesDir, "draft-list.yml");
    await Deno.mkdir(tempFilesDir, { recursive: true });
    await Deno.writeTextFile(draftListFilePath, stringify(draftList));
}

// Utilities
export async function readYML(path: string): Promise<any> {
    const yamlContent = await Deno.readTextFile(path);
    return parse(yamlContent);
}

function convertDateToISOFormat(dateStr: string, timezone: string): string {
    const [month, day, year] = dateStr.split('/').map(num => num.padStart(2, '0'));
    return `20${year}-${month}-${day}T00:00:00${timezone}`;
}

function getDraftVal(item: any, thresholdDate: Date, timezone: string): boolean {
    // default to false
    let draftValue = false;
    const itemDate = new Date(convertDateToISOFormat(item.date, timezone));
        
    // override if using draft-after
    if (itemDate > thresholdDate) {
        draftValue = true;
    }

    // override default and draft-after if draft value specified in config.yml
    if (item.hasOwnProperty('draft')) {
        draftValue = item.draft;
    }

    return draftValue;
}


// ------------------------------------ //
//   Make this-week.yml from schedule   //
// ------------------------------------ //

export async function makeThisWeek(config: any, schedule: any) {
    if (!config['partial-render'].hasOwnProperty('this-week')) {
        return; 
    }
    
    console.log("> Making this-week.yml file.")
  
    const { "render-as-of": renderAsOf, timezone, "this-week": { starts } } = config["partial-render"];
    const [weekStart, weekEnd] = getWeekWindow(renderAsOf, starts, timezone);
    console.log(`  - Searching for the first week with a date between ${weekStart} and ${weekEnd}`);

    let selectedWeek = schedule.find((week: any) => week.days.some((day: any) => {
        const dayDate = new Date(day.date + timezone);
        return dayDate >= weekStart && dayDate < weekEnd;
    }));

    // If no week matches, use an empty array in that case.
    if (!selectedWeek) {
        selectedWeek = [];
        console.log('. - No matching week was found. Using a blank this-week.yml.')
    } else {
        console.log('  - Using week', selectedWeek.week)
    }

    const filePath = join(Deno.cwd(), "this-week.yml");
    await Deno.writeTextFile(filePath, stringify(selectedWeek));
    console.log(`Written to ${filePath}`);
}

// utilities
function getWeekWindow(renderAsOf: string, thisWeekStarts: string, timezone: string): [Date, Date] {
    const renderAsOfDate = new Date(renderAsOf + timezone);
    const [weekday, time] = thisWeekStarts.split(', ');
    const [hours, minutes] = time.split(':').map(Number);

    // Adjust to the most recent such weekday and time
    let weekStart = new Date(renderAsOfDate);
    weekStart.setHours(hours, minutes, 0, 0);

    // Adjust the weekStart to the previous instance of the specified weekday
    while (weekStart.getDay() !== ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(weekday.toLowerCase())) {
        weekStart.setDate(weekStart.getDate() - 1);
    }

    // Ensure weekStart is before or equal to renderAsOfDate
    if (weekStart > renderAsOfDate) {
        weekStart.setDate(weekStart.getDate() - 7);
    }

    // Create weekEnd one week after weekStart
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return [weekStart, weekEnd];
}



// ------------------------------------- //
//  Make auto-nav.yml from schedule  //
// ------------------------------------- //

export async function writeAutoNav(config: any, tempFilesDir: string) {
    
    if (!config.hasOwnProperty('auto-nav')) {
        return; 
    }
    
    if (config['auto-nav'].hasOwnProperty('sidebar') && 
        config['auto-nav'].hasOwnProperty('hybrid-sidebar')) {
      console.error("'auto-nav' can have either 'sidebar' or 'hybrid-sidebar', not both.")
      return;
    }
    
    console.log("> Making auto nav...")
    let autoNav = { website: {} };
    
    // to do - add navbar and hybrid-navbar
    
    // sidebar nav
    if (config['auto-nav'].hasOwnProperty('sidebar')) {
        let sidebarContents = [];
        const sidebarTypes = config['auto-nav']['sidebar'];
        
        sidebarTypes.forEach(sidebarType => {
            const type = sidebarType.type;
            let typeHrefs: string[] = [];

            config.schedule.forEach(week => {
               week.days.forEach(day => {
                    day.items.forEach(item => {
                        if (item.type === type) {
                            typeHrefs.push(item.href);
                        }
                    });
                });
            });
            
            sidebarContents.push({ section: type, contents: typeHrefs });
        });
    
        autoNav.website.sidebar = { contents: sidebarContents };
    }
    
    // hybrid-sidebar nav
    if (config['auto-nav'].hasOwnProperty('hybrid-sidebar')) {
        let sidebarContents = [];
        const sidebarTypes = config['auto-nav']['hybrid-sidebar'];
        
        sidebarTypes.forEach(sidebarType => {
            const type = sidebarType.type;
            let typeHrefs: string[] = [];

            config.schedule.forEach(week => {
               week.days.forEach(day => {
                    day.items.forEach(item => {
                        if (item.type === type) {
                            typeHrefs.push(item.href);
                        }
                    });
                });
            });
            
            sidebarContents.push({ title: type, contents: typeHrefs });
        });
    
        autoNav.website.sidebar = sidebarContents;
    }
    
    const autoNavPath = join(Deno.cwd(), tempFilesDir, "auto-nav.yml");
    await Deno.writeTextFile(autoNavPath, stringify(autoNav));
}


// -------------------------------- //
//           Make Listings          //
// -------------------------------- //

export async function writeAutoListings(config: any, tempFilesDir: string) {
  
    if (!config.hasOwnProperty('auto-listings')) {
        return; 
    }
    
    console.log("> Making contents files for listings...")
    
    const listingTypes = config['auto-listings'].map((listing: any) => listing.type);
    
    // Initialize typeLists with an entry for each listing type
    const typeLists: Record<string, Array<{ path: string }>> = listingTypes.reduce((acc, type) => {
        acc[type] = [];
        return acc;
    }, {});

    for (const week of config.schedule) {
        for (const day of week.days) {
            if (day.items && Array.isArray(day.items)) {
                for (const item of day.items) {
                    if (listingTypes.includes(item.type)) {
                        typeLists[item.type].push({ path: item.href });
                    }
                }
            }
        }
    }

    for (const [type, items] of Object.entries(typeLists)) {
        const outputPath = join(tempFilesDir, `${type}-contents.yml`);
        await Deno.writeTextFile(outputPath, stringify(items));
        console.log(` - Created file: ${outputPath}`); 
    }
}


// ------------------------------------------- //
//  Remove temp files generated during render  //
// ------------------------------------------- //
// This removes all -contents.yml files, schedule.yml, and auto-nav.yml
// Turned off if debug: true exists in config file.

export async function removeTempDir(config: any, tempFilesDir: string) {
  
  if (!config.debug) {
    try {
      await Deno.remove(tempFilesDir, { recursive: true });
      console.log(`> Temporary directory '${tempFilesDir}' has been removed.`);
    } catch (error) {
      console.error(`> Error removing temporary directory '${tempFilesDir}': ${error}`);
    }
  } else {
    console.log(`> Debug mode is on. Temporary files can be viewed in '${tempFilesDir}'.`)
  }
}

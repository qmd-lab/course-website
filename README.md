# Quarto Course Website Extension

A Quarto website with additional functionality designed for course websites that supports:

1. A schedule of topics and materials.
2. Scheduled publishing of materials.
3. A "This Week" box that excerpts the current week from the schedule.
4. Adaptive navigation

## Usage

To add the extension to an existing website, run the following command in the project directory.

```bash
quarto add qmd-lab/course-website
```

This will add a `_extensions/qmd-lab/course-website` subdirectory with the files needed to enable this functionality. Once you've added this extension, you change the project type of in `_quarto.yml` to read:

```yaml
project:
  type: course-website
```

If you do you have an existing website, you can use the template website with the extension enabled by running the following command:

```bash
quarto use template qmd-lab/course-website
```

## Features

### 1. Schedule of Topics

To set up a week-by-week schedule of topics, add them to the `_config.yml` file under the `schedule` key. Here is a glance at one week of a schedule.

```yaml
schedule:
- week: 1
  days:
    - topic: "Random Variables"
      display-date: Jan 16
      date: 1/16/24
      unit: Probability
      items:
        - type: Notes
          href: 1-probability/1-random-variables/notes.qmd
        - type: Slides
          href: 1-probability/1-random-variables/slides.qmd
          
    - topic: "The Binomial Distribution"
      display-date: Jan 18
      date: 1/18/24
      items:
        - type: Notes
          href: 1-probability/2-binomial/notes.qmd
        - type: Slides
          href: 1-probability/2-binomial/slides.qmd
```

Nested under `schedule` is a list of `week`s, each of which can have a list of `days`, each of which can have a list of `items` (slides, html pages, pdfs, etc) that are used that day. This data gets read into an ejs template that can be placed as a listing anywhere on the course website.

### 2. Scheduled Publishing

#### Manually toggle each document

Any document that you wish to not appear on the website can be toggled off by adding `draft: true` to that item in the schedule. That is done below to `1-probability/1-random-variables/slides.qmd`.

```yaml
schedule:
- week: 1
  days:
    - topic: "Random Variables"
      display-date: Jan 16
      date: 1/16/24
      unit: Probability
      items:
        - type: Notes
          href: 1-probability/1-random-variables/notes.qmd
        - type: Slides
          href: 1-probability/1-random-variables/slides.qmd
          draft: true
```

This removes the document and prevents it from appearing in the schedule, navigation, listings, and search. Any item without `draft: true` defaults to having `draft: false`.

#### Specify a draft-after date

You can make rendering date-dependent by adding the following to your `_config.yml`.

```yaml
scheduled-drafts:
  draft-after: "1/20/24"
  timezone: "-07:00" # GMT offset in +/-hh:mm does not adjust for daylight savings
```

This will add `draft: true` to all items with a `date` that is after the `draft-after` date and `draft: false` to all items with dates that are before the `render-as-of` date. The `date` can either be added to the individual item or to the `date` of the day that item is under.

### 3. This Week

If you choose to use `scheduled-drafts`, you can pull out the current week from the schedule to place prominently on the course homepage. Add the following to `_config.yml`:

```bash
scheduled-drafts:
  draft-after: "1/20/24"
  timezone: "-07:00" # GMT offset in +/-hh:mm does not adjust for daylight savings
  this-week:
    starts: "friday, 17:00"
```

This will pull out the first week containing a day date that follows Friday at 5 pm. The syntax is `dayofweek, hh:mm` where `hh:mm` is in 24 hr time. Like the schedule, `this-week` can then be placed as a listing anywhere on your website.

### 4. Adaptive Navigation

The use of `scheduled-drafts` means that your course material will be evolving slowly throughout the semester. Site navigation can be set to automatically update alongside your course material.

To create listing contents files that pull from all `items` in `schedule` with a matching `type`, use:

```yaml
auto-listings:
    - type: Slides
    - type: PS
```

This creates `cw_files/Slides-contents.yml` and `cw_files/PS-contents.yml`. That can then be referenced elsewhere on the site.

You can use a similar approach to populate the items in sidebar navigation.

```yaml
auto-nav:
  sidebar:
    - type: Notes
```

This creates a `cw_files/auto-nav.yml` file that is automatically appended to your `_quarto.yml` file through the project extension.
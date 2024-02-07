# Quarto Class Website

A Quarto website with additional functionality designed for course websites that supports:

1. A schedule of topics and materials.
2. Partial rendering of materials.
3. A "This Week" box that excerpts the current week from the schedule.
4. Adaptive navigation

## Usage

To do a partial render of the website, run the following command in the project directory.

```bash
quarto run qc-render.ts partial-site
```

The partially rendered website can then be found in `_partial-site`. You can modify which documents are rendered for the website (and which show up in the schedule) by changing the `render` field of each item in the `_config.yml` file.

To do a full render of the website (while taking advantage of the adaptive navigation), instead run:

```bash
quarto run qc-render.ts full-site
```

This will render every qmd found in the project directory and fully populate the schedule. The resulting website can be found in `_full-site`.

Note that if you run:
 
```bash
quarto render
```
 
you will still get a fully rendered website, however it will not automatically create the sidebar navigation.

## Features

### 2. Partial Rendering

There are two ways to render a subset of your course materials: manually toggle whether or not an item will be rendered or specify a date at which only previously dated documents will be published.

Both of these changes are made to the `_config.yml` file.

#### Manually toggle each document

Any document that you wish not to render (and correspondingly not show in the schedule) you can toggle off by adding `render: false` to that item in the schedule. That is done below to `1-probability/1-random-variables/slides.qmd`.

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
          render: false
```

Any item without `render: false` specified defaults to having `render: true`.

#### Specify a render-as-of date

You can make rendering date-dependent by adding the following to your `_config.yml`.

```yaml
partial-render:
  render-as-of: "1/20/24"
  timezone: "-07:00" # GMT offset in +/-hh:mm (does not adjust for daylight savings)
```

This will add `render: false` to all items with a `date` that is after the `render-as-of` date and `render: true` to all items with dates that are before the `render-as-of` date.

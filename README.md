# Quarto Class Website

A Quarto website with additional functionality designed for course websites that supports:

1. A schedule of topics and materials.
2. Partial rendering of materials.
3. Adaptive navigation.

## Usage

To do a partial render of the website, run the following command in the project directory.

```bash
quarto run partial-render.ts
```

The partially rendered website can then be found in `_partial-site`. You can modify which documents are rendered for the website (and which show up in the schedule) by changing the `render` field of each item in the "_config.yml" file.

To do a full render of the website (while taking advantage of the adaptive navigation), instead run:

```bash
quarto run full-render.ts
```

This will render every qmd found in the project directory and fully populate the schedule. The resulting website can be found in "_full-site".

Note that if you run:
 
```bash
quarto render
```
 
you will still get a fully rendered website, however it will not automatically create the sidebar navigation.
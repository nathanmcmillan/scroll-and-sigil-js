# Scroll & Sigil

A 3D adventure game with a strong focus on modding and user crafted content.

[Visit the website here.](https://scrollandsigil.com)

## Goals

- Provide a customizable engine
- Easy map design
- Music and sound effect creation
- Extensive modding support
- Scripting for extending entity actions

## Development

### High Priority

- Single file format for entire data pack
- Tiles as sprites specified in regular image. Auto-generate OpenGL single image for repeating
- Sector and triangle map generator is broken
- When saving/exporting a map. Need to include all entity information. When exporting entire tape, can be separate

### Low Priority

- Forward rendered light shader
- Forward rendered built-in palette mapper. Reduce incoming final colors to 16 color map
- Equiptable Items
- Cinema camera (floating, de-attached from a target)
- Experience Points
- Triggers
  - Events
    - On enter sector
    - On leave sector
    - On enter line
    - On leave line
    - On entity death
    - On interact with line
    - On interact with entity
  - Conditions
    - Health less than
    - Entity group is
  - Actions
    - End map
    - Go to new map
    - Kill entity
    - Spawn entity
    - Wake up entity
    - Move towards point
    - Follow target
    - Quest Complete
    - Sound effect
    - Set target to
- NPC Interactions
  - Buying
  - Selling
  - Talking
  - Quests
- Consumable Items
- Time based effects
  - Extra strength
  - Poisoned
- First person camera support
- Top down camera support
- Terrain slopes
- Doors and keys
- Campaign / Overworld designer
  - Persistent & temporary variables settable per map

## User Interface

- Health as hearts bottom left. Only show when in combat
- Stamina as circles above health hears
- Do not show any UI unless holding down a button or during combat
- Cutscenes with NPC
  - Cinema black bars on top and bottom. Show text on bottom black bar
  - Show response options to the lower right of NPC
- Talking and buying from NPC
  - Move character closer to NPC if needed
  - Show options on left. Show merchant in world (no special screen) on the right.
- Boss battles
  - Boss health top middle of screen
- Hero menu
  - In world (no special screen)
  - Inventory
    - Head piece
    - Outfit
    - Weapon
    - Side weapon
    - Scrolls - Charms - Totems
    - Show hero with selected outfit on the right
  - Options
    - Adjust audio and video
    - Exit game to main menu
- World map

## Bundling Sprite Sheets

`$ bundle.sh`

Collects sprite images and generates sprite sheets.

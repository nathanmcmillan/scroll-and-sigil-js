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

### Priority

- Add arguments for flags e.g. water 2 (for +2 height) lava 2 3 (for +2 height and 3 damage per ticks)
- trigger condition require-item arg:name-of-item
- trigger action floor 10 (raise floor +10)
- trigger action ceiling 10 (raise ceiling +10)
- Add random name generator for unique monsters (and show name somewhere in UI) -> boss flag on monster? display health bar and name center top of screen
- Top down view, show red for monsters, yellow for doodads, green for friendly, etc
- Single file format for entire data pack
- Snap/attach things to walls (like torches)
- Need a global ticker for animated tiles and doodads

### Bugs

- Paint: Undo redo is broken for edge cases

### Ideas

- Add replay files (record user input deltas per tick)
- Paint
  - Fullscreen mode for sprite sheet
  - Smart undo redo history saving. Only save region that was changed
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
    - Particle effect
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

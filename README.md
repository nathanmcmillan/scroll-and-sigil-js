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

- Trigger action floor 10 (raise floor +10)
- Trigger action ceiling 10 (raise ceiling +10)
- Top down view, show red for monsters, yellow for doodads, green for friendly, etc
- Single file format for entire data pack
- Snap/attach things to walls (like torches)
- Need a global ticker for animated tiles and doodads
- Synth sound visualizer

### Bugs

- Paint: Undo redo is broken for edge cases

### Ideas

- SFX
  - Every sound effect needs to be chainable e.g. (noise for 1s + sine for 1s + etc)
- Paint
  - Fullscreen mode for sprite sheet
  - Smart undo redo history saving. Only save region that was changed
- Add replay files (record user input deltas per tick)
- Equiptable Items
- Cinema camera (floating, de-attached from a target)
- Experience Points
- Triggers
  - Events
    - On enter line
    - On leave line
  - Actions
    - End map
    - Wake up entity
    - Move towards point
    - Follow target
    - Quest Complete
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

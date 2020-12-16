# Scroll & Sigil

A 3D adventure game with a strong focus on modding and user crafted content.

[Visit the website here.](https://scrollandsigil.com)

# Goals

- Provide a customizable engine
- Easy map design
- Music and sound effect creation
- Extensive modding support
- Scripting for extending entity actions

# Development

###

- Make home menu a 3D scene using game renderer

### High Priority

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
    - On interect with line
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

### Low Priority

- Consumable Items
- Time based effects
  - Extra strength
  - Poisoned
- First person camera support
- Top down camera support
- Terrain slopes
- Doors and keys

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

# Notes

- Do not depend on camera for entity interaction.
  Use the player's entity rotation and proximity instead.
  Otherwise it's hard to be consistent across first person, third person, top down views

# Bundling Sprite Sheets

`$ bundle.sh`

Collects sprite images and generates sprite sheets.

# Packages

Defines the images, sound files, and entity descriptions.

### Resource Pack

- Sprite sheets
- Music
- Sound effects

### Entity Pack

- Depends on resource pack
- Defines things

### Map Pack

- Depends on resource and entity packs
- List of connected maps

# Map Editor

A map design tool with a top down view for sector editing and a 3D view paint mode.

### Vertex Mode

- Top down view
- Drag and drop existing vertices

### Line Mode

- Top down view
- Connect vectors to create new lines

### Sector Mode

- Top down view

### Paint Mode

- Fly in 3D view
- Edit textures where camera is pointed
- Offset texture coordinates

### Thing Mode

- Fly in 3D view
- Place new things where camera is pointed

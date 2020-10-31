# Scroll & Sigil

[website](https://scrollandsigil.com)

# Goals

- Provide a customizable engine
- Easy map design
- Music and sound effect creation
- Extensive modding support
- Scripting for extending entity actions

# Development

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
    - Quest Complete
    - Sound effect
    - Set target to
- Experience Points
- RPG Elements
  - Stamina
  - Energy:
  - Strength
  - Dexterity
  - Vitality
  - Intelligence
- Equiptable Items
- Consumable Items
- Time based effects
  - Extra strength
  - Poisoned
- NPC Interactions
  - Buying
  - Selling
  - Talking
  - Quests
- Doors
  - Keys

# Notes

- Do not depend on camera for entity interaction.  
  Use the player's entity rotation and proximity instead.  
  Otherwise it's hard to be consistent across first person, third person, top down views

# Bundling Sprite Sheets

- `$ bundle.sh`
- Collects sprite images and generates sprite sheets

# Packages

## Resource Pack

- Sprite sheets
- Music
- Sound effects

## Entity Pack

- Depends on resource pack
- Defines things

## Map Pack

- Depends on resource and entity packs
- List of connected maps

# Map Editor

## Modes

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

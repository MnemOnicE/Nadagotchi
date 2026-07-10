# Roadmap

## Phase 1: Core Foundation (Completed)
- [x] Basic Pet Stats (Hunger, Energy, Happiness)
- [x] Housing System (Decoration, Room Unlocking)
- [x] Career System (Minigames, Progression)
- [x] Genetics System (Breeding, Inheritance)

## Phase 2: Dynamic World (Completed)
- [x] **Living Garden:** Debris spawning and cleaning mechanics.
- [x] **Visual Weather:** Particle effects for immersion.
- [x] **Physical NPCs:** Interactive Merchant in the world.
- [x] Advanced Weather Logic: Weather affecting foraging, expeditions, and stat decay.
- [x] Expanded NPC Interactions: Friendship quests, gifting system with energy costs.

## Phase 2.5: Procedural Pet System (Completed)
- [x] Body part system: Head, Torso, Hands, Feet
- [x] Color and markings customization (archetype-based palettes)
- [x] Procedural generation from genetics (seeded RNG)
- [x] Visual rendering in Phaser (container-based sprite system)

## Phase 2.6: Extra Programmatic Art (Completed)
- [x] Pet body parts: Head (round, square, pointy, heart), Torso (small, medium, large, stocky), Hands (small, medium, large, paw), Feet (small, medium, large, hooved)
- [x] Color systems: Primary, secondary, accent colors based on archetype
- [x] Markings: Stripes, spots, swirls, patches, gradient, none
- [x] Deterministic generation from DNA for consistent appearance
- [x] Feature flag system for enabling/disabling procedural pets

## Phase 3: Social & Meta (Planned)
- [ ] "Showcase" System (Sharing Pet Passports)
- [ ] Community Challenges (Leaderboards)
- [ ] Mystery Egg Exchange (Async Social)

## Phase 4: Polish & Expansion (In Progress)
- [x] Mobile App Packaging (Capacitor/Cordova) - Already configured in package.json
- [x] Pet Animation System - Blinking, mood-based animations (happy, sad, angry, sleep, excited, eat)
  - [x] Blinking eyes every 4 seconds
  - [x] Floating idle animation
  - [x] Tail wagging (normal and happy)
  - [x] Bouncing for happy/excited
  - [x] Drooping head/ears for sad
  - [x] Shaking for angry
  - [x] Breathing for sleep
  - [x] Chewing for eat
  - [x] Sparkle effects for happy
- [ ] Sound Effects & Music Overhaul
  - [ ] Background music for different scenes
  - [ ] Sound effects for actions (feeding, playing, etc.)
  - [ ] Pet voice/sounds based on mood
  - [ ] Weather ambient sounds
- [ ] Accessibility Features
  - [ ] Screen reader support
  - [ ] High contrast mode
  - [ ] Colorblind-friendly palettes
  - [ ] Keyboard-only navigation
  - [ ] Reduced motion option

## Phase 2.7: Enhanced Procedural Art (Completed)
- [x] Additional head types: oval, diamond (total: 6)
- [x] Additional torso types: slim, plump (total: 6)
- [x] Additional hand types: claw, hoof (total: 6)
- [x] Additional feet types: pawed, clawed (total: 6)
- [x] New body parts: Ears (7 types), Tail (7 types), Accessory (8 types)
- [x] Accessory types: hat, glasses, scarf, bowtie, crown, bandana, wings, none
- [x] Archetype-based preferences for all body parts
- [x] Tail animations (wagging, happy wag)
- [x] Ear rendering with style variations

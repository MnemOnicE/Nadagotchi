# Nadagotchi

A Tamagotchi-like game with a deep, emergent personality system.

---

### ✨ Interactive Design Explorer ✨

For a visual and interactive breakdown of the game's core concepts, systems, and design pillars, please see our interactive explorer page. This page details the mood, legacy, career, and other planned systems.

**[Click here to open the Interactive Design Explorer](./psagame.html)**

---

## Game Prototype

This repository also contains the active Phaser.js prototype of the game.

# Tamagotchi-like Game: Detailed System Design

## I. Mood-Based Interaction & Dynamic Personality System

**Goal:** To create a nuanced and reactive virtual pet that responds uniquely based on its core archetype and current emotional state, driving diverse player interactions.

### Archetypal Personalities (Examples & Core Needs):

*   **The Adventurer:** Craves exploration, novelty, challenges. Becomes bored with routine.
    *   **Happy Triggers:** Discovering new areas, mastering new mini-games.
    *   **Sad Triggers:** Stuck in a rut, repetitive tasks.
    *   **Angry Triggers:** Exploration attempts blocked, repeated failures.
*   **The Nurturer:** Enjoys caring for others, building relationships, fostering growth.
    *   **Happy Triggers:** Strong relationships, virtual pets/characters well-cared for.
    *   **Sad Triggers:** Perceived neglect (even accidental), weakening social bonds.
    *   **Angry Triggers:** Perceived injustice, mistreatment of a 'friend'.
*   **The Mischievous:** Likes to bend rules, cause harmless trouble, seeks playful chaos.
    *   **Happy Triggers:** Successfully pulling off a prank, surprising the player.
    *   **Sad Triggers:** Strictly disciplined, unable to express playful side.
    *   **Angry Triggers:** Thwarted by rigid rules/authority.
*   **The Intellectual:** Driven by curiosity, problem-solving, learning.
    *   **Happy Triggers:** Gaining new knowledge, solving puzzles.
    *   **Sad Triggers:** Simple, repetitive tasks, no new stimuli.
    *   **Angry Triggers:** Faced with illogical situations, blatant misinformation.
*   **The Recluse:** Prefers solitude, quiet activities, needs personal space.
    *   **Happy Triggers:** Left alone for reasonable periods, engaging in quiet activities.
    *   **Sad Triggers:** Constantly pestered, forced into crowded situations.
    *   **Angry Triggers:** Repeated violation of personal boundaries.

### Mood Meter & Expression:

*   **Visuals:** Implement visible "mood meters" (e.g., a simple face icon, color overlay on the Tamagotchi, animated expressions) that shift based on current mood (happy, sad, angry). These should evoke the Pokémon Emerald/Sapphire aesthetic with clear, pixel-art indicators.
*   **Archetype Influence:** The underlying "archetype" influences mood intensity, duration, and expression (e.g., an "Angry Adventurer" might stomp/try to break something with energetic pixel animations; an "Angry Nurturer" might sulk/refuse interaction with more subdued, withdrawn animations).

### Dynamic Interaction Triggers:

*   **Dialogue Options:** Player dialogue choices change based on current mood and underlying personality. UI elements for dialogue should match the Emerald/Sapphire text box style.
    *   **Example:** If a "Sad Nurturer" is detected, offer "Offer comfort," "Ask what's wrong," "Suggest a quiet activity."
    *   **Example:** If a "Happy Mischievous" Tamagotchi is present, offer "Suggest a harmless prank," "Play a trick," "Encourage playful antics."
*   **Proactive Behaviors:** Tamagotchi "independent behavior" tied to current mood and personality, shown through distinct sprite animations.
    *   **Adventurer (Happy):** Might spontaneously "explore" a new room animation (pixelated magnifying glass, excited hops), nudge player towards a new mini-game icon.
    *   **Nurturer (Sad):** Might retreat to a corner (pixelated droopy ears/posture), refuse food (shakes head animation), make sad pixelated sound effect bubbles.
    *   **Mischievous (Angry):** Might vandalize a virtual item (pixelated scribbles on an object), ignore commands (turns back to player sprite), try to run away (scurrying animation, temporarily off-screen).
*   **Mini-Game Availability:** Some mini-games only accessible or highly appealing in a specific mood/personality state. Icons for mini-games could glow or animate when particularly relevant.
    *   **Example:** An "Intellectual" might unlock a "Logic Puzzle" mini-game (icon: a pixelated brain or cogwheel) when happy.
    *   **Example:** A "Recluse" might only engage in a "Zen Garden" mini-game (icon: a pixelated bonsai or raked sand) when needing quiet time.

### Personality Evolution:

*   **Player Actions:** Consistently engaging with a Tamagotchi's archetype strengthens it. Introducing activities contrary to its archetype could slowly shift its personality or create a hybrid. This could be visualized with a subtle shift in the Tamagotchi's aura color or a small accessory changing.
*   **Internal Tracking:** Managed via hidden "personality points" for each archetype, accumulating based on player choices and Tamagotchi experiences. The highest points determine dominance, but other archetypes can still influence behavior. This could be represented in a status screen similar to Pokémon stat pages.

## II. Generational Legacy & Breeding System (with a Twist)

**Goal:** Provide long-term engagement and replayability by allowing players to cultivate a lineage of Tamagotchi, passing down unique traits and creating a sense of lasting impact.

### Aesthetic Integration:

*   **Breeding Den:** A serene, overgrown pixel-art "sanctuary" reminiscent of the Pokémon Day Care or specific Emerald/Sapphire caves/forests (e.g., Petalburg Woods, Verdanturf Town). Features unique environmental animations like sparkling motes of light, rustling leaves, or gently flowing water, all in the distinct Emerald/Sapphire pixel style.
*   **Egg Designs:** Offspring begin as vibrant pixel-art eggs with subtle patterns or color schemes hinting at their dominant inherited personality (e.g., leaf-patterned for Nurturer, jagged/fiery for Adventurer, swirling patterns for Mischievous, geometric for Intellectual, calm/muted for Recluse). Egg sprites should be distinct and appealing.
*   **Visual Forms:** Optional subtle visual "forms" or adornments for Tamagotchi based on their dominant inherited archetype (e.g., an Adventurer might have a tiny bandana or compass motif; a Nurturer might have a flower or heart motif). These should be small, non-intrusive pixel details on their sprite.

### Mechanics:

*   **Maturity & "Legacy Readiness":** Tamagotchi reach a "Legacy-Ready" elder phase (visualized by subtle sprite changes like slightly grayer pixels, a wise expression, or a distinguished accessory). Players choose when to initiate the generational process (e.g., after achievements, max personality growth, or readiness for a new companion).
*   **"Personality Genes" (Inheritance):** Internal, hidden "Personality Points" for each archetype are inherited. Dominant and a fraction of secondary archetype points from the parent(s) influence the offspring's starting point distribution.
*   **Hybridization:** High points in multiple archetypes in a parent increase the chance of hybrid offspring or a predisposition towards multiple types. This could result in unique egg patterns or initial behaviors.
*   **"Mood Sensitivity" Trait:** An inherited trait (1-10 scale, perhaps visualized as a small colored bar on a status screen) dictating mood shift speed and intensity. High sensitivity = dynamic; low sensitivity = stable. Inherited probabilistically with slight mutation.
*   **"Environmental Influence" (Nurture over Nature):** Players can "prepare" the breeding environment (specific pixel-art items placed in the Breeding Den, parent mini-game focus before breeding) to subtly influence the offspring's starting traits (e.g., Adventurer parent exploring yields offspring with higher Adventurer 'gene'). This could involve dragging and dropping thematic items into the Breeding Den scene.
*   **"Legacy Traits" (Rare Inherited Abilities/Buffs):** Unlockable, rare traits (e.g., "Swift Learner" - faster skill gain, "Zen Focus" - better performance in puzzle mini-games, "Creative Spark" - unlocks unique crafting recipes) with powerful buffs or unique abilities, passed down with low probability. Visually represented by small, distinct pixel-art badges or a faint aura on the Tamagotchi's profile or sprite.
*   **"Retirement" of Elders:** Legacy-Ready Tamagotchi "retire" to a special area (e.g., a "Hall of Ancestors" with pixel-art portraits or statues), become NPCs offering advice based on their personality (dialogue bubbles with wisdom), or contribute to a player's "Tamagotchi Lore Library," preserving emotional connection.

### Canvas Integration:

*   Lineage tree visual (like a family tree with Tamagotchi sprites and egg icons).
*   Trait cards (drag-and-drop visual representations of Personality Genes and Legacy Traits).
*   Environmental influence zones (visual areas in the Breeding Den where items can be placed).
*   Evolutionary line mock-ups (showing potential visual changes or adornments based on archetype).

## III. Career/Life Path System & Skill Development

**Goal:** Provide clear progression, specialization, and unlockable content, allowing players to guide their Tamagotchi into unique roles within its world.

### Aesthetic Integration:

*   **Job Centers/Guilds:** Pixel-art "Guild Halls," "Research Institutes," "Artisan Workshops," or "Explorer's Outposts" on the world map, visually hinting at career specializations (e.g., a building with a large telescope for an Astronomer path, a forge for a Crafter path). These locations should have a distinct Emerald/Sapphire style architecture.
*   **Skill Badges/Ribbons:** Pixel-art badges/ribbons (like Pokémon Gym Badges or Contest Ribbons) displayed on the Tamagotchi's profile or sprite as skills are mastered. Each badge should have a unique, thematic design.
*   **Unique Animations/Props:** Tamagotchi gain career-specific animations or hold tiny pixel-art props (e.g., a tiny wrench for Inventor, a map scroll for Explorer, a miniature musical instrument for a Bard).

### Mechanics:

*   **Skill Categories:**
    *   Core universal skills (e.g., "Communication" - affects dialogue success, "Resilience" - faster mood recovery, "Learning Aptitude" - faster skill gain).
    *   Archetype-specific skills (e.g., Adventurer: Navigation, Agility; Intellectual: Logic, Research; Nurturer: Empathy, First Aid; Mischievous: Stealth, Deception; Recluse: Focus, Crafting).
*   **Skill Acquisition:** Gained through:
    *   Mini-game mastery (specific mini-games grant specific skill points).
    *   Aligning dialogue choices (choosing a logical answer boosts "Logic").
    *   Using specific training items (e.g., a "Puzzle Box" item trains "Logic").
    *   Engaging with NPC "mentors" via specialized "training mini-games" found in Guilds.
*   **Life Paths / Career Unlocks:** Reaching skill thresholds and having a dominant personality unlocks "Career Paths."
    *   **Example Progression:** Adventurer with high "Navigation" + high "Agility" -> Path: Scout. Intellectual with high "Engineering" + "Deduction" -> Path: Innovator. Nurturer with "Empathy" + "Botany" -> Path: Healer/Gardener.
    *   Paths are non-linear; multi-classing or hybrid careers (e.g., "Archaeologist" = Adventurer + Intellectual skills) are possible.
*   **"Work" Opportunities & Rewards:** Career paths unlock "Job Board" quests or missions (presented in a Pokémon-style quest log).
    *   **Examples:** "Mapping the Whispering Woods" for a Scout, "Design a New Watering System" for an Innovator, "Comfort the Lost Sprite" for a Healer.
    *   **Rewards:** Unique items (tools, decor), cosmetics (career-themed outfits), new mini-games, or in-game currency.
*   **Social Standing & Reputation:** Success in careers builds "Reputation" (visualized by a star system or title on their profile), leading to prestigious job offers, unique NPC interactions, or access to exclusive areas/shops.

### Canvas Integration:

*   Skill web/tree diagrams (showing interconnected skills and their progression).
*   Mini-game "tags" (visual tags linking mini-games to the skills they develop).
*   Career progression flowcharts (visualizing how skills lead to different careers).
*   Item-to-skill links (showing which items help train which skills).

## IV. Dynamic World Events & Environmental Interaction

**Goal:** Create a living, breathing game world that feels responsive and offers spontaneous gameplay opportunities, affecting Tamagotchi mood and behavior.

### Aesthetic Integration:

*   **Weather Effects:** Seamless pixel-art weather overlays (rain, snow, sun glare, fog, falling leaves) affecting the Tamagotchi's home screen and any outdoor mini-map visuals, mirroring the style seen in Pokémon Emerald/Sapphire (e.g., the ash fall around Fallarbor Town, rain on Route 119).
*   **Day/Night Cycle:** Soft pixel-art lighting changes (warm hues for dawn/dusk, cool blues for night, bright for midday) affecting ambient sounds and Tamagotchi activities. Windows in the Tamagotchi's room could show the changing sky.
*   **Interactive "Tiles":** Small, clickable pixel-art objects or areas within the Tamagotchi's environment (home or mini-maps) that react to the Tamagotchi or player input with a small animation or sound effect (e.g., a rustling bush, a sparkling patch of ground).
*   **Event Backgrounds/Music:** Special pixel-art backgrounds and unique chiptune music tracks for festivals and significant events, creating a distinct atmosphere.

### Mechanics:

*   **Weather System:** Real-time or accelerated in-game clock integration.
    *   **Weather Types:** Sunny, Rainy (light/heavy), Cloudy, Foggy, Windy, rare Aurora Borealis or Meteor Shower.
    *   **Effects:** Immediate mood modifiers (e.g., Rain makes Nurturer cozy/happy, Adventurer restless/sad). Some mini-games may be weather-dependent (e.g., "Stargazing" only on clear nights). Specific items might be found only during certain weather.
*   **Day/Night Cycle:** Shifts Tamagotchi activities and energy levels.
    *   **Activities:** Sleep schedules, quiet activities at night (e.g., reading for Intellectuals), exploration or social mini-games more common during the day.
    *   **Mood/Energy:** Energy naturally depletes and replenishes. Some Tamagotchi might be nocturnal or early risers based on personality.
    *   **Encounters:** Unique nocturnal creatures or events in outdoor exploration areas.
*   **Interactive Environment Elements:**
    *   **Furniture & Objects:** Player-furnished spaces with interactive pixel-art furniture.
        *   **Examples:** Bookshelf (Intellectual can "read" for a small skill gain/mood boost), Potted Plant (Nurturer can "water" for happiness), Toy Chest (Mischievous can "rummage" for a random playful item), Window (Recluse can "gaze out" for calm).
        *   Interactions can trigger small skill gains, mood changes, or even unlock mini-games or crafting recipes.
    *   **Outdoor Exploration (Mini-Maps):** Unlockable pixel-art areas (e.g., "Whispering Woods," "Sunbeam Beach," "Crystal Cave") accessible via a world map icon.
        *   Contain unique interactive elements, collectible resources (for crafting), hidden items, and area-specific mini-games.
        *   Access or success within these areas can be tied to Tamagotchi's "Explorer" skills (Navigation, Foraging) or specific career paths.
*   **Seasonal Festivals & Dynamic Events:** In-game calendar tracks seasons (Spring, Summer, Autumn, Winter) and special festival days.
    *   **Festivals:** Themed events (e.g., "Spring Bloom Festival," "Summer Sandcastle Contest," "Autumn Harvest Fair," "Winter Light Parade").
    *   **Content:** Unique themed mini-games, limited-time rewards (cosmetics, rare food, decor), special NPC visitors, and significant mood boosts.
    *   **Random Events:** Spontaneous occurrences like "Traveling Merchant Arrives" (with rare items), "Stray Critter Needs Help" (Nurturer opportunity), "Mystery Box Appears," or "Sudden Inspiration" (boost for Intellectual/Creative types).

### Canvas Integration:

*   Environment design layers (for home customization with draggable furniture).
*   Weather/time overlays (visual toggles to show different states).
*   Event timelines (visual calendar showing upcoming festivals).
*   "Interaction hotspot" indicators on environment mock-ups.
*   Mini-map layouts with icons for resources and interactive elements.

## V. Meta-Game & Community/Sharing Features

**Goal:** Enhance single-player depth with personalized narrative, a sense of lasting legacy, and optional, low-pressure sharing without direct multiplayer.

### Aesthetic Integration:

*   **Journal Design:** Looks like a classic Pokémon trainer's Pokedex or a field researcher's notebook, with a pixel-art cover, tabbed sections, and a handwritten-style font for entries. Small, charming pixel-art illustrations (doodles) could accompany entries.
*   **Showcase "Statues/Trophies":** In-game "Hall of Fame," "Trophy Room," or "Memory Garden" where pixel-art representations (small statues, framed pictures, or commemorative plaques) of past generations or significant achievements are displayed.
*   **Recipe Book Visuals:** A pixel-art "Cookbook," "Crafting Manual," or "Inventor's Blueprint Book" with charming, simple illustrations for each recipe or item. The style should be reminiscent of item descriptions in Pokémon.

### Mechanics:

*   **"Tamagotchi Journal" (Automated Lore & Progress):**
    *   AI-generated (or template-based) journal entries chronicle significant events: discoveries (new area, rare item), major mood shifts, personality milestones, career achievements, mini-game high scores, items invented/crafted.
    *   Entries could include small auto-generated pixel-art "snapshots" or icons representing the event.
    *   Player can browse this journal to relive their Tamagotchi's story, creating a personalized narrative.
*   **"Showcase System" (Optional Sharing & Challenges):**
    *   A "snapshot" feature to capture the Tamagotchi's current state: appearance (sprite), dominant personality, key skills, current mood, notable achievements/badges.
    *   Save these snapshots to a local "Hall of Fame" or "Photo Album."
    *   Optional, anonymized global leaderboards or themed "Showcase Challenges" for specific criteria (e.g., "Most Creatively Decorated Room," "Highest Score in X Mini-Game," "Most Unique Hybrid Personality"). No direct interaction, just comparison.
*   **"Mystery Egg Exchange" (Asynchronous):**
    *   Optional feature where players can "deposit" the genetic data (Personality Genes, potential Legacy Traits) of a Legacy-Ready Tamagotchi into a global, anonymous pool.
    *   In return, they receive a "Mystery Egg" containing genetic data from another player's lineage. This egg would then hatch into a new Tamagotchi with inherited traits.
    *   This fosters a sense of shared world without direct interaction, focusing on the surprise of new genetic combinations.
*   **"Recipe/Crafting Book" (Discovery & Collection):**
    *   Recipes for unique food (providing special mood/stat boosts), craftable items (decor, tools, toys), or variations/unlocks for for mini-games are discovered through:
        *   Specific Tamagotchi actions (e.g., an Intellectual researching might find an "Ancient Potion" recipe).
        *   Personality milestones (e.g., a high-level Nurturer unlocks a "Comforting Broth" recipe).
        *   Environmental interactions (e.g., finding a rare herb in an exploration zone unlocks a new tea recipe).
    *   Discovered recipes are added to an in-game "Crafting Compendium" or "Cookbook" for easy reference.
*   **Player Achievements & Milestones:**
    *   Standard achievement tracking system (e.g., "Breed 5 Generations," "Master an Adventurer Career Path," "Experience all Moods with one Tamagotchi," "Collect 50 Unique Recipes").
    *   Grants small in-game rewards: unique cosmetic items, rare crafting materials, currency, or special titles for the player profile.
    *   Achievements could be visualized as pixel-art stamps or medals in a dedicated section of the UI.

### Canvas Integration:

*   Journal entry templates (mock-ups of how entries would look).
*   Showcase layout mock-ups (how a Tamagotchi's snapshot would be displayed).
*   Recipe card builders (visual design for recipe displays).
*   Achievement tracker mock-ups (visual list of achievements with icons).

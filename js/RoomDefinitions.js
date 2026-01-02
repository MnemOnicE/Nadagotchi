/**
 * @fileoverview Definitions for the Housing System Rooms and their layout.
 */

export const RoomDefinitions = {
    "Entryway": {
        name: "Entryway",
        id: "Entryway",
        connections: ["LivingRoom"],
        defaultWallpaper: "wallpaper_default",
        defaultFlooring: "flooring_default",
        unlocked: true // Always unlocked start
    },
    "LivingRoom": {
        name: "Living Room",
        id: "LivingRoom",
        connections: ["Entryway", "Kitchen", "Bedroom"],
        defaultWallpaper: "cozy_wallpaper",
        defaultFlooring: "wood_flooring",
        unlocked: true // For testing
    },
    "Kitchen": {
        name: "Kitchen",
        id: "Kitchen",
        connections: ["LivingRoom"],
        defaultWallpaper: "wallpaper_brick",
        defaultFlooring: "flooring_tile",
        unlocked: true // For testing
    },
    "Bedroom": {
        name: "Bedroom",
        id: "Bedroom",
        connections: ["LivingRoom"],
        defaultWallpaper: "wallpaper_blue",
        defaultFlooring: "flooring_wood",
        unlocked: true // For testing
    }
};

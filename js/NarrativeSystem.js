/**
 * @class NarrativeSystem
 * @description Generates contextual narrative text based on the pet's personality and game events.
 */
export class NarrativeSystem {

    /**
     * Generates a journal entry text.
     * @param {string} archetype - The pet's dominant archetype (e.g., 'Adventurer').
     * @param {string} eventType - The type of event (e.g., 'MOOD_CHANGE', 'WEATHER_CHANGE').
     * @param {object} context - Additional data (e.g., { newMood: 'happy', weather: 'Rainy' }).
     * @returns {string|null} The generated text, or null if no appropriate text found.
     */
    static generateEntry(archetype, eventType, context) {
        const templates = NarrativeSystem.getTemplates();

        // Fallback to 'Default' if archetype not found or undefined
        const archetypeTemplates = templates[archetype] || templates['Default'];
        const eventTemplates = archetypeTemplates[eventType];

        if (!eventTemplates) return null; // No template for this event type

        // Select specific template based on context
        let template = null;

        if (eventType === 'MOOD_CHANGE') {
            template = eventTemplates[context.newMood];
        } else if (eventType === 'WEATHER_CHANGE') {
            template = eventTemplates[context.weather];
        } else if (eventType === 'AGE_MILESTONE') {
            template = eventTemplates['default'];
        }

        // If specific key not found, return null (do not log)
        if (!template) return null;

        // Resolve random choice if array
        if (Array.isArray(template)) {
             return template[Math.floor(Math.random() * template.length)];
        }

        return template;
    }

    static getTemplates() {
        return {
            'Default': {
                'MOOD_CHANGE': {
                    'happy': "I'm feeling good today!",
                    'sad': "I'm feeling a bit down...",
                    'angry': "I'm so frustrated!",
                    'neutral': "I feel fine."
                },
                'WEATHER_CHANGE': {
                    'Sunny': "The sun is shining.",
                    'Rainy': "It's raining outside.",
                    'Stormy': "What a storm!",
                    'Cloudy': "It's a bit cloudy."
                },
                'AGE_MILESTONE': {
                    'default': "I feel like I'm growing up."
                }
            },
            'Adventurer': {
                'MOOD_CHANGE': {
                    'happy': ["I'm pumped! Where should we explore next?", "I feel unstoppable!"],
                    'sad': "I haven't been on an adventure in a while... feeling bored.",
                    'angry': "I want to go outside! Now!",
                    'neutral': "Ready for anything."
                },
                'WEATHER_CHANGE': {
                    'Sunny': "Perfect weather for an expedition!",
                    'Rainy': "A little rain won't stop a true explorer.",
                    'Stormy': "Thunder! Exciting!",
                    'Cloudy': "Good tracking weather."
                },
                'AGE_MILESTONE': {
                    'default': "Another year, another adventure awaits."
                }
            },
            'Nurturer': {
                'MOOD_CHANGE': {
                    'happy': "My heart is full of joy.",
                    'sad': "I feel a bit lonely.",
                    'angry': "I'm upset. It's not fair.",
                    'neutral': "Peaceful."
                },
                 'WEATHER_CHANGE': {
                    'Sunny': "The plants must be loving this sun.",
                    'Rainy': "The garden is getting a drink.",
                    'Stormy': "I hope the little animals are safe.",
                    'Cloudy': "A calm, grey day."
                },
                'AGE_MILESTONE': {
                    'default': "I'm growing older. I hope I've made the world kinder."
                }
            },
             'Intellectual': {
                'MOOD_CHANGE': {
                    'happy': "My mind is sharp today.",
                    'sad': "I can't seem to focus...",
                    'angry': "This is illogical and frustrating!",
                    'neutral': "Contemplative."
                },
                 'WEATHER_CHANGE': {
                    'Sunny': "Excellent lighting for reading.",
                    'Rainy': "The sound of rain helps me think.",
                    'Stormy': "Atmospheric pressure is dropping.",
                    'Cloudy': "No glare on my pages today."
                },
                'AGE_MILESTONE': {
                    'default': "With age comes wisdom."
                }
            },
            'Mischievous': {
                'MOOD_CHANGE': {
                    'happy': "Hehe, I'm plotting something fun.",
                    'sad': "Boring...",
                    'angry': "Grrr!",
                    'neutral': "Waiting for a chance to play."
                },
                 'WEATHER_CHANGE': {
                    'Sunny': "Let's go cause some trouble!",
                    'Rainy': "Mud puddles! Yes!",
                    'Stormy': "Chaos in the sky!",
                    'Cloudy': "Good cover for sneaking."
                },
                'AGE_MILESTONE': {
                    'default': "I'm getting bigger! More mischief to make!"
                }
            },
             'Recluse': {
                'MOOD_CHANGE': {
                    'happy': "It's nice and quiet. I like it.",
                    'sad': "Too much noise...",
                    'angry': "Leave me alone!",
                    'neutral': "..."
                },
                 'WEATHER_CHANGE': {
                    'Sunny': "It's too bright outside.",
                    'Rainy': "I love the rain. It keeps people away.",
                    'Stormy': "The world is angry.",
                    'Cloudy': "My favorite kind of weather."
                },
                'AGE_MILESTONE': {
                    'default': "Another year passed in solitude."
                }
            }
        };
    }
}

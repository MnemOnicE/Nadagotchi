/**
 * @fileoverview System for generating dynamic narrative text.
 * Selects appropriate journal entries and advice based on pet archetype and context.
 */

/**
 * Generates contextual narrative text based on the pet's personality and game events.
 * @class NarrativeSystem
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

    /**
     * Retrieves a piece of advice based on the ancestor's archetype.
     * @param {string} archetype - The ancestor's archetype.
     * @returns {string} A random piece of advice.
     */
    static getAdvice(archetype) {
        const templates = NarrativeSystem.getTemplates();
        const adviceList = templates['ADVICE'][archetype] || templates['ADVICE']['Default'];
        return adviceList[Math.floor(Math.random() * adviceList.length)];
    }

    /**
     * Returns the dictionary of narrative templates.
     * @returns {Object} The complete map of narrative strings.
     */
    static getTemplates() {
        return {
            'ADVICE': {
                'Default': [
                    "Listen to your heart.",
                    "Time flies, use it well.",
                    "Every generation has its own challenges."
                ],
                'Adventurer': [
                    "Don't stay in one place too long. The world is vast!",
                    "If you're scared, that just means it's worth doing.",
                    "Always check under the rocks. You never know what you'll find.",
                    "Rain or shine, the journey must go on."
                ],
                'Nurturer': [
                    "Kindness is a seed that always bears fruit.",
                    "Take care of your friends, and they will take care of you.",
                    "A well-fed pet is a happy pet.",
                    "Patience is the most important skill."
                ],
                'Intellectual': [
                    "Knowledge is the only treasure that multiplies when shared.",
                    "Always analyze the situation before acting.",
                    "A puzzle solved is a mind sharpened.",
                    "There is a logical solution to every problem."
                ],
                'Mischievous': [
                    "Rules are more like... guidelines.",
                    "A little prank never hurt anyone (much).",
                    "Surprise is your best weapon.",
                    "Why walk when you can sneak?"
                ],
                'Recluse': [
                    "Silence is golden.",
                    "Sometimes the best company is your own.",
                    "Crowds drain you; solitude recharges you.",
                    "Observe from the shadows. You see more that way."
                ]
            },
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

// Mock Phaser *before* requiring the system
global.Phaser = {
    Math: {
        Between: (min, max) => (min + max) / 2 // A predictable value for testing
    },
    Utils: {
        Array: {
            // A mock that lets us control the "random" choice
            GetRandom: jest.fn((arr) => arr[1]) // Always return "Cloudy" initially
        }
    }
};

import { WeatherSystem } from '../js/WeatherSystem';

// Mock Phaser Scene and related functionality
const mockScene = {
    time: { addEvent: jest.fn() },
    game: { events: { emit: jest.fn() } }
};

describe('WeatherSystem', () => {
    let weatherSystem;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        weatherSystem = new WeatherSystem(mockScene);
    });

    test('should initialize with "Sunny" weather', () => {
        expect(weatherSystem.getCurrentWeather()).toBe('Sunny');
    });

    test('should set up a timer on construction', () => {
        expect(mockScene.time.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            delay: expect.any(Number),
            callback: expect.any(Function),
            callbackScope: expect.anything(),
            loop: true,
        }));
    });

    test('changeWeather should update the weather and emit an event', () => {
        Phaser.Utils.Array.GetRandom.mockReturnValue('Rainy');
        weatherSystem.changeWeather();
        expect(weatherSystem.getCurrentWeather()).toBe('Rainy');
        expect(mockScene.game.events.emit).toHaveBeenCalledWith('weatherChanged', 'Rainy');
    });

    test('should set up a timer to change weather', () => {
        expect(mockScene.time.addEvent).toHaveBeenCalledWith({
            delay: 60000, // (30000 + 90000) / 2
            callback: weatherSystem.changeWeather,
            callbackScope: weatherSystem,
            loop: true
        });
    });

    test('changeWeather should update the current weather', () => {
        Phaser.Utils.Array.GetRandom.mockReturnValue('Rainy');
        weatherSystem.changeWeather();
        expect(weatherSystem.getCurrentWeather()).toBe('Rainy');
        expect(mockScene.game.events.emit).toHaveBeenCalledWith('weatherChanged', 'Rainy');
    });

    test('changeWeather should not switch to the same weather', () => {
        // First, make the current weather "Cloudy" so the mock has something to match
        weatherSystem.currentWeather = 'Cloudy';

        // Make the mock return "Cloudy" again, then "Rainy" on the next call
        Phaser.Utils.Array.GetRandom
            .mockReturnValueOnce('Cloudy')
            .mockReturnValueOnce('Rainy');

        weatherSystem.changeWeather();

        // It should have called itself again and settled on "Rainy"
        expect(weatherSystem.getCurrentWeather()).toBe('Rainy');
        expect(mockScene.game.events.emit).toHaveBeenCalledWith('weatherChanged', 'Rainy');
        // GetRandom was called twice
        expect(Phaser.Utils.Array.GetRandom).toHaveBeenCalledTimes(2);
    });
});

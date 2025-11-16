// tests/WeatherSystem.test.js
const fs = require('fs');
const path = require('path');

// Load the class from the source file
const weatherSystemCode = fs.readFileSync(path.resolve(__dirname, '../js/WeatherSystem.js'), 'utf8');
const WeatherSystem = eval(weatherSystemCode + '; module.exports = WeatherSystem;');

// Mock the Phaser framework components that WeatherSystem depends on
const mockScene = {
    time: {
        addEvent: jest.fn(),
    },
    game: {
        events: {
            emit: jest.fn(),
        },
    },
};

// Mock Phaser.Math.Between and Phaser.Utils.Array.GetRandom
global.Phaser = {
    Math: {
        Between: jest.fn((min, max) => (min + max) / 2), // Return a predictable value
    },
    Utils: {
        Array: {
            GetRandom: jest.fn(),
        },
    },
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

    test('changeWeather should not select the same weather', () => {
        // Mock it to return the same weather first, then a different one.
        Phaser.Utils.Array.GetRandom.mockReturnValueOnce('Sunny').mockReturnValueOnce('Cloudy');
        weatherSystem.changeWeather();
        expect(weatherSystem.getCurrentWeather()).toBe('Cloudy');
        expect(Phaser.Utils.Array.GetRandom).toHaveBeenCalledTimes(2);
    });
});

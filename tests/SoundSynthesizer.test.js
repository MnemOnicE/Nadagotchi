import { SoundSynthesizer } from '../js/utils/SoundSynthesizer.js';
import { Config } from '../js/Config.js';

describe('SoundSynthesizer', () => {
    let warnSpy;

    beforeEach(() => {
        // Clear the singleton instance before each test
        SoundSynthesizer.instance = undefined;
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        // Mock window.AudioContext and webkitAudioContext
        // We use defineProperty because they might not be directly deletable or might be read-only
        Object.defineProperty(window, 'AudioContext', {
            value: undefined,
            writable: true,
            configurable: true
        });
        Object.defineProperty(window, 'webkitAudioContext', {
            value: undefined,
            writable: true,
            configurable: true
        });
    });

    afterEach(() => {
        warnSpy.mockRestore();
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    describe('Constructor Error Path', () => {
        it('should handle Web Audio API not supported', () => {
            // AudioContext is undefined by default in our beforeEach
            const synth = new SoundSynthesizer();

            expect(synth.ctx).toBeNull();
            expect(warnSpy).toHaveBeenCalledWith(
                'Web Audio API not supported or blocked.',
                expect.any(Error)
            );
        });

        it('should handle AudioContext instantiation failure', () => {
            const mockError = new Error('Instantiation failed');
            window.AudioContext = jest.fn().mockImplementation(() => {
                throw mockError;
            });

            const synth = new SoundSynthesizer();

            expect(synth.ctx).toBeNull();
            expect(warnSpy).toHaveBeenCalledWith(
                'Web Audio API not supported or blocked.',
                mockError
            );
        });
    });

    describe('Happy Path', () => {
        let mockAudioContext;
        let mockGainNode;
        let mockOscillatorNode;
        let mockBufferSourceNode;

        beforeEach(() => {
            mockGainNode = {
                connect: jest.fn(),
                disconnect: jest.fn(),
                gain: { value: 1, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
            };
            mockOscillatorNode = {
                connect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn(),
                disconnect: jest.fn(),
                frequency: { setValueAtTime: jest.fn() }
            };
            mockBufferSourceNode = {
                connect: jest.fn(),
                start: jest.fn(),
                disconnect: jest.fn(),
                buffer: null
            };
            mockAudioContext = {
                createGain: jest.fn(() => mockGainNode),
                createOscillator: jest.fn(() => mockOscillatorNode),
                createBufferSource: jest.fn(() => mockBufferSourceNode),
                createBuffer: jest.fn(() => ({ getChannelData: jest.fn(() => new Float32Array(100)) })),
                destination: {},
                currentTime: 0,
                sampleRate: 44100
            };
            window.AudioContext = jest.fn(() => mockAudioContext);
        });

        it('should initialize correctly when AudioContext is supported', () => {
            const synth = new SoundSynthesizer();

            expect(synth.ctx).toBe(mockAudioContext);
            expect(mockAudioContext.createGain).toHaveBeenCalled();
            expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
            expect(mockGainNode.gain.value).toBe(Config.SETTINGS.DEFAULT_VOLUME);
        });

        it('should behave as a Singleton', () => {
            const synth1 = new SoundSynthesizer();
            const synth2 = new SoundSynthesizer();

            expect(synth1).toBe(synth2);
            expect(window.AudioContext).toHaveBeenCalledTimes(1);
        });

        it('should set volume correctly', () => {
            const synth = new SoundSynthesizer();
            synth.setVolume(0.8);
            expect(mockGainNode.gain.value).toBe(0.8);

            synth.setVolume(1.5); // Should clamp to 1
            expect(mockGainNode.gain.value).toBe(1);

            synth.setVolume(-0.5); // Should clamp to 0
            expect(mockGainNode.gain.value).toBe(0);
        });

        it('should play tone correctly', () => {
            const synth = new SoundSynthesizer();
            jest.useFakeTimers();

            synth.playTone(440, 'sine', 0.5);

            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
            expect(mockOscillatorNode.type).toBe('sine');
            expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0);
            expect(mockOscillatorNode.start).toHaveBeenCalled();
            expect(mockOscillatorNode.stop).toHaveBeenCalledWith(0.5);

            jest.advanceTimersByTime(610);
            expect(mockOscillatorNode.disconnect).toHaveBeenCalled();

            jest.useRealTimers();
        });

        it('should validate inputs in playTone', () => {
            const synth = new SoundSynthesizer();

            synth.playTone(-100, 'sine', 0.5);
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid frequency'));

            synth.playTone(440, 'sine', 10);
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid duration'));
        });

        it('should generate noise correctly', () => {
            const synth = new SoundSynthesizer();
            jest.useFakeTimers();

            synth.generateNoise(0.5);

            expect(mockAudioContext.createBuffer).toHaveBeenCalled();
            expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
            expect(mockBufferSourceNode.start).toHaveBeenCalled();

            jest.advanceTimersByTime(610);
            expect(mockBufferSourceNode.disconnect).toHaveBeenCalled();

            jest.useRealTimers();
        });

        it('should validate inputs in generateNoise', () => {
            const synth = new SoundSynthesizer();

            synth.generateNoise(-1);
            expect(mockAudioContext.createBuffer).not.toHaveBeenCalled();

            synth.generateNoise(10);
            expect(mockAudioContext.createBuffer).not.toHaveBeenCalled();
        });

        it('should play presets without error', () => {
            const synth = new SoundSynthesizer();
            expect(() => synth.playClick()).not.toThrow();
            expect(() => synth.playSuccess()).not.toThrow();
            expect(() => synth.playFailure()).not.toThrow();
            expect(() => synth.playChime()).not.toThrow();
            expect(() => synth.playAmbience()).not.toThrow();
        });
    });

    describe('Graceful Handling of Null Context', () => {
        it('should return early in setVolume when ctx is null', () => {
            const synth = new SoundSynthesizer(); // ctx is null
            expect(() => synth.setVolume(0.5)).not.toThrow();
        });

        it('should return early in playTone when ctx is null', () => {
            const synth = new SoundSynthesizer();
            expect(() => synth.playTone(440, 'sine', 0.5)).not.toThrow();
        });

        it('should return early in generateNoise when ctx is null', () => {
            const synth = new SoundSynthesizer();
            expect(() => synth.generateNoise(0.5)).not.toThrow();
        });

        it('should return early in playSuccess when ctx is null', () => {
            const synth = new SoundSynthesizer();
            expect(() => synth.playSuccess()).not.toThrow();
        });
    });
});

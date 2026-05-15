import { SoundSynthesizer } from '../js/utils/SoundSynthesizer.js';
import { Config } from '../js/Config.js';

describe('SoundSynthesizer', () => {
    let warnSpy;

    beforeEach(() => {
        // Clear the singleton instance before each test
        SoundSynthesizer.instance = undefined;
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        // Mock window.AudioContext and webkitAudioContext
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
    });

    describe('Constructor Error Path', () => {
        it('should handle Web Audio API not supported', () => {
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
        let masterGainNode;

        const createMockGainNode = () => ({
            connect: jest.fn(),
            disconnect: jest.fn(),
            gain: {
                value: 1,
                setValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn(),
                exponentialRampToValueAtTime: jest.fn()
            }
        });

        const createMockOscillatorNode = () => ({
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            disconnect: jest.fn(),
            frequency: { setValueAtTime: jest.fn() }
        });

        const createMockBufferSourceNode = () => ({
            connect: jest.fn(),
            start: jest.fn(),
            disconnect: jest.fn(),
            buffer: null
        });

        beforeEach(() => {
            masterGainNode = createMockGainNode();
            mockAudioContext = {
                createGain: jest.fn().mockImplementation(createMockGainNode),
                createOscillator: jest.fn().mockImplementation(createMockOscillatorNode),
                createBufferSource: jest.fn().mockImplementation(createMockBufferSourceNode),
                createBuffer: jest.fn(() => ({ getChannelData: jest.fn(() => new Float32Array(100)) })),
                destination: { name: 'destination' },
                currentTime: 10,
                sampleRate: 44100
            };
            // The first call to createGain in constructor is for masterGain
            mockAudioContext.createGain.mockReturnValueOnce(masterGainNode);
            window.AudioContext = jest.fn(() => mockAudioContext);
        });

        it('should initialize correctly when AudioContext is supported', () => {
            const synth = new SoundSynthesizer();

            expect(synth.ctx).toBe(mockAudioContext);
            expect(mockAudioContext.createGain).toHaveBeenCalled();
            expect(masterGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
            expect(masterGainNode.gain.value).toBe(Config.SETTINGS.DEFAULT_VOLUME);
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
            expect(masterGainNode.gain.value).toBe(0.8);

            synth.setVolume(1.5); // Should clamp to 1
            expect(masterGainNode.gain.value).toBe(1);

            synth.setVolume(-0.5); // Should clamp to 0
            expect(masterGainNode.gain.value).toBe(0);
        });

        it('should play tone with correct envelope and connections', () => {
            const synth = new SoundSynthesizer();
            const toneGainNode = createMockGainNode();
            const oscNode = createMockOscillatorNode();

            mockAudioContext.createGain.mockReturnValue(toneGainNode);
            mockAudioContext.createOscillator.mockReturnValue(oscNode);

            jest.useFakeTimers();

            const freq = 440;
            const duration = 0.5;
            synth.playTone(freq, 'sine', duration);

            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
            expect(oscNode.type).toBe('sine');
            expect(oscNode.frequency.setValueAtTime).toHaveBeenCalledWith(freq, mockAudioContext.currentTime);

            // Audio Graph connections
            expect(oscNode.connect).toHaveBeenCalledWith(toneGainNode);
            expect(toneGainNode.connect).toHaveBeenCalledWith(masterGainNode);

            // Envelope (ADSR) verification
            expect(toneGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, mockAudioContext.currentTime);
            expect(toneGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, mockAudioContext.currentTime + duration * 0.1);
            expect(toneGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, mockAudioContext.currentTime + duration);

            expect(oscNode.start).toHaveBeenCalled();
            expect(oscNode.stop).toHaveBeenCalledWith(mockAudioContext.currentTime + duration);

            // Cleanup verification
            jest.advanceTimersByTime(duration * 1000 + 100);
            expect(oscNode.disconnect).toHaveBeenCalled();
            expect(toneGainNode.disconnect).toHaveBeenCalled();

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
            const noiseGainNode = createMockGainNode();
            const noiseSourceNode = createMockBufferSourceNode();

            mockAudioContext.createGain.mockReturnValue(noiseGainNode);
            mockAudioContext.createBufferSource.mockReturnValue(noiseSourceNode);

            jest.useFakeTimers();

            const duration = 0.5;
            synth.generateNoise(duration);

            expect(mockAudioContext.createBuffer).toHaveBeenCalled();
            expect(mockAudioContext.createBufferSource).toHaveBeenCalled();

            // Connections
            expect(noiseSourceNode.connect).toHaveBeenCalledWith(noiseGainNode);
            expect(noiseGainNode.connect).toHaveBeenCalledWith(masterGainNode);

            // Envelope
            expect(noiseGainNode.gain.setValueAtTime).toHaveBeenCalledWith(1, mockAudioContext.currentTime);
            expect(noiseGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, mockAudioContext.currentTime + duration);

            expect(noiseSourceNode.start).toHaveBeenCalled();

            jest.advanceTimersByTime(duration * 1000 + 100);
            expect(noiseSourceNode.disconnect).toHaveBeenCalled();
            expect(noiseGainNode.disconnect).toHaveBeenCalled();

            jest.useRealTimers();
        });

        it('should validate inputs in generateNoise', () => {
            const synth = new SoundSynthesizer();

            synth.generateNoise(-1);
            expect(mockAudioContext.createBuffer).not.toHaveBeenCalled();

            synth.generateNoise(10);
            expect(mockAudioContext.createBuffer).not.toHaveBeenCalled();
        });

        it('should schedule sequential tones in playSuccess', () => {
            const synth = new SoundSynthesizer();
            const playToneSpy = jest.spyOn(synth, 'playTone').mockImplementation(() => {});

            jest.useFakeTimers();
            synth.playSuccess();

            expect(playToneSpy).toHaveBeenCalledWith(440, 'sine', 0.2);

            jest.advanceTimersByTime(100);
            expect(playToneSpy).toHaveBeenCalledWith(554, 'sine', 0.2);

            jest.advanceTimersByTime(100);
            expect(playToneSpy).toHaveBeenCalledWith(659, 'sine', 0.4);

            jest.useRealTimers();
        });

        it('should schedule sequential tones in playFailure', () => {
            const synth = new SoundSynthesizer();
            const playToneSpy = jest.spyOn(synth, 'playTone').mockImplementation(() => {});

            jest.useFakeTimers();
            synth.playFailure();

            expect(playToneSpy).toHaveBeenCalledWith(150, 'sawtooth', 0.4);

            jest.advanceTimersByTime(100);
            expect(playToneSpy).toHaveBeenCalledWith(140, 'sawtooth', 0.4);

            jest.useRealTimers();
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
            const synth = new SoundSynthesizer();
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

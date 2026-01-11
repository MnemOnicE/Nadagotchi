import sys

# Mocking modules
class ConfigMock:
    class ACTIONS:
        class INTERACT_NPC:
            ENERGY_COST = 5
            CHAT_RELATIONSHIP = 1
            CHAT_HAPPINESS = 1
            CHAT_SKILL_GAIN = 1
            GIFT_RELATIONSHIP = 5
            GIFT_HAPPINESS = 5
            GIFT_SKILL_GAIN = 1
            SCOUT_SKILL_GAIN = 1
            ARTISAN_SKILL_GAIN = 1
            VILLAGER_SKILL_GAIN = 1
            FRIENDSHIP_DECAY = 0.5

class NarrativeSystemMock:
    @staticmethod
    def getNPCDialogue(npc, level, has_quest):
        return f"Hello {npc} level {level} quest {has_quest}"

class EventKeysMock:
    pass

# Mocking environment
import types
sys.modules['../Config.js'] = types.ModuleType('Config')
sys.modules['../Config.js'].Config = ConfigMock
sys.modules['../NarrativeSystem.js'] = types.ModuleType('NarrativeSystem')
sys.modules['../NarrativeSystem.js'].NarrativeSystem = NarrativeSystemMock
sys.modules['../EventKeys.js'] = types.ModuleType('EventKeys')
sys.modules['../EventKeys.js'].EventKeys = EventKeysMock

# Minimal Pet Mock
class MockPet:
    def __init__(self):
        self.relationships = {
            'Grizzled Scout': {'level': 0, 'interactedToday': False}
        }
        self.stats = type('Stats', (), {'energy': 100, 'happiness': 50})()
        self.skills = type('Skills', (), {'communication': 0, 'navigation': 0})()
        self.inventory = {}
        self.dailyQuest = None
        self.quests = {}
        self.questSystem = type('QS', (), {
            'completeDailyQuest': lambda: True,
            'getStageDefinition': lambda x: type('Stage', (), {'isComplete': False})(),
            'startQuest': lambda x: None,
            'checkRequirements': lambda x: False
        })()

    def addJournalEntry(self, text):
        pass

    def getMoodMultiplier(self):
        return 1.0

# Import System under test (Using Python to mock JS structure is tricky,
# better to run JS with Node. But since we need to verify JS logic,
# we should construct a Node test script).

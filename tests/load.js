// Charge source/logic.js et source/drawings.js dans un bac à sable, sans page web, pour les tester.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const NAMES = [
  'EX', 'PROGRAMS', 'PROG_ORDER', 'ILLUS', 'LEVELS', 'LINES', 'BADGES', 'CHALLENGES', 'OUTFITS', 'OUTFIT_SVG',
  'weekChallenges', 'esc', 'dayKey', 'weekKey', 'startOfWeek', 'defaultState', 'normalize', 'cleanEntry',
  'threshold', 'levelInfo', 'weekDays', 'weekStreak', 'backCat', 'painFreeRun', 'pendingNextDay', 'chalProgress',
  'evalChallenges', 'evalBadges', 'unlockedOutfits', 'setsFor', 'sideText', 'presc', 'timerMin', 'estMin',
  'buildSteps', 'solidStreak', 'SOLIDE_NEEDED', 'STRENGTH_PROGS', 'SUGGEST_ROTATION', 'quietState', 'suggestToday', 'applyNext', 'stepLevel', 'STEP_MAX', 'STEP_PROGS', 'suggestBonus', 'SUGGEST_BONUS', 'reminderICS', 'LADDERS', 'rungOf', 'rungsReady', 'laddersOf', 'FIT_TESTS', 'testDue', 'TEST_XP', 'TEST_CAP', 'TEST_VERSION', 'progFor', 'hasBike', 'computeXP', 'computeStars', 'canRows', 'backupDue', 'kineSummary', 'illusFull', 'illusMini', 'mascotSVG'
];

module.exports = function load() {
  const dir = path.join(__dirname, '..', 'source');
  const code = ['logic.js', 'drawings.js'].map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const ctx = vm.createContext({});
  vm.runInContext(`${code}\n;globalThis.__api = { ${NAMES.join(', ')} };`, ctx, { filename: 'logic+drawings.js' });
  return ctx.__api;
};

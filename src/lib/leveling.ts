/**
 * XP and Leveling System
 *
 * Features:
 * 1. XP earned from quests, achievements, battles, trades
 * 2. Progressive level requirements
 * 3. Level-based unlocks
 * 4. Prestige system for level 50+
 */

export type LevelTier = 'Novice' | 'Apprentice' | 'Journeyman' | 'Expert' | 'Master' | 'Grandmaster' | 'Legend';

export interface LevelInfo {
  level: number;
  tier: LevelTier;
  xpRequired: number;
  totalXPRequired: number;
  unlocks: string[];
}

export interface UserLevel {
  level: number;
  currentXP: number;
  totalXP: number;
  tier: LevelTier;
  prestige: number;
}

// Level thresholds and XP requirements
const LEVEL_CONFIG: LevelInfo[] = [];

// Generate level configuration
function generateLevelConfig(): LevelInfo[] {
  const config: LevelInfo[] = [];
  let totalXP = 0;

  for (let level = 1; level <= 50; level++) {
    let xpRequired: number;
    let tier: LevelTier;
    let unlocks: string[] = [];

    // XP scaling
    if (level <= 5) {
      xpRequired = 100;
      tier = 'Novice';
    } else if (level <= 10) {
      xpRequired = 250;
      tier = 'Apprentice';
    } else if (level <= 20) {
      xpRequired = 500;
      tier = 'Journeyman';
    } else if (level <= 30) {
      xpRequired = 1000;
      tier = 'Expert';
    } else if (level <= 40) {
      xpRequired = 1500;
      tier = 'Master';
    } else if (level <= 45) {
      xpRequired = 2000;
      tier = 'Grandmaster';
    } else {
      xpRequired = 2500;
      tier = 'Legend';
    }

    // Unlocks at specific levels
    switch (level) {
      case 1:
        unlocks = ['Basic trading', 'Watchlist'];
        break;
      case 3:
        unlocks = ['Daily quests'];
        break;
      case 5:
        unlocks = ['Custom profile badge'];
        break;
      case 10:
        unlocks = ['Weekly quests', 'Battle access'];
        break;
      case 15:
        unlocks = ['Tournament entry'];
        break;
      case 20:
        unlocks = ['Gold card back', 'Battle wagering'];
        break;
      case 25:
        unlocks = ['Custom card backs'];
        break;
      case 30:
        unlocks = ['Diamond card back', 'Premium tournaments'];
        break;
      case 40:
        unlocks = ['Legendary card back', 'Title customization'];
        break;
      case 50:
        unlocks = ['Prestige mode', 'Exclusive cosmetics'];
        break;
    }

    totalXP += xpRequired;

    config.push({
      level,
      tier,
      xpRequired,
      totalXPRequired: totalXP,
      unlocks,
    });
  }

  return config;
}

// Initialize level config
export const LEVELS = generateLevelConfig();

// Get level info for a specific level
export function getLevelInfo(level: number): LevelInfo | undefined {
  return LEVELS.find(l => l.level === level);
}

// Calculate user level from total XP
export function calculateLevel(totalXP: number): UserLevel {
  let level = 1;
  let remainingXP = totalXP;

  for (const levelInfo of LEVELS) {
    if (remainingXP < levelInfo.xpRequired) {
      break;
    }
    remainingXP -= levelInfo.xpRequired;
    level = levelInfo.level;
  }

  // Cap at level 50 (prestige handles higher)
  if (level >= 50) {
    level = 50;
    // Calculate prestige
    const prestigeXP = totalXP - (LEVELS[49]?.totalXPRequired || 0);
    const prestigeLevel = Math.floor(prestigeXP / 10000); // 10000 XP per prestige

    const currentLevelInfo = LEVELS[49];
    return {
      level: 50,
      currentXP: prestigeXP % 10000,
      totalXP,
      tier: 'Legend',
      prestige: prestigeLevel,
    };
  }

  const currentLevelInfo = LEVELS[level - 1];
  const nextLevelInfo = LEVELS[level];
  const currentXP = nextLevelInfo
    ? totalXP - (currentLevelInfo?.totalXPRequired || 0) + currentLevelInfo?.xpRequired
    : remainingXP;

  return {
    level,
    currentXP,
    totalXP,
    tier: currentLevelInfo?.tier || 'Novice',
    prestige: 0,
  };
}

// Get XP needed for next level
export function getXPToNextLevel(userLevel: UserLevel): number {
  if (userLevel.level >= 50) {
    return 10000 - userLevel.currentXP; // Prestige XP
  }

  const nextLevel = LEVELS.find(l => l.level === userLevel.level + 1);
  if (!nextLevel) return 0;

  return nextLevel.xpRequired - userLevel.currentXP;
}

// Get progress percentage to next level
export function getLevelProgress(userLevel: UserLevel): number {
  if (userLevel.level >= 50) {
    return (userLevel.currentXP / 10000) * 100;
  }

  const currentLevelInfo = LEVELS.find(l => l.level === userLevel.level);
  const nextLevelInfo = LEVELS.find(l => l.level === userLevel.level + 1);

  if (!currentLevelInfo || !nextLevelInfo) return 0;

  const xpIntoLevel = userLevel.totalXP - (currentLevelInfo.totalXPRequired - currentLevelInfo.xpRequired);
  return Math.min(100, (xpIntoLevel / nextLevelInfo.xpRequired) * 100);
}

// Get all unlocks up to a level
export function getUnlocksUpToLevel(level: number): string[] {
  const unlocks: string[] = [];
  for (const levelInfo of LEVELS) {
    if (levelInfo.level > level) break;
    unlocks.push(...levelInfo.unlocks);
  }
  return unlocks;
}

// Check if feature is unlocked
export function isFeatureUnlocked(feature: string, level: number): boolean {
  const unlocks = getUnlocksUpToLevel(level);
  return unlocks.some(u => u.toLowerCase().includes(feature.toLowerCase()));
}

// XP sources and amounts
export const XP_REWARDS = {
  // Daily activities
  daily_login: 10,
  view_token: 2,
  add_watchlist: 5,
  remove_watchlist: 0,

  // Trading
  complete_trade: 15,
  first_trade_of_day: 25,
  large_trade: 50, // $1000+

  // Battles
  battle_win: 30,
  battle_loss: 10,
  battle_draw: 15,
  tournament_win: 100,
  tournament_participation: 25,

  // Achievements
  achievement_common: 25,
  achievement_rare: 50,
  achievement_epic: 100,
  achievement_legendary: 250,

  // Social
  share_profile: 10,
  referral_signup: 100,
  referral_first_trade: 200,

  // Collections
  complete_collection_set: 150,
  unlock_card_back: 75,
} as const;

export type XPSource = keyof typeof XP_REWARDS;

// Get tier color
export function getTierColor(tier: LevelTier): string {
  switch (tier) {
    case 'Novice':
      return 'text-gray-600';
    case 'Apprentice':
      return 'text-green-600';
    case 'Journeyman':
      return 'text-blue-600';
    case 'Expert':
      return 'text-purple-600';
    case 'Master':
      return 'text-orange-600';
    case 'Grandmaster':
      return 'text-red-600';
    case 'Legend':
      return 'text-yellow-500';
    default:
      return 'text-gray-600';
  }
}

// Get tier background color
export function getTierBgColor(tier: LevelTier): string {
  switch (tier) {
    case 'Novice':
      return 'bg-gray-100';
    case 'Apprentice':
      return 'bg-green-100';
    case 'Journeyman':
      return 'bg-blue-100';
    case 'Expert':
      return 'bg-purple-100';
    case 'Master':
      return 'bg-orange-100';
    case 'Grandmaster':
      return 'bg-red-100';
    case 'Legend':
      return 'bg-gradient-to-r from-yellow-100 to-amber-100';
    default:
      return 'bg-gray-100';
  }
}

// Get tier icon
export function getTierIcon(tier: LevelTier): string {
  switch (tier) {
    case 'Novice':
      return '🌱';
    case 'Apprentice':
      return '📚';
    case 'Journeyman':
      return '🛠️';
    case 'Expert':
      return '⭐';
    case 'Master':
      return '💎';
    case 'Grandmaster':
      return '👑';
    case 'Legend':
      return '🏆';
    default:
      return '🌱';
  }
}

// Get prestige badge
export function getPrestigeBadge(prestige: number): { icon: string; label: string; color: string } | null {
  if (prestige === 0) return null;

  if (prestige < 5) {
    return { icon: '⭐', label: `Prestige ${prestige}`, color: 'text-yellow-500' };
  }
  if (prestige < 10) {
    return { icon: '✨', label: `Prestige ${prestige}`, color: 'text-blue-500' };
  }
  if (prestige < 25) {
    return { icon: '💫', label: `Prestige ${prestige}`, color: 'text-purple-500' };
  }
  return { icon: '🌟', label: `Prestige ${prestige}`, color: 'text-amber-500' };
}

// Format XP number
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}

// Calculate XP with multipliers
export function calculateXPWithMultipliers(
  baseXP: number,
  multipliers: {
    stakingMultiplier?: number;
    streakBonus?: number;
    eventMultiplier?: number;
  }
): number {
  let finalXP = baseXP;

  if (multipliers.stakingMultiplier) {
    finalXP *= multipliers.stakingMultiplier;
  }

  if (multipliers.streakBonus) {
    finalXP *= 1 + multipliers.streakBonus / 100;
  }

  if (multipliers.eventMultiplier) {
    finalXP *= multipliers.eventMultiplier;
  }

  return Math.round(finalXP);
}

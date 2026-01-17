'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

// Achievement definitions (4x3 grid - tattoo flash style)
export const ACHIEVEMENTS = {
  'be-bleeding-edge': { name: 'Be Bleeding Edge', description: 'Early adopter - first to try new features' },
  'fly-by-night': { name: 'Fly By Night', description: 'Night owl trader - active during off-hours' },
  'thank-you': { name: 'Thank You', description: 'Community contributor - helped others succeed' },
  'brand-new': { name: 'Brand New', description: 'First launch - created your first token' },
  'pay-me': { name: 'Pay Me', description: 'Revenue milestone - earned your first profits' },
  'magic-comes-with-a-price': { name: 'Magic Comes With A Price', description: 'Risk taker - high-stakes trader' },
  'act-now': { name: 'Act Now', description: 'Quick decision maker - seized time-sensitive opportunities' },
  'tell-the-truth': { name: 'Tell The Fucking Truth', description: 'Transparency champion - honest and upfront' },
  'roll-the-dice': { name: 'Roll The Dice', description: 'First trade - took your first chance' },
  'no-crystal-balls': { name: 'No Crystal Balls Just Brass Ones', description: 'Bold move - traded without certainty' },
  'no-sacrifice-no-victory': { name: 'No Sacrifice No Victory', description: 'Diamond hands - held through volatility' },
  'snake-oil': { name: 'Snake Oil', description: 'Due diligence expert - spotted a scam' },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;

interface AchievementBadgeProps {
  achievementId: AchievementId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  unlocked?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeConfig = {
  sm: { width: 80, height: 73, label: 'text-xs' },
  md: { width: 120, height: 110, label: 'text-sm' },
  lg: { width: 160, height: 146, label: 'text-base' },
  xl: { width: 200, height: 183, label: 'text-lg' },
};

export function AchievementBadge({
  achievementId,
  size = 'md',
  unlocked = true,
  showLabel = false,
  onClick,
  className = '',
}: AchievementBadgeProps) {
  const achievement = ACHIEVEMENTS[achievementId];
  const config = sizeConfig[size];

  return (
    <motion.div
      whileHover={unlocked ? { scale: 1.05 } : undefined}
      whileTap={unlocked ? { scale: 0.98 } : undefined}
      onClick={unlocked ? onClick : undefined}
      className={`
        inline-flex flex-col items-center gap-2
        ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-40 grayscale'}
        ${className}
      `}
    >
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <Image
          src={`/assets/sprites/${achievementId}.png`}
          alt={achievement.name}
          fill
          className="object-contain"
          sizes={`${config.width}px`}
        />
      </div>

      {showLabel && (
        <span
          className={`${config.label} font-semibold text-center max-w-[${config.width + 20}px]`}
          style={{ color: unlocked ? 'var(--achievement-ink)' : 'var(--fg-muted)' }}
        >
          {achievement.name}
        </span>
      )}
    </motion.div>
  );
}

// Grid of all achievements
export function AchievementGrid({
  unlockedIds = [],
  size = 'md',
  showLabels = true,
  onBadgeClick,
}: {
  unlockedIds?: AchievementId[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabels?: boolean;
  onBadgeClick?: (id: AchievementId) => void;
}) {
  const allIds = Object.keys(ACHIEVEMENTS) as AchievementId[];

  return (
    <div className="grid grid-cols-4 gap-4">
      {allIds.map((id) => (
        <AchievementBadge
          key={id}
          achievementId={id}
          size={size}
          unlocked={unlockedIds.includes(id)}
          showLabel={showLabels}
          onClick={() => onBadgeClick?.(id)}
        />
      ))}
    </div>
  );
}

export default AchievementBadge;

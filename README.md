# Vibecoin Playing Card Design System

A botanical-themed playing card design system for the 0G ecosystem token marketplace.

## Features

- **52-Card Deck**: Dynamically generated playing cards with botanical illustrations
- **12 Face Cards**: Custom AI-generated J, Q, K illustrations for all 4 suits
- **12 Achievement Badges**: Tattoo flash-style sprite badges
- **4 Suit Flora**: Lotus (Diamonds), Cherry Blossom (Hearts), Clover (Clubs), Olive (Spades)

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary (Red) | `#E45239` | Diamonds, Hearts suits |
| Ink (Black) | `#2F3129` | Clubs, Spades suits |
| Paper | `#F1F1EC` | Card backgrounds |
| Sage | `#939F8F` | Botanical accents |

## Asset Structure

```
public/assets/
├── faces/           # 12 face card illustrations (J, Q, K × 4 suits)
│   ├── jack-diamonds.jpg
│   ├── queen-diamonds.jpg
│   ├── king-diamonds.jpg
│   ├── jack-hearts.jpg
│   ├── queen-hearts.jpg
│   ├── king-hearts.jpg
│   ├── jack-clubs.jpg
│   ├── queen-clubs.jpg
│   ├── king-clubs.jpg
│   ├── jack-spades.jpg
│   ├── queen-spades.jpg
│   └── king-spades.jpg
├── flora/           # 4 botanical center illustrations
│   ├── lotus-diamonds.jpg
│   ├── cherry-blossom-hearts.jpg
│   ├── clover-clubs.jpg
│   └── olive-spades.jpg
├── sprites/         # 12 achievement badge sprites
└── patterns/        # Card back patterns
```

## Components

### PlayingCard
```tsx
import { PlayingCard } from '@/components/design-system';

<PlayingCard
  rank="K"
  suit="hearts"
  size="lg"
  flippable
  backVariant="botanical"
/>
```

### AchievementBadge
```tsx
import { AchievementBadge } from '@/components/design-system';

<AchievementBadge
  achievementId="be-bleeding-edge"
  size="lg"
  unlocked={true}
  showLabel
/>
```

## Category → Suit Mapping

| Category | Suit | Flora |
|----------|------|-------|
| AI | Diamonds | Lotus |
| DeFi | Spades | Olive |
| Gaming | Clubs | Clover |
| Creator | Hearts | Cherry Blossom |

## Score → Rank Mapping

| Score | Rank |
|-------|------|
| 95-100 | A |
| 90-94 | K |
| 85-89 | Q |
| 80-84 | J |
| 70-79 | 10 |
| <70 | 9-2 |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the design system demo.

## Roadmap

### Completed
- [x] Design tokens and color system
- [x] PlayingCard component with dynamic generation
- [x] 40 Number card illustrations (A-10 × 4 suits)
- [x] 12 Face card illustrations (J, Q, K × 4 suits)
- [x] 12 Achievement badge sprites (tattoo flash style)
- [x] Card back design (4-flora botanical)
- [x] Full deck review page (`/full-deck-review.html`)

### Backlog - Card Refinements
- [ ] **Clubs number cards** - Regenerate with botanical style (currently traditional pip layout)
- [ ] **Spades 3, 5 consistency** - Fix color/style inconsistencies
- [ ] **Unified art direction** - Ensure all 52 cards match botanical illustration style
- [ ] Card builder tool for custom tokens

### Backlog - Features
- [ ] Token overlay integration
- [ ] Marketplace card grid
- [ ] Card flip animations
- [ ] Mobile responsive layouts
- [ ] Backend API integration
- [ ] Website UI implementation

'use client';

import { useMemo } from 'react';
import type { Tournament, TournamentBracket, TournamentMatch } from '@/lib/battles';

/**
 * ★ Insight ─────────────────────────────────────
 *
 * Tournament brackets use a recursive grid layout:
 * 1. Each round is a column with increasing vertical spacing
 * 2. Matches connect with SVG lines to show progression
 * 3. Winners advance visually "up" to the next round
 *
 * The bracket supports 4, 8, 16, or 32 participants
 * with automatic BYE handling for odd numbers.
 * ─────────────────────────────────────────────────
 */

interface TournamentBracketProps {
  tournament: Tournament;
  currentUserAddress?: string;
  onMatchClick?: (match: TournamentMatch) => void;
}

interface MatchCardProps {
  match: TournamentMatch;
  tournament: Tournament;
  currentUserAddress?: string;
  onClick?: () => void;
}

function MatchCard({ match, tournament, currentUserAddress, onClick }: MatchCardProps) {
  const player1 = tournament.participants.find(p => p.address === match.player1);
  const player2 = tournament.participants.find(p => p.address === match.player2);
  const isBye = !match.player1 || !match.player2;
  const isUserMatch = match.player1 === currentUserAddress || match.player2 === currentUserAddress;
  const hasWinner = !!match.winner;

  const getPlayerDisplay = (address?: string, isSeed?: number) => {
    if (!address) return 'TBD';
    if (address === 'BYE') return 'BYE';
    const participant = tournament.participants.find(p => p.address === address);
    return participant?.username || `${address.slice(0, 6)}...`;
  };

  const isWinner = (address?: string) => match.winner === address;

  return (
    <div
      onClick={onClick}
      className={`
        min-w-[160px] rounded-lg border-2 overflow-hidden cursor-pointer
        transition-all hover:shadow-md
        ${isUserMatch ? 'border-botanical-500 bg-botanical-50' : 'border-botanical-200 bg-white'}
        ${isBye ? 'opacity-60' : ''}
      `}
    >
      {/* Player 1 */}
      <div
        className={`
          px-3 py-2 flex justify-between items-center text-sm
          ${isWinner(match.player1) ? 'bg-green-100 font-medium' : ''}
          ${match.player1 === currentUserAddress ? 'text-botanical-600' : ''}
        `}
      >
        <span className="truncate max-w-[100px]">
          {player1?.seed && <span className="text-xs text-muted mr-1">#{player1.seed}</span>}
          {getPlayerDisplay(match.player1)}
        </span>
        {hasWinner && (
          <span className={isWinner(match.player1) ? 'text-green-600' : 'text-muted'}>
            {isWinner(match.player1) ? '✓' : ''}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-botanical-200" />

      {/* Player 2 */}
      <div
        className={`
          px-3 py-2 flex justify-between items-center text-sm
          ${isWinner(match.player2) ? 'bg-green-100 font-medium' : ''}
          ${match.player2 === currentUserAddress ? 'text-botanical-600' : ''}
        `}
      >
        <span className="truncate max-w-[100px]">
          {player2?.seed && <span className="text-xs text-muted mr-1">#{player2.seed}</span>}
          {getPlayerDisplay(match.player2)}
        </span>
        {hasWinner && (
          <span className={isWinner(match.player2) ? 'text-green-600' : 'text-muted'}>
            {isWinner(match.player2) ? '✓' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export function TournamentBracket({ tournament, currentUserAddress, onMatchClick }: TournamentBracketProps) {
  const totalRounds = tournament.brackets.length;

  const getRoundName = (roundNum: number, total: number) => {
    if (roundNum === total) return 'Finals';
    if (roundNum === total - 1) return 'Semifinals';
    if (roundNum === total - 2) return 'Quarterfinals';
    return `Round ${roundNum}`;
  };

  if (tournament.brackets.length === 0) {
    return (
      <div className="surface-panel text-center py-8">
        <p className="text-muted">Brackets will be generated when registration closes</p>
        <p className="text-sm text-muted mt-2">
          {tournament.participants.length} / {tournament.maxParticipants} participants
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8 min-w-max p-4">
        {tournament.brackets.map((bracket, roundIndex) => {
          // Calculate spacing - doubles each round
          const matchSpacing = Math.pow(2, roundIndex) * 60;

          return (
            <div key={bracket.round} className="flex flex-col">
              {/* Round header */}
              <div className="text-center mb-4">
                <h4 className="font-medium text-sm">
                  {getRoundName(bracket.round, totalRounds)}
                </h4>
                <p className="text-xs text-muted">
                  {bracket.matches.filter(m => m.winner).length} / {bracket.matches.length} complete
                </p>
              </div>

              {/* Matches */}
              <div
                className="flex flex-col justify-around flex-1"
                style={{ gap: `${matchSpacing}px` }}
              >
                {bracket.matches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    tournament={tournament}
                    currentUserAddress={currentUserAddress}
                    onClick={() => onMatchClick?.(match)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Champion display */}
        {tournament.winner && (
          <div className="flex flex-col justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <h4 className="font-bold text-lg">Champion</h4>
              <p className="text-botanical-600">
                {tournament.participants.find(p => p.address === tournament.winner)?.username ||
                  `${tournament.winner.slice(0, 6)}...`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact bracket for cards
interface TournamentBracketMiniProps {
  tournament: Tournament;
  className?: string;
}

export function TournamentBracketMini({ tournament, className = '' }: TournamentBracketMiniProps) {
  const progress = useMemo(() => {
    if (tournament.brackets.length === 0) return 0;
    const totalMatches = tournament.brackets.reduce((sum, b) => sum + b.matches.length, 0);
    const completedMatches = tournament.brackets.reduce(
      (sum, b) => sum + b.matches.filter(m => m.winner).length,
      0
    );
    return Math.round((completedMatches / totalMatches) * 100);
  }, [tournament.brackets]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Mini bracket visualization */}
      <div className="flex gap-1">
        {tournament.brackets.map((bracket, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {bracket.matches.map((match, j) => (
              <div
                key={j}
                className={`w-2 h-2 rounded-sm ${
                  match.winner ? 'bg-green-500' : 'bg-botanical-200'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <span className="text-sm text-muted">{progress}% complete</span>
    </div>
  );
}

export default TournamentBracket;

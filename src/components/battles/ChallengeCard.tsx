'use client';

import type { Challenge, BattleType } from '@/lib/battles';

interface ChallengeCardProps {
  challenge: Challenge;
  type: 'incoming' | 'outgoing';
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const BATTLE_TYPE_ICONS: Record<BattleType, string> = {
  'hand-battle': '🃏',
  'card-duel': '⚔️',
  'tournament': '🏆',
};

const BATTLE_TYPE_NAMES: Record<BattleType, string> = {
  'hand-battle': 'Hand Battle',
  'card-duel': 'Card Duel',
  'tournament': 'Tournament',
};

export function ChallengeCard({ challenge, type, onAccept, onDecline, onCancel }: ChallengeCardProps) {
  const isExpired = new Date(challenge.expiresAt) < new Date();
  const isPending = challenge.status === 'pending' && !isExpired;
  const timeRemaining = Math.max(0, new Date(challenge.expiresAt).getTime() - Date.now());
  const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));

  const getStatusBadge = () => {
    if (isExpired) return { text: 'Expired', color: 'bg-gray-100 text-gray-600' };
    switch (challenge.status) {
      case 'pending':
        return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
      case 'accepted':
        return { text: 'Accepted', color: 'bg-green-100 text-green-700' };
      case 'declined':
        return { text: 'Declined', color: 'bg-red-100 text-red-700' };
      default:
        return { text: challenge.status, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const status = getStatusBadge();
  const opponent = type === 'incoming' ? challenge.from : challenge.to;

  return (
    <div className={`p-4 rounded-xl border ${isPending ? 'bg-white border-botanical-300' : 'bg-botanical-50 border-botanical-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{BATTLE_TYPE_ICONS[challenge.battleType]}</span>
            <span className="font-medium">{BATTLE_TYPE_NAMES[challenge.battleType]}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
              {status.text}
            </span>
          </div>

          {/* Opponent info */}
          <p className="text-sm text-muted mb-1">
            {type === 'incoming' ? 'From: ' : 'To: '}
            <span className="text-foreground">{opponent.slice(0, 10)}...{opponent.slice(-4)}</span>
          </p>

          {/* Message */}
          {challenge.message && (
            <p className="text-sm italic text-muted mb-2">"{challenge.message}"</p>
          )}

          {/* Wager */}
          {challenge.wager && challenge.wager.type !== 'none' && (
            <p className="text-sm">
              <span className="text-muted">Wager: </span>
              <span className="font-medium text-botanical-600">
                {challenge.wager.amount} {challenge.wager.type === 'points' ? 'points' : '$VIBE'}
              </span>
            </p>
          )}

          {/* Time remaining */}
          {isPending && (
            <p className="text-xs text-muted mt-2">
              Expires in {hoursRemaining}h {minutesRemaining}m
            </p>
          )}
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex flex-col gap-2">
            {type === 'incoming' ? (
              <>
                <button
                  onClick={() => onAccept?.(challenge.id)}
                  className="btn btn-primary text-sm py-1.5 px-3"
                >
                  Accept
                </button>
                <button
                  onClick={() => onDecline?.(challenge.id)}
                  className="btn btn-secondary text-sm py-1.5 px-3"
                >
                  Decline
                </button>
              </>
            ) : (
              <button
                onClick={() => onCancel?.(challenge.id)}
                className="btn btn-secondary text-sm py-1.5 px-3"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Challenges list component
interface ChallengesListProps {
  incoming: Challenge[];
  outgoing: Challenge[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
}

export function ChallengesList({ incoming, outgoing, onAccept, onDecline, onCancel }: ChallengesListProps) {
  const pendingIncoming = incoming.filter(c => c.status === 'pending');
  const pendingOutgoing = outgoing.filter(c => c.status === 'pending');

  if (pendingIncoming.length === 0 && pendingOutgoing.length === 0) {
    return (
      <div className="text-center py-6 text-muted">
        <p>No pending challenges</p>
        <p className="text-sm mt-1">Challenge other players to a battle!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Incoming challenges */}
      {pendingIncoming.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            Incoming Challenges ({pendingIncoming.length})
          </h4>
          <div className="space-y-2">
            {pendingIncoming.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                type="incoming"
                onAccept={onAccept}
                onDecline={onDecline}
              />
            ))}
          </div>
        </div>
      )}

      {/* Outgoing challenges */}
      {pendingOutgoing.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted mb-2">
            Sent Challenges ({pendingOutgoing.length})
          </h4>
          <div className="space-y-2">
            {pendingOutgoing.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                type="outgoing"
                onCancel={onCancel}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChallengeCard;

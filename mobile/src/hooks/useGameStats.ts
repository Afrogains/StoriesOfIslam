import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { apiRequest } from '../services/api';
import type { SectionSlug } from '../types/catalog';

export type GameSection = SectionSlug | 'all';

export type GameRound = {
  section: GameSection;
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  playedAt: string;
};

export type GameStats = {
  games: number;
  best: Partial<Record<GameSection, number>>;
  recent: GameRound[];
};

export type LeaderboardEntry = { name: string; score: number; isYou: boolean };

const EMPTY: GameStats = { games: 0, best: {}, recent: [] };
const keyFor = (account: string) => `stories.game.stats.v1.${account}`;

export function scoreAnswer(correct: boolean, secondsLeft: number, streak: number): number {
  if (!correct) return 0;
  const streakBonus = streak >= 3 ? 50 : 0;
  return 100 + Math.max(0, secondsLeft) * 5 + streakBonus;
}

export function useGameStats() {
  const { accountKey, mode, getAccessToken } = useAuth();
  const [stats, setStats] = useState<GameStats>(EMPTY);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    if (!accountKey) {
      setStats(EMPTY);
      return;
    }
    void AsyncStorage.getItem(keyFor(accountKey)).then((raw) => {
      try {
        setStats(raw ? { ...EMPTY, ...(JSON.parse(raw) as GameStats) } : EMPTY);
      } catch {
        setStats(EMPTY);
      }
    });
  }, [accountKey]);

  const loadLeaderboard = useCallback(
    async (section: GameSection) => {
      if (mode !== 'server') {
        setLeaderboard(null);
        return;
      }
      try {
        const token = await getAccessToken();
        const response = await apiRequest<{ data: LeaderboardEntry[] }>(
          `/v1/game/leaderboard?section=${encodeURIComponent(section)}`,
          { accessToken: token },
        );
        setLeaderboard(response.data);
      } catch {
        setLeaderboard(null);
      }
    },
    [mode, getAccessToken],
  );

  const recordRound = useCallback(
    async (round: GameRound): Promise<{ newBest: boolean }> => {
      if (!accountKey) return { newBest: false };
      let newBest = false;
      setStats((current) => {
        const previousBest = current.best[round.section] ?? 0;
        newBest = round.score > previousBest;
        const next: GameStats = {
          games: current.games + 1,
          best: { ...current.best, [round.section]: Math.max(previousBest, round.score) },
          recent: [round, ...current.recent].slice(0, 20),
        };
        void AsyncStorage.setItem(keyFor(accountKey), JSON.stringify(next));
        return next;
      });
      if (mode === 'server') {
        try {
          const token = await getAccessToken();
          if (token) {
            await apiRequest('/v1/me/game-scores', {
              method: 'POST',
              accessToken: token,
              body: JSON.stringify(round),
            });
          }
        } catch {
          // Kept locally; the server board simply won't include this round.
        }
      }
      return { newBest };
    },
    [accountKey, mode, getAccessToken],
  );

  return { stats, leaderboard, loadLeaderboard, recordRound };
}

import { useCallback } from 'react';
import { ECONOMY, type Wallet } from './progress';
import { useProgressStorage } from './useProgressStorage';

/** One coin wallet shared by both word games: bonus words and solved levels earn coins, hints spend them. */
export function useHintSystem() {
  const { value, update, ready } = useProgressStorage<Wallet>('wallet', { coins: ECONOMY.startingCoins });

  const canAfford = useCallback((cost: number = ECONOMY.hintCost) => value.coins >= cost, [value.coins]);

  const spend = useCallback(
    (cost: number = ECONOMY.hintCost) => {
      if (value.coins < cost) return false;
      update((wallet) => ({ coins: Math.max(0, wallet.coins - cost) }));
      return true;
    },
    [value.coins, update],
  );

  const earn = useCallback(
    (amount: number) => {
      if (amount > 0) update((wallet) => ({ coins: wallet.coins + amount }));
    },
    [update],
  );

  return { coins: value.coins, ready, canAfford, spend, earn, hintCost: ECONOMY.hintCost };
}

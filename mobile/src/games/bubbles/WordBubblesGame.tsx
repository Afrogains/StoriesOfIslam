import { ArrowRight, BookOpen, Lightbulb, RotateCcw, Shuffle, Sparkles, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, LinearTransition, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Body, BodyStrong, Caption, GradientButton, OutlineButton, Overline, Row, Small, Title, useTheme } from '../../components/ui';
import { alpha, brandGradients, radius } from '../../theme/tokens';
import { GameCard, GameHeader, LevelStrip } from '../shared/GameChrome';
import { bubbleLevels } from '../shared/levels';
import { ECONOMY, EMPTY_PROGRESS, firstOpenLevelIndex, isLevelUnlocked, recordLevelComplete } from '../shared/progress';
import { useGameFeedback } from '../shared/useGameFeedback';
import { useHintSystem } from '../shared/useHintSystem';
import { useProgressStorage } from '../shared/useProgressStorage';
import { BOARD_COLUMNS, type Bubble } from './bubbleEngine';
import { useBubbleGame } from './useBubbleGame';

const LEVEL_IDS = bubbleLevels.map((level) => level.levelId);
const GAP = 6;
const MAX_BUBBLE = 54;

function BubbleButton({
  bubble,
  size,
  reachable,
  selected,
  hinted,
  onPress,
}: {
  bubble: Bubble;
  size: number;
  reachable: boolean;
  selected: boolean;
  hinted: boolean;
  onPress: (id: string) => void;
}) {
  const { colors, isDark } = useTheme();
  const fill = selected ? colors.gold : reachable ? (isDark ? colors.cardAlt : '#FFFFFF') : alpha(colors.emerald, isDark ? 0.18 : 0.08);
  const border = hinted ? colors.gold : selected ? colors.goldDark : reachable ? alpha(colors.emerald, 0.55) : 'transparent';
  return (
    <Animated.View layout={LinearTransition.springify().damping(16)} entering={ZoomIn.springify()} exiting={ZoomOut.duration(220)}>
      <Pressable
        onPress={() => onPress(bubble.id)}
        disabled={!reachable}
        accessibilityRole="button"
        accessibilityLabel={`${bubble.letter}${reachable ? '' : ', out of reach'}${selected ? ', selected' : ''}`}
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: fill,
            borderColor: border,
            borderWidth: hinted ? 3 : 1.5,
            opacity: reachable ? 1 : 0.55,
          },
        ]}
      >
        <Title style={{ fontSize: size * 0.42, lineHeight: size * 0.52 }} color={selected ? '#FFFFFF' : reachable ? colors.ink : colors.inkSubtle}>
          {bubble.letter}
        </Title>
      </Pressable>
    </Animated.View>
  );
}

function WordSlots({ words, found, hintWord }: { words: string[]; found: string[]; hintWord: string | null }) {
  const { colors } = useTheme();
  return (
    <View style={styles.slots}>
      {words.map((word) => {
        const done = found.includes(word);
        const hinted = !done && word === hintWord;
        return (
          <View
            key={word}
            style={[
              styles.slot,
              {
                borderColor: done ? colors.emerald : hinted ? colors.gold : colors.border,
                backgroundColor: done ? alpha(colors.emerald, 0.12) : 'transparent',
              },
            ]}
            accessibilityLabel={done ? `${word}, found` : `${word.length}-letter word, not found yet`}
          >
            <Small color={done ? colors.emerald : hinted ? colors.gold : colors.inkSubtle} style={styles.slotText}>
              {done ? word : hinted ? `${word[0]}${' _'.repeat(word.length - 1)}` : '_ '.repeat(word.length).trim()}
            </Small>
          </View>
        );
      })}
    </View>
  );
}

export default function WordBubblesGame({ onExit, contentStyle }: { onExit: () => void; contentStyle?: StyleProp<ViewStyle> }) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const hints = useHintSystem();
  const feedback = useGameFeedback();
  const progress = useProgressStorage('wordBubbles', EMPTY_PROGRESS);
  const [levelId, setLevelId] = useState<string | null>(null);

  useEffect(() => {
    if (progress.ready && levelId === null) setLevelId(LEVEL_IDS[firstOpenLevelIndex(LEVEL_IDS, progress.value)]);
  }, [progress.ready, progress.value, levelId]);

  const level = bubbleLevels.find((candidate) => candidate.levelId === levelId) ?? bubbleLevels[0];
  const levelIndex = LEVEL_IDS.indexOf(level.levelId);

  const alreadySolved = progress.value.completedLevels.includes(level.levelId);
  const onComplete = (score: number) => {
    if (!alreadySolved) hints.earn(ECONOMY.levelCompleteReward);
    progress.update((current) => recordLevelComplete(current, level.levelId, score));
  };

  const game = useBubbleGame(level, { hints, feedback, onComplete });
  const { state } = game;

  const boardWidth = Math.min(width, 520) - 40;
  const size = Math.min(MAX_BUBBLE, Math.floor((boardWidth - GAP * (BOARD_COLUMNS - 1)) / BOARD_COLUMNS));
  const rows = useMemo(() => Math.max(...state.columns.map((column) => column.length), 1), [state.columns]);
  const [boardRows, setBoardRows] = useState(rows);
  useEffect(() => {
    setBoardRows((current) => (state.found.length === 0 ? rows : Math.max(current, rows)));
  }, [rows, state.found.length, state.levelId]);

  const longest = Math.max(0, ...game.remaining.map((word) => word.length));
  const [rejected, setRejected] = useState(false);
  useEffect(() => {
    if (!game.staged || game.staged.length < longest) return;
    setRejected(true);
    feedback.error();
    const timer = setTimeout(() => {
      setRejected(false);
      game.clear();
    }, 450);
    return () => clearTimeout(timer);
    // Only re-evaluate when the staged letters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.staged]);

  const chips = bubbleLevels.map((candidate, index) => ({
    id: candidate.levelId,
    label: candidate.prophetTheme.replace('Prophet ', ''),
    done: progress.value.completedLevels.includes(candidate.levelId),
    locked: !isLevelUnlocked(LEVEL_IDS, index, progress.value),
  }));
  const nextLevel = bubbleLevels[levelIndex + 1];
  const emerald = brandGradients.emerald[isDark ? 'dark' : 'light'];
  const gold = brandGradients.gold[isDark ? 'dark' : 'light'];

  return (
    <ScrollView contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>
      <GameHeader
        subtitle={`Level ${levelIndex + 1} · ${level.prophetTheme}`}
        title="Prophetic Word Bubbles"
        coins={hints.coins}
        score={state.score}
        onBack={onExit}
      />
      <LevelStrip levels={chips} activeId={level.levelId} onSelect={setLevelId} />

      <GameCard tint={colors.emerald}>
        <Overline color={colors.emerald}>{level.prophetTheme}</Overline>
        <Body color={colors.ink}>{level.storyClue}</Body>
        {game.hintWord ? (
          <Animated.View entering={FadeIn}>
            <Row gap={6} align="flex-start">
              <Lightbulb size={14} color={colors.gold} style={styles.iconNudge} />
              <Small color={colors.gold} style={styles.flex}>
                {state.clues[game.hintWord]}
              </Small>
            </Row>
          </Animated.View>
        ) : null}
      </GameCard>

      <WordSlots words={state.words} found={state.found} hintWord={game.hintWord} />

      {game.complete ? (
        <Animated.View entering={ZoomIn.springify()}>
          <GameCard tint={colors.gold}>
            <Row gap={8} align="center">
              <Sparkles size={18} color={colors.gold} />
              <Title style={styles.flex}>Story complete</Title>
              <BodyStrong color={colors.emerald}>+{state.score}</BodyStrong>
            </Row>
            <Overline>Reflection</Overline>
            <Body color={colors.ink}>{level.postLevelTakeaway}</Body>
            <Row gap={6} align="center">
              <BookOpen size={12} color={colors.inkSubtle} />
              <Caption>{level.source}</Caption>
            </Row>
            <Row gap={10} style={styles.actions}>
              <OutlineButton label="Replay" icon={RotateCcw} onPress={game.restart} style={styles.flex} />
              {nextLevel ? (
                <GradientButton
                  label={`Next: ${nextLevel.prophetTheme.replace('Prophet ', '')}`}
                  icon={ArrowRight}
                  gradient={emerald}
                  onPress={() => setLevelId(nextLevel.levelId)}
                  style={styles.flex}
                />
              ) : (
                <GradientButton label="All stories solved" icon={Sparkles} gradient={gold} onPress={onExit} style={styles.flex} />
              )}
            </Row>
          </GameCard>
        </Animated.View>
      ) : (
        <>
          <View
            style={[
              styles.board,
              {
                height: boardRows * (size + GAP) + 12,
                backgroundColor: isDark ? alpha(colors.emerald, 0.06) : alpha(colors.emerald, 0.04),
                borderColor: colors.border,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.reachBand,
                { height: 3 * (size + GAP) + 6, backgroundColor: alpha(colors.gold, isDark ? 0.08 : 0.07), borderColor: alpha(colors.gold, 0.3) },
              ]}
            />
            <Row gap={GAP} align="flex-end" justify="center" style={styles.columns}>
              {state.columns.map((column, columnIndex) => (
                <View key={columnIndex} style={[styles.column, { width: size, gap: GAP }]}>
                  {column.map((bubble) => (
                    <BubbleButton
                      key={bubble.id}
                      bubble={bubble}
                      size={size}
                      reachable={game.reachable.has(bubble.id)}
                      selected={state.selection.includes(bubble.id)}
                      hinted={state.hintBubbleId === bubble.id}
                      onPress={game.tap}
                    />
                  ))}
                </View>
              ))}
            </Row>
          </View>
          <Caption style={styles.center}>Tap glowing bubbles in the gold band. Popped words let the rest fall into reach.</Caption>

          <Row
            gap={8}
            align="center"
            style={[
              styles.staging,
              {
                borderColor: rejected ? '#DC2626' : game.staged ? colors.gold : colors.border,
                backgroundColor: isDark ? colors.card : '#FFFFFF',
              },
            ]}
          >
            <View style={styles.stagedLetters}>
              {game.staged ? (
                [...game.staged].map((letter, index) => (
                  <Animated.View key={`${index}-${letter}`} entering={ZoomIn.duration(140)} style={[styles.tile, { backgroundColor: rejected ? '#DC2626' : colors.gold }]}>
                    <BodyStrong color="#FFFFFF">{letter}</BodyStrong>
                  </Animated.View>
                ))
              ) : (
                <Small color={colors.inkSubtle}>Spell a word from the story</Small>
              )}
            </View>
            <Pressable
              onPress={game.clear}
              disabled={!game.staged}
              accessibilityRole="button"
              accessibilityLabel="Clear word"
              hitSlop={8}
              style={[styles.clear, { opacity: game.staged ? 1 : 0.35, backgroundColor: colors.subtleBg }]}
            >
              <X size={16} color={colors.inkMuted} />
            </Pressable>
          </Row>

          {state.lastEvent?.type === 'pop' && state.lastEvent.relayered ? (
            <Small color={colors.emerald} style={styles.center}>
              The bubbles settled into a new order so another story word is in reach.
            </Small>
          ) : null}
          {game.stuck ? (
            <Small color={colors.gold} style={styles.center}>
              No story word is in reach right now. Shuffle to rearrange the bubbles.
            </Small>
          ) : null}

          <Row gap={10}>
            <OutlineButton label="Shuffle" icon={Shuffle} onPress={game.shuffle} style={styles.flex} />
            <GradientButton
              label={`Hint · ${hints.hintCost}`}
              icon={Lightbulb}
              gradient={gold}
              disabled={!hints.canAfford()}
              onPress={game.hint}
              style={styles.flex}
            />
          </Row>
          {!hints.canAfford() ? (
            <Caption style={styles.center}>Out of hint coins. Solve stories or find Wordscapes bonus words to earn more.</Caption>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 14, width: '100%', maxWidth: 560, alignSelf: 'center' },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  iconNudge: { marginTop: 2 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  slot: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  slotText: { fontWeight: '800', letterSpacing: 1.5 },
  board: { borderRadius: radius.lg, borderWidth: 1, justifyContent: 'flex-end', overflow: 'hidden', paddingBottom: 6 },
  reachBand: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderStyle: 'dashed' },
  columns: { paddingHorizontal: 6 },
  column: { flexDirection: 'column-reverse', alignItems: 'center' },
  bubble: { alignItems: 'center', justifyContent: 'center' },
  staging: { borderWidth: 1.5, borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 10, minHeight: 56 },
  stagedLetters: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  tile: { width: 30, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  clear: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actions: { marginTop: 6 },
});

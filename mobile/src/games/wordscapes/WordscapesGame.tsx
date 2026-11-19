import { ArrowRight, BookOpen, Gift, Lightbulb, Lock, RotateCcw, ScrollText, Shuffle, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Body, BodyStrong, Caption, GradientButton, OutlineButton, Overline, Row, Small, Title, useTheme } from '../../components/ui';
import { alpha, brandGradients, radius } from '../../theme/tokens';
import { GameCard, GameHeader, LevelStrip } from '../shared/GameChrome';
import { wordscapesChapters, wordscapesLevels } from '../shared/levels';
import {
  ECONOMY,
  EMPTY_PROGRESS,
  addBonusWord,
  firstOpenLevelIndex,
  isLevelUnlocked,
  recordLevelComplete,
  type WordGameProgress,
} from '../shared/progress';
import type { WordscapesChapter } from '../shared/types';
import { useGameFeedback } from '../shared/useGameFeedback';
import { useHintSystem } from '../shared/useHintSystem';
import { useProgressStorage } from '../shared/useProgressStorage';
import CrosswordGrid from './CrosswordGrid';
import LetterWheel from './LetterWheel';
import { useWordscapesGame } from './useWordscapesGame';

const LEVEL_IDS = wordscapesLevels.map((level) => level.levelId);

const RESULT_COPY = {
  found: (word: string) => `${word} revealed`,
  repeat: (word: string) => `${word} is already on the grid`,
  bonus: (word: string) => `Bonus word ${word}! +${ECONOMY.bonusWordReward} coin`,
  bonusRepeat: (word: string) => `${word} is already in your chest`,
  short: () => 'Words need at least 3 letters',
  invalid: (word: string) => `${word} isn't one of the story words`,
} as const;

function chapterDone(chapter: WordscapesChapter, progress: WordGameProgress) {
  return chapter.levels.every((level) => progress.completedLevels.includes(level.levelId));
}

function ChapterSummary({ chapter, unlocked }: { chapter: WordscapesChapter; unlocked: boolean }) {
  const { colors } = useTheme();
  return (
    <GameCard tint={unlocked ? colors.gold : undefined}>
      <Row gap={8} align="center">
        {unlocked ? <ScrollText size={16} color={colors.gold} /> : <Lock size={14} color={colors.inkSubtle} />}
        <Overline style={styles.flex}>
          Chapter {chapter.chapterNumber} · {chapter.prophet}
        </Overline>
      </Row>
      <BodyStrong>{chapter.title}</BodyStrong>
      {unlocked ? (
        <Body color={colors.ink}>{chapter.summary}</Body>
      ) : (
        <Small color={colors.inkSubtle}>Solve every level in this chapter to unlock its takeaway.</Small>
      )}
    </GameCard>
  );
}

export default function WordscapesGame({ onExit, contentStyle }: { onExit: () => void; contentStyle?: StyleProp<ViewStyle> }) {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const hints = useHintSystem();
  const feedback = useGameFeedback();
  const progress = useProgressStorage('wordscapes', EMPTY_PROGRESS);
  const [levelId, setLevelId] = useState<string | null>(null);
  const [swipeWord, setSwipeWord] = useState('');
  const [chestOpen, setChestOpen] = useState(false);

  useEffect(() => {
    if (progress.ready && levelId === null) setLevelId(LEVEL_IDS[firstOpenLevelIndex(LEVEL_IDS, progress.value)]);
  }, [progress.ready, progress.value, levelId]);

  const level = wordscapesLevels.find((candidate) => candidate.levelId === levelId) ?? wordscapesLevels[0];
  const levelIndex = LEVEL_IDS.indexOf(level.levelId);
  const chapter = wordscapesChapters.find((candidate) => candidate.chapterId === level.chapterId) ?? wordscapesChapters[0];
  const alreadySolved = progress.value.completedLevels.includes(level.levelId);

  const onComplete = (score: number) => {
    if (!alreadySolved) hints.earn(ECONOMY.levelCompleteReward);
    progress.update((current) => recordLevelComplete(current, level.levelId, score));
  };

  const onBonusWord = (word: string) => {
    if (!progress.value.bonusWords.includes(word)) hints.earn(ECONOMY.bonusWordReward);
    progress.update((current) => addBonusWord(current, word));
  };

  const game = useWordscapesGame(level, { hints, feedback, onComplete, onBonusWord });
  const { state } = game;
  const lastResult = state.lastResult;
  const flashWord = lastResult?.result === 'found' || lastResult?.result === 'repeat' ? lastResult.word : null;

  const contentWidth = Math.min(width, 560) - 40;
  const wheelSize = Math.min(contentWidth - 96, 300, height * 0.36);
  const chapterComplete = chapterDone(chapter, progress.value);
  const nextLevel = wordscapesLevels[levelIndex + 1];
  const emerald = brandGradients.emerald[isDark ? 'dark' : 'light'];
  const gold = brandGradients.gold[isDark ? 'dark' : 'light'];

  const chips = wordscapesLevels.map((candidate, index) => {
    const owner = wordscapesChapters.find((item) => item.chapterId === candidate.chapterId);
    const position = owner ? owner.levels.findIndex((item) => item.levelId === candidate.levelId) : 0;
    const name = candidate.prophetTheme.replace('Prophet ', '');
    return {
      id: candidate.levelId,
      label: owner && owner.levels.length > 1 ? `${name} ${position + 1}` : name,
      done: progress.value.completedLevels.includes(candidate.levelId),
      locked: !isLevelUnlocked(LEVEL_IDS, index, progress.value),
    };
  });

  return (
    <ScrollView contentContainerStyle={[styles.content, contentStyle]} scrollEnabled={!swipeWord} showsVerticalScrollIndicator={false}>
      <GameHeader
        subtitle={`Chapter ${chapter.chapterNumber} · ${chapter.prophet}`}
        title="Prophetic Wordscapes"
        coins={hints.coins}
        score={game.score}
        onBack={onExit}
      />
      <LevelStrip levels={chips} activeId={level.levelId} onSelect={setLevelId} />

      <GameCard tint={colors.emerald}>
        <Overline color={colors.emerald}>{chapter.title}</Overline>
        <Body color={colors.ink}>{level.storyClue}</Body>
      </GameCard>

      <CrosswordGrid
        cells={game.cells}
        state={state}
        width={level.grid.width}
        height={level.grid.height}
        maxWidth={contentWidth}
        maxHeight={Math.max(160, height * 0.28)}
        flashWord={flashWord}
      />

      <View style={styles.feedbackRow}>
        {swipeWord ? (
          <Animated.View entering={FadeIn.duration(120)} style={[styles.preview, { backgroundColor: colors.gold }]}>
            <Title color="#FFFFFF" style={styles.previewText}>
              {swipeWord}
            </Title>
          </Animated.View>
        ) : lastResult ? (
          <Animated.View key={state.eventId} entering={FadeInDown.duration(200)}>
            <Small
              color={lastResult.result === 'invalid' || lastResult.result === 'short' ? '#DC2626' : lastResult.result === 'bonus' ? colors.gold : colors.emerald}
              style={styles.center}
            >
              {RESULT_COPY[lastResult.result](lastResult.word)}
            </Small>
          </Animated.View>
        ) : (
          <Caption style={styles.center}>Swipe across the letters to spell a word from the story.</Caption>
        )}
      </View>

      {game.complete ? (
        <Animated.View entering={ZoomIn.springify()} style={styles.stack}>
          <GameCard tint={colors.gold}>
            <Row gap={8} align="center">
              <Sparkles size={18} color={colors.gold} />
              <Title style={styles.flex}>Level solved</Title>
              <BodyStrong color={colors.emerald}>+{game.score}</BodyStrong>
            </Row>
            <Overline>Takeaway</Overline>
            <Body color={colors.ink}>{level.postLevelTakeaway}</Body>
            <Row gap={6} align="center">
              <BookOpen size={12} color={colors.inkSubtle} />
              <Caption>{level.source}</Caption>
            </Row>
          </GameCard>
          {chapterComplete ? <ChapterSummary chapter={chapter} unlocked /> : null}
          <Row gap={10}>
            <OutlineButton label="Replay" icon={RotateCcw} onPress={game.restart} style={styles.flex} />
            {nextLevel ? (
              <GradientButton
                label={nextLevel.chapterId === chapter.chapterId ? 'Next level' : 'Next chapter'}
                icon={ArrowRight}
                gradient={emerald}
                onPress={() => setLevelId(nextLevel.levelId)}
                style={styles.flex}
              />
            ) : (
              <GradientButton label="All chapters solved" icon={Sparkles} gradient={gold} onPress={onExit} style={styles.flex} />
            )}
          </Row>
        </Animated.View>
      ) : (
        <Row gap={12} align="center" justify="center">
          <Pressable
            onPress={game.shuffle}
            accessibilityRole="button"
            accessibilityLabel="Shuffle letters"
            style={[styles.round, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Shuffle size={18} color={colors.ink} />
          </Pressable>
          <LetterWheel
            letters={state.wheel}
            size={wheelSize}
            onPathChange={setSwipeWord}
            onSubmit={game.submit}
            onLetter={feedback.tap}
          />
          <Pressable
            onPress={game.hint}
            disabled={!hints.canAfford()}
            accessibilityRole="button"
            accessibilityLabel={`Reveal a letter for ${hints.hintCost} coins`}
            style={[styles.round, { borderColor: alpha(colors.gold, 0.5), backgroundColor: alpha(colors.gold, 0.12), opacity: hints.canAfford() ? 1 : 0.4 }]}
          >
            <Lightbulb size={18} color={colors.gold} />
            <Caption color={colors.gold} style={styles.cost}>
              {hints.hintCost}
            </Caption>
          </Pressable>
        </Row>
      )}

      <Pressable
        onPress={() => setChestOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: chestOpen }}
        style={[styles.chest, { borderColor: alpha(colors.gold, 0.4), backgroundColor: alpha(colors.gold, isDark ? 0.12 : 0.08) }]}
      >
        <Row gap={8} align="center">
          <Gift size={16} color={colors.gold} />
          <BodyStrong style={styles.flex}>Bonus words chest</BodyStrong>
          <BodyStrong color={colors.gold}>{progress.value.bonusWords.length}</BodyStrong>
        </Row>
        {chestOpen ? (
          <Small style={styles.chestBody}>
            {progress.value.bonusWords.length
              ? progress.value.bonusWords.join(' · ')
              : `Spell story words that aren't on the grid to earn ${ECONOMY.bonusWordReward} hint coin each.`}
          </Small>
        ) : null}
      </Pressable>

      <Overline style={styles.section}>Chapter takeaways</Overline>
      {wordscapesChapters.map((item) => (
        <ChapterSummary key={item.chapterId} chapter={item} unlocked={chapterDone(item, progress.value)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 14, width: '100%', maxWidth: 560, alignSelf: 'center' },
  flex: { flex: 1 },
  stack: { gap: 12 },
  center: { textAlign: 'center' },
  feedbackRow: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  preview: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: radius.pill },
  previewText: { letterSpacing: 3, fontSize: 20, lineHeight: 28 },
  round: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cost: { fontSize: 10, lineHeight: 12, fontWeight: '800' },
  chest: { borderRadius: radius.lg, borderWidth: 1, padding: 12 },
  chestBody: { marginTop: 6 },
  section: { marginTop: 8 },
});

import {
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Gamepad2,
  LogIn,
  Medal,
  RotateCcw,
  Sparkles,
  Trophy,
  UserPlus,
  WifiOff,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { useAuthSheet } from '../components/AuthSheet';
import { QuestionView } from '../components/ChapterQuiz';
import ScreenHeader from '../components/ScreenHeader';
import {
  Body,
  BodyStrong,
  Caption,
  GradientButton,
  OutlineButton,
  Overline,
  Pill,
  Row,
  Small,
  Title,
  useTheme,
} from '../components/ui';
import { useCatalog } from '../data/CatalogProvider';
import { sectionsMeta } from '../data/catalogMeta';
import { drawGameQuestions, type GameQuestion } from '../data/quiz';
import { scoreAnswer, useGameStats, type GameSection } from '../hooks/useGameStats';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { useQuizResults } from '../hooks/useQuizResults';
import { alpha, brandGradients, radius, sectionAccent, shadow } from '../theme/tokens';
import type { SectionSlug } from '../types/catalog';

const ROUND_SIZE = 10;
const SECONDS_PER_QUESTION = 20;

type Phase = 'lobby' | 'playing' | 'results';

const SECTION_CHOICES: { value: GameSection; label: string }[] = [
  { value: 'all', label: 'All' },
  ...(Object.keys(sectionsMeta) as SectionSlug[]).map((slug) => ({ value: slug, label: sectionsMeta[slug].shortTitle ?? sectionsMeta[slug].title })),
];

function sectionLabel(section: GameSection): string {
  return SECTION_CHOICES.find((choice) => choice.value === section)?.label ?? 'All';
}

function StatTile({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Trophy; color: string }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: isDark ? colors.cardAlt : colors.card, borderColor: colors.border }]}>
      <Icon size={16} color={color} />
      <Title style={styles.statValue}>{value}</Title>
      <Caption color={colors.inkMuted}>{label}</Caption>
    </View>
  );
}

export default function GameScreen() {
  const { colors, isDark } = useTheme();
  const { screenContent } = useMobileLayout();
  const { user, mode } = useAuth();
  const { openAuth } = useAuthSheet();
  const { stories } = useCatalog();
  const { summary } = useQuizResults();
  const { stats, leaderboard, loadLeaderboard, recordRound } = useGameStats();
  const scrollRef = useRef<ScrollView>(null);

  const [section, setSection] = useState<GameSection>('all');
  const [phase, setPhase] = useState<Phase>('lobby');
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [position, setPosition] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastPoints, setLastPoints] = useState(0);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [hidden, setHidden] = useState<number[]>([]);
  const [newBest, setNewBest] = useState(false);

  const question = questions[position];
  const answered = picked !== null || timedOut;
  const accent = question ? sectionAccent(question.sectionSlug, isDark).primary : colors.emerald;

  useEffect(() => {
    if (user) void loadLeaderboard(section);
  }, [user, section, loadLeaderboard, phase]);

  useEffect(() => {
    if (phase !== 'playing' || answered) return;
    if (secondsLeft <= 0) {
      setTimedOut(true);
      setStreak(0);
      setLastPoints(0);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, answered, secondsLeft]);

  const start = useCallback(() => {
    const drawn = drawGameQuestions(stories, ROUND_SIZE, `${Date.now()}`, section);
    setQuestions(drawn);
    setPosition(0);
    setPicked(null);
    setTimedOut(false);
    setSecondsLeft(SECONDS_PER_QUESTION);
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setLastPoints(0);
    setFiftyUsed(false);
    setHidden([]);
    setNewBest(false);
    setPhase('playing');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [stories, section]);

  const pick = (index: number) => {
    if (!question || answered) return;
    setPicked(index);
    const isCorrect = index === question.answerIndex;
    const nextStreak = isCorrect ? streak + 1 : 0;
    const points = scoreAnswer(isCorrect, secondsLeft, nextStreak);
    setStreak(nextStreak);
    setBestStreak((value) => Math.max(value, nextStreak));
    setLastPoints(points);
    if (isCorrect) setCorrect((value) => value + 1);
    setScore((value) => value + points);
  };

  const useFifty = () => {
    if (!question || fiftyUsed || answered) return;
    const wrong = question.options.map((_, index) => index).filter((index) => index !== question.answerIndex);
    setHidden(wrong.sort(() => Math.random() - 0.5).slice(0, 2));
    setFiftyUsed(true);
  };

  const next = async () => {
    if (position < questions.length - 1) {
      setPosition(position + 1);
      setPicked(null);
      setTimedOut(false);
      setHidden([]);
      setSecondsLeft(SECONDS_PER_QUESTION);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const result = await recordRound({
      section,
      score,
      correct,
      total: questions.length,
      bestStreak,
      playedAt: new Date().toISOString(),
    });
    setNewBest(result.newBest);
    setPhase('results');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const visibleQuestion = useMemo(() => {
    if (!question || !hidden.length) return question;
    return { ...question, options: question.options.map((option, index) => (hidden.includes(index) ? '—' : option)) };
  }, [question, hidden]);

  const emerald = brandGradients.emerald[isDark ? 'dark' : 'light'];
  const gold = brandGradients.gold[isDark ? 'dark' : 'light'];

  if (!user) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.paper }]}>
        <ScrollView contentContainerStyle={[styles.content, screenContent]}>
          <ScreenHeader eyebrow="Test your knowledge" title="Knowledge Quest" arabic="مسابقة المعرفة" />
          <View style={[styles.hero, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }, shadow('sm', isDark)]}>
            <View style={[styles.heroIcon, { backgroundColor: alpha(colors.gold, 0.14) }]}>
              <Gamepad2 size={28} color={colors.gold} />
            </View>
            <Title style={styles.center}>A quiz game for registered readers</Title>
            <Body style={styles.center}>
              Ten timed questions drawn from the Prophets, the Quran’s stories, the Seerah and the Companions. Answer
              fast for bonus points, build streaks, and beat your best score.
            </Body>
            <GradientButton
              label="Create a free account"
              icon={UserPlus}
              size="lg"
              gradient={emerald}
              onPress={() => openAuth({ tab: 'register', reason: 'Create a free account to play Knowledge Quest and keep your scores.' })}
            />
            <OutlineButton
              label="I already have an account"
              icon={LogIn}
              onPress={() => openAuth({ tab: 'signin', reason: 'Sign in to play Knowledge Quest.' })}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.paper }]}>
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, screenContent]} showsVerticalScrollIndicator={false}>
        {phase === 'lobby' ? (
          <>
            <ScreenHeader eyebrow={`Salaam, ${user.name.split(' ')[0]}`} title="Knowledge Quest" arabic="مسابقة المعرفة" />
            <Row gap={10} style={styles.stats}>
              <StatTile label="Best score" value={String(stats.best[section] ?? 0)} icon={Trophy} color={colors.gold} />
              <StatTile label="Rounds played" value={String(stats.games)} icon={Gamepad2} color={colors.emerald} />
              <StatTile label="Chapters checked" value={String(summary.chapters)} icon={Sparkles} color={colors.azure} />
            </Row>

            <Overline style={styles.label}>Choose a topic</Overline>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
              {SECTION_CHOICES.map((choice) => (
                <Pill
                  key={choice.value}
                  label={choice.label}
                  selected={section === choice.value}
                  onPress={() => setSection(choice.value)}
                  gradient={emerald}
                />
              ))}
            </ScrollView>

            <View style={[styles.rules, { backgroundColor: isDark ? colors.cardAlt : colors.subtleBg }]}>
              <Row gap={8} align="center">
                <Clock size={14} color={colors.inkMuted} />
                <Small>{ROUND_SIZE} questions · {SECONDS_PER_QUESTION} seconds each</Small>
              </Row>
              <Row gap={8} align="center">
                <Flame size={14} color={colors.inkMuted} />
                <Small>100 points per answer, +5 per second left, +50 on a 3-answer streak</Small>
              </Row>
              <Row gap={8} align="center">
                <Sparkles size={14} color={colors.inkMuted} />
                <Small>One 50:50 lifeline per round</Small>
              </Row>
            </View>

            <GradientButton label={`Play · ${sectionLabel(section)}`} icon={Gamepad2} size="lg" gradient={gold} onPress={start} />
            <Caption color={colors.inkSubtle} style={styles.note}>
              Questions are auto-generated from the stories in this app.
            </Caption>

            <Overline style={styles.label}>Leaderboard · {sectionLabel(section)}</Overline>
            {mode !== 'server' ? (
              <Row gap={8} align="center" style={styles.boardEmpty}>
                <WifiOff size={14} color={colors.inkSubtle} />
                <Small color={colors.inkSubtle} style={styles.flex}>
                  Your account is saved on this device, so the online leaderboard isn’t available. Your best scores are
                  still kept here.
                </Small>
              </Row>
            ) : leaderboard?.length ? (
              <View style={[styles.board, { borderColor: colors.border }]}>
                {leaderboard.map((entry, index) => (
                  <Row
                    key={`${entry.name}-${index}`}
                    gap={10}
                    align="center"
                    style={[styles.boardRow, entry.isYou && { backgroundColor: alpha(colors.gold, 0.12) }]}
                  >
                    {index < 3 ? <Medal size={16} color={['#D4AF37', '#A8A9AD', '#CD7F32'][index]} /> : <Caption style={styles.rank}>{index + 1}</Caption>}
                    <BodyStrong style={styles.flex}>{entry.isYou ? `${entry.name} (you)` : entry.name}</BodyStrong>
                    <BodyStrong color={colors.gold}>{entry.score}</BodyStrong>
                  </Row>
                ))}
              </View>
            ) : (
              <Small color={colors.inkSubtle} style={styles.boardEmpty}>
                {leaderboard ? 'No scores yet — be the first.' : 'Leaderboard is unavailable right now.'}
              </Small>
            )}
          </>
        ) : null}

        {phase === 'playing' && visibleQuestion ? (
          <View style={styles.playing}>
            <Row gap={10} align="center" style={styles.hud}>
              <View style={[styles.timer, { borderColor: secondsLeft <= 5 && !answered ? '#DC2626' : colors.border }]}>
                <Clock size={14} color={secondsLeft <= 5 && !answered ? '#DC2626' : colors.inkMuted} />
                <BodyStrong color={secondsLeft <= 5 && !answered ? '#DC2626' : colors.ink}>{secondsLeft}s</BodyStrong>
              </View>
              <View style={styles.flex}>
                <Caption color={colors.inkMuted}>{sectionsMeta[visibleQuestion.sectionSlug].title}</Caption>
                <Small numberOfLines={1} color={colors.ink}>
                  {visibleQuestion.storyTitle}
                </Small>
              </View>
              <View style={styles.scoreBox}>
                <Caption color={colors.inkMuted}>Score</Caption>
                <BodyStrong color={colors.gold}>{score}</BodyStrong>
              </View>
            </Row>
            {streak >= 2 ? (
              <Row gap={6} align="center">
                <Flame size={14} color="#EA580C" />
                <Caption color="#EA580C">{streak} in a row</Caption>
              </Row>
            ) : null}

            <View style={[styles.questionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: alpha(accent, 0.35) }, shadow('sm', isDark)]}>
              <QuestionView
                question={visibleQuestion}
                number={position + 1}
                count={questions.length}
                picked={timedOut && picked === null ? -1 : picked}
                onPick={(index) => {
                  if (!hidden.includes(index)) pick(index);
                }}
                accent={accent}
              />
              {timedOut && picked === null ? <BodyStrong color="#DC2626">Time’s up!</BodyStrong> : null}
              {answered && lastPoints > 0 ? <BodyStrong color={colors.gold}>+{lastPoints} points</BodyStrong> : null}
            </View>

            {answered ? (
              <GradientButton
                label={position < questions.length - 1 ? 'Next question' : 'See results'}
                icon={ChevronRight}
                size="lg"
                gradient={emerald}
                onPress={() => void next()}
              />
            ) : (
              <OutlineButton
                label={fiftyUsed ? '50:50 used' : 'Use 50:50 lifeline'}
                icon={Sparkles}
                disabled={fiftyUsed}
                onPress={useFifty}
              />
            )}
            <Pressable onPress={() => setPhase('lobby')} accessibilityRole="button" style={styles.quit}>
              <Caption color={colors.inkSubtle}>Quit round</Caption>
            </Pressable>
          </View>
        ) : null}

        {phase === 'playing' && !visibleQuestion ? (
          <View style={styles.playing}>
            <Body>Not enough questions for this topic yet. Try another topic.</Body>
            <OutlineButton label="Back" onPress={() => setPhase('lobby')} />
          </View>
        ) : null}

        {phase === 'results' ? (
          <View style={styles.results}>
            <View style={[styles.hero, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }, shadow('sm', isDark)]}>
              <View style={[styles.heroIcon, { backgroundColor: alpha(colors.gold, 0.14) }]}>
                {newBest ? <Crown size={28} color={colors.gold} /> : <Trophy size={28} color={colors.gold} />}
              </View>
              <Overline color={colors.gold}>{newBest ? 'New personal best!' : 'Round complete'}</Overline>
              <Title style={styles.bigScore}>{score}</Title>
              <Body style={styles.center}>
                {correct} of {questions.length} correct · best streak {bestStreak}
              </Body>
              <Small color={colors.inkMuted} style={styles.center}>
                {correct === questions.length
                  ? 'MashaAllah — a perfect round!'
                  : correct >= questions.length * 0.7
                    ? 'Excellent knowledge. Keep reading to go further.'
                    : 'Every story you read adds to your score next time.'}
              </Small>
              <GradientButton label="Play again" icon={RotateCcw} size="lg" gradient={gold} onPress={start} />
              <OutlineButton label="Back to Knowledge Quest" onPress={() => setPhase('lobby')} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  hero: { borderWidth: 1, borderRadius: radius.xl, padding: 20, gap: 14, alignItems: 'stretch' },
  heroIcon: { alignSelf: 'center', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  stats: { alignItems: 'stretch' },
  stat: { flex: 1, borderWidth: 1, borderRadius: radius.lg, padding: 12, gap: 2 },
  statValue: { fontSize: 20 },
  label: { marginTop: 6 },
  pills: { gap: 8, paddingRight: 20 },
  rules: { borderRadius: radius.lg, padding: 14, gap: 8 },
  note: { textAlign: 'center' },
  board: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  boardRow: { paddingHorizontal: 14, paddingVertical: 10 },
  boardEmpty: { marginBottom: 8 },
  rank: { width: 16, textAlign: 'center', fontWeight: '800' },
  playing: { gap: 12 },
  hud: { alignItems: 'center' },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    height: 36,
  },
  scoreBox: { alignItems: 'flex-end' },
  questionCard: { borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 10 },
  quit: { alignSelf: 'center', padding: 8 },
  results: { gap: 14 },
  bigScore: { fontSize: 40, lineHeight: 46, textAlign: 'center' },
});

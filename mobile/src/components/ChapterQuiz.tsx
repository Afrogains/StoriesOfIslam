import { CheckCircle2, ChevronRight, ClipboardCheck, RotateCcw, Trophy, XCircle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCatalog } from '../data/CatalogProvider';
import { getChapterQuiz, type QuizQuestion } from '../data/quiz';
import { useQuizResults } from '../hooks/useQuizResults';
import { alpha, brandGradients, radius, sectionAccent, shadow } from '../theme/tokens';
import type { StoryItem } from '../types/catalog';
import { Body, BodyStrong, Caption, GradientButton, OutlineButton, Overline, Small, Title, useTheme } from './ui';

type Phase = 'intro' | 'question' | 'done';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function QuestionView({
  question,
  number,
  count,
  picked,
  onPick,
  accent,
}: {
  question: QuizQuestion;
  number: number;
  count: number;
  picked: number | null;
  onPick: (index: number) => void;
  accent: string;
}) {
  const { colors, isDark } = useTheme();
  const answered = picked !== null;
  const correct = picked === question.answerIndex;
  return (
    <View style={styles.question}>
      <View style={styles.progressRow}>
        {Array.from({ length: count }, (_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index < number ? accent : colors.trackBg },
            ]}
          />
        ))}
      </View>
      <Caption color={colors.inkMuted}>
        Question {number} of {count}
      </Caption>
      <BodyStrong>{question.prompt}</BodyStrong>
      {question.quote ? (
        <View style={[styles.quote, { borderLeftColor: accent, backgroundColor: alpha(accent, isDark ? 0.14 : 0.06) }]}>
          <Body color={colors.ink} style={styles.quoteText}>
            “{question.quote}”
          </Body>
        </View>
      ) : null}
      <View style={styles.options}>
        {question.options.map((option, index) => {
          const isAnswer = index === question.answerIndex;
          const isPicked = index === picked;
          const tone = answered && isAnswer ? '#059669' : answered && isPicked ? '#DC2626' : null;
          return (
            <Pressable
              key={`${index}-${option}`}
              disabled={answered}
              onPress={() => onPick(index)}
              accessibilityRole="button"
              accessibilityState={{ disabled: answered, selected: isPicked }}
              accessibilityLabel={`Option ${OPTION_LETTERS[index]}: ${option}`}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: tone ?? colors.border,
                  backgroundColor: tone ? alpha(tone, isDark ? 0.2 : 0.08) : isDark ? colors.cardAlt : colors.card,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.letter, { backgroundColor: tone ?? alpha(accent, 0.12) }]}>
                <Caption color={tone ? '#FFFFFF' : accent} style={styles.letterText}>
                  {OPTION_LETTERS[index]}
                </Caption>
              </View>
              <Small color={colors.ink} style={styles.optionText}>
                {option}
              </Small>
              {answered && isAnswer ? <CheckCircle2 size={18} color="#059669" /> : null}
              {answered && isPicked && !isAnswer ? <XCircle size={18} color="#DC2626" /> : null}
            </Pressable>
          );
        })}
      </View>
      {answered ? (
        <View style={[styles.feedback, { backgroundColor: isDark ? colors.cardAlt : colors.subtleBg }]}>
          <BodyStrong color={correct ? '#059669' : '#DC2626'}>{correct ? 'Correct' : 'Not quite'}</BodyStrong>
          <Caption color={colors.inkMuted}>From the text:</Caption>
          <Small color={colors.ink}>{question.explanation}</Small>
        </View>
      ) : null}
    </View>
  );
}

export default function ChapterQuiz({
  story,
  chapterIndex,
  chapterCount,
  onNextChapter,
}: {
  story: StoryItem;
  chapterIndex: number;
  chapterCount: number;
  onNextChapter?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const { stories } = useCatalog();
  const { getResult, recordResult } = useQuizResults();
  const accent = sectionAccent(story.sectionSlug, isDark).primary;
  const quiz = useMemo(() => getChapterQuiz(story, chapterIndex, stories), [story, chapterIndex, stories]);
  const [phase, setPhase] = useState<Phase>('intro');
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const previous = getResult(story.id, chapterIndex);
  const count = quiz.questions.length;
  const question = quiz.questions[position];
  const picked = answers[position] ?? null;
  const score = answers.filter((answer, index) => answer === quiz.questions[index]?.answerIndex).length;
  const isLast = chapterIndex >= chapterCount - 1;

  if (!count) return null;

  const start = () => {
    setAnswers([]);
    setPosition(0);
    setPhase('question');
  };

  const next = () => {
    if (position < count - 1) {
      setPosition(position + 1);
      return;
    }
    recordResult(story.id, chapterIndex, score, count);
    setPhase('done');
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: alpha(accent, 0.35) },
        shadow('sm', isDark),
      ]}
      testID="chapter-quiz"
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: alpha(accent, 0.12) }]}>
          <ClipboardCheck size={18} color={accent} />
        </View>
        <View style={styles.flex}>
          <Overline color={accent}>
            Chapter {chapterIndex + 1} check · {count} questions
          </Overline>
          <Caption color={colors.inkSubtle}>Auto-generated from this chapter’s text</Caption>
        </View>
      </View>

      {phase === 'intro' ? (
        <View style={styles.body}>
          <Body>
            Test your understanding of what you just read. Each question comes from a line in this chapter.
          </Body>
          {previous ? (
            <Small color={colors.inkMuted}>
              Best so far: {previous.best}/{previous.total} · {previous.attempts}{' '}
              {previous.attempts === 1 ? 'attempt' : 'attempts'}
            </Small>
          ) : null}
          <View style={styles.actions}>
            <GradientButton
              label={previous ? 'Retake the check' : 'Start the check'}
              icon={previous ? RotateCcw : ClipboardCheck}
              gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
              onPress={start}
            />
            {!isLast && onNextChapter ? (
              <OutlineButton label="Skip to next chapter" icon={ChevronRight} onPress={onNextChapter} />
            ) : null}
          </View>
        </View>
      ) : null}

      {phase === 'question' && question ? (
        <View style={styles.body}>
          <QuestionView
            question={question}
            number={position + 1}
            count={count}
            picked={picked}
            accent={accent}
            onPick={(index) =>
              setAnswers((current) => {
                const copy = [...current];
                copy[position] = index;
                return copy;
              })
            }
          />
          {picked !== null ? (
            <GradientButton
              label={position < count - 1 ? 'Next question' : 'See my score'}
              icon={ChevronRight}
              gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
              onPress={next}
            />
          ) : null}
        </View>
      ) : null}

      {phase === 'done' ? (
        <View style={styles.body}>
          <View style={styles.scoreRow}>
            <Trophy size={26} color={score === count ? colors.gold : accent} />
            <View>
              <Title>
                {score}/{count}
              </Title>
              <Small color={colors.inkMuted}>
                {score === count
                  ? 'Excellent — full marks!'
                  : score >= count - 1
                    ? 'Great understanding.'
                    : score >= Math.ceil(count / 2)
                      ? 'Good effort. A quick re-read will help.'
                      : 'Worth reading this chapter again.'}
              </Small>
            </View>
          </View>
          <View style={styles.actions}>
            {!isLast && onNextChapter ? (
              <GradientButton
                label="Next chapter"
                icon={ChevronRight}
                gradient={brandGradients.emerald[isDark ? 'dark' : 'light']}
                onPress={onNextChapter}
              />
            ) : (
              <BodyStrong color={accent}>You’ve finished this story.</BodyStrong>
            )}
            <OutlineButton label="Retake" icon={RotateCcw} onPress={start} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 12, marginBottom: 20 },
  header: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  body: { gap: 12 },
  actions: { gap: 10 },
  question: { gap: 10 },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },
  quote: { borderLeftWidth: 3, borderRadius: radius.md, padding: 12 },
  quoteText: { fontStyle: 'italic' },
  options: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  letter: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontWeight: '800' },
  optionText: { flex: 1, fontSize: 14, lineHeight: 20 },
  feedback: { borderRadius: radius.md, padding: 12, gap: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

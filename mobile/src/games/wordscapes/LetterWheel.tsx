import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Title, useTheme } from '../../components/ui';
import { alpha } from '../../theme/tokens';
import { extendPath, hitNode, wheelNodes, type Point } from './wheelGeometry';

/**
 * Swipe across letters to build a word; a line follows the finger between them.
 * Letter views ignore touches so every responder event is measured against the wheel itself.
 */
export default function LetterWheel({
  letters,
  size,
  onPathChange,
  onSubmit,
  onLetter,
}: {
  letters: string[];
  size: number;
  onPathChange: (word: string) => void;
  onSubmit: (word: string) => void;
  onLetter?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const nodeRadius = Math.min(30, size / (letters.length > 6 ? 7.2 : 6.2));
  const nodes = useMemo(() => wheelNodes(letters.length, size, nodeRadius), [letters.length, size, nodeRadius]);
  const [path, setPath] = useState<number[]>([]);
  const [finger, setFinger] = useState<Point | null>(null);
  const pathRef = useRef<number[]>([]);

  const wordFor = (indexes: number[]) => indexes.map((index) => letters[index]).join('');

  const track = (event: GestureResponderEvent) => {
    const point = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
    setFinger(point);
    const next = extendPath(pathRef.current, hitNode(point, nodes, nodeRadius * 1.05));
    if (next.length !== pathRef.current.length || next.some((node, index) => node !== pathRef.current[index])) {
      if (next.length > pathRef.current.length) onLetter?.();
      pathRef.current = next;
      setPath(next);
      onPathChange(wordFor(next));
    }
  };

  const finish = () => {
    const word = wordFor(pathRef.current);
    pathRef.current = [];
    setPath([]);
    setFinger(null);
    onPathChange('');
    if (word.length) onSubmit(word);
  };

  const linePoints = [...path.map((index) => nodes[index]), ...(finger && path.length ? [finger] : [])]
    .map((point) => `${point.x},${point.y}`)
    .join(' ');

  return (
    <View
      style={[styles.wheel, { width: size, height: size, borderRadius: size / 2, backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={track}
      onResponderMove={track}
      onResponderRelease={finish}
      onResponderTerminate={finish}
      accessibilityRole="adjustable"
      accessibilityLabel={`Letter wheel: ${letters.join(', ')}. Swipe across letters to spell a word.`}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill={alpha(colors.emerald, isDark ? 0.08 : 0.05)} />
        {path.length ? (
          <Polyline points={linePoints} fill="none" stroke={colors.gold} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        ) : null}
      </Svg>
      {letters.map((letter, index) => {
        const active = path.includes(index);
        return (
          <View
            key={`${letter}-${index}`}
            pointerEvents="none"
            style={[
              styles.node,
              {
                width: nodeRadius * 2,
                height: nodeRadius * 2,
                borderRadius: nodeRadius,
                left: nodes[index].x - nodeRadius,
                top: nodes[index].y - nodeRadius,
                backgroundColor: active ? colors.gold : 'transparent',
              },
            ]}
          >
            <Title style={{ fontSize: nodeRadius * 0.95, lineHeight: nodeRadius * 1.2 }} color={active ? '#FFFFFF' : colors.ink}>
              {letter}
            </Title>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: { borderWidth: 1, alignSelf: 'center' },
  node: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});

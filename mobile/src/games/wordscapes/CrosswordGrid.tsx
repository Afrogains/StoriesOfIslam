import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Title, useTheme } from '../../components/ui';
import { alpha } from '../../theme/tokens';
import { isCellVisible, type GridCell, type WordscapesState } from './wordscapesEngine';

export default function CrosswordGrid({
  cells,
  state,
  width,
  height,
  maxWidth,
  maxHeight,
  flashWord,
}: {
  cells: Map<string, GridCell>;
  state: WordscapesState;
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  flashWord: string | null;
}) {
  const { colors, isDark } = useTheme();
  const gap = 4;
  const cell = Math.floor(Math.min(46, (maxWidth - gap * (width - 1)) / width, (maxHeight - gap * (height - 1)) / height));
  return (
    <View
      style={{ width: width * cell + gap * (width - 1), height: height * cell + gap * (height - 1), alignSelf: 'center' }}
      accessibilityLabel={`Crossword with ${new Set([...cells.values()].flatMap((item) => item.words)).size} words`}
    >
      {[...cells.values()].map((item) => {
        const visible = isCellVisible(state, item);
        const flashing = flashWord !== null && item.words.includes(flashWord);
        return (
          <View
            key={`${item.x},${item.y}`}
            style={[
              styles.cell,
              {
                width: cell,
                height: cell,
                left: item.x * (cell + gap),
                top: item.y * (cell + gap),
                backgroundColor: visible ? (flashing ? colors.gold : colors.emerald) : isDark ? colors.cardAlt : '#FFFFFF',
                borderColor: visible ? 'transparent' : alpha(colors.emerald, 0.35),
              },
            ]}
          >
            {visible ? (
              <Animated.View entering={ZoomIn.springify()}>
                <Title color="#FFFFFF" style={{ fontSize: cell * 0.52, lineHeight: cell * 0.66 }}>
                  {item.letter}
                </Title>
              </Animated.View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { position: 'absolute', borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

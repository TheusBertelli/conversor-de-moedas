import { StyleSheet, View } from 'react-native';

// Traços em vez de um caractere: a seta independe das fontes do aparelho.
export default function ArrowUpRight({ size = 20, color = '#DFEDB6' }) {
  return (
    <View accessible={false} style={{ width: size, height: size }}>
      <View style={[styles.line, { backgroundColor: color, width: size * 1.2, left: -size * 0.1, top: size / 2 - 1 }]} />
      <View style={[styles.tip, { borderColor: color, width: size * 0.5, height: size * 0.5 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: { position: 'absolute', height: 2, transform: [{ rotate: '-45deg' }] },
  tip: { position: 'absolute', top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
});

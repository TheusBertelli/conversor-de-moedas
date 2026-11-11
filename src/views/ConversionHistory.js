import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate, formatMoney } from '../viewmodels/conversion';
import { colors } from './colors';

export default function ConversionHistory({ history, onClear }) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Histórico
        </Text>
        {history.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpar histórico"
            onPress={onClear}
            style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
          >
            <Text style={styles.clearText}>Limpar</Text>
          </Pressable>
        )}
      </View>
      {history.length === 0 ? (
        <Text style={styles.empty}>Nenhuma conversão nesta sessão.</Text>
      ) : (
        history.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.pair}>
                {item.base} → {item.quote}
              </Text>
              <Text style={styles.caption}>Referência: {formatDate(item.date)}</Text>
            </View>
            <View style={styles.amounts}>
              <Text style={styles.value}>{formatMoney(item.converted, item.quote)}</Text>
              <Text style={styles.caption}>{formatMoney(item.amount, item.base)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '500' },
  clear: { minHeight: 44, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: colors.primary, fontSize: 14 },
  pressed: { opacity: 0.6 },
  empty: { color: colors.secondary, fontSize: 13, lineHeight: 20, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  column: { flex: 1, minWidth: 0 },
  pair: { color: colors.text, fontSize: 14 },
  amounts: { alignItems: 'flex-end', flexShrink: 1 },
  value: { color: colors.text, fontSize: 15, fontVariant: ['tabular-nums'] },
  caption: { color: colors.secondary, fontSize: 12, marginTop: 6 },
});

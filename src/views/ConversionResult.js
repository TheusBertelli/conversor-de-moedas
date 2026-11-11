import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { formatDate, formatMoney, formatRate } from '../viewmodels/conversion';
import { colors } from './colors';

export default function ConversionResult({ result, loading }) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      {result ? (
        <>
          <Text style={styles.original}>{formatMoney(result.amount, result.base)} equivalem a</Text>
          <Text selectable style={styles.value}>
            {formatMoney(result.converted, result.quote)}
          </Text>
          <Text style={styles.pair}>
            {result.base} → {result.quote}
          </Text>
          <View style={styles.details}>
            <View style={styles.detail}>
              <Text style={styles.label}>Taxa utilizada</Text>
              <Text selectable style={styles.detailValue}>
                1 {result.base} = {formatRate(result.rate)} {result.quote}
              </Text>
            </View>
            <View style={styles.detail}>
              <Text style={styles.label}>Data de referência</Text>
              <Text style={styles.detailValue}>{formatDate(result.date)}</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          {loading && <ActivityIndicator color={colors.primary} />}
          <Text style={styles.original}>
            {loading ? 'Consultando a taxa…' : 'O resultado da conversão aparece aqui.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 24,
    paddingTop: 24,
  },
  original: { color: colors.secondary, fontSize: 15, lineHeight: 22 },
  value: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '400',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  pair: { color: colors.secondary, fontSize: 13, marginTop: 6 },
  details: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, marginTop: 24 },
  detail: { gap: 6 },
  label: { color: colors.secondary, fontSize: 12 },
  detailValue: { color: colors.text, fontSize: 14, lineHeight: 20 },
  empty: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
});

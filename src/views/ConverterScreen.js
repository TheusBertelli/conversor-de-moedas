import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useConverterViewModel from '../viewmodels/useConverterViewModel';
import ConversionHistory from './ConversionHistory';
import ConversionResult from './ConversionResult';
import CurrencyPicker from './CurrencyPicker';
import { colors } from './colors';

export default function ConverterScreen() {
  const converter = useConverterViewModel();
  const [amountFocused, setAmountFocused] = useState(false);
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const currenciesUnavailable = converter.loadingCurrencies || converter.currencies.length === 0;
  const convertDisabled = currenciesUnavailable || converter.converting;

  function handleConvert() {
    Keyboard.dismiss();
    converter.convert();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.page}>
            <View style={styles.header}>
              <Text accessibilityRole="header" accessibilityLabel="Câmbio" style={styles.wordmark}>
                <Text style={styles.blue}>C</Text>
                <Text style={styles.red}>â</Text>
                <Text style={styles.yellow}>m</Text>
                <Text style={styles.blue}>b</Text>
                <Text style={styles.green}>i</Text>
                <Text style={styles.red}>o</Text>
              </Text>
              <Text style={styles.subtitle}>Conversor de moedas</Text>
            </View>

            <View style={styles.converter}>
              <Text style={styles.label}>Valor</Text>
              <View style={[styles.amountField, amountFocused && styles.focused]}>
                <TextInput
                  accessibilityLabel="Valor para converter"
                  accessibilityHint="Use vírgula ou ponto para decimais, sem separador de milhar"
                  value={converter.amount}
                  onChangeText={converter.setAmount}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleConvert}
                  placeholder="0,00"
                  placeholderTextColor={colors.secondary}
                  style={[styles.amount, Platform.OS === 'web' && styles.webInput]}
                  underlineColorAndroid="transparent"
                  maxLength={30}
                  selectTextOnFocus
                />
                <Text style={styles.amountCurrency}>{converter.base || '—'}</Text>
              </View>
              <Text style={styles.hint}>
                Use vírgula ou ponto para os decimais, sem separar milhares.
              </Text>

              <View style={[styles.currencies, compact && styles.currenciesCompact]}>
                <CurrencyPicker
                  label="De"
                  value={converter.base}
                  currencies={converter.currencies}
                  disabled={currenciesUnavailable}
                  onChange={converter.setBase}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Inverter moedas"
                  disabled={currenciesUnavailable}
                  onPress={converter.swapCurrencies}
                  style={({ pressed }) => [
                    styles.swap,
                    compact && styles.swapCompact,
                    currenciesUnavailable && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.swapText}>⇄</Text>
                </Pressable>
                <CurrencyPicker
                  label="Para"
                  value={converter.quote}
                  currencies={converter.currencies}
                  disabled={currenciesUnavailable}
                  onChange={converter.setQuote}
                />
              </View>

              {converter.loadingCurrencies && (
                <View style={styles.loading} accessibilityLiveRegion="polite">
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={styles.message}>Carregando moedas…</Text>
                </View>
              )}
              {!!converter.validationError && (
                <Text accessibilityRole="alert" style={styles.error}>
                  {converter.validationError}
                </Text>
              )}
              {!!converter.error && (
                <View accessibilityRole="alert" style={styles.errorBox}>
                  <Text style={styles.errorText}>{converter.error}</Text>
                  {converter.currencies.length === 0 && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Tentar carregar moedas novamente"
                      onPress={converter.reloadCurrencies}
                      style={styles.retry}
                    >
                      <Text style={styles.link}>Tentar novamente</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    converter.isFavorite ? 'Remover par dos favoritos' : 'Salvar par nos favoritos'
                  }
                  accessibilityState={{ selected: converter.isFavorite }}
                  disabled={currenciesUnavailable || converter.base === converter.quote}
                  onPress={converter.toggleFavorite}
                  style={({ pressed }) => [
                    styles.save,
                    (currenciesUnavailable || converter.base === converter.quote) &&
                      styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.star}>{converter.isFavorite ? '★' : '☆'}</Text>
                  <Text style={styles.link}>{converter.isFavorite ? 'Salvo' : 'Salvar par'}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={converter.converting ? 'Convertendo' : 'Converter valor'}
                  accessibilityState={{ disabled: convertDisabled, busy: converter.converting }}
                  disabled={convertDisabled}
                  onPress={handleConvert}
                  style={({ pressed }) => [
                    styles.convertButton,
                    convertDisabled && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.convertText}>
                    {converter.converting ? 'Convertendo…' : 'Converter'}
                  </Text>
                </Pressable>
              </View>

              <ConversionResult result={converter.result} loading={converter.converting} />
            </View>

            <Text style={styles.source}>
              Frankfurter · Taxas de referência, sem cotação comercial em tempo real.
            </Text>

            <View style={styles.favorites}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Favoritos
              </Text>
              {converter.favorites.length === 0 ? (
                <Text style={styles.empty}>Nenhum par salvo.</Text>
              ) : (
                <View style={styles.chips}>
                  {converter.favorites.map((pair) => (
                    <Pressable
                      key={`${pair.base}-${pair.quote}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Usar favorito ${pair.base} para ${pair.quote}`}
                      onPress={() => converter.selectPair(pair.base, pair.quote)}
                      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                    >
                      <Text style={styles.chipText}>
                        {pair.base} → {pair.quote}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <ConversionHistory history={converter.history} onClear={converter.clearHistory} />
            <Text style={styles.footer}>
              Histórico e favoritos ficam salvos apenas nesta sessão.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  page: {
    width: '100%',
    maxWidth: 752,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  wordmark: { fontSize: 56, fontWeight: '400', letterSpacing: -2 },
  blue: { color: '#4285F4' },
  red: { color: '#EA4335' },
  yellow: { color: '#FBBC05' },
  green: { color: '#34A853' },
  subtitle: { color: colors.secondary, fontSize: 16, marginTop: 8 },
  converter: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 20 },
  label: { color: colors.secondary, fontSize: 13, marginBottom: 8 },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  focused: { borderColor: colors.primary },
  webInput: { outlineStyle: 'none' },
  amount: { flex: 1, minWidth: 0, paddingVertical: 12, color: colors.text, fontSize: 24 },
  amountCurrency: { color: colors.secondary, fontSize: 14, marginLeft: 12 },
  hint: { color: colors.secondary, fontSize: 12, lineHeight: 18, marginTop: 8 },
  currencies: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 24 },
  currenciesCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 4 },
  swap: { width: 48, minHeight: 64, justifyContent: 'center', alignItems: 'center' },
  swapCompact: { minHeight: 44, alignSelf: 'center' },
  swapText: { color: colors.secondary, fontSize: 26 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  save: { minHeight: 44, flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 4 },
  star: { color: colors.primary, fontSize: 22 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  convertButton: {
    minHeight: 44,
    minWidth: 120,
    borderRadius: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  convertText: { color: colors.background, fontSize: 14, fontWeight: '500' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.65 },
  loading: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 16 },
  message: { color: colors.secondary, fontSize: 13 },
  error: { color: colors.error, fontSize: 13, lineHeight: 20, marginTop: 16 },
  errorBox: { backgroundColor: colors.errorLight, borderRadius: 4, padding: 12, marginTop: 16 },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 20 },
  retry: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 4 },
  source: {
    color: colors.secondary,
    fontSize: 11,
    lineHeight: 18,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  favorites: { marginTop: 28 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '500', marginBottom: 12 },
  empty: { color: colors.secondary, fontSize: 13, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  chipText: { color: colors.primary, fontSize: 13 },
  footer: { color: colors.secondary, fontSize: 12, lineHeight: 18, marginTop: 28 },
});

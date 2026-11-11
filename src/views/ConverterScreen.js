import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useConverterViewModel from '../viewmodels/useConverterViewModel';
import { formatDate, formatMoney, formatRate } from '../viewmodels/conversion';
import CurrencyPicker from './CurrencyPicker';
import ArrowUpRight from './ArrowUpRight';

function Action({ children, onPress, label, style, disabled = false }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
      onPress={onPress} style={({ pressed }) => [styles.action, style, disabled && styles.disabled, pressed && styles.pressed]}>
      <Text style={styles.actionText}>{children}</Text>
    </Pressable>
  );
}

export default function ConverterScreen() {
  const vm = useConverterViewModel();
  const { width } = useWindowDimensions();
  const wide = width >= 780;
  const unavailable = vm.loadingCurrencies || vm.currencies.length === 0;

  function convert() {
    Keyboard.dismiss();
    vm.convert();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.page}>
            <View style={styles.header}>
              <View style={styles.brand}>
                <View style={styles.brandMark}><Text style={styles.brandArrow}>⇄</Text></View>
                <Text style={styles.brandText}>câmbio de bolso</Text>
              </View>
              {width >= 380 && <Text style={styles.headerNote}>SIMPLES. DIRETO.</Text>}
            </View>

            <View style={styles.intro}>
              <Text style={styles.eyebrow}>DE UMA MOEDA PARA OUTRA</Text>
              <Text accessibilityRole="header" style={[styles.title, wide && styles.titleWide]}>Seu dinheiro,{ '\n' }em outra moeda.</Text>
              <Text style={styles.description}>Faça as contas antes de fazer planos.</Text>
            </View>

            <View style={[styles.workspace, wide && styles.workspaceWide]}>
              <View style={[styles.form, wide && styles.column]}>
                <View style={styles.cardHeading}>
                  <Text style={styles.sectionTitle}>Conversor de moedas</Text>
                  <Text style={styles.step}>01 / 02</Text>
                </View>
                <Text style={styles.label}>Quanto você quer converter?</Text>
                <View style={[styles.amountBox, vm.validationError && styles.invalidBox]}>
                  <TextInput
                    accessibilityLabel="Valor para converter"
                    accessibilityHint="Use vírgula ou ponto para decimais, sem separador de milhar"
                    value={vm.amount} onChangeText={vm.setAmount}
                    keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={convert}
                    placeholder="0,00" placeholderTextColor="#8A968B" style={styles.amount}
                    maxLength={30} selectTextOnFocus
                  />
                  <Text style={styles.amountCurrency}>{vm.base || '—'}</Text>
                </View>
                <Text style={styles.inputHint}>Decimais com vírgula ou ponto. Sem separador de milhar.</Text>

                <View style={[styles.pair, width < 360 && styles.pairCompact]}>
                  <CurrencyPicker label="De" value={vm.base} currencies={vm.currencies} disabled={unavailable} onChange={vm.setBase} />
                  <Pressable accessibilityRole="button" accessibilityLabel="Inverter moedas" disabled={unavailable}
                    onPress={vm.swapCurrencies} style={({ pressed }) => [styles.swap, width < 360 && styles.swapCompact, unavailable && styles.disabled, pressed && styles.pressed]}>
                    <Text style={styles.swapText}>⇄</Text>
                  </Pressable>
                  <CurrencyPicker label="Para" value={vm.quote} currencies={vm.currencies} disabled={unavailable} onChange={vm.setQuote} />
                </View>

                <View style={styles.favoriteRow}>
                  <Action onPress={vm.toggleFavorite} disabled={unavailable || vm.base === vm.quote}
                    label={vm.isFavorite ? 'Remover par dos favoritos' : 'Salvar par nos favoritos'}>
                    {vm.isFavorite ? '★ Par salvo' : '☆ Salvar este par'}
                  </Action>
                </View>

                {vm.loadingCurrencies && <View style={styles.loading} accessibilityLiveRegion="polite"><ActivityIndicator color="#315C43" /><Text style={styles.loadingText}>Carregando moedas…</Text></View>}
                {!!vm.validationError && <Text accessibilityRole="alert" style={styles.error}>{vm.validationError}</Text>}
                {!!vm.error && <View accessibilityRole="alert" style={styles.errorBox}>
                  <Text style={styles.error}>{vm.error}</Text>
                  {vm.currencies.length === 0 && <Action onPress={vm.reloadCurrencies} label="Tentar carregar moedas novamente">Tentar novamente ↻</Action>}
                </View>}

                <Pressable accessibilityRole="button" accessibilityLabel={vm.converting ? 'Convertendo' : 'Converter valor'}
                  accessibilityState={{ disabled: unavailable || vm.converting, busy: vm.converting }}
                  disabled={unavailable || vm.converting} onPress={convert}
                  style={({ pressed }) => [styles.convertButton, (unavailable || vm.converting) && styles.disabled, pressed && styles.pressed]}>
                  {vm.converting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.convertText}>Converter valor</Text>}
                  {vm.converting ? <Text style={styles.convertArrow}>Aguarde…</Text> : <ArrowUpRight />}
                </Pressable>
              </View>

              <View style={[styles.resultCard, wide && styles.column]} accessibilityLiveRegion="polite">
                <View style={styles.resultTop}>
                  <Text style={styles.resultEyebrow}>SUA CONVERSÃO</Text>
                  <Text style={styles.resultStep}>02 / 02</Text>
                </View>
                {vm.result ? <>
                  <Text style={styles.resultOriginal}>{formatMoney(vm.result.amount, vm.result.base)} equivalem a</Text>
                  <Text selectable style={[styles.resultValue, wide && styles.resultValueWide]}>{formatMoney(vm.result.converted, vm.result.quote)}</Text>
                  <Text style={styles.resultCurrency}>{vm.result.base} → {vm.result.quote}</Text>
                  <View style={styles.rateDetails}>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Taxa utilizada</Text><Text selectable style={styles.detailValue}>1 {vm.result.base} = {formatRate(vm.result.rate)} {vm.result.quote}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Data de referência</Text><Text style={styles.detailValue}>{formatDate(vm.result.date)}</Text></View>
                  </View>
                </> : <View style={styles.emptyResult}>
                  <View style={styles.resultIllustration}><ArrowUpRight size={26} color="#D5E89E" /></View>
                  <Text style={styles.emptyTitle}>{vm.converting ? 'Consultando a taxa…' : 'Novos valores,\nnovos planos.'}</Text>
                  <Text style={styles.emptyDescription}>{vm.converting ? 'Buscando a referência mais recente para este par.' : 'Escolha as moedas e toque em converter. O resultado aparece aqui.'}</Text>
                </View>}
                <View style={styles.sourceNote}>
                  <View style={styles.sourceDot} />
                  <Text style={styles.sourceText}>Dados da Frankfurter · Taxas de referência, sem cotação comercial em tempo real.</Text>
                </View>
              </View>
            </View>

            <View style={styles.lowerSection}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Seus pares favoritos</Text>
                <Text style={styles.smallNote}>À mão, na próxima conta</Text>
              </View>
              {vm.favorites.length ? <View style={styles.favorites}>
                {vm.favorites.map((pair) => <Action key={`${pair.base}-${pair.quote}`} onPress={() => vm.selectPair(pair.base, pair.quote)}
                  label={`Usar favorito ${pair.base} para ${pair.quote}`} style={styles.favoriteChip}>★ {pair.base} → {pair.quote}</Action>)}
              </View> : <Text style={styles.emptyHint}>Toque na estrela para guardar um par durante esta sessão.</Text>}
            </View>

            <View style={styles.lowerSection}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Últimas conversões</Text>
                {vm.history.length > 0 && <Action label="Limpar histórico" onPress={vm.clearHistory}>Limpar</Action>}
              </View>
              {vm.history.length ? vm.history.map((item) => <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyIcon}><ArrowUpRight size={15} color="#486A43" /></View>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyPair}>{item.base} → {item.quote}</Text>
                  <Text style={styles.historyDate}>Referência: {formatDate(item.date)}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyValue}>{formatMoney(item.converted, item.quote)}</Text>
                  <Text style={styles.historyDate}>{formatMoney(item.amount, item.base)}</Text>
                </View>
              </View>) : <Text style={styles.emptyHint}>Suas últimas 10 conversões ficam aqui enquanto o app estiver aberto.</Text>}
            </View>

            <View style={styles.footer}><Text style={styles.footerText}>Uma conta a menos para fazer de cabeça.</Text><Text style={styles.footerBrand}>câmbio de bolso</Text></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F3EB' },
  scroll: { flexGrow: 1 },
  page: { width: '100%', maxWidth: 1060, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: 25 },
  header: { paddingVertical: 25, borderBottomWidth: 1, borderBottomColor: '#DEDFD3', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#254D36', justifyContent: 'center', alignItems: 'center' },
  brandArrow: { color: '#D7EB9B', fontSize: 25 },
  brandText: { color: '#24422F', fontWeight: '700', fontSize: 16, letterSpacing: -0.4 },
  headerNote: { color: '#64725E', fontSize: 9, letterSpacing: 1.3 },
  intro: { paddingTop: 32, paddingBottom: 30 },
  eyebrow: { color: '#586C50', letterSpacing: 2, fontSize: 10, fontWeight: '700', marginBottom: 13 },
  title: { fontSize: 38, lineHeight: 43, letterSpacing: -1.9, fontWeight: '700', color: '#213C2D' },
  titleWide: { fontSize: 54, lineHeight: 58 },
  description: { color: '#687363', fontSize: 14, lineHeight: 22, marginTop: 13 },
  workspace: { gap: 16 },
  workspaceWide: { flexDirection: 'row', alignItems: 'stretch' },
  column: { flex: 1 },
  form: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 23, borderWidth: 1, borderColor: '#E5E7DE' },
  cardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: 8 },
  sectionTitle: { color: '#2C4433', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  step: { color: '#86917E', fontSize: 10, letterSpacing: 1 },
  label: { fontSize: 12, color: '#53635A', fontWeight: '600', marginBottom: 9 },
  amountBox: { borderWidth: 1, borderColor: '#DCE2DA', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#FAFBF8' },
  invalidBox: { borderColor: '#BA654F' },
  amount: { flex: 1, minWidth: 0, paddingVertical: 18, fontSize: 32, fontWeight: '600', color: '#193C2D' },
  amountCurrency: { color: '#677461', fontSize: 13, marginLeft: 10 },
  inputHint: { color: '#6A7569', fontSize: 10, lineHeight: 15, marginTop: 8, marginBottom: 23 },
  pair: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  pairCompact: { flexDirection: 'column', alignItems: 'stretch' },
  swapCompact: { minHeight: 44, alignSelf: 'center' },
  swap: { width: 44, minHeight: 76, alignItems: 'center', justifyContent: 'center' },
  swapText: { fontSize: 27, color: '#416044' },
  favoriteRow: { alignItems: 'flex-start', marginTop: 8, marginBottom: 9 },
  action: { minHeight: 44, paddingVertical: 10, justifyContent: 'center' },
  actionText: { color: '#4F6946', fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.5 },
  loading: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  loadingText: { color: '#526B5C', fontSize: 13 },
  error: { color: '#983E28', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  errorBox: { padding: 12, borderRadius: 10, backgroundColor: '#FFF4EC', marginBottom: 12 },
  convertButton: { minHeight: 56, backgroundColor: '#2C533B', borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 19, gap: 12 },
  convertText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  convertArrow: { color: '#DFEDB6', fontSize: 22 },
  resultCard: { backgroundColor: '#224631', borderRadius: 22, padding: 25, minHeight: 365, overflow: 'hidden' },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 27 },
  resultEyebrow: { color: '#D4E7B7', letterSpacing: 2, fontSize: 10, fontWeight: '600' },
  resultStep: { color: '#A9BBA6', fontSize: 10, letterSpacing: 1 },
  resultOriginal: { color: '#C6D5BE', fontSize: 14, lineHeight: 22, marginTop: 10 },
  resultValue: { color: '#EFF6D7', fontSize: 36, fontWeight: '600', letterSpacing: -1.2, marginTop: 10 },
  resultValueWide: { fontSize: 42 },
  resultCurrency: { color: '#C2D6A7', fontSize: 12, marginTop: 13 },
  rateDetails: { borderTopWidth: 1, borderTopColor: '#46634A', marginTop: 25, paddingTop: 18, gap: 15, marginBottom: 24 },
  detailRow: { gap: 5 },
  detailLabel: { color: '#B9CCB0', fontSize: 11 },
  detailValue: { color: '#EFF6D7', fontSize: 13, lineHeight: 20 },
  emptyResult: { flex: 1, paddingBottom: 30 },
  resultIllustration: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#6E8655', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  emptyTitle: { color: '#EAF1D4', fontSize: 30, lineHeight: 35, fontWeight: '500', letterSpacing: -0.8 },
  emptyDescription: { color: '#C1D1B8', fontSize: 13, lineHeight: 21, maxWidth: 270, marginTop: 12 },
  sourceNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 'auto', paddingTop: 17, borderTopWidth: 1, borderTopColor: '#46634A' },
  sourceDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#CAE395', marginTop: 5 },
  sourceText: { flex: 1, color: '#C2D2B7', fontSize: 10, lineHeight: 16 },
  lowerSection: { marginTop: 29, paddingBottom: 21, borderBottomWidth: 1, borderBottomColor: '#DEDFD3' },
  sectionHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 11 },
  smallNote: { color: '#6E7B65', fontSize: 10 },
  emptyHint: { color: '#6C7864', fontSize: 12, lineHeight: 20 },
  favorites: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  favoriteChip: { borderWidth: 1, borderColor: '#C9D4BC', borderRadius: 10, paddingHorizontal: 14, backgroundColor: '#EBEEDF' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#E1E4D8', paddingVertical: 15 },
  historyIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#E5EADB', alignItems: 'center', justifyContent: 'center' },
  historyLeft: { flex: 1, minWidth: 0 },
  historyPair: { color: '#2E4936', fontSize: 13, fontWeight: '600' },
  historyDate: { color: '#6B7962', fontSize: 10, marginTop: 5 },
  historyRight: { alignItems: 'flex-end', flexShrink: 1 },
  historyValue: { color: '#2E4936', fontSize: 14, fontWeight: '600' },
  footer: { marginTop: 25, gap: 10 },
  footerText: { color: '#75806C', fontSize: 11 },
  footerBrand: { color: '#4E6845', fontSize: 11, fontWeight: '600' },
});

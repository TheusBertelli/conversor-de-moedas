import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './colors';

export default function CurrencyPicker({ label, value, currencies, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const selected = currencies.find((currency) => currency.code === value);
  const query = search.trim().toLocaleLowerCase('pt-BR');
  const filtered = currencies.filter(({ code, name }) =>
    `${code} ${name}`.toLocaleLowerCase('pt-BR').includes(query),
  );

  function close() {
    setOpen(false);
    setSearch('');
    setSearchFocused(false);
  }

  function selectCurrency(code) {
    onChange(code);
    close();
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.code || 'carregando'}`}
        accessibilityHint="Abre a lista de moedas"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.selector,
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.selectedText}>
          <Text numberOfLines={1} style={styles.code}>
            {selected?.code || '—'}
          </Text>
          <Text numberOfLines={1} style={styles.name}>
            {selected?.name || 'Carregando…'}
          </Text>
        </View>
        <View style={styles.chevron} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={styles.dialog} accessibilityViewIsModal>
            <View style={styles.dialogHeader}>
              <Text accessibilityRole="header" style={styles.dialogTitle}>
                Selecionar moeda
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar lista de moedas"
                onPress={close}
                style={styles.close}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel="Buscar moeda"
              autoFocus
              autoCorrect={false}
              placeholder="Buscar por código ou nome"
              placeholderTextColor={colors.secondary}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              underlineColorAndroid="transparent"
              style={[
                styles.search,
                searchFocused && styles.focused,
                Platform.OS === 'web' && styles.webInput,
              ]}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>Nenhuma moeda encontrada.</Text>}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.code}, ${item.name}`}
                  accessibilityState={{ selected: item.code === value }}
                  onPress={() => selectCurrency(item.code)}
                  style={({ pressed }) => [
                    styles.option,
                    item.code === value && styles.selected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.optionCode}>{item.code}</Text>
                  <Text style={styles.optionName}>{item.name}</Text>
                  {item.code === value && <Text style={styles.check}>✓</Text>}
                </Pressable>
              )}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, minWidth: 0 },
  label: { color: colors.secondary, fontSize: 13, marginBottom: 8 },
  selector: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedText: { flex: 1, minWidth: 0 },
  code: { color: colors.text, fontSize: 18 },
  name: { color: colors.secondary, fontSize: 12, marginTop: 4 },
  chevron: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.secondary,
    transform: [{ rotate: '45deg' }],
    marginRight: 3,
  },
  disabled: { opacity: 0.45 },
  pressed: { backgroundColor: colors.surface },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(32,33,36,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  dialog: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    flexShrink: 1,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  dialogTitle: { color: colors.text, fontSize: 20, flexShrink: 1 },
  close: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  closeText: { color: colors.secondary, fontSize: 28 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    minHeight: 48,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  focused: { borderColor: colors.primary },
  webInput: { outlineStyle: 'none' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, padding: 12 },
  selected: { backgroundColor: colors.primaryLight },
  optionCode: { color: colors.text, fontSize: 14, width: 52, fontWeight: '500' },
  optionName: { color: colors.secondary, fontSize: 14, flex: 1 },
  check: { color: colors.primary, fontSize: 18 },
  empty: { color: colors.secondary, paddingVertical: 24, fontSize: 14, textAlign: 'center' },
});

import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CurrencyPicker({ label, value, currencies, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = currencies.find((currency) => currency.code === value);
  const query = search.trim().toLocaleLowerCase('pt-BR');
  const filtered = currencies.filter(({ code, name }) =>
    `${code} ${name}`.toLocaleLowerCase('pt-BR').includes(query),
  );

  function close() {
    setOpen(false);
    setSearch('');
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
        style={({ pressed }) => [styles.selector, disabled && styles.disabled, pressed && styles.pressed]}
      >
        <View style={styles.selectedText}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.code}>{selected?.code || '—'}</Text>
          <Text numberOfLines={1} style={styles.name}>{selected?.name || 'Aguarde a lista'}</Text>
        </View>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <SafeAreaView style={styles.modal} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Escolha a moeda</Text>
                <Text style={styles.subtitle}>{label}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar lista de moedas" onPress={close} style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel="Buscar moeda"
              autoFocus
              autoCorrect={false}
              placeholder="Buscar por código ou nome"
              placeholderTextColor="#707B75"
              value={search}
              onChangeText={setSearch}
              style={styles.search}
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
                  onPress={() => { onChange(item.code); close(); }}
                  style={({ pressed }) => [styles.option, item.code === value && styles.active, pressed && styles.pressed]}
                >
                  <Text style={styles.optionCode}>{item.code}</Text>
                  <Text style={styles.optionName}>{item.name}</Text>
                  {item.code === value && <Text style={styles.check}>✓</Text>}
                </Pressable>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, minWidth: 0 },
  label: { color: '#53635A', fontSize: 12, fontWeight: '600', marginBottom: 9 },
  selector: { minHeight: 76, borderWidth: 1, borderColor: '#DCE2DA', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFBF8', gap: 6 },
  selectedText: { flex: 1 },
  code: { fontSize: 20, fontWeight: '700', color: '#193C2D', marginBottom: 4 },
  name: { fontSize: 11, color: '#627067' },
  chevron: { color: '#526B5C', fontSize: 22 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.65 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,35,25,0.5)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, maxHeight: '85%', width: '100%', maxWidth: 480, alignSelf: 'center', flexShrink: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle: { color: '#193C2D', fontSize: 23, fontWeight: '700' },
  subtitle: { color: '#627067', marginTop: 5 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#193C2D', fontSize: 30 },
  search: { backgroundColor: '#F1F4EE', borderRadius: 12, padding: 14, fontSize: 16, color: '#193C2D', marginBottom: 14, minHeight: 50 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#EEF0EB', borderRadius: 8 },
  active: { backgroundColor: '#EDF4E7' },
  optionCode: { width: 55, fontSize: 15, fontWeight: '700', color: '#193C2D' },
  optionName: { flex: 1, fontSize: 14, color: '#53635A' },
  check: { color: '#2F6742', fontSize: 18 },
  empty: { color: '#627067', paddingVertical: 30, textAlign: 'center' },
});

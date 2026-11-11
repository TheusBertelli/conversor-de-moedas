import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ConverterScreen from './src/views/ConverterScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ConverterScreen />
    </SafeAreaProvider>
  );
}

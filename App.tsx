import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { TripProvider } from './src/presentation/state/TripContext';
import { MainCompanionScreen } from './src/presentation/screens/MainCompanionScreen';

export default function App() {
  return (
    <TripProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <MainCompanionScreen />
      </SafeAreaView>
    </TripProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});

import * as React from 'react';

import { StyleSheet, View, Button } from 'react-native';
import { useToaster } from 'react-native-toaster';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from 'react-native-toaster';
export default () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <W />
      </ToastProvider>
    </GestureHandlerRootView>
  );
};

export function W() {
  const t = useToaster();
  return (
    <View style={styles.container}>
      <Button title="lol" onPress={() => t.show({ title: 'lol' })} />
      <Button title="lol" onPress={() => t.show({ title: 'hahaha' })} />
      <Button title="lol" onPress={() => t.show({ title: 'loooooool' })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});

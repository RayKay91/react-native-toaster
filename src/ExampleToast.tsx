import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { ToastProvider, useToaster } from './ToastContext';

export const Wrapper = () => {
  return (
    <ToastProvider>
      <ExampleToast />
    </ToastProvider>
  );
};

export function ExampleToast() {
  const t = useToaster();
  return (
    <>
      <View style={styles.container}>
        <Button
          title="show toast"
          onPress={() => {
            t.show({
              title: 'lol',
              onDidShow: () => console.warn('did show!!!!'),
              onWillShow: () => console.warn('2222'),
            });
          }}
          testID="lol"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

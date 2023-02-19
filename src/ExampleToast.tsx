import React, { useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { Toast } from './Toast';

export function ExampleToast() {
  const [showToast, setShowToast] = useState(false);

  return (
    <>
      <Toast
        isVisible={showToast}
        setIsVisible={setShowToast}
        delay={3000}
        title="hello there"
      />
      <View style={styles.container}>
        <Button
          title="show toast"
          onPress={() => setShowToast(true)}
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

import * as React from 'react';

import { StyleSheet, View, Button, Text } from 'react-native';
import { Toast } from 'react-native-toaster';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function App() {
  const [show, setShow] = React.useState(false);
  const [t, setT] = React.useState('hello :)');

  return (
    <View style={styles.container}>
      <Toast
        containerStyle={{ backgroundColor: 'red' }}
        isVisible={show}
        setIsVisible={(s) => setShow(s)}
        delay={5000}
        onWillShow={() => setT('will show')}
        onDidShow={() => setT('did show')}
        onWillHide={() => setT('will hide')}
        onDidHide={() => setT('did hide')}
      />
      <Button title="lol" onPress={() => setShow(true)} />
      <Text>{t}</Text>
    </View>
  );
}

export default () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <App />
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});

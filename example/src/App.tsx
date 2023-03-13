import * as React from 'react';

import { StyleSheet, View, Button, Modal } from 'react-native';
import { useToaster } from 'react-native-toaster';
import { ToastProvider } from 'react-native-toaster';
export default () => {
  const [isV, sIsV] = React.useState(false);

  return (
    <ToastProvider>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* <Button title={'launch modal'} onPress={() => sIsV(true)} /> */}
        <B />
      </View>
      <W isV={isV} sIsV={sIsV} />
    </ToastProvider>
  );
};

function B() {
  const t = useToaster();
  return (
    <Button
      title={'launch modal'}
      onPress={() =>
        t.show({
          title: 'nmdnmdndnd',
          subText: 'lol',
          toastType: 2,
          onWillShow: () => console.log('willShow'),
          onDidShow: () => console.log('didShow'),
          onWillHide: () => console.log('willHide'),
          onDidHide: () => console.log('didHide'),
        })
      }
    />
  );
}

export function W(props: { isV: boolean; sIsV: (s: boolean) => void }) {
  const t = useToaster();
  return (
    <Modal visible={props.isV} animationType="slide">
      <View style={styles.container}>
        <Button title="lol" onPress={() => t.show({ title: 'lol' })} />
        <Button title="lol" onPress={() => t.show({ title: 'hahaha' })} />
        <Button
          title="lol"
          onPress={() =>
            t.show({
              title: 'loooooool',
              onWillShow() {
                props.sIsV(false);
              },
            })
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'salmon',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});

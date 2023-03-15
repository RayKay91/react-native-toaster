import * as React from 'react';

import { View, Button } from 'react-native';
import { useToaster } from 'react-native-toaster';
import { ToastProvider } from 'react-native-toaster';
export default () => {
  return (
    <ToastProvider>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <B />
      </View>
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
          title: 'Hello there!',
          subText: 'lol',
          toastType: 2,
          onLongPress: () => console.log('learn to let go! :)'),
          onPress: () => console.log('press'),
          onWillShow: () => console.log('willShow'),
          onDidShow: () => console.log('didShow'),
          onWillHide: () => console.log('willHide'),
          onDidHide: () => console.log('didHide'),
        })
      }
    />
  );
}

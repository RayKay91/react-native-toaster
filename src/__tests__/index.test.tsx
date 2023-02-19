import React from 'react';
import { ExampleToast } from '../ExampleToast';
import { fireEvent, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native';
import {
  withReanimatedTimer,
  advanceAnimationByTime,
} from 'react-native-reanimated/src/reanimated2/jestUtils';

describe('toast component', () => {
  afterAll(() => jest.useRealTimers());
  it('initial state should not be visible on screen', () => {
    render(<ExampleToast />);
    const toast = screen.getByTestId('toast');

    expect(toast).not.toBeVisible();
  });

  it('final position should be on screen', () => {
    withReanimatedTimer(async () => {
      render(<ExampleToast />);
      const toast = screen.getByText('hello there');
      const button = await screen.findByRole('button');
      fireEvent.press(button);
      jest.useFakeTimers();
      advanceAnimationByTime(700);
      expect(toast).toBeVisible();
      jest.useRealTimers();
    });
  });
});

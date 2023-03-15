import React from 'react';
import renderer from 'react-test-renderer';
import { Toast } from '..';
import { render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

describe('<Toast />', () => {
  it('renders', async () => {
    const props = {
      title: 'hello',
      subtext: 'world ',
      setToastConfig: jest.fn(),
      setIsVisible: jest.fn(),
      isVisible: false,
      toastQueue: [],
    };
    render(<Toast {...props} />);
    const toast = await screen.getByTestId(/toast/);
    // it is off screen but present in element tree
    expect(toast).toBeOnTheScreen();
  });

  it('does not have visual regressions', () => {
    const props = {
      title: 'hello',
      subtext: 'world ',
      setToastConfig: jest.fn(),
      setIsVisible: jest.fn(),
      isVisible: false,
      toastQueue: [],
    };
    const tree = renderer.create(<Toast {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('is initially off screen', async () => {
    const props = {
      title: 'hello',
      subtext: 'world ',
      setToastConfig: jest.fn(),
      setIsVisible: jest.fn(),
      isVisible: false,
      toastQueue: [],
    };
    render(<Toast {...props} />);
    const toast = await screen.getByTestId(/toast/);
    expect(toast).not.toBeVisible();
  });
});

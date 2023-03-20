import React from 'react';
import renderer from 'react-test-renderer';
import { Toast } from '..';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

describe('<Toast />', () => {
  it('renders', async () => {
    const props = {
      title: 'hello',
      subText: 'world',
      setIsVisible: jest.fn(),
      isVisible: false,
      displayNextToastInQueue: jest.fn(),
    };
    render(<Toast {...props} />);
    const toast = await screen.getByTestId(/toast/);
    // it is off screen but present in element tree
    expect(toast).toBeOnTheScreen();
  });

  it('does not have visual regressions', () => {
    const props = {
      title: 'hello',
      subText: 'world',
      setIsVisible: jest.fn(),
      isVisible: false,
      displayNextToastInQueue: jest.fn(),
    };
    const tree = renderer.create(<Toast {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('is initially off screen', async () => {
    const props = {
      title: 'hello',
      subText: 'world',
      setIsVisible: jest.fn(),
      isVisible: false,
      displayNextToastInQueue: jest.fn(),
    };
    render(<Toast {...props} />);
    const toast = await screen.getByTestId(/toast/);
    expect(toast).not.toBeVisible();
  });

  it('should render the title and subtext', () => {
    const mockProps = {
      title: 'hello',
      subText: 'world',
      setIsVisible: jest.fn(),
      isVisible: false,
      displayNextToastInQueue: jest.fn(),
    };
    const { getByText } = render(<Toast {...mockProps} />);

    expect(getByText('hello')).toBeDefined();
    expect(getByText('world')).toBeDefined();
  });

  it('should call onPress() and then call setIsVisible(false)', () => {
    const mockProps = {
      title: 'hello',
      subText: 'world',
      setIsVisible: jest.fn(),
      isVisible: false,
      displayNextToastInQueue: jest.fn(),
      onPress: jest.fn(),
      onWillHide: jest.fn(),
    };
    render(<Toast {...mockProps} />);
    const toast = screen.getByRole('button');
    fireEvent.press(toast);
    expect(mockProps.onPress).toBeCalledTimes(1);
    expect(mockProps.setIsVisible).toBeCalledTimes(1);
    expect(mockProps.setIsVisible).toBeCalledWith(false);
    expect(mockProps.onWillHide.mock.calls.length).not.toBeGreaterThan(1);
  });

  // this test causes weird open handles issue due to animation timer not being properly run
  // using jest --forceExit to workaround for now.
  it('is on screen if is visible', async () => {
    const props = {
      title: 'hello',
      subText: 'world',
      setIsVisible: jest.fn(),
      isVisible: true,
      displayNextToastInQueue: jest.fn(),
    };
    render(<Toast {...props} />);
    const toast = await screen.getByTestId(/toast/);
    await waitFor(() => expect(toast).toBeVisible());
  });
});

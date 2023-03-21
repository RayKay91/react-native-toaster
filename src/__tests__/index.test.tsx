import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Toast, ToastProvider, useToaster } from '..';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  renderHook,
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

  it('should call onPress() and then call setIsVisible(false)', async () => {
    const mockProps = {
      title: 'hello',
      subText: 'world',
      setIsVisible: jest.fn(),
      isVisible: true,
      displayNextToastInQueue: jest.fn(),
      onPress: jest.fn(),
      onWillHide: jest.fn(),
    };
    render(<Toast {...mockProps} />);
    const toast = screen.getByRole('button');
    fireEvent.press(toast);
    expect(mockProps.onPress).toBeCalledTimes(1);
    expect(mockProps.setIsVisible).toBeCalledWith(false);
    expect(mockProps.onWillHide.mock.calls.length).not.toBeGreaterThan(1);
  });
  it('useToaster() context returns correct values', () => {
    const { result } = renderHook(useToaster, { wrapper: ToastProvider });
    expect(result.current).toMatchObject({
      isToastVisible: false,
      hide: expect.any(Function),
      show: expect.any(Function),
      getQueue: expect.any(Function),
      dangerously_get_queue: expect.any(Function),
    });
  });

  it('useToaster() context methods work correctly', () => {
    const {
      result: { current: toast },
    } = renderHook(useToaster, { wrapper: ToastProvider });

    const spyShow = jest.spyOn(toast, 'show');
    act(() => {
      const toastConfig = { title: 'hello there' };
      toast.show(toastConfig);
    });
    expect(spyShow).toBeCalledWith({ title: 'hello there' });
    const spyGetQ = jest.spyOn(toast, 'getQueue');
    const expectedQueue = [{ title: 'hello there' }];
    const queue = toast.getQueue();
    expect(spyGetQ).toBeCalled();
    expect(queue).toEqual(expectedQueue);
    expect(Object.isFrozen(queue)).toBe(true);
    queue.forEach((_toast) => expect(Object.isFrozen(_toast)).toBe(true));

    const spyHide = jest.spyOn(toast, 'hide');
    act(() => {
      toast.hide();
    });
    expect(spyHide).toHaveBeenCalled();
    const dangerousQSpy = jest.spyOn(toast, 'dangerously_get_queue');
    const dangerousQ = toast.dangerously_get_queue();
    expect(dangerousQSpy).toHaveBeenCalled();
    expect(dangerousQ).toEqual(expectedQueue);
    expect(Object.isFrozen(dangerousQ)).toBe(false);
  });

  // this test causes weird open handles issue due to animation timer not being properly run on jest > v27
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

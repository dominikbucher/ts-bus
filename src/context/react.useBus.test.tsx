import { renderHook } from '@testing-library/react';
import { bus, wrapper } from '../testhelpers';
import { useBus } from './react';

it('should provide a bus', () => {
  const { result } = renderHook(() => useBus(), { wrapper });
  expect(result.current).toBe(bus);
});

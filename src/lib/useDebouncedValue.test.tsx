import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('oddaje wartość dopiero po przerwie w zmianach', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })
    expect(result.current).toBe('a') // jeszcze nie minęło opóźnienie

    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('ab')
  })

  /** Sedno: szybkie pisanie ma dać jedną wartość na końcu, nie ciąg pośrednich. */
  it('pomija wartości pośrednie przy szybkim pisaniu', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: '' },
    })

    for (const value of ['a', 'ag', 'agr', 'agri']) {
      rerender({ value })
      act(() => vi.advanceTimersByTime(100)) // krócej niż opóźnienie
    }
    expect(result.current).toBe('')

    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('agri')
  })
})

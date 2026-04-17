import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getColombiaDayLabelSetForWindow, getLastDaysColombiaLabels } from './date-colombia';

/** Martes 15 abr 2026 ~ mediodía Bogotá (misma fecha calendario en CO). */
const FIXED_NOW = new Date('2026-04-15T18:00:00.000Z');

describe('getLastDaysColombiaLabels', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve N etiquetas D/M; la última corresponde al día actual en Colombia', () => {
    const labels = getLastDaysColombiaLabels(31);
    expect(labels).toHaveLength(31);
    expect(labels[labels.length - 1]).toBe('15/4');
  });

  it('los últimos 7 días coinciden con slice de la ventana de 31', () => {
    const from31 = getLastDaysColombiaLabels(31).slice(-7);
    const seven = getLastDaysColombiaLabels(7);
    expect(from31).toEqual(seven);
  });
});

describe('getColombiaDayLabelSetForWindow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ventana 1 día = solo la etiqueta de hoy', () => {
    const set = getColombiaDayLabelSetForWindow(1);
    expect(set.size).toBe(1);
    expect(set.has('15/4')).toBe(true);
  });

  it('ventana 7 días incluye hoy y 6 días anteriores', () => {
    const set = getColombiaDayLabelSetForWindow(7);
    expect(set.size).toBe(7);
    expect(set.has('15/4')).toBe(true);
    expect(set.has('9/4')).toBe(true);
  });
});

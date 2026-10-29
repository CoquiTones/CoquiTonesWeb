import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SpectrogramControls from '../src/components/SoundAnalysisTools/render/SpectrogramControls';
import { renderWithTheme } from './helpers/renderWithTheme';

const makeProps = (overrides = {}) => ({
  colorscale: 'jet',
  setColorscale: vi.fn(),
  xrange: [0, 15],
  setXrange: vi.fn(),
  yrange: [0, 10000],
  setYrange: vi.fn(),
  defaultX: [0, 60],
  defaultY: [0, 22050],
  detailProfile: 'high',
  setDetailProfile: vi.fn(),
  duration: 60,
  sampleRate: 44100,
  disabled: false,
  rerendering: false,
  onRerenderVisible: vi.fn(),
  ...overrides,
});

const expandAdvancedSettings = () => {
  fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }));
};

describe('SpectrogramControls advanced settings', () => {
  it('keeps generation profiles collapsed by default', () => {
    renderWithTheme(<SpectrogramControls {...makeProps()} />);

    expect(screen.getByText('Display')).toBeTruthy();
    expect(screen.getByText('Advanced settings')).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: /Resolution profile/i })).toBeNull();
  });

  it('shows the effective detail for the selected profile', () => {
    renderWithTheme(<SpectrogramControls {...makeProps()} />);
    expandAdvancedSettings();

    expect(screen.getByRole('combobox', { name: /Resolution profile/i })).toBeTruthy();
    expect(screen.getAllByText(/2,048 frames/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/46 ms\/frame at 50% overlap/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1,024 bins/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/22 Hz\/bin/).length).toBeGreaterThan(0);
  });

  it('updates the generation profile from the dropdown', () => {
    const props = makeProps();
    renderWithTheme(<SpectrogramControls {...props} />);
    expandAdvancedSettings();

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /Resolution profile/i }));
    fireEvent.click(screen.getByRole('option', { name: /Low/ }));

    expect(props.setDetailProfile).toHaveBeenCalledWith('low');
  });

  it('re-renders only the visible segment from advanced settings', () => {
    const props = makeProps();
    renderWithTheme(<SpectrogramControls {...props} />);
    expandAdvancedSettings();

    fireEvent.click(screen.getByRole('button', { name: 'Re-render visible segment' }));

    expect(props.onRerenderVisible).toHaveBeenCalledTimes(1);
  });

  it('disables the segment re-render while one is running', () => {
    renderWithTheme(
      <SpectrogramControls {...makeProps({ rerendering: true })} />,
    );
    expandAdvancedSettings();

    const button = screen.getByRole('button', { name: /Re-rendering visible segment/ });
    expect(button.disabled).toBe(true);
  });

  it('reports the effective bin count when the file cannot use the profile detail', () => {
    renderWithTheme(
      <SpectrogramControls
        {...makeProps({ detailProfile: 'high', sampleRate: 8000 })}
      />,
    );
    expandAdvancedSettings();

    // An 8 kHz recording uses a 1024-point FFT, so only 513 bins exist.
    expect(screen.getAllByText(/513 bins/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/max for this file/).length).toBeGreaterThan(0);
  });
});

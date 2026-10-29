import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DataManager from '../src/components/shared/DataManager';
import { ErrorProvider } from '../src/components/shared/ErrorContext';
import { renderWithTheme } from './helpers/renderWithTheme';

const makeProps = (overrides = {}) => ({
  audioFile: null,
  setAudioFile: vi.fn(),
  setDefaultX: vi.fn(),
  setDefaultY: vi.fn(),
  setStats: vi.fn(),
  canExport: false,
  onExportScreenshot: vi.fn(),
  ...overrides,
});

const renderManager = (props) => renderWithTheme(
  <ErrorProvider>
    <DataManager {...props} />
  </ErrorProvider>,
);

describe('DataManager export control', () => {
  it('disables the PNG export until a spectrogram is ready', () => {
    renderManager(makeProps());

    expect(screen.getByRole('button', {
      name: 'Export the visible spectrogram as a PNG',
    }).disabled).toBe(true);
  });

  it('calls the screenshot exporter from the upload toolbar', () => {
    const props = makeProps({ canExport: true });
    renderManager(props);

    fireEvent.click(screen.getByRole('button', {
      name: 'Export the visible spectrogram as a PNG',
    }));

    expect(props.onExportScreenshot).toHaveBeenCalledTimes(1);
  });
});

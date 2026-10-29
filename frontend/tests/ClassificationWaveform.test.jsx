import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ClassificationWaveform from '../src/components/classifier/ClassificationWaveform';
import { SPECIES } from '../src/components/classifier/species';
import { useWaveformPeaks } from '../src/components/classifier/useWaveformPeaks';
import { renderWithTheme } from './helpers/renderWithTheme';

vi.mock('../src/components/classifier/useWaveformPeaks', () => ({
  useWaveformPeaks: vi.fn(),
}));

const makeSlice = (start, end, keys = []) => ({
  start_time: start,
  end_time: end,
  ...Object.fromEntries(
    SPECIES.map((species) => [species.key, keys.includes(species.key) ? 1 : 0]),
  ),
});

const slices = [
  makeSlice(0, 10, ['coqui']),
  makeSlice(10, 20, ['gryllus']),
];

const file = new File([new Uint8Array(1)], 'field-recording.wav', {
  type: 'audio/wav',
  lastModified: 0,
});

const readyState = {
  status: 'ready',
  peaks: Float32Array.from([0.2, 0.8, 0.4, 0.9]),
  duration: 20,
  error: null,
  skippedReason: null,
};

const renderWaveform = (props = {}) =>
  renderWithTheme(
    <ClassificationWaveform
      slices={slices}
      audioFile={file}
      fileName="field-recording.wav"
      {...props}
    />,
  );

const openTimeline = () => screen.getByRole('application', { name: /Detection timeline/ });

const mockPlotRect = (element, width = 800, height = 160) => {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width,
    height,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
};

describe('ClassificationWaveform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWaveformPeaks.mockReturnValue(readyState);
  });

  it('renders the timeline, summary, and species legend', () => {
    renderWaveform();

    expect(screen.getByRole('heading', { name: 'Detection timeline' })).toBeTruthy();
    expect(screen.getByTestId('classification-waveform-summary').textContent).toMatch(
      /2 of 2 windows with detections/,
    );
    expect(screen.getAllByText('Coquí').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gryllus').length).toBeGreaterThan(0);
  });

  it('shows the first detected window on focus and moves with the arrow keys', () => {
    renderWaveform();
    const timeline = openTimeline();

    fireEvent.focus(timeline);

    let tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('0s – 10s')).toBeTruthy();
    expect(within(tooltip).getByText('Coquí')).toBeTruthy();

    fireEvent.keyDown(timeline, { key: 'ArrowRight' });

    tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('10s – 20s')).toBeTruthy();
    expect(within(tooltip).getByText('Gryllus')).toBeTruthy();
    expect(
      screen.getByTestId('classification-waveform-announcement').textContent,
    ).toMatch(/10 to 20 seconds/);

    fireEvent.keyDown(timeline, { key: 'End' });
    expect(within(screen.getByRole('tooltip')).getByText('10s – 20s')).toBeTruthy();

    fireEvent.keyDown(timeline, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('inspects the window under the pointer and clears on leave', () => {
    renderWaveform();
    const timeline = openTimeline();
    mockPlotRect(timeline);

    fireEvent.pointerMove(timeline, { clientX: 600, clientY: 80, pointerType: 'mouse' });

    expect(within(screen.getByRole('tooltip')).getByText('10s – 20s')).toBeTruthy();

    fireEvent.pointerLeave(timeline);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('describes the unclassified tail after the last complete window', () => {
    useWaveformPeaks.mockReturnValue({ ...readyState, duration: 25 });
    renderWaveform();
    const timeline = openTimeline();
    mockPlotRect(timeline);

    fireEvent.pointerMove(timeline, { clientX: 720, clientY: 80, pointerType: 'mouse' });

    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('Unclassified audio')).toBeTruthy();
    expect(within(tooltip).getByText('20s – 25s')).toBeTruthy();
  });

  it('keeps highlights and inspection available when decoding fails', () => {
    useWaveformPeaks.mockReturnValue({
      status: 'failed',
      peaks: null,
      duration: 0,
      error: 'decode failed',
      skippedReason: null,
    });

    renderWaveform();

    expect(screen.getByText(/waveform preview could not be decoded/i)).toBeTruthy();

    const timeline = openTimeline();
    fireEvent.focus(timeline);
    expect(within(screen.getByRole('tooltip')).getByText('0s – 10s')).toBeTruthy();
  });

  it('shows a progress state while the envelope is decoding', () => {
    useWaveformPeaks.mockReturnValue({
      status: 'decoding',
      peaks: null,
      duration: 0,
      error: null,
      skippedReason: null,
    });

    renderWaveform();

    expect(screen.getByText('Preparing waveform…')).toBeTruthy();
    expect(openTimeline().getAttribute('aria-busy')).toBe('true');
  });

  it('reports a slice without detections honestly', () => {
    useWaveformPeaks.mockReturnValue({ ...readyState, duration: 10 });
    renderWaveform({ slices: [makeSlice(0, 10, [])] });

    const timeline = openTimeline();
    fireEvent.focus(timeline);

    expect(within(screen.getByRole('tooltip')).getByText('No species detected')).toBeTruthy();
  });

  it('renders nothing without slices', () => {
    const { container } = renderWaveform({ slices: [] });
    expect(container.firstChild).toBeNull();
  });
});

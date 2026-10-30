import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PageHero from '../src/components/layout/PageHero';
import { renderWithTheme } from './helpers/renderWithTheme';

const VIDEO_SRC = 'https://example.com/hero.mp4';
const pausedDescriptor = Object.getOwnPropertyDescriptor(
  HTMLMediaElement.prototype,
  'paused',
);

let playSpy;
let pauseSpy;

beforeEach(() => {
  // jsdom does not implement media playback, so emulate the essential parts.
  Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
    configurable: true,
    get() {
      return this.__paused ?? true;
    },
  });

  playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function play() {
    this.__paused = false;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });

  pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function pause() {
    this.__paused = true;
    this.dispatchEvent(new Event('pause'));
  });
});

afterEach(() => {
  playSpy?.mockRestore();
  pauseSpy?.mockRestore();
  Object.defineProperty(HTMLMediaElement.prototype, 'paused', pausedDescriptor);
});

const renderHero = (props = {}) =>
  renderWithTheme(<PageHero id="home" title="Coquí" videoSrc={VIDEO_SRC} {...props} />);

describe('PageHero background video', () => {
  it('plays automatically by default and exposes a pause control', async () => {
    renderHero();

    const video = document.querySelector('video');
    expect(video).toBeTruthy();
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.getAttribute('muted')).not.toBeNull();
    expect(video.loop).toBe(true);

    await waitFor(() => expect(playSpy).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Pause background video' })).toBeTruthy();
  });

  it('pauses and resumes from the control', async () => {
    renderHero();
    const video = document.querySelector('video');

    await waitFor(() => expect(playSpy).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Pause background video' }));
    expect(pauseSpy).toHaveBeenCalled();
    expect(video.__paused).toBe(true);
    expect(screen.getByRole('button', { name: 'Play background video' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Play background video' }));
    expect(playSpy).toHaveBeenCalledTimes(2);
    expect(video.__paused).toBe(false);
    expect(screen.getByRole('button', { name: 'Pause background video' })).toBeTruthy();
  });

  it('falls back to the poster image if the video fails to load', async () => {
    renderHero({ videoSrc: VIDEO_SRC, image: '/poster.jpg', imageAlt: 'Coquí' });

    fireEvent.error(document.querySelector('video'));

    await waitFor(() => expect(document.querySelector('video')).toBeNull());
    expect(screen.getByAltText('Coquí')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /background video/i })).toBeNull();
  });

  it('does not render a video when none is provided', () => {
    renderWithTheme(<PageHero id="about" title="About" image="/poster.jpg" imageAlt="Coquí" />);

    expect(document.querySelector('video')).toBeNull();
    expect(screen.getByAltText('Coquí')).toBeTruthy();
  });
});

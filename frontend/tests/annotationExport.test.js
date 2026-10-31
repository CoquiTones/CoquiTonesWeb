import { describe, expect, it, vi } from 'vitest';

import {
  buildAnnotationExport,
  downloadAnnotationExport,
  exportFileName,
  sanitizeRecordingName,
} from '../src/components/SoundAnalysisTools/annotation/annotationExport';
import { makeWindows, speciesState } from './helpers/annotationFixtures';

const makeFile = (name = 'node-3-42.wav') => (
  new File([new Uint8Array([1])], name, { type: 'audio/wav' })
);

const exportedAt = new Date('2026-10-31T14:10:00Z');

describe('annotation export payload', () => {
  it('builds a versioned payload covering every window and species flag', () => {
    const windows = makeWindows(22.5).map((window, index) => ({
      ...window,
      ...speciesState(index === 0 ? { coqui: true } : index === 1 ? { gryllus: true } : {}),
    }));

    const payload = buildAnnotationExport({
      audioFile: makeFile(),
      durationSeconds: 22.5,
      afid: 42,
      source: 'Manual',
      isDraft: false,
      windows,
      exportedAt,
    });

    expect(payload.schema_version).toBe(1);
    expect(payload.window_seconds).toBe(10);
    expect(payload.audio).toEqual({
      name: 'node-3-42.wav',
      duration_seconds: 22.5,
      afid: 42,
    });
    expect(payload.source).toBe('Manual');
    expect(payload.is_draft).toBe(false);
    expect(payload.exported_at).toBe('2026-10-31T14:10:00.000Z');
    expect(payload.slices).toHaveLength(3);
    expect(payload.slices[0]).toMatchObject({
      window_index: 0,
      start_time: 0,
      end_time: 10,
      coqui: true,
      gryllus: false,
    });
    expect(payload.slices[1]).toMatchObject({ gryllus: true });
    expect(payload.slices[2]).toMatchObject({
      window_index: 2,
      start_time: 20,
      end_time: 22.5,
    });
  });

  it('marks local-only and edited exports as drafts', () => {
    const windows = makeWindows(10);

    const local = buildAnnotationExport({
      audioFile: makeFile('local.wav'),
      durationSeconds: 10,
      afid: null,
      source: 'None',
      isDraft: true,
      windows,
      exportedAt,
    });

    expect(local.audio.afid).toBeNull();
    expect(local.source).toBe('None');
    expect(local.is_draft).toBe(true);
  });

  it('rejects exporting without a loaded recording', () => {
    expect(() => buildAnnotationExport({
      audioFile: null,
      durationSeconds: 0,
      windows: [],
      exportedAt,
    })).toThrow(/recording/i);

    expect(() => buildAnnotationExport({
      audioFile: makeFile(),
      durationSeconds: 0,
      windows: [],
      exportedAt,
    })).toThrow(/duration/i);
  });
});

describe('annotation export file name', () => {
  it('derives a timestamped name from the recording name', () => {
    expect(exportFileName('My Recording (final).wav', exportedAt))
      .toBe('My-Recording-final-annotations-20261031-141000.json');
  });

  it('removes path separators and falls back for empty names', () => {
    expect(exportFileName('../../etc/passwd', exportedAt))
      .toBe('passwd-annotations-20261031-141000.json');
    expect(exportFileName('', exportedAt))
      .toBe('recording-annotations-20261031-141000.json');
    expect(sanitizeRecordingName('   ')).toBe('recording');
  });

  it('limits very long names', () => {
    const name = `${'a'.repeat(200)}.wav`;
    expect(exportFileName(name, exportedAt).length).toBeLessThan(140);
  });
});

describe('annotation export download', () => {
  it('triggers one JSON download and revokes the object URL', () => {
    const createObjectURL = vi.fn(() => 'blob:annotations');
    const revokeObjectURL = vi.fn();
    const click = vi.fn();
    const anchor = { href: '', download: '', click, style: {} };
    const documentRef = {
      createElement: vi.fn(() => anchor),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    };

    downloadAnnotationExport(
      { schema_version: 1 },
      'fixture-annotations.json',
      {
        documentRef,
        urlRef: { createObjectURL, revokeObjectURL },
      },
    );

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe('fixture-annotations.json');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:annotations');
  });
});

import { describe, expect, it, vi } from 'vitest';

import { NodeList } from '../src/services/rest/ResponseORM/NetworkMonitor/NodeResponse';
import { WeekSpeciesSummary } from '../src/services/rest/ResponseORM/Dashboard/WeekSpeciesSummary';
import { RecentData } from '../src/services/rest/ResponseORM/Dashboard/RecenDataResponse';
import { escapeCsvValue, formatRelativeTime, parseApiDate, toCsv } from '../src/utils/format';

describe('NodeList', () => {
  const response = [
    { nid: 1, nname: 'North ridge', nttype: 'primary', ntype: 'primary', nlatitude: 18.2, nlongitude: -66.4, ndescription: 'Ridge' },
    { nid: 2, ntype: 'secondary', nlatitude: 18.3, nlongitude: -66.5, ndescription: 'Valley' },
  ];

  it('wraps API rows and exposes a length', () => {
    const list = new NodeList(response);
    expect(list.length).toBe(2);
    expect(list.isEmpty()).toBe(false);
    expect([...list].map((node) => node.nid)).toEqual([1, 2]);
  });

  it('is iterable and filterable', () => {
    const list = new NodeList(response);
    expect(list.filter((node) => node.ntype === 'primary')).toHaveLength(1);
    expect(list.toArray()).toHaveLength(2);
  });

  it('handles missing payloads safely', () => {
    const list = new NodeList(undefined);
    expect(list.length).toBe(0);
    expect(list.isEmpty()).toBe(true);
  });

  it('reports whether a node has usable coordinates', () => {
    const [node] = new NodeList(response).toArray();
    expect(node.hasLocation).toBe(true);
    expect(new NodeList([{}]).toArray()[0].hasLocation).toBe(false);
  });
});

describe('WeekSpeciesSummary', () => {
  it('detects an empty week', () => {
    expect(new WeekSpeciesSummary({}).isEmpty()).toBe(true);
    expect(new WeekSpeciesSummary({ date_bin: [] }).isEmpty()).toBe(true);
    expect(new WeekSpeciesSummary({ date_bin: ['2026-10-01'], total_coqui: [3] }).isEmpty()).toBe(false);
  });

  it('formats the axis and series', () => {
    const summary = new WeekSpeciesSummary({ date_bin: ['2026-10-01', '2026-10-02'], total_coqui: [1, 2] });
    expect(summary.getXData()).toHaveLength(2);
    const series = summary.getSeriesData();
    expect(series).toHaveLength(8);
    expect(series[0]).toMatchObject({ label: 'Coquí', data: [1, 2] });
  });
});

describe('RecentData', () => {
  it('assigns stable grid ids and parses timestamps', () => {
    const data = new RecentData([
      { tid: 10, nid: 1, afid: 5, humidity: 70, temperature: 80, pressure: 1010, rain: 0, time: '2026-10-20T10:00:00Z' },
    ]);
    const [row] = data.getData();
    expect(data.length).toBe(1);
    expect(row.id).toBe(1);
    expect(row.tid).toBe(10);
    expect(row.timestamp).toBe(Date.parse('2026-10-20T10:00:00Z'));
  });

  it('handles non-array payloads', () => {
    expect(new RecentData(null).length).toBe(0);
  });

  it('treats naive API timestamps as UTC and keeps explicit zones', () => {
    const data = new RecentData([
      { tid: 1, nid: 1, afid: 2, time: '2026-10-28T02:29:10.788' },
      { tid: 2, nid: 1, afid: 3, time: '2026-10-28T02:29:10.788Z' },
      { tid: 3, nid: 1, afid: 4, time: '2026-10-27T22:29:10.788-04:00' },
    ]);
    const [naive, utc, offset] = data.getData();
    expect(naive.timestamp).toBe(Date.parse('2026-10-28T02:29:10.788Z'));
    expect(utc.timestamp).toBe(naive.timestamp);
    expect(offset.timestamp).toBe(naive.timestamp);
  });
});

describe('parseApiDate', () => {
  it('appends UTC to naive ISO strings only', () => {
    expect(parseApiDate('2026-10-28T02:29:10.788').toISOString()).toBe('2026-10-28T02:29:10.788Z');
    expect(parseApiDate('2026-10-28T02:29:10.788Z').toISOString()).toBe('2026-10-28T02:29:10.788Z');
    expect(parseApiDate('2026-10-27T22:29:10.788-04:00').toISOString()).toBe('2026-10-28T02:29:10.788Z');
    expect(parseApiDate(new Date('2026-10-28T02:29:10.788Z')).toISOString()).toBe('2026-10-28T02:29:10.788Z');
  });
});

describe('CSV helpers', () => {
  it('escapes quotes, commas and newlines', () => {
    expect(escapeCsvValue('a,b')).toBe('"a,b"');
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvValue(null)).toBe('""');
  });

  it('builds a CSV document from headers and rows', () => {
    const csv = toCsv(['Node', 'Detected'], [[1, 'Coquí'], [2, 'Gryllus']]);
    expect(csv.split('\n')).toHaveLength(3);
    expect(csv).toContain('"Node","Detected"');
  });
});

describe('formatRelativeTime', () => {
  it('formats recent and missing timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    expect(formatRelativeTime(Date.parse('2026-10-20T10:00:00Z'))).toMatch(/2 hours ago/);
    expect(formatRelativeTime(null)).toBe('Unknown');
    vi.useRealTimers();
  });
});

/**
 * Single source of truth for top-level navigation. Both the desktop navbar
 * and the mobile drawer render from this list, so labels/routes cannot drift.
 */
export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/Dashboard',
    sectionId: 'dashboard',
    protected: true,
  },
  {
    label: 'IoT Network',
    to: '/NetworkMonitor',
    sectionId: 'network-monitor',
    protected: true,
  },
  {
    label: 'Classifier',
    to: '/Classifier',
    sectionId: 'classifier',
    protected: false,
  },
  {
    label: 'Spectral Analysis',
    to: '/SpectralAnalysis',
    sectionId: 'spectral-analysis',
    protected: false,
  },
  {
    label: 'About',
    to: '/About',
    sectionId: 'about',
    protected: false,
  },
];

export const PROJECT_REPOSITORY = 'https://github.com/CoquiTones/CoquiTonesWeb';

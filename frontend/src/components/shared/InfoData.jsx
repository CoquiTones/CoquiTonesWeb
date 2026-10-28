import homeDashboard from '../assets/images/homedashboard.svg';
import homeNetwork from '../assets/images/homecdn.svg';
import homeClassifier from '../assets/images/homeclassifier.svg';
import homeAnalysis from '../assets/images/homeanalysis.svg';

/**
 * Content for the marketing sections on the home page. `id` values are also
 * the scroll targets used by the home navbar.
 */
export const HOME_SECTIONS = [
  {
    id: 'dashboard',
    eyebrow: 'Dashboard',
    headline: 'Historical data, presented in a structured way',
    description:
      'Every recording is stored in a relational database and surfaced as charts, node health checks, and an exportable data table — so trends are visible without manual spreadsheets.',
    buttonLabel: 'Open the dashboard',
    buttonRoute: '/Dashboard',
    image: homeDashboard,
    imageAlt: 'Dashboard illustration showing weekly species detections and recent records',
    imageSide: 'right',
    tone: 'dark',
  },
  {
    id: 'network-monitor',
    eyebrow: 'Bio-acoustic monitoring',
    headline: 'Deploy and manage an IoT sensor network',
    description:
      'Build monitors from our open hardware design, then collect acoustic and meteorological data. The Cluster Duck protocol links devices over a modified LoRa network.',
    buttonLabel: 'Explore the IoT network',
    buttonRoute: '/NetworkMonitor',
    image: homeNetwork,
    imageAlt: 'Illustration of connected field sensor nodes',
    imageSide: 'left',
    tone: 'raised',
  },
  {
    id: 'classifier',
    eyebrow: 'Machine learning',
    headline: 'Identify coquí species with a trained model',
    description:
      'A Random Forest classifier analyses each uploaded recording and reports which species are present in every time slice, with a CSV export for further study.',
    buttonLabel: 'Try the classifier',
    buttonRoute: '/Classifier',
    image: homeClassifier,
    imageAlt: 'Illustration of an audio waveform being classified',
    imageSide: 'right',
    tone: 'dark',
  },
  {
    id: 'spectral-analysis',
    eyebrow: 'Spectral analysis',
    headline: 'Inspect recordings with precision',
    description:
      'Upload a recording and explore an interactive spectrogram. Filter by time and frequency, switch colour scales, and read file metadata before you analyse.',
    buttonLabel: 'Open spectral analysis',
    buttonRoute: '/SpectralAnalysis',
    image: homeAnalysis,
    imageAlt: 'Illustration of a spectrogram with time and frequency axes',
    imageSide: 'left',
    tone: 'raised',
  },
];

// Named exports kept for any external imports.
export const dashboardData = HOME_SECTIONS[0];
export const NetworkMonitorData = HOME_SECTIONS[1];
export const ClassifierData = HOME_SECTIONS[2];
export const SpectralAnalysisData = HOME_SECTIONS[3];

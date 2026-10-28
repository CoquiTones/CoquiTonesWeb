import { createTheme, alpha } from '@mui/material/styles';
import { palette, radii, fontFamily, motion } from './tokens';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: palette.amber,
      light: palette.amberSoft,
      dark: palette.ember,
      contrastText: palette.ink,
    },
    secondary: {
      main: palette.ember,
      light: palette.emberText,
      dark: '#7A3000',
      contrastText: palette.fog,
    },
    error: { main: palette.error, contrastText: palette.ink },
    warning: { main: palette.warning, contrastText: palette.ink },
    info: { main: palette.info, contrastText: palette.ink },
    success: { main: palette.success, contrastText: palette.ink },
    background: {
      default: palette.ink,
      paper: palette.inkRaised,
    },
    divider: palette.line,
    text: {
      primary: palette.fog,
      secondary: palette.fogMuted,
      disabled: alpha(palette.fog, 0.38),
    },
    action: {
      hover: alpha(palette.amber, 0.08),
      selected: alpha(palette.amber, 0.16),
      focus: alpha(palette.amber, 0.24),
      disabled: alpha(palette.fog, 0.3),
      disabledBackground: alpha(palette.fog, 0.12),
    },
  },
  shape: { borderRadius: radii.md },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  typography: {
    fontFamily: fontFamily.body,
    h1: {
      fontSize: 'clamp(2.25rem, 1.4rem + 3.6vw, 3.75rem)',
      fontWeight: 700,
      lineHeight: 1.08,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: 'clamp(1.75rem, 1.2rem + 2.2vw, 2.5rem)',
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: '-0.015em',
    },
    h3: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.25 },
    h4: { fontSize: '1.25rem', fontWeight: 650, lineHeight: 1.3 },
    h5: { fontSize: '1.125rem', fontWeight: 650, lineHeight: 1.35 },
    h6: { fontSize: '1rem', fontWeight: 650, lineHeight: 1.4 },
    subtitle1: { fontSize: '1.0625rem', lineHeight: 1.6 },
    subtitle2: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '1rem', lineHeight: 1.65 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5, letterSpacing: '0.01em' },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.14em',
      lineHeight: 1.6,
      textTransform: 'uppercase',
    },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    // Numeric/data values keep a tabular monospace stack.
    monospace: {
      fontFamily: fontFamily.mono,
      fontVariantNumeric: 'tabular-nums',
    },
  },
  transitions: {
    duration: { shortest: motion.fast, shorter: 180, short: motion.base, standard: 280, complex: motion.slow },
    easing: { easeInOut: motion.easing },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': { colorScheme: 'dark' },
        html: { WebkitTextSizeAdjust: '100%' },
        body: {
          minHeight: '100%',
          backgroundColor: palette.ink,
          color: palette.fog,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        },
        '#root': { minHeight: '100dvh' },
        '::selection': { backgroundColor: alpha(palette.amber, 0.32), color: palette.fog },
        ':focus-visible': {
          outline: `2px solid ${palette.amber}`,
          outlineOffset: 2,
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radii.pill,
          paddingInline: 20,
          minHeight: 40,
          '&.Mui-focusVisible': { outlineOffset: 3 },
        },
        sizeSmall: { minHeight: 32, paddingInline: 14 },
        sizeLarge: { minHeight: 48, paddingInline: 28, fontSize: '1rem' },
        containedPrimary: { color: palette.ink },
        outlined: { borderColor: palette.lineStrong },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radii.sm,
          '&.Mui-focusVisible': { outlineOffset: 2 },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${palette.line}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(palette.inkRaised, 0.92),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${palette.line}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: 64, '@media (min-width:600px)': { minHeight: 72 } },
      },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: {
        root: { color: palette.amberSoft, textUnderlineOffset: 3 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: palette.line },
        head: {
          fontWeight: 700,
          color: palette.fog,
          backgroundColor: palette.inkSoft,
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radii.pill, fontWeight: 600 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: palette.inkRaised,
          border: `1px solid ${palette.lineStrong}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 700 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(palette.fog, 0.04),
          '& fieldset': { borderColor: palette.lineStrong },
          '&:hover fieldset': { borderColor: alpha(palette.amber, 0.6) },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.fog,
          color: palette.ink,
          fontSize: '0.8125rem',
          borderRadius: radii.sm,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: radii.md },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: { paddingInline: 16 },
        maxWidthLg: { '@media (min-width:1200px)': { maxWidth: 1180 } },
      },
    },
    MuiTabs: {
      styleOverrides: { indicator: { height: 3, borderRadius: 3 } },
    },
  },
});

export default theme;

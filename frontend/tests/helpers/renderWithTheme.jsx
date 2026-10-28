import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import theme from '../../src/theme/theme';

export const renderWithTheme = (ui) => {
  const result = render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  return {
    ...result,
    rerenderWithTheme: (nextUi) =>
      result.rerender(<ThemeProvider theme={theme}>{nextUi}</ThemeProvider>),
  };
};

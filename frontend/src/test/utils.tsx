import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { theme } from '../theme';

interface ProvidersOptions {
  route?: string;
}

/** Wraps a component in all app-level providers for tests. */
function AllProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <AuthProvider>{children}</AuthProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

/** Render a component inside providers and a MemoryRouter at the given route. */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...options }: ProvidersOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AllProviders>{ui}</AllProviders>
    </MemoryRouter>,
    options,
  );
}

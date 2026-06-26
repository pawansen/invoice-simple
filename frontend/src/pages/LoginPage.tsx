import { zodResolver } from '@hookform/resolvers/zod';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { extractErrorMessage } from '../api/axios';
import { useAuth } from '../auth/useAuth';
import { LoginFormValues, loginSchema } from '../schemas/login.schema';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { login, isAuthenticated, isInitialising } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Already signed in -> go straight to the app.
  if (!isInitialising && isAuthenticated) {
    const redirectTo = (location.state as LocationState)?.from?.pathname ?? '/invoices';
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values);
      const redirectTo = (location.state as LocationState)?.from?.pathname ?? '/invoices';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(extractErrorMessage(error, 'Invalid email or password'));
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%' }} elevation={3}>
        <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <ReceiptLongIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5">SimpleInvoice</Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to manage your invoices
          </Typography>
        </Stack>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              autoComplete="email"
              autoFocus
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              autoComplete="current-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}

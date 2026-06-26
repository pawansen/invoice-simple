import { zodResolver } from '@hookform/resolvers/zod';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { extractErrorMessage } from '../api/axios';
import { useCreateInvoice } from '../hooks/useCreateInvoice';
import {
  CreateInvoiceFormValues,
  createInvoiceSchema,
} from '../schemas/invoice.schema';
import { CreateInvoicePayload } from '../types/invoice';

const CURRENCIES = ['AUD', 'USD', 'GBP', 'EUR', 'SGD', 'NZD'];

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const createInvoice = useCreateInvoice();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      invoiceReference: '',
      invoiceDate: '',
      dueDate: '',
      currency: 'AUD',
      description: '',
      taxPercent: 10,
      discount: 0,
      customer: { fullname: '', email: '', mobileNumber: '', address: '' },
      item: { name: '', quantity: 1, rate: 0 },
    },
  });

  const onSubmit = (values: CreateInvoiceFormValues) => {
    const payload: CreateInvoicePayload = {
      invoiceNumber: values.invoiceNumber,
      invoiceReference: values.invoiceReference || undefined,
      invoiceDate: values.invoiceDate,
      dueDate: values.dueDate,
      currency: values.currency,
      description: values.description || undefined,
      taxPercent: values.taxPercent,
      discount: values.discount,
      customer: {
        fullname: values.customer.fullname,
        email: values.customer.email,
        mobileNumber: values.customer.mobileNumber || undefined,
        address: values.customer.address || undefined,
      },
      item: {
        name: values.item.name,
        quantity: values.item.quantity,
        rate: values.item.rate,
      },
    };

    createInvoice.mutate(payload, {
      onSuccess: () => {
        enqueueSnackbar('Invoice created successfully', { variant: 'success' });
        navigate('/invoices');
      },
      onError: (error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        const message = extractErrorMessage(error, 'Could not create invoice');
        if (status === 409) {
          // Duplicate invoice number — surface against the relevant field.
          setError('invoiceNumber', { type: 'server', message });
        }
        enqueueSnackbar(message, { variant: 'error' });
      },
    });
  };

  return (
    <Stack spacing={2}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')} sx={{ alignSelf: 'flex-start' }}>
        Back to invoices
      </Button>
      <Typography variant="h5">Create Invoice</Typography>
      <Typography variant="body2" color="text.secondary">
        New invoices are created as <strong>Draft</strong>. Totals are calculated by the server.
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          {/* Invoice details */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" gutterBottom>
                Invoice Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Invoice Number"
                    fullWidth
                    required
                    error={Boolean(errors.invoiceNumber)}
                    helperText={errors.invoiceNumber?.message}
                    {...register('invoiceNumber')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Reference (optional)"
                    fullWidth
                    error={Boolean(errors.invoiceReference)}
                    helperText={errors.invoiceReference?.message}
                    {...register('invoiceReference')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Invoice Date"
                    type="date"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(errors.invoiceDate)}
                    helperText={errors.invoiceDate?.message}
                    {...register('invoiceDate')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Due Date"
                    type="date"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(errors.dueDate)}
                    helperText={errors.dueDate?.message}
                    {...register('dueDate')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Currency"
                    fullWidth
                    required
                    defaultValue="AUD"
                    error={Boolean(errors.currency)}
                    helperText={errors.currency?.message}
                    {...register('currency')}
                  >
                    {CURRENCIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description (optional)"
                    fullWidth
                    multiline
                    minRows={2}
                    {...register('description')}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Customer */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Customer
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Full Name"
                    fullWidth
                    required
                    error={Boolean(errors.customer?.fullname)}
                    helperText={errors.customer?.fullname?.message}
                    {...register('customer.fullname')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    error={Boolean(errors.customer?.email)}
                    helperText={errors.customer?.email?.message}
                    {...register('customer.email')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Mobile (optional)"
                    fullWidth
                    {...register('customer.mobileNumber')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Address (optional)"
                    fullWidth
                    {...register('customer.address')}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Line item + amounts */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Line Item
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Item Name"
                    fullWidth
                    required
                    error={Boolean(errors.item?.name)}
                    helperText={errors.item?.name?.message}
                    {...register('item.name')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ min: 1, step: 1 }}
                    error={Boolean(errors.item?.quantity)}
                    helperText={errors.item?.quantity?.message}
                    {...register('item.quantity')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Rate"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ min: 0, step: '0.01' }}
                    error={Boolean(errors.item?.rate)}
                    helperText={errors.item?.rate?.message}
                    {...register('item.rate')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Tax (%)"
                    type="number"
                    fullWidth
                    inputProps={{ min: 0, step: '0.01' }}
                    error={Boolean(errors.taxPercent)}
                    helperText={errors.taxPercent?.message ?? 'Defaults to 10%'}
                    {...register('taxPercent')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Discount"
                    type="number"
                    fullWidth
                    inputProps={{ min: 0, step: '0.01' }}
                    error={Boolean(errors.discount)}
                    helperText={errors.discount?.message ?? 'Defaults to 0'}
                    {...register('discount')}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => navigate('/invoices')} disabled={createInvoice.isPending}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={createInvoice.isPending}>
                {createInvoice.isPending ? 'Creating…' : 'Create Invoice'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Stack>
  );
}

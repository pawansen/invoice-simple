import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { Loading } from '../components/Loading';
import { StatusChip } from '../components/StatusChip';
import { useInvoice } from '../hooks/useInvoice';
import { Invoice } from '../types/invoice';
import { formatDate, formatMoney } from '../utils/format';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{children || '—'}</Typography>
    </Box>
  );
}

function TotalsRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant={strong ? 'subtitle1' : 'body2'} color={strong ? 'text.primary' : 'text.secondary'}>
        {label}
      </Typography>
      <Typography variant={strong ? 'subtitle1' : 'body2'} fontWeight={strong ? 700 : 400}>
        {value}
      </Typography>
    </Stack>
  );
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading, isError, error, refetch } = useInvoice(id);

  if (isLoading) {
    return <Loading message="Loading invoice…" />;
  }

  if (isError || !invoice) {
    const notFound = (error as { response?: { status?: number } })?.response?.status === 404;
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')} sx={{ alignSelf: 'flex-start' }}>
          Back to invoices
        </Button>
        <ErrorState
          message={notFound ? 'Invoice not found.' : 'Could not load this invoice.'}
          onRetry={notFound ? undefined : () => void refetch()}
        />
      </Stack>
    );
  }

  const inv: Invoice = invoice;
  const symbol = inv.currencySymbol;

  return (
    <Stack spacing={2}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')} sx={{ alignSelf: 'flex-start' }}>
        Back to invoices
      </Button>

      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="h5">Invoice {inv.invoiceNumber}</Typography>
        <StatusChip status={inv.status} />
      </Stack>

      <Grid container spacing={2}>
        {/* Invoice + customer info */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Invoice Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Field label="Invoice Date">{formatDate(inv.invoiceDate)}</Field>
              </Grid>
              <Grid item xs={6}>
                <Field label="Due Date">{formatDate(inv.dueDate)}</Field>
              </Grid>
              <Grid item xs={6}>
                <Field label="Currency">{inv.currency}</Field>
              </Grid>
              <Grid item xs={6}>
                <Field label="Reference">{inv.invoiceReference}</Field>
              </Grid>
              <Grid item xs={12}>
                <Field label="Description">{inv.description}</Field>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Customer
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Field label="Name">{inv.customer.fullname}</Field>
              </Grid>
              <Grid item xs={6}>
                <Field label="Email">{inv.customer.email}</Field>
              </Grid>
              <Grid item xs={6}>
                <Field label="Mobile">{inv.customer.mobileNumber}</Field>
              </Grid>
              <Grid item xs={6}>
                <Field label="Address">{inv.customer.address}</Field>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Totals */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Summary
            </Typography>
            <Stack spacing={1.25}>
              <TotalsRow label="Subtotal" value={formatMoney(inv.invoiceSubTotal, symbol)} />
              <TotalsRow label="Tax" value={formatMoney(inv.totalTax, symbol)} />
              <TotalsRow label="Discount" value={`- ${formatMoney(inv.totalDiscount, symbol)}`} />
              <Divider />
              <TotalsRow label="Total" value={formatMoney(inv.totalAmount, symbol)} strong />
              <TotalsRow label="Paid" value={formatMoney(inv.totalPaid, symbol)} />
              <TotalsRow label="Balance Due" value={formatMoney(inv.balanceAmount, symbol)} strong />
            </Stack>
          </Paper>
        </Grid>

        {/* Line items */}
        <Grid item xs={12}>
          <Paper variant="outlined">
            <Box sx={{ p: 2, pb: 0 }}>
              <Typography variant="subtitle1">Line Items</Typography>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inv.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{formatMoney(item.rate, symbol)}</TableCell>
                    <TableCell align="right">{formatMoney(item.quantity * item.rate, symbol)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}

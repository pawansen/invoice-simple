import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Loading } from '../components/Loading';
import { StatusChip } from '../components/StatusChip';
import { useDebounce } from '../hooks/useDebounce';
import { useInvoices } from '../hooks/useInvoices';
import {
  INVOICE_STATUSES,
  InvoiceSortField,
  InvoiceStatus,
  SortOrdering,
} from '../types/invoice';
import { formatDate, formatMoney } from '../utils/format';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const SORTABLE_COLUMNS: { field: InvoiceSortField; label: string; numeric?: boolean }[] = [
  { field: 'invoiceDate', label: 'Invoice Date' },
  { field: 'dueDate', label: 'Due Date' },
  { field: 'totalAmount', label: 'Total Amount', numeric: true },
];

export function InvoiceListPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1); // 1-based for the API
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<InvoiceSortField>('invoiceDate');
  const [ordering, setOrdering] = useState<SortOrdering>('DESC');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [keywordInput, setKeywordInput] = useState('');
  const keyword = useDebounce(keywordInput.trim(), 400);

  // Any filter/search/sort change resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [pageSize, sortBy, ordering, status, keyword]);

  const params = useMemo(
    () => ({
      page,
      pageSize,
      sortBy,
      ordering,
      status: status || undefined,
      keyword: keyword || undefined,
    }),
    [page, pageSize, sortBy, ordering, status, keyword],
  );

  const { data, isLoading, isError, isFetching, refetch } = useInvoices(params);

  const handleSort = (field: InvoiceSortField) => {
    if (sortBy === field) {
      setOrdering((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setOrdering('ASC');
    }
  };

  const invoices = data?.data ?? [];
  const total = data?.paging.total ?? 0;

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
      >
        <Typography variant="h5">Invoices</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/invoices/new')}
        >
          New Invoice
        </Button>
      </Stack>

      {/* Search + status filter */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Search by invoice number or customer"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as InvoiceStatus | '')}
          size="small"
          sx={{ minWidth: { sm: 200 } }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {INVOICE_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Paper variant="outlined">
        <Box sx={{ height: 4 }}>{isFetching && <LinearProgress />}</Box>

        {isLoading ? (
          <Loading message="Loading invoices…" />
        ) : isError ? (
          <ErrorState message="Could not load invoices." onRetry={() => void refetch()} />
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description={
              keyword || status
                ? 'Try adjusting your search or filter.'
                : 'Create your first invoice to get started.'
            }
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  {SORTABLE_COLUMNS.map((col) => (
                    <TableCell key={col.field} align={col.numeric ? 'right' : 'left'}>
                      <TableSortLabel
                        active={sortBy === col.field}
                        direction={sortBy === col.field ? (ordering.toLowerCase() as 'asc' | 'desc') : 'asc'}
                        onClick={() => handleSort(col.field)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customer.fullname}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell align="right">
                      {formatMoney(invoice.totalAmount, invoice.currencySymbol)}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={invoice.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component="div"
          count={total}
          page={total === 0 ? 0 : page - 1}
          onPageChange={(_, newPage) => setPage(newPage + 1)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => setPageSize(parseInt(e.target.value, 10))}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
        />
      </Paper>
    </Stack>
  );
}

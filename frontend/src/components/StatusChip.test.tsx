import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InvoiceStatus } from '../types/invoice';
import { StatusChip } from './StatusChip';

describe('StatusChip', () => {
  it.each<InvoiceStatus>(['Draft', 'Pending', 'Paid', 'Overdue'])(
    'renders the %s status label',
    (status) => {
      render(<StatusChip status={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
    },
  );
});

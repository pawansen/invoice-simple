import InboxIcon from '@mui/icons-material/Inbox';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

/** Friendly empty-results placeholder. */
export function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        py: 6,
      }}
    >
      <InboxIcon color="disabled" sx={{ fontSize: 48 }} />
      <Typography variant="subtitle1">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}

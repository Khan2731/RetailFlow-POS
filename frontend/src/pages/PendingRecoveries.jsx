import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tooltip,
} from '@mui/material';
import { Payments, Refresh } from '@mui/icons-material';
import { salaryAdvanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PendingRecoveries = () => {
  const { isAdmin } = useAuth();
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recoverDialog, setRecoverDialog] = useState(false);
  const [recoverTarget, setRecoverTarget] = useState(null);
  const [recoverAmount, setRecoverAmount] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await salaryAdvanceAPI.getPending();
      setAdvances(res.data || []);
    } catch { toast.error('Failed to load pending recoveries'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const openRecover = (adv) => { setRecoverTarget(adv); setRecoverAmount(''); setRecoverDialog(true); };

  const handleRecover = async () => {
    const amt = parseFloat(recoverAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await salaryAdvanceAPI.recover(recoverTarget.id, amt);
      toast.success('Recovery recorded');
      setRecoverDialog(false);
      fetchPending();
    } catch (err) { toast.error(err.response?.data?.error || 'Recovery failed'); }
  };

  const totalOutstanding = advances.reduce((s, a) => s + Number(a.remaining_amount), 0);

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Payments color="warning" />
          <Typography variant="h4">Pending Recoveries</Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchPending}><Refresh /></IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`${advances.length} pending advances`} color="warning" variant="outlined" />
          <Chip label={`Total outstanding: Rs. ${totalOutstanding.toFixed(0)}`} color="error" variant="outlined" />
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Advance Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Recovered</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remaining</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                {isAdmin() && <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {advances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No pending recoveries.
                  </TableCell>
                </TableRow>
              ) : (
                advances.map((adv) => (
                  <TableRow key={adv.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{adv.employee_name}</TableCell>
                    <TableCell>Rs. {Number(adv.amount).toFixed(0)}</TableCell>
                    <TableCell sx={{ color: '#2e7d32', fontWeight: 600 }}>Rs. {Number(adv.recovered_amount).toFixed(0)}</TableCell>
                    <TableCell sx={{ color: '#c62828', fontWeight: 700 }}>Rs. {Number(adv.remaining_amount).toFixed(0)}</TableCell>
                    <TableCell>{adv.advance_date ? String(adv.advance_date).substring(0, 10) : '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={adv.status.replace(/_/g, ' ')}
                        color={adv.status === 'partially_recovered' ? 'info' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    {isAdmin() && (
                      <TableCell align="right">
                        <Button
                          size="small" variant="contained" color="success"
                          startIcon={<Payments />} onClick={() => openRecover(adv)}
                        >
                          Recover
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={recoverDialog} onClose={() => setRecoverDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Recovery</DialogTitle>
        <DialogContent>
          {recoverTarget && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">Employee: <strong>{recoverTarget.employee_name}</strong></Typography>
              <Typography variant="body2">Total Advance: <strong>Rs. {Number(recoverTarget.amount).toFixed(0)}</strong></Typography>
              <Typography variant="body2">Recovered So Far: <strong>Rs. {Number(recoverTarget.recovered_amount).toFixed(0)}</strong></Typography>
              <Typography variant="body2" color="error">Still Remaining: <strong>Rs. {Number(recoverTarget.remaining_amount).toFixed(0)}</strong></Typography>
            </Box>
          )}
          <TextField
            autoFocus label="Recovery Amount (Rs.)" type="number" fullWidth
            value={recoverAmount} onChange={(e) => setRecoverAmount(e.target.value)}
            inputProps={{ min: 1, max: recoverTarget?.remaining_amount, step: 1 }}
            helperText="You can enter less than the remaining amount for partial recovery."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecoverDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleRecover}>Confirm Recovery</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PendingRecoveries;

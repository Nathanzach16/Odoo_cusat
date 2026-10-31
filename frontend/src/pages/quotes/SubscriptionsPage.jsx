import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const STATUS_COLORS = {
  Draft: { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
  Quotation: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  Confirmed: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  Active: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  Closed: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
};

export default function SubscriptionsPage({ onViewDetail }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [transitioningId, setTransitioningId] = useState(null);

  // Selected subscription for detail view modal
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter, customerFilter]);

  async function loadSubscriptions() {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (customerFilter) params.customer_id = customerFilter;
      const data = await api.getSubscriptions(params);
      setSubscriptions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTransition(subId, nextStatus) {
    setTransitioningId(subId);
    setError(null);
    try {
      const updated = await api.transitionSubscriptionStatus(subId, nextStatus);
      setSubscriptions((prev) => prev.map((s) => (s.id === subId ? updated : s)));
      if (selectedSub && selectedSub.id === subId) {
        setSelectedSub(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTransitioningId(null);
    }
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111827' }}>Subscriptions & Lifecycle</h1>
          <p style={{ margin: 0, color: '#6B7280' }}>
            Lifecycle flow: <strong>Draft &rarr; Quotation &rarr; Confirmed &rarr; Active &rarr; Closed</strong>. Exposes <code>next_billing_date</code> for Member 3.
          </p>
        </div>
        <button
          onClick={loadSubscriptions}
          style={{
            backgroundColor: '#F3F4F6',
            color: '#374151',
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #D1D5DB',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEE2E2', borderLeft: '4px solid #DC2626', color: '#991B1B', padding: '12px', marginBottom: '20px', borderRadius: '4px' }}>
          <strong>Action Failed:</strong> {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Quotation">Quotation</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Active">Active</option>
          <option value="Closed">Closed</option>
        </select>

        <input
          type="number"
          placeholder="Filter by Customer ID..."
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', width: '200px' }}
        />
      </div>

      {/* Subscriptions Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '13px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Subscription #</th>
              <th style={{ padding: '12px 16px' }}>Customer</th>
              <th style={{ padding: '12px 16px' }}>Plan</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Next Billing Date</th>
              <th style={{ padding: '12px 16px' }}>Total Amount</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Lifecycle Transition</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>Loading subscriptions...</td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>No subscriptions found.</td>
              </tr>
            ) : (
              subscriptions.map((sub) => {
                const badge = STATUS_COLORS[sub.status] || STATUS_COLORS.Draft;
                const isWorking = transitioningId === sub.id;

                return (
                  <tr key={sub.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#111827' }}>
                      <span
                        onClick={() => setSelectedSub(sub)}
                        style={{ color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {sub.subscription_number}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4B5563' }}>Customer #{sub.customer_id}</td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>
                      {sub.plan ? `${sub.plan.name} (${sub.plan.billing_period})` : `Plan #${sub.plan_id}`}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {sub.next_billing_date ? (
                        <span style={{ fontWeight: '600', color: '#047857' }}>{sub.next_billing_date}</span>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>Not active</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#111827' }}>
                      ${parseFloat(sub.total_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {/* Action buttons based on lifecycle state */}
                      {sub.status === 'Draft' && (
                        <button
                          disabled={isWorking}
                          onClick={() => handleTransition(sub.id, 'Quotation')}
                          style={{
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #FCD34D',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Send Quotation &rarr;
                        </button>
                      )}
                      {sub.status === 'Quotation' && (
                        <button
                          disabled={isWorking}
                          onClick={() => handleTransition(sub.id, 'Confirmed')}
                          style={{
                            backgroundColor: '#DBEAFE',
                            color: '#1E40AF',
                            border: '1px solid #93C5FD',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Confirm &rarr;
                        </button>
                      )}
                      {sub.status === 'Confirmed' && (
                        <button
                          disabled={isWorking}
                          onClick={() => handleTransition(sub.id, 'Active')}
                          style={{
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Activate &rarr;
                        </button>
                      )}
                      {sub.status === 'Active' && (
                        <button
                          disabled={isWorking}
                          onClick={() => handleTransition(sub.id, 'Closed')}
                          style={{
                            backgroundColor: '#FEE2E2',
                            color: '#B91C1C',
                            border: '1px solid #FCA5A5',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Close Subscription
                        </button>
                      )}
                      {sub.status === 'Closed' && (
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', width: '640px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                  {selectedSub.subscription_number}
                </h2>
                <span style={{
                  backgroundColor: STATUS_COLORS[selectedSub.status]?.bg,
                  color: STATUS_COLORS[selectedSub.status]?.text,
                  border: `1px solid ${STATUS_COLORS[selectedSub.status]?.border}`,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}>
                  {selectedSub.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#9CA3AF' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
              <div><strong>Customer ID:</strong> {selectedSub.customer_id}</div>
              <div><strong>Payment Terms:</strong> {selectedSub.payment_terms || 'Net 30'}</div>
              <div><strong>Start Date:</strong> {selectedSub.start_date}</div>
              <div><strong>Expiry Date:</strong> {selectedSub.expiry_date || 'N/A'}</div>
              <div><strong>Quotation Valid Until:</strong> {selectedSub.quotation_valid_until || 'N/A'}</div>
              <div>
                <strong>Next Billing Date:</strong>{' '}
                <span style={{ color: selectedSub.next_billing_date ? '#047857' : '#9CA3AF', fontWeight: 'bold' }}>
                  {selectedSub.next_billing_date || 'N/A (Inactive)'}
                </span>
              </div>
            </div>

            {selectedSub.notes && (
              <div style={{ marginBottom: '16px', fontSize: '13px', color: '#6B7280' }}>
                <strong>Notes:</strong> {selectedSub.notes}
              </div>
            )}

            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Subscription Lines</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Product / Description</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tax Rate</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSub.lines.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '8px 12px' }}>{l.description || `Product #${l.product_id}`}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{l.quantity}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>${parseFloat(l.unit_price).toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{parseFloat(l.tax_rate).toFixed(2)}%</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>
                      ${parseFloat(l.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '20px' }}>
              Total: ${parseFloat(selectedSub.total_amount).toFixed(2)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

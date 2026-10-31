import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'PERCENTAGE',
    value: '',
    min_purchase_amount: '',
    min_quantity: '',
    start_date: '',
    end_date: '',
    max_uses: '',
    scope: 'SUBSCRIPTION',
    product_id: '',
    is_active: true,
  });

  // Interactive tester tool
  const [testSubtotal, setTestSubtotal] = useState('250.00');
  const [testQty, setTestQty] = useState('3');
  const [testProductId, setTestProductId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [testingLookup, setTestingLookup] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [dList, pList] = await Promise.all([
        api.getDiscounts(),
        api.getProducts(),
      ]);
      setDiscounts(dList);
      setProducts(pList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingDiscount(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'PERCENTAGE',
      value: '',
      min_purchase_amount: '',
      min_quantity: '',
      start_date: '',
      end_date: '',
      max_uses: '',
      scope: 'SUBSCRIPTION',
      product_id: '',
      is_active: true,
    });
    setShowModal(true);
  }

  function openEditModal(d) {
    setEditingDiscount(d);
    setFormData({
      code: d.code,
      description: d.description || '',
      discount_type: d.discount_type,
      value: d.value,
      min_purchase_amount: d.min_purchase_amount || '',
      min_quantity: d.min_quantity || '',
      start_date: d.start_date || '',
      end_date: d.end_date || '',
      max_uses: d.max_uses || '',
      scope: d.scope,
      product_id: d.product_id || '',
      is_active: d.is_active,
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        value: parseFloat(formData.value),
        min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : null,
        min_quantity: formData.min_quantity ? parseInt(formData.min_quantity, 10) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses, 10) : null,
        scope: formData.scope,
        product_id: formData.scope === 'PRODUCT' && formData.product_id ? parseInt(formData.product_id, 10) : null,
        is_active: formData.is_active,
      };

      if (editingDiscount) {
        await api.updateDiscount(editingDiscount.id, payload);
      } else {
        await api.createDiscount(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this discount rule?')) return;
    try {
      await api.deleteDiscount(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  // Interactive tester tool call
  async function runDiscountTest() {
    setTestingLookup(true);
    setError(null);
    try {
      const pIds = testProductId ? [parseInt(testProductId, 10)] : [];
      const res = await api.lookupDiscounts({
        subtotal: parseFloat(testSubtotal || 0),
        total_quantity: parseInt(testQty || 0, 10),
        product_ids: pIds,
      });
      setLookupResult(res);
    } catch (err) {
      setError(`Lookup test failed: ${err.message}`);
    } finally {
      setTestingLookup(false);
    }
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111827' }}>Discounts & Promotions</h1>
          <p style={{ margin: 0, color: '#6B7280' }}>
            Admin-defined discount rules, usage limits, minimum purchase/quantity requirements, and backend eligibility tester (Task T16 & T20).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          + Add Discount
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEE2E2', borderLeft: '4px solid #DC2626', color: '#991B1B', padding: '12px', marginBottom: '20px', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Discounts List */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '13px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Code</th>
              <th style={{ padding: '12px 16px' }}>Type & Value</th>
              <th style={{ padding: '12px 16px' }}>Scope</th>
              <th style={{ padding: '12px 16px' }}>Conditions</th>
              <th style={{ padding: '12px 16px' }}>Usage</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>Loading discount rules...</td>
              </tr>
            ) : discounts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>No discount rules found. Click "+ Add Discount" to create one.</td>
              </tr>
            ) : (
              discounts.map((d) => {
                const isExhausted = d.max_uses !== null && d.used_count >= d.max_uses;
                const isExpired = d.end_date && new Date(d.end_date) < new Date();

                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#111827' }}>
                      <span style={{ backgroundColor: '#F3F4F6', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                        {d.code}
                      </span>
                      {d.description && <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 'normal', marginTop: '4px' }}>{d.description}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#047857' }}>
                      {d.discount_type === 'PERCENTAGE' ? `${parseFloat(d.value)}% OFF` : `$${parseFloat(d.value).toFixed(2)} OFF`}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>
                      <span style={{
                        backgroundColor: d.scope === 'PRODUCT' ? '#E0E7FF' : '#F3F4F6',
                        color: d.scope === 'PRODUCT' ? '#3730A3' : '#374151',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {d.scope === 'PRODUCT' ? `Product #${d.product_id}` : 'Entire Subscription'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#4B5563' }}>
                      {d.min_purchase_amount && <div>Min Spend: ${parseFloat(d.min_purchase_amount).toFixed(2)}</div>}
                      {d.min_quantity && <div>Min Qty: {d.min_quantity}</div>}
                      {d.start_date && <div>From: {d.start_date}</div>}
                      {d.end_date && <div>Until: {d.end_date}</div>}
                      {!d.min_purchase_amount && !d.min_quantity && !d.start_date && !d.end_date && <span>No restrictions</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      {d.max_uses !== null ? (
                        <span>{d.used_count} / {d.max_uses} used</span>
                      ) : (
                        <span>{d.used_count} (Unlimited)</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isExhausted ? (
                        <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                          Exhausted
                        </span>
                      ) : isExpired ? (
                        <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                          Expired
                        </span>
                      ) : d.is_active ? (
                        <span style={{ backgroundColor: '#DEF7EC', color: '#03543F', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                          Active
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#F3F4F6', color: '#6B7280', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => openEditModal(d)}
                        style={{
                          marginRight: '8px',
                          backgroundColor: '#F3F4F6',
                          color: '#374151',
                          border: '1px solid #D1D5DB',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        style={{
                          backgroundColor: '#FEE2E2',
                          color: '#B91C1C',
                          border: '1px solid #FECACA',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Billing Engine Lookup Tester */}
      <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#111827' }}>
          Interactive Discount Engine Tester (Member 3 API Integration)
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6B7280' }}>
          Simulates Member 3's billing engine calling <code>POST /discounts/lookup</code>. Verifies eligibility rules without mutating database counters.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Order Subtotal ($)</label>
            <input
              type="number"
              step="0.01"
              value={testSubtotal}
              onChange={(e) => setTestSubtotal(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Total Seats / Qty</label>
            <input
              type="number"
              value={testQty}
              onChange={(e) => setTestQty(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Product in Cart (Optional)</label>
            <select
              value={testProductId}
              onChange={(e) => setTestProductId(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
            >
              <option value="">-- None Selected --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (${parseFloat(p.sales_price).toFixed(2)})</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={testingLookup}
            onClick={runDiscountTest}
            style={{
              padding: '9px 18px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {testingLookup ? 'Checking...' : 'Check Eligible Discounts'}
          </button>
        </div>

        {lookupResult && (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F3F4F6', paddingBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>Eligible Discounts Found:</span>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#047857' }}>
                Total Deduction: -${parseFloat(lookupResult.total_discount_amount).toFixed(2)}
              </span>
            </div>

            {lookupResult.eligible_discounts.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                No active discounts qualify for this subtotal or quantity.
              </div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                {lookupResult.eligible_discounts.map((ed, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>
                    <strong>{ed.code}</strong> ({ed.discount_type}):{' '}
                    <span style={{ color: '#047857', fontWeight: '600' }}>
                      -${parseFloat(ed.calculated_discount_amount).toFixed(2)}
                    </span>{' '}
                    ({ed.scope === 'PRODUCT' ? `Product #${ed.product_id}` : 'Order Subtotal'})
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', width: '540px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              {editingDiscount ? 'Edit Discount Rule' : 'Create Discount Rule'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Discount Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER25"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB', textTransform: 'uppercase' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Discount Type *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                    Value ({formData.discount_type === 'PERCENTAGE' ? '%' : '$'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'PERCENTAGE' ? '100' : undefined}
                    required
                    placeholder={formData.discount_type === 'PERCENTAGE' ? '20.00' : '50.00'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Scope *</label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  >
                    <option value="SUBSCRIPTION">Entire Subscription</option>
                    <option value="PRODUCT">Specific Product</option>
                  </select>
                </div>
              </div>

              {formData.scope === 'PRODUCT' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Applicable Product *</label>
                  <select
                    required
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (${parseFloat(p.sales_price).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Min Purchase ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional threshold"
                    value={formData.min_purchase_amount}
                    onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Min Quantity (Seats)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Optional seat count"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Valid From</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Valid Until</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Max Total Uses</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Blank = unlimited"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '22px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Active Rule
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

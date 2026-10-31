import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function QuoteTemplatesPage({ onSubscriptionCreated }) {
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Template creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    plan_id: '',
    validity_days: 30,
    lines: [],
  });

  // Convert to subscription modal
  const [convertModalTemplate, setConvertModalTemplate] = useState(null);
  const [convertForm, setConvertForm] = useState({
    customer_id: '',
    start_date: new Date().toISOString().split('T')[0],
    payment_terms: 'Net 30',
    notes: '',
  });
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [tList, pList, plList] = await Promise.all([
        api.getQuoteTemplates(),
        api.getProducts(),
        api.getPlans(),
      ]);
      setTemplates(tList);
      setProducts(pList);
      setPlans(plList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleAddLine() {
    if (products.length === 0) return;
    const firstProd = products[0];
    setTemplateForm({
      ...templateForm,
      lines: [
        ...templateForm.lines,
        {
          product_id: firstProd.id,
          variant_id: null,
          quantity: 1,
          unit_price: firstProd.sales_price,
          description: firstProd.name,
        },
      ],
    });
  }

  function handleLineChange(index, field, value) {
    const updated = [...templateForm.lines];
    updated[index][field] = value;
    if (field === 'product_id') {
      const p = products.find((prod) => prod.id === parseInt(value, 10));
      if (p) {
        updated[index].unit_price = p.sales_price;
        updated[index].description = p.name;
      }
    }
    setTemplateForm({ ...templateForm, lines: updated });
  }

  function handleRemoveLine(index) {
    const updated = templateForm.lines.filter((_, i) => i !== index);
    setTemplateForm({ ...templateForm, lines: updated });
  }

  async function handleCreateTemplate(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        name: templateForm.name,
        description: templateForm.description || null,
        plan_id: templateForm.plan_id ? parseInt(templateForm.plan_id, 10) : null,
        validity_days: parseInt(templateForm.validity_days, 10),
        lines: templateForm.lines.map((l) => ({
          product_id: parseInt(l.product_id, 10),
          variant_id: l.variant_id ? parseInt(l.variant_id, 10) : null,
          quantity: parseInt(l.quantity, 10),
          unit_price: parseFloat(l.unit_price),
          description: l.description,
        })),
      };

      await api.createQuoteTemplate(payload);
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConvertSubmit(e) {
    e.preventDefault();
    if (!convertModalTemplate) return;
    setConverting(true);
    try {
      const newSub = await api.convertTemplateToSubscription(convertModalTemplate.id, {
        customer_id: parseInt(convertForm.customer_id, 10),
        start_date: convertForm.start_date || null,
        payment_terms: convertForm.payment_terms,
        notes: convertForm.notes || null,
      });
      alert(`Success! Created Subscription #${newSub.subscription_number} in Quotation status.`);
      setConvertModalTemplate(null);
      if (onSubscriptionCreated) {
        onSubscriptionCreated(newSub);
      }
    } catch (err) {
      alert(`Conversion failed: ${err.message}`);
    } finally {
      setConverting(false);
    }
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111827' }}>Quotation Templates</h1>
          <p style={{ margin: 0, color: '#6B7280' }}>
            Preconfigured offers with product lines and validity durations. 1-click conversion to subscriptions (Task T14).
          </p>
        </div>
        <button
          onClick={() => {
            setTemplateForm({
              name: '',
              description: '',
              plan_id: plans.length > 0 ? plans[0].id : '',
              validity_days: 30,
              lines: [],
            });
            setShowCreateModal(true);
          }}
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
          + Add Template
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEE2E2', borderLeft: '4px solid #DC2626', color: '#991B1B', padding: '12px', marginBottom: '20px', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Grid of Templates */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading quotation templates...</div>
      ) : templates.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', color: '#6B7280' }}>
          No quotation templates found. Click "+ Add Template" to create your first standard offer.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {templates.map((tpl) => (
            <div key={tpl.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#111827' }}>{tpl.name}</h3>
                  <span style={{ backgroundColor: '#E0E7FF', color: '#3730A3', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                    Valid {tpl.validity_days} days
                  </span>
                </div>
                {tpl.description && <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 12px 0' }}>{tpl.description}</p>}

                <div style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
                  <strong>Default Plan:</strong> {tpl.plan ? tpl.plan.name : 'None specified'}
                </div>

                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Line Items:</span>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '13px', color: '#4B5563' }}>
                    {tpl.lines.map((l, idx) => (
                      <li key={idx}>
                        {l.quantity}x {l.description || 'Product'} (${parseFloat(l.unit_price).toFixed(2)} ea)
                      </li>
                    ))}
                    {tpl.lines.length === 0 && <li style={{ color: '#9CA3AF' }}>No preconfigured product lines</li>}
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '14px' }}>
                <button
                  onClick={() => {
                    setConvertModalTemplate(tpl);
                    setConvertForm({
                      customer_id: '1',
                      start_date: new Date().toISOString().split('T')[0],
                      payment_terms: 'Net 30',
                      notes: `Converted from template: ${tpl.name}`,
                    });
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '4px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Convert to Subscription &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', width: '600px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Create Quotation Template</h2>
            <form onSubmit={handleCreateTemplate}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Template Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard 5-Seat SaaS Offer"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Subscription Plan</label>
                  <select
                    value={templateForm.plan_id}
                    onChange={(e) => setTemplateForm({ ...templateForm, plan_id: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  >
                    <option value="">-- Optional Default Plan --</option>
                    {plans.map((pl) => (
                      <option key={pl.id} value={pl.id}>{pl.name} (${parseFloat(pl.price).toFixed(2)}/{pl.billing_period})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Validity (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={templateForm.validity_days}
                    onChange={(e) => setTemplateForm({ ...templateForm, validity_days: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  rows="2"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                />
              </div>

              {/* Dynamic Line Items */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>Product Lines</label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    + Add Line
                  </button>
                </div>

                {templateForm.lines.map((line, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <select
                      value={line.product_id}
                      onChange={(e) => handleLineChange(idx, 'product_id', e.target.value)}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (${parseFloat(p.sales_price).toFixed(2)})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Price"
                      value={line.unit_price}
                      onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      style={{ color: '#DC2626', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Template to Subscription Modal */}
      {convertModalTemplate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', width: '480px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Convert Template to Subscription
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6B7280' }}>
              Template: <strong>{convertModalTemplate.name}</strong> (Valid for {convertModalTemplate.validity_days} days)
            </p>

            <form onSubmit={handleConvertSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Customer ID (User ID) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1"
                  value={convertForm.customer_id}
                  onChange={(e) => setConvertForm({ ...convertForm, customer_id: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Start Date</label>
                <input
                  type="date"
                  value={convertForm.start_date}
                  onChange={(e) => setConvertForm({ ...convertForm, start_date: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Payment Terms</label>
                <input
                  type="text"
                  placeholder="Net 30, Due on Receipt, etc."
                  value={convertForm.payment_terms}
                  onChange={(e) => setConvertForm({ ...convertForm, payment_terms: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Notes</label>
                <textarea
                  value={convertForm.notes}
                  onChange={(e) => setConvertForm({ ...convertForm, notes: e.target.value })}
                  rows="2"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setConvertModalTemplate(null)}
                  style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#10B981', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
                >
                  {converting ? 'Converting...' : 'Generate Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

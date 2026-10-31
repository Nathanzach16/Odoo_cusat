import React, { useState } from 'react';
import QuoteTemplatesPage from './QuoteTemplatesPage';
import SubscriptionsPage from './SubscriptionsPage';

export default function QuotesPage() {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div>
      {/* Sub-header navigation */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <button
            onClick={() => setActiveTab('templates')}
            style={{
              padding: '16px 4px',
              border: 'none',
              borderBottom: activeTab === 'templates' ? '3px solid #2563EB' : '3px solid transparent',
              color: activeTab === 'templates' ? '#2563EB' : '#4B5563',
              fontWeight: activeTab === 'templates' ? '600' : '500',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Quotation Templates (Task T14)
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            style={{
              padding: '16px 4px',
              border: 'none',
              borderBottom: activeTab === 'subscriptions' ? '3px solid #2563EB' : '3px solid transparent',
              color: activeTab === 'subscriptions' ? '#2563EB' : '#4B5563',
              fontWeight: activeTab === 'subscriptions' ? '600' : '500',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Subscriptions & Status Flow (Task T15)
          </button>
        </div>
      </div>

      {activeTab === 'templates' && (
        <QuoteTemplatesPage
          onSubscriptionCreated={() => {
            setActiveTab('subscriptions');
          }}
        />
      )}
      {activeTab === 'subscriptions' && <SubscriptionsPage />}
    </div>
  );
}

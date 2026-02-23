import type { CommunityDiagram } from '../types.ts';

/**
 * Static fallback community diagrams data.
 * Used when Supabase is unavailable or during initial load.
 * Timestamps use fixed dates to avoid drift on bundle load.
 */
export const COMMUNITY_DATA: CommunityDiagram[] = [
  {
    id: 'c1',
    title: 'Microservices Payment System',
    author: 'SarahEng',
    description:
      'A comprehensive flow of a microservices-based payment gateway including fraud detection and ledger updates.',
    likes: 1240,
    views: 8500,
    tags: ['System Design', 'FinTech', 'Flowchart'],
    createdAt: '2025-01-15',
    createdAtTimestamp: new Date('2025-01-15').getTime(),
    code: `graph TB
    Client[Client App]
    API[API Gateway]
    Auth[Auth Service]

    subgraph Payment_Core
        Orchestrator[Payment Orchestrator]
        Ledger[Ledger Service]
        Wallet[Wallet Service]
    end

    subgraph Risk_Engine
        Fraud[Fraud Detection]
        KYC[KYC Service]
    end

    subgraph External_PSPs
        Stripe[Stripe Adapter]
        PayPal[PayPal Adapter]
    end

    Client -->|REST| API
    API -->|gRPC| Auth
    API -->|gRPC| Orchestrator

    Orchestrator -->|Async| Fraud
    Orchestrator -->|Sync| Wallet

    Fraud -.->|Risk Score| Orchestrator

    Orchestrator -->|Route| Stripe
    Orchestrator -->|Route| PayPal

    Stripe -->|Webhook| Ledger
    PayPal -->|Webhook| Ledger

    style Orchestrator fill:#4f46e5,stroke:#312e81,color:#fff
    style Fraud fill:#ef4444,stroke:#7f1d1d,color:#fff
    style Ledger fill:#10b981,stroke:#064e3b,color:#fff`,
  },
];

export const INITIAL_CODE = `sequenceDiagram
    autonumber
    participant Sales as Sales Team
    participant Brand as Brand User
    participant Portal as app.swiirl.ai Portal
    participant Tech as Tech System
    participant Kay as Manual (Kay)
    participant Spreadsheet as Matching Spreadsheet
    participant Host as Meeting Host
    participant Meeting as Meeting Platform<br/>(Zoom/Google Meet)
    participant Agent as Swiirl Brand Agent
    participant Storage as Audio/Text Storage
    participant Redactor as PII Redaction System
    participant Analyzer as Analysis System
    participant Dashboard as Brand Dashboard
    participant Copilot as Swiirl AI Copilot

    Note over Sales,Brand: Phase 1: Initial Setup
    Sales->>Brand: Sign pilot agreement<br/>(5-10 conversations, 1 month)
    Brand->>Portal: Sign up on app.swiirl.ai
    Brand->>Tech: Create brand agent
    Brand->>Tech: Set up project<br/>(brief, goals, budget, demo)
    
    Note over Tech,Spreadsheet: Phase 2: Matching & Invitation
    Tech->>Spreadsheet: Match groups to project<br/>(through spreadsheet)
    Note right of Tech: Question: How do we see<br/>the matched groups?
    Tech->>Kay: Provide list of matched groups
    Note right of Kay: Question: Where can Kay<br/>get the list of groups?
    Kay->>Host: Email sent to initial matched groups<br/>(email directs them to portal)
    Tech->>Tech: Create meeting event<br/>(add host email address)
    Tech->>Host: Send meeting invite<br/>(invite sent to meeting host)
    Kay->>Host: Nudge meeting host to accept
    
    Note over Host,Meeting: Phase 3: Host Onboarding
    Host->>Portal: Host onboards<br/>(confirms or declines participation)
    alt Host Confirms
        Host->>Portal: Move invite to different days<br/>(within project time frame)
        Note right of Host: Host can add people to meetings<br/>(min 7 people, ideal 15, 45 min min)
    else Host Declines
        Host->>Portal: Decline participation
        Note over Tech: Process ends for this host
    end
    
    Note over Tech,Agent: Phase 4: Meeting Execution
    Tech->>Tech: Monitor meeting start time
    Tech->>Meeting: Swiirl agent joins meeting
    Host->>Meeting: Host admits Swiirl agent
    Agent->>Meeting: Swiirl brand agent does quick chat intro<br/>(who they are, purpose, what they want to learn,<br/>gratitude to the group)
    Agent->>Meeting: Swiirl agent participates lightly<br/>(answers questions, asks clarifying questions,<br/>educates, only as aligns with brand goals,<br/>3 questions max)
    
    Note over Meeting,Analyzer: Phase 5: Post-Meeting Processing
    Meeting->>Storage: Following meeting - audio/text captured<br/>and stored
    Storage->>Redactor: PII redacted
    Redactor->>Analyzer: System analyzes information<br/>through methodology
    Analyzer->>Dashboard: Initial report shows up in dashboard
    Note right of Dashboard: UX needed: Inform about what<br/>the report is based on before<br/>they can view it (maybe pop-up)
    
    Note over Tech,Dashboard: Phase 6: Report Generation
    Tech->>Analyzer: Additional conversations added<br/>into dataset for report
    Analyzer->>Dashboard: Final report ready alert
    Brand->>Dashboard: View final report
    Brand->>Copilot: Brands dig deeper into research<br/>(mining, report generation)`;

// Phase 1: Domain-Specific Copilot Contexts
export const DOMAIN_INSTRUCTIONS: Record<string, string> = {
  "General": `You are ArchiGram.ai, an expert Technical Architect.
Rules:
1. Output ONLY valid Mermaid.js code inside a markdown code block.
2. Prioritize clarity and standard architectural patterns.`,

  "Healthcare": `You are ArchiGram.ai (Healthcare Edition), an expert in HIPAA-compliant architectures and HL7/FHIR standards.
Rules:
1. Output ONLY valid Mermaid.js code.
2. Emphasize data privacy, encryption at rest/transit, and PHI isolation.
3. Use terms like "EHR Integration", "FHIR Store", "De-identification Service".
4. Suggest secure enclaves for ML training on patient data.`,

  "Finance": `You are ArchiGram.ai (FinTech Edition), an expert in PCI-DSS, high-frequency trading, and fraud detection systems.
Rules:
1. Output ONLY valid Mermaid.js code.
2. Focus on ACID transactions, ledger immutability, and low-latency pipelines.
3. Use components like "Ledger", "Risk Engine", "KYC Service", "Audit Log".
4. Ensure audit trails are visualized in workflows.`,

  "E-commerce": `You are ArchiGram.ai (Retail Edition), an expert in high-scale recommendation engines and inventory management.
Rules:
1. Output ONLY valid Mermaid.js code.
2. Focus on caching (Redis), CDNs, and event-driven architecture (Kafka) for inventory updates.
3. Include "Recommendation Engine", "User Behavior Tracker", "Cart Service".`
};

export const STORAGE_KEY = 'archigram_diagram_v2';

// Phase 1: One-Click Pipeline Templates
export const ML_TEMPLATES: Record<string, string> = {
  "Text Classifier Pipeline": `graph LR
    A[Raw Text Data] --> B[Tokenization]
    B --> C[Embedding Layer]
    C --> D[Transformer Block]
    D --> E[Classification Head]
    E --> F[Softmax Output]
    
    subgraph MLOps
    G[Model Registry] -.-> D
    H[Experiment Tracker] -.-> E
    end`,

  "Healthcare Risk Prediction": `sequenceDiagram
    participant EHR as Electronic Health Record
    participant DeID as De-identification
    participant Lake as Secure Data Lake
    participant Model as Risk Prediction Model
    participant Doc as Doctor Dashboard

    autonumber
    EHR->>DeID: Send Patient Vitals (HL7)
    DeID->>Lake: Store Anonymized Data
    Lake->>Model: Batch Inference Request
    Model->>Model: Calculate Risk Score
    Model-->>Lake: Store Results
    Lake->>Doc: Push High Risk Alert (Audit Logged)
    Note over Doc, Model: HIPAA Compliant Flow`,

  "Fraud Detection (Real-time)": `flowchart TD
    Tx[Transaction Event] --> Kafka{Message Queue}
    Kafka -->|Stream| Flink[Feature Extraction]
    Flink --> Redis[(Feature Store)]
    Redis --> Model[Inference Service]
    Model -->|Score > 0.8| Block[Block Transaction]
    Model -->|Score < 0.8| Approve[Approve Transaction]
    Block --> Alert[Notify Ops]`,
    
  "RAG Pipeline": `graph TD
    User(User Query) --> Embed[Embedding Model]
    Embed --> VectorDB[(Vector Database)]
    VectorDB -->|Top K Chunks| LLM[LLM Context Window]
    User --> LLM
    LLM --> Response(Generated Answer)
    
    subgraph Data_Ingestion
    Docs[Documents] --> Splitter[Text Splitter]
    Splitter --> Embed
    end`
};

export const TEMPLATES: Record<string, string> = {
  "Cloud Architecture": `graph TB
    Users((Users))
    LB[Load Balancer]
    
    subgraph Cluster
        App1[App Server 1]
        App2[App Server 2]
    end
    
    subgraph Data
        DB[(Primary DB)]
        Cache[(Redis Cache)]
    end
    
    Users -->|HTTPS| LB
    LB --> App1
    LB --> App2
    App1 & App2 -->|Read/Write| DB
    App1 & App2 -->|Read| Cache`,

  "User Journey": `journey
    title My working day
    section Go to work
      Wake up: 1: Me, Cat
      Brush teeth: 2: Me
      Walk downstairs: 3: Me, Cat
    section Work
      Start working: 5: Me
      Go for a walk: 3: Me
      Finish working: 5: Me`,
      
  "State Machine": `stateDiagram-v2
    [*] --> Still
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`
};

export const COMMUNITY_DATA = [
  {
    id: "c1",
    title: "Microservices Payment System",
    author: "SarahEng",
    description: "A comprehensive flow of a microservices-based payment gateway including fraud detection and ledger updates.",
    likes: 1240,
    views: 8500,
    tags: ["System Design", "FinTech", "Flowchart"],
    createdAt: "2d ago",
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
    style Ledger fill:#10b981,stroke:#064e3b,color:#fff`
  }
];
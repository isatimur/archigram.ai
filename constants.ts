
export const INITIAL_CODE = `sequenceDiagram
    autonumber
    box "User Interaction" #11111b
        participant User
        participant UI as Chat Interface
    end
    box "Edge Services" #181825
        participant Edge as Global Edge
        participant WAF as WAF/Shield
    end
    box "AI Platform" #11111b
        participant API as API Gateway
        participant Orch as Orchestrator
        participant Cache as Semantic Cache
    end
    box "Inference Grid" #181825
        participant RAG as Vector Store
        participant Model as LLM Engine
        participant Safety as Safety Layer
    end

    Note over User, Safety: ⚡ GenAI Request Lifecycle (High-Performance Pipeline)

    User->>UI: "Design a microservices architecture"
    UI->>Edge: POST /chat/completions (Stream)
    Edge->>WAF: Inspect Traffic (Rate Limit/Bot)
    WAF-->>API: Forward Request
    
    API->>Orch: Init Session & Trace
    
    rect rgb(30, 30, 46)
        note right of Orch: Optimization & Safety Phase
        Orch->>Cache: Compute Embedding & Search
        
        alt Semantic Cache Hit
            Cache-->>Orch: Return Cached Response
            Orch-->>UI: Stream Cached Tokens
        else Cache Miss
            Orch->>Safety: Pre-Generation Check (PII/Jailbreak)
            Safety-->>Orch: Safe to Process
            
            par Context Augmentation
                Orch->>RAG: Hybrid Search (Top-K)
                RAG-->>Orch: Retrieved Chunks
            and Session State
                Orch->>Orch: Load History & User Prefs
            end
            
            Orch->>Model: Invoke Model (Context + Prompt)
            activate Model
            Model->>Model: Load LoRA Adapters
            Model->>Model: Speculative Decoding
            
            loop Token Streaming
                Model-->>API: Yield Token
                API-->>UI: SSE Chunk
            end
            deactivate Model
            
            Orch->>Cache: Async Cache Write
        end
    end
    
    UI->>User: Render Markdown Response`;

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
    Users((<icon:fa/users> Users))
    LB[<icon:aws/elastic-load-balancing> Load Balancer]
    
    subgraph Cluster [App Cluster]
        App1[<icon:logos/docker-icon> App Server 1]
        App2[<icon:logos/docker-icon> App Server 2]
    end
    
    subgraph Data [Persistence Layer]
        DB[(<icon:logos/postgresql> Primary DB)]
        Cache[(<icon:logos/redis> Redis Cache)]
    end
    
    Users -->|HTTPS| LB
    LB --> App1
    LB --> App2
    App1 & App2 -->|Read/Write| DB
    App1 & App2 -->|Read| Cache`,

  "Architecture (Beta)": `architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service disk(disk)[Storage] in api
    service server(server)[Server] in api

    db:L -- R:server
    disk:T -- B:server`,

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

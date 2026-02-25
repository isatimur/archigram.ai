// Phase 1: One-Click Pipeline Templates
export const ML_TEMPLATES: Record<string, string> = {
  'Text Classifier Pipeline': `graph LR
    A[Raw Text Data] --> B[Tokenization]
    B --> C[Embedding Layer]
    C --> D[Transformer Block]
    D --> E[Classification Head]
    E --> F[Softmax Output]

    subgraph MLOps
    G[Model Registry] -.-> D
    H[Experiment Tracker] -.-> E
    end`,

  'Healthcare Risk Prediction': `sequenceDiagram
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

  'Fraud Detection (Real-time)': `flowchart TD
    Tx[Transaction Event] --> Kafka{Message Queue}
    Kafka -->|Stream| Flink[Feature Extraction]
    Flink --> Redis[(Feature Store)]
    Redis --> Model[Inference Service]
    Model -->|Score > 0.8| Block[Block Transaction]
    Model -->|Score < 0.8| Approve[Approve Transaction]
    Block --> Alert[Notify Ops]`,

  'RAG Pipeline': `graph TD
    User(User Query) --> Embed[Embedding Model]
    Embed --> VectorDB[(Vector Database)]
    VectorDB -->|Top K Chunks| LLM[LLM Context Window]
    User --> LLM
    LLM --> Response(Generated Answer)

    subgraph Data_Ingestion
    Docs[Documents] --> Splitter[Text Splitter]
    Splitter --> Embed
    end`,
};

export const TEMPLATES: Record<string, string> = {
  'Cloud Architecture': `graph TB
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

  'Architecture (Beta)': `architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service disk(disk)[Storage] in api
    service server(server)[Server] in api

    db:L -- R:server
    disk:T -- B:server`,

  'User Journey': `journey
    title My working day
    section Go to work
      Wake up: 1: Me, Cat
      Brush teeth: 2: Me
      Walk downstairs: 3: Me, Cat
    section Work
      Start working: 5: Me
      Go for a walk: 3: Me
      Finish working: 5: Me`,

  'State Machine': `stateDiagram-v2
    [*] --> Still
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
};

// C4 Model Templates (Context, Container, Component, Code)
export const C4_TEMPLATES: Record<string, string> = {
  'C4 Context': `flowchart TB
    subgraph External["External Systems"]
        direction TB
        User((User))
        Email[Email Service]
        Payment[Payment Gateway]
    end

    subgraph System["Software System"]
        direction TB
        App[Web Application]
    end

    User -->|"Uses"| App
    App -->|"Sends emails"| Email
    App -->|"Processes payments"| Payment`,

  'C4 Container': `flowchart TB
    subgraph System["Software System"]
        direction TB
        Web[Web Application]
        API[API Server]
        DB[(Database)]
    end

    Web -->|"REST/HTTPS"| API
    API -->|"SQL"| DB`,

  'C4 Component': `flowchart TB
    subgraph API["API Server"]
        direction TB
        Controller[Controller]
        Service[Service Layer]
        Repository[Repository]
    end

    Controller -->|"Calls"| Service
    Service -->|"Uses"| Repository`,

  'C4 Code (UML)': `classDiagram
    class Order {
        +id: string
        +status: OrderStatus
        +create()
        +updateStatus()
    }
    class OrderItem {
        +productId: string
        +quantity: number
        +price: number
    }
    class Payment {
        +process()
        +refund()
    }
    Order "1" --> "*" OrderItem : contains
    Order --> Payment : uses`,
};

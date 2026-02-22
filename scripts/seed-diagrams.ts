// Seed data for ArchiGram.ai community gallery and collections
// Run: bun run scripts/seed-diagrams.ts (requires SUPABASE_URL and SUPABASE_SERVICE_KEY env vars)

export interface SeedDiagram {
  title: string;
  author: string;
  description: string;
  code: string;
  tags: string[];
  category: string;
}

export interface SeedCollection {
  title: string;
  slug: string;
  description: string;
  curator: string;
}

export const SEED_COLLECTIONS: SeedCollection[] = [
  {
    title: 'Microservices Patterns',
    slug: 'microservices-patterns',
    description:
      'Essential architectural patterns for building resilient, scalable microservices systems. Covers saga, CQRS, service mesh, and more.',
    curator: 'ArchiGram Team',
  },
  {
    title: 'Cloud Reference Architectures',
    slug: 'cloud-reference-architectures',
    description:
      'Production-grade cloud architectures for AWS, GCP, and Azure. Includes serverless, multi-region, and hybrid deployments.',
    curator: 'ArchiGram Team',
  },
  {
    title: 'System Design Interview Prep',
    slug: 'system-design-interview',
    description:
      'Classic system design problems with detailed architecture diagrams. Perfect for FAANG interview preparation.',
    curator: 'ArchiGram Team',
  },
  {
    title: 'Data Pipeline Architectures',
    slug: 'data-pipeline-architectures',
    description:
      'Modern data engineering patterns including ETL, streaming, CDC, data lakes, and real-time analytics pipelines.',
    curator: 'ArchiGram Team',
  },
  {
    title: 'ML/AI System Design',
    slug: 'ml-ai-system-design',
    description:
      'End-to-end machine learning system architectures covering training, serving, monitoring, and MLOps workflows.',
    curator: 'ArchiGram Team',
  },
];

export const SEED_DIAGRAMS: SeedDiagram[] = [
  // ═══════════════════════════════════════════
  // MICROSERVICES PATTERNS
  // ═══════════════════════════════════════════
  {
    title: 'Saga Pattern — Order Fulfillment',
    author: 'ArchiGram',
    description:
      'Orchestrator-based saga pattern for distributed order processing with compensating transactions.',
    category: 'microservices-patterns',
    tags: ['Microservices', 'Saga', 'Distributed Transactions'],
    code: `sequenceDiagram
    participant Client
    participant Orchestrator as Saga Orchestrator
    participant Order as Order Service
    participant Payment as Payment Service
    participant Inventory as Inventory Service
    participant Shipping as Shipping Service

    Client->>Orchestrator: Place Order
    activate Orchestrator

    Orchestrator->>Order: Create Order
    Order-->>Orchestrator: Order Created

    Orchestrator->>Payment: Process Payment
    Payment-->>Orchestrator: Payment Confirmed

    Orchestrator->>Inventory: Reserve Stock
    Inventory-->>Orchestrator: Stock Reserved

    Orchestrator->>Shipping: Schedule Delivery
    Shipping-->>Orchestrator: Delivery Scheduled

    Orchestrator-->>Client: Order Confirmed
    deactivate Orchestrator

    Note over Orchestrator: If any step fails...

    rect rgb(255, 230, 230)
        Orchestrator->>Shipping: Cancel Delivery
        Orchestrator->>Inventory: Release Stock
        Orchestrator->>Payment: Refund Payment
        Orchestrator->>Order: Cancel Order
        Orchestrator-->>Client: Order Failed
    end`,
  },
  {
    title: 'CQRS + Event Sourcing',
    author: 'ArchiGram',
    description:
      'Command Query Responsibility Segregation with event sourcing for high-performance read/write separation.',
    category: 'microservices-patterns',
    tags: ['CQRS', 'Event Sourcing', 'Microservices'],
    code: `graph LR
    subgraph Commands["Write Side"]
        API[Command API]
        Handler[Command Handler]
        ES[(Event Store)]
    end

    subgraph Events["Event Bus"]
        Kafka{Kafka / EventBridge}
    end

    subgraph Queries["Read Side"]
        Projector[Event Projector]
        ReadDB[(Read Database)]
        QueryAPI[Query API]
    end

    Client((Client)) -->|Command| API
    API --> Handler
    Handler -->|Append Event| ES
    ES -->|Publish| Kafka
    Kafka -->|Subscribe| Projector
    Projector -->|Update View| ReadDB
    Client -->|Query| QueryAPI
    QueryAPI -->|Read| ReadDB

    style Commands fill:#1e3a5f,stroke:#2563eb,color:#fff
    style Queries fill:#1a4731,stroke:#10b981,color:#fff
    style Events fill:#4a1d6a,stroke:#8b5cf6,color:#fff`,
  },
  {
    title: 'API Gateway Pattern',
    author: 'ArchiGram',
    description:
      'API Gateway aggregating multiple microservices with auth, rate limiting, and request routing.',
    category: 'microservices-patterns',
    tags: ['API Gateway', 'Microservices', 'Authentication'],
    code: `graph TB
    Mobile((Mobile App))
    Web((Web App))
    Partner((Partner API))

    subgraph Gateway["API Gateway"]
        Auth[Auth Middleware]
        RateLimit[Rate Limiter]
        Router[Request Router]
        Transform[Response Transformer]
    end

    subgraph Services["Microservices"]
        UserSvc[User Service]
        ProductSvc[Product Service]
        OrderSvc[Order Service]
        SearchSvc[Search Service]
    end

    subgraph Infra["Infrastructure"]
        Cache[(Redis Cache)]
        MQ{Message Queue}
    end

    Mobile --> Auth
    Web --> Auth
    Partner --> Auth
    Auth --> RateLimit
    RateLimit --> Router
    Router --> UserSvc
    Router --> ProductSvc
    Router --> OrderSvc
    Router --> SearchSvc
    Router --> Transform
    UserSvc --> Cache
    OrderSvc --> MQ

    style Gateway fill:#1e293b,stroke:#3b82f6,color:#fff
    style Services fill:#1a1a2e,stroke:#6366f1,color:#fff`,
  },
  {
    title: 'Service Mesh Architecture',
    author: 'ArchiGram',
    description:
      'Istio/Envoy service mesh with sidecar proxies handling mTLS, observability, and traffic management.',
    category: 'microservices-patterns',
    tags: ['Service Mesh', 'Istio', 'Envoy', 'Kubernetes'],
    code: `graph TB
    subgraph ControlPlane["Control Plane"]
        Pilot[Pilot / Traffic Mgmt]
        Citadel[Citadel / mTLS]
        Galley[Config Management]
        Mixer[Telemetry / Policy]
    end

    subgraph DataPlane["Data Plane"]
        subgraph PodA["Pod A"]
            SvcA[Service A]
            ProxyA[Envoy Sidecar]
        end
        subgraph PodB["Pod B"]
            SvcB[Service B]
            ProxyB[Envoy Sidecar]
        end
        subgraph PodC["Pod C"]
            SvcC[Service C]
            ProxyC[Envoy Sidecar]
        end
    end

    SvcA <--> ProxyA
    SvcB <--> ProxyB
    SvcC <--> ProxyC
    ProxyA <-->|mTLS| ProxyB
    ProxyB <-->|mTLS| ProxyC

    Pilot --> ProxyA
    Pilot --> ProxyB
    Pilot --> ProxyC
    Citadel --> ProxyA
    Citadel --> ProxyB
    Citadel --> ProxyC

    style ControlPlane fill:#312e81,stroke:#6366f1,color:#fff
    style DataPlane fill:#1e293b,stroke:#94a3b8,color:#fff`,
  },
  {
    title: 'Circuit Breaker Pattern',
    author: 'ArchiGram',
    description:
      'Circuit breaker state machine preventing cascading failures in distributed systems.',
    category: 'microservices-patterns',
    tags: ['Circuit Breaker', 'Resilience', 'Fault Tolerance'],
    code: `stateDiagram-v2
    [*] --> Closed
    Closed --> Open : Failure threshold exceeded
    Open --> HalfOpen : Timeout expires
    HalfOpen --> Closed : Probe succeeds
    HalfOpen --> Open : Probe fails

    state Closed {
        [*] --> Monitoring
        Monitoring --> Monitoring : Success (reset counter)
        Monitoring --> CountFailures : Failure
        CountFailures --> Monitoring : Below threshold
    }

    state Open {
        [*] --> Rejecting
        Rejecting --> Rejecting : All requests fail-fast
        note right of Rejecting : Returns fallback response
    }

    state HalfOpen {
        [*] --> Testing
        Testing --> Testing : Allow limited traffic
        note right of Testing : Single probe request
    }`,
  },
  {
    title: 'Event-Driven Microservices',
    author: 'ArchiGram',
    description:
      'Asynchronous event-driven architecture with domain events, event bus, and eventual consistency.',
    category: 'microservices-patterns',
    tags: ['Event-Driven', 'Async', 'Kafka'],
    code: `graph LR
    subgraph Producers["Event Producers"]
        OrderSvc[Order Service]
        PaymentSvc[Payment Service]
        UserSvc[User Service]
    end

    subgraph Bus["Event Bus (Kafka)"]
        OrderTopic[order-events]
        PaymentTopic[payment-events]
        UserTopic[user-events]
    end

    subgraph Consumers["Event Consumers"]
        NotifSvc[Notification Service]
        AnalyticsSvc[Analytics Service]
        SearchSvc[Search Indexer]
        AuditSvc[Audit Logger]
    end

    subgraph Storage["Event Storage"]
        DLQ[(Dead Letter Queue)]
        Archive[(Event Archive)]
    end

    OrderSvc -->|publish| OrderTopic
    PaymentSvc -->|publish| PaymentTopic
    UserSvc -->|publish| UserTopic

    OrderTopic -->|subscribe| NotifSvc
    OrderTopic -->|subscribe| AnalyticsSvc
    PaymentTopic -->|subscribe| NotifSvc
    PaymentTopic -->|subscribe| AuditSvc
    UserTopic -->|subscribe| SearchSvc
    UserTopic -->|subscribe| AnalyticsSvc

    NotifSvc -.->|failed| DLQ
    OrderTopic -.->|retain| Archive

    style Bus fill:#3b1f6e,stroke:#8b5cf6,color:#fff
    style Producers fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Consumers fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Strangler Fig Migration',
    author: 'ArchiGram',
    description:
      'Incremental migration from monolith to microservices using the strangler fig pattern.',
    category: 'microservices-patterns',
    tags: ['Migration', 'Strangler Fig', 'Monolith'],
    code: `graph TB
    LB[Load Balancer]

    subgraph Facade["Anti-Corruption Layer"]
        Router[Request Router]
    end

    subgraph New["New Microservices"]
        UserMS[User Service]
        OrderMS[Order Service]
        PaymentMS[Payment Service]
    end

    subgraph Legacy["Legacy Monolith"]
        LegacyUser[User Module]
        LegacyOrder[Order Module]
        LegacyPayment[Payment Module]
        LegacyDB[(Legacy Database)]
    end

    LB --> Router
    Router -->|migrated| UserMS
    Router -->|migrating| OrderMS
    Router -->|not started| LegacyPayment
    OrderMS -.->|sync data| LegacyOrder
    LegacyUser -.->|deprecated| LegacyDB
    LegacyOrder --> LegacyDB
    LegacyPayment --> LegacyDB

    style New fill:#064e3b,stroke:#10b981,color:#fff
    style Legacy fill:#450a0a,stroke:#ef4444,color:#fff
    style Facade fill:#1e293b,stroke:#f59e0b,color:#fff`,
  },
  {
    title: 'Sidecar Pattern',
    author: 'ArchiGram',
    description:
      'Sidecar containers handling cross-cutting concerns like logging, config, and health checks.',
    category: 'microservices-patterns',
    tags: ['Sidecar', 'Kubernetes', 'Containers'],
    code: `graph TB
    subgraph Pod1["Pod: Order Service"]
        App1[Order App Container]
        Log1[Log Collector Sidecar]
        Config1[Config Agent Sidecar]
        Health1[Health Check Sidecar]
        App1 --> Log1
        App1 --> Config1
        Health1 --> App1
    end

    subgraph Pod2["Pod: Payment Service"]
        App2[Payment App Container]
        Log2[Log Collector Sidecar]
        Config2[Config Agent Sidecar]
        Health2[Health Check Sidecar]
        App2 --> Log2
        App2 --> Config2
        Health2 --> App2
    end

    subgraph Central["Central Infrastructure"]
        ELK[(ELK Stack)]
        Consul[Consul / Vault]
        Prom[Prometheus]
    end

    Log1 --> ELK
    Log2 --> ELK
    Config1 --> Consul
    Config2 --> Consul
    Health1 --> Prom
    Health2 --> Prom

    style Pod1 fill:#1e293b,stroke:#6366f1,color:#fff
    style Pod2 fill:#1e293b,stroke:#6366f1,color:#fff
    style Central fill:#312e81,stroke:#a78bfa,color:#fff`,
  },
  {
    title: 'Backend for Frontend (BFF)',
    author: 'ArchiGram',
    description:
      'Dedicated backend services tailored for each frontend platform (web, mobile, third-party).',
    category: 'microservices-patterns',
    tags: ['BFF', 'API Design', 'Frontend'],
    code: `graph TB
    WebApp((Web App))
    MobileApp((Mobile App))
    TVApp((Smart TV))

    subgraph BFFs["Backend for Frontend Layer"]
        WebBFF[Web BFF]
        MobileBFF[Mobile BFF]
        TVBFF[TV BFF]
    end

    subgraph Services["Shared Microservices"]
        UserAPI[User Service]
        ContentAPI[Content Service]
        RecAPI[Recommendation Engine]
        SearchAPI[Search Service]
    end

    WebApp --> WebBFF
    MobileApp --> MobileBFF
    TVApp --> TVBFF

    WebBFF --> UserAPI
    WebBFF --> ContentAPI
    WebBFF --> SearchAPI

    MobileBFF --> UserAPI
    MobileBFF --> ContentAPI
    MobileBFF --> RecAPI

    TVBFF --> ContentAPI
    TVBFF --> RecAPI

    style BFFs fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Services fill:#1a1a2e,stroke:#8b5cf6,color:#fff`,
  },
  {
    title: 'Bulkhead Pattern',
    author: 'ArchiGram',
    description:
      'Isolating critical resources into separate pools to prevent cascading failures across services.',
    category: 'microservices-patterns',
    tags: ['Bulkhead', 'Resilience', 'Isolation'],
    code: `graph TB
    Client((Client Requests))

    subgraph Critical["Critical Pool (10 threads)"]
        CritQ[Priority Queue]
        CritW1[Worker 1]
        CritW2[Worker 2]
        CritDB[(Primary DB)]
        CritQ --> CritW1
        CritQ --> CritW2
        CritW1 --> CritDB
        CritW2 --> CritDB
    end

    subgraph Standard["Standard Pool (5 threads)"]
        StdQ[Standard Queue]
        StdW1[Worker 1]
        StdDB[(Read Replica)]
        StdQ --> StdW1
        StdW1 --> StdDB
    end

    subgraph Batch["Batch Pool (3 threads)"]
        BatchQ[Batch Queue]
        BatchW1[Worker 1]
        BatchDB[(Analytics DB)]
        BatchQ --> BatchW1
        BatchW1 --> BatchDB
    end

    Client -->|checkout, payment| CritQ
    Client -->|browse, search| StdQ
    Client -->|reports, export| BatchQ

    style Critical fill:#064e3b,stroke:#10b981,color:#fff
    style Standard fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Batch fill:#4a1d6a,stroke:#8b5cf6,color:#fff`,
  },

  // ═══════════════════════════════════════════
  // CLOUD REFERENCE ARCHITECTURES
  // ═══════════════════════════════════════════
  {
    title: 'AWS Serverless Web App',
    author: 'ArchiGram',
    description:
      'Full-stack serverless architecture on AWS with CloudFront, Lambda, API Gateway, and DynamoDB.',
    category: 'cloud-reference-architectures',
    tags: ['AWS', 'Serverless', 'Lambda', 'DynamoDB'],
    code: `graph TB
    User((Users))

    subgraph CDN["Content Delivery"]
        CF[CloudFront CDN]
        S3[S3 Static Assets]
    end

    subgraph API["API Layer"]
        APIGW[API Gateway]
        Cognito[Cognito Auth]
    end

    subgraph Compute["Compute"]
        LambdaA[Lambda: Users]
        LambdaB[Lambda: Orders]
        LambdaC[Lambda: Products]
    end

    subgraph Data["Data Layer"]
        DDB[(DynamoDB)]
        S3Data[(S3 Data Lake)]
        SQS{SQS Queue}
    end

    subgraph Monitoring["Observability"]
        CW[CloudWatch]
        XRay[X-Ray Tracing]
    end

    User --> CF
    CF --> S3
    User --> APIGW
    APIGW --> Cognito
    APIGW --> LambdaA
    APIGW --> LambdaB
    APIGW --> LambdaC
    LambdaA --> DDB
    LambdaB --> DDB
    LambdaB --> SQS
    LambdaC --> DDB
    SQS --> LambdaC
    LambdaB --> S3Data
    LambdaA --> CW
    LambdaB --> XRay

    style CDN fill:#1a1a2e,stroke:#f59e0b,color:#fff
    style Compute fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Data fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Multi-Region Active-Active',
    author: 'ArchiGram',
    description:
      'Highly available multi-region deployment with global load balancing and data replication.',
    category: 'cloud-reference-architectures',
    tags: ['Multi-Region', 'High Availability', 'Disaster Recovery'],
    code: `graph TB
    DNS[Route 53 / Global DNS]

    subgraph RegionA["Region: US-East"]
        LBA[ALB]
        AppA1[App Server 1]
        AppA2[App Server 2]
        DBA[(Primary DB)]
        CacheA[(Redis)]
        LBA --> AppA1
        LBA --> AppA2
        AppA1 --> DBA
        AppA2 --> DBA
        AppA1 --> CacheA
    end

    subgraph RegionB["Region: EU-West"]
        LBB[ALB]
        AppB1[App Server 1]
        AppB2[App Server 2]
        DBB[(Replica DB)]
        CacheB[(Redis)]
        LBB --> AppB1
        LBB --> AppB2
        AppB1 --> DBB
        AppB2 --> DBB
        AppB1 --> CacheB
    end

    DNS -->|Latency routing| LBA
    DNS -->|Latency routing| LBB
    DBA <-->|Cross-region replication| DBB
    CacheA <-->|Cache sync| CacheB

    style RegionA fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style RegionB fill:#3b1f6e,stroke:#8b5cf6,color:#fff`,
  },
  {
    title: 'Kubernetes Production Cluster',
    author: 'ArchiGram',
    description:
      'Production-grade Kubernetes architecture with ingress, namespaces, and observability stack.',
    category: 'cloud-reference-architectures',
    tags: ['Kubernetes', 'K8s', 'Containers', 'DevOps'],
    code: `graph TB
    Internet((Internet))

    subgraph Cluster["Kubernetes Cluster"]
        Ingress[NGINX Ingress Controller]

        subgraph AppNS["Namespace: app"]
            FrontDeploy[Frontend Deployment]
            APIDeploy[API Deployment]
            WorkerDeploy[Worker Deployment]
        end

        subgraph DataNS["Namespace: data"]
            PG[(PostgreSQL StatefulSet)]
            Redis[(Redis StatefulSet)]
            Kafka[(Kafka StatefulSet)]
        end

        subgraph MonNS["Namespace: monitoring"]
            Prometheus[Prometheus]
            Grafana[Grafana]
            Loki[Loki Logs]
        end
    end

    subgraph External["External Services"]
        S3[(S3 / Object Storage)]
        DNS[DNS / CDN]
    end

    Internet --> DNS
    DNS --> Ingress
    Ingress --> FrontDeploy
    Ingress --> APIDeploy
    APIDeploy --> PG
    APIDeploy --> Redis
    WorkerDeploy --> Kafka
    WorkerDeploy --> PG
    Prometheus --> APIDeploy
    Prometheus --> WorkerDeploy
    APIDeploy --> S3

    style Cluster fill:#0f172a,stroke:#6366f1,color:#fff
    style AppNS fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style DataNS fill:#1a4731,stroke:#10b981,color:#fff
    style MonNS fill:#4a1d6a,stroke:#a78bfa,color:#fff`,
  },
  {
    title: 'VPC Network Architecture',
    author: 'ArchiGram',
    description:
      'AWS VPC design with public/private subnets, NAT gateway, and security group layers.',
    category: 'cloud-reference-architectures',
    tags: ['VPC', 'Networking', 'AWS', 'Security'],
    code: `graph TB
    IGW[Internet Gateway]

    subgraph VPC["VPC 10.0.0.0/16"]
        subgraph PublicSubnet["Public Subnet 10.0.1.0/24"]
            ALB[Application Load Balancer]
            NAT[NAT Gateway]
            Bastion[Bastion Host]
        end

        subgraph PrivateSubnet["Private Subnet 10.0.2.0/24"]
            App1[App Server]
            App2[App Server]
        end

        subgraph DataSubnet["Data Subnet 10.0.3.0/24"]
            RDS[(RDS Primary)]
            RDSReplica[(RDS Replica)]
            ElastiCache[(ElastiCache)]
        end
    end

    IGW --> ALB
    IGW --> Bastion
    ALB --> App1
    ALB --> App2
    App1 --> NAT
    App2 --> NAT
    NAT --> IGW
    App1 --> RDS
    App2 --> RDS
    App1 --> ElastiCache
    RDS --> RDSReplica

    style PublicSubnet fill:#1a4731,stroke:#10b981,color:#fff
    style PrivateSubnet fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style DataSubnet fill:#4a1d6a,stroke:#8b5cf6,color:#fff`,
  },
  {
    title: 'CI/CD Pipeline Architecture',
    author: 'ArchiGram',
    description:
      'End-to-end CI/CD pipeline with GitHub Actions, Docker, and progressive deployment to Kubernetes.',
    category: 'cloud-reference-architectures',
    tags: ['CI/CD', 'DevOps', 'GitHub Actions', 'Docker'],
    code: `graph LR
    Dev[Developer Push]

    subgraph CI["CI Pipeline"]
        Lint[Lint & Format]
        Test[Unit Tests]
        SAST[Security Scan]
        Build[Docker Build]
        Push[Push to Registry]
    end

    subgraph CD["CD Pipeline"]
        Staging[Deploy to Staging]
        IntTest[Integration Tests]
        Approve{Manual Approval}
        Canary[Canary Deploy 10%]
        Rollout[Full Rollout]
    end

    subgraph Monitor["Post-Deploy"]
        Health[Health Checks]
        Metrics[Metrics Watch]
        Rollback[Auto Rollback]
    end

    Dev --> Lint
    Lint --> Test
    Test --> SAST
    SAST --> Build
    Build --> Push
    Push --> Staging
    Staging --> IntTest
    IntTest --> Approve
    Approve -->|approved| Canary
    Canary --> Health
    Health -->|healthy| Rollout
    Health -->|unhealthy| Rollback
    Rollout --> Metrics

    style CI fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style CD fill:#1a4731,stroke:#10b981,color:#fff
    style Monitor fill:#4a1d6a,stroke:#a78bfa,color:#fff`,
  },
  {
    title: 'GCP Data Analytics Platform',
    author: 'ArchiGram',
    description:
      'Google Cloud analytics stack with BigQuery, Dataflow, and Looker for enterprise data analysis.',
    category: 'cloud-reference-architectures',
    tags: ['GCP', 'BigQuery', 'Analytics', 'Data'],
    code: `graph TB
    subgraph Sources["Data Sources"]
        App[Application Logs]
        IoT[IoT Devices]
        SaaS[SaaS APIs]
    end

    subgraph Ingestion["Ingestion Layer"]
        PubSub[Cloud Pub/Sub]
        Transfer[Data Transfer Service]
    end

    subgraph Processing["Processing"]
        Dataflow[Cloud Dataflow]
        Dataproc[Cloud Dataproc]
    end

    subgraph Storage["Storage & Query"]
        GCS[(Cloud Storage)]
        BQ[(BigQuery)]
    end

    subgraph Serving["Analytics"]
        Looker[Looker Studio]
        Vertex[Vertex AI]
        Notebooks[AI Notebooks]
    end

    App --> PubSub
    IoT --> PubSub
    SaaS --> Transfer
    PubSub --> Dataflow
    Transfer --> GCS
    Dataflow --> BQ
    Dataflow --> GCS
    GCS --> Dataproc
    Dataproc --> BQ
    BQ --> Looker
    BQ --> Vertex
    BQ --> Notebooks

    style Sources fill:#1a1a2e,stroke:#94a3b8,color:#fff
    style Processing fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Storage fill:#1a4731,stroke:#10b981,color:#fff
    style Serving fill:#4a1d6a,stroke:#a78bfa,color:#fff`,
  },
  {
    title: 'Azure Enterprise Architecture',
    author: 'ArchiGram',
    description:
      'Azure landing zone with hub-spoke network, shared services, and workload isolation.',
    category: 'cloud-reference-architectures',
    tags: ['Azure', 'Enterprise', 'Landing Zone', 'Hub-Spoke'],
    code: `graph TB
    subgraph Hub["Hub VNet"]
        FW[Azure Firewall]
        VPN[VPN Gateway]
        DNS[Private DNS]
        Bastion[Azure Bastion]
    end

    subgraph Spoke1["Spoke: Production"]
        AKS[AKS Cluster]
        SQL[(Azure SQL)]
        KV[Key Vault]
    end

    subgraph Spoke2["Spoke: Development"]
        AppSvc[App Service]
        CosmosDB[(Cosmos DB)]
    end

    subgraph Shared["Shared Services"]
        Monitor[Azure Monitor]
        Sentinel[Azure Sentinel]
        Policy[Azure Policy]
    end

    OnPrem((On-Premises)) --> VPN
    VPN --> FW
    FW --> AKS
    FW --> AppSvc
    AKS --> SQL
    AKS --> KV
    AppSvc --> CosmosDB
    AKS --> Monitor
    AppSvc --> Monitor
    FW --> Sentinel
    Policy --> Spoke1
    Policy --> Spoke2

    style Hub fill:#1e293b,stroke:#f59e0b,color:#fff
    style Spoke1 fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Spoke2 fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'CDN & Edge Computing',
    author: 'ArchiGram',
    description:
      'Global content delivery with edge computing, caching layers, and origin failover.',
    category: 'cloud-reference-architectures',
    tags: ['CDN', 'Edge', 'Caching', 'Performance'],
    code: `graph TB
    Users((Global Users))

    subgraph Edge["Edge Layer (200+ PoPs)"]
        Edge1[Edge PoP: US]
        Edge2[Edge PoP: EU]
        Edge3[Edge PoP: Asia]
        WAF[WAF / DDoS Shield]
    end

    subgraph Cache["Cache Layer"]
        L1[L1 Edge Cache]
        L2[L2 Regional Cache]
    end

    subgraph Origin["Origin"]
        LB[Load Balancer]
        App[App Servers]
        ObjStore[(Object Storage)]
    end

    Users --> WAF
    WAF --> Edge1
    WAF --> Edge2
    WAF --> Edge3
    Edge1 --> L1
    Edge2 --> L1
    Edge3 --> L1
    L1 -->|miss| L2
    L2 -->|miss| LB
    LB --> App
    App --> ObjStore

    style Edge fill:#1a1a2e,stroke:#f59e0b,color:#fff
    style Cache fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Origin fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Terraform Infrastructure as Code',
    author: 'ArchiGram',
    description:
      'Terraform module architecture with state management, workspaces, and multi-environment promotion.',
    category: 'cloud-reference-architectures',
    tags: ['Terraform', 'IaC', 'DevOps', 'Infrastructure'],
    code: `graph TB
    subgraph Modules["Terraform Modules"]
        NetMod[Network Module]
        ComputeMod[Compute Module]
        DataMod[Database Module]
        MonMod[Monitoring Module]
    end

    subgraph Envs["Environments"]
        Dev[Dev Workspace]
        Staging[Staging Workspace]
        Prod[Prod Workspace]
    end

    subgraph State["State Management"]
        S3State[(S3 State Backend)]
        DDBLock[(DynamoDB Lock)]
    end

    subgraph Pipeline["CI/CD"]
        Plan[terraform plan]
        Review{Code Review}
        Apply[terraform apply]
    end

    NetMod --> Dev
    ComputeMod --> Dev
    DataMod --> Dev
    MonMod --> Dev
    Dev -->|promote| Staging
    Staging -->|promote| Prod
    Dev --> S3State
    Staging --> S3State
    Prod --> S3State
    S3State --> DDBLock
    Plan --> Review
    Review -->|approved| Apply

    style Modules fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Envs fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style State fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Hybrid Cloud Architecture',
    author: 'ArchiGram',
    description:
      'Connecting on-premises data center to cloud with VPN, direct connect, and workload portability.',
    category: 'cloud-reference-architectures',
    tags: ['Hybrid Cloud', 'On-Premises', 'Migration'],
    code: `graph LR
    subgraph OnPrem["On-Premises Data Center"]
        Legacy[Legacy Systems]
        LDAP[Active Directory]
        FileServer[(File Storage)]
    end

    subgraph Connectivity["Connectivity"]
        VPN[VPN Tunnel]
        DirectConnect[Direct Connect]
    end

    subgraph Cloud["Public Cloud"]
        VPCGW[VPC Gateway]
        Modern[Cloud-Native Apps]
        ObjectStore[(Object Storage)]
        IdFed[Identity Federation]
    end

    Legacy <-->|VPN| VPN
    VPN <--> VPCGW
    FileServer <-->|Direct Connect| DirectConnect
    DirectConnect <--> ObjectStore
    LDAP <--> IdFed
    VPCGW --> Modern
    Modern --> ObjectStore

    style OnPrem fill:#450a0a,stroke:#ef4444,color:#fff
    style Cloud fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Connectivity fill:#1a1a2e,stroke:#f59e0b,color:#fff`,
  },

  // ═══════════════════════════════════════════
  // SYSTEM DESIGN INTERVIEW PREP
  // ═══════════════════════════════════════════
  {
    title: 'URL Shortener (TinyURL)',
    author: 'ArchiGram',
    description:
      'Scalable URL shortening service with base62 encoding, caching, and analytics tracking.',
    category: 'system-design-interview',
    tags: ['System Design', 'Interview', 'URL Shortener'],
    code: `graph TB
    User((User))

    subgraph Frontend["Client Layer"]
        Web[Web App]
        API[REST API]
    end

    subgraph Core["Core Service"]
        Encoder[Base62 Encoder]
        Resolver[URL Resolver]
        Counter[ID Generator]
    end

    subgraph Storage["Storage"]
        Cache[(Redis Cache)]
        DB[(Cassandra / DynamoDB)]
        Analytics[(Analytics Store)]
    end

    subgraph CDN["Edge"]
        LB[Load Balancer]
        Redirect[301 Redirect]
    end

    User -->|Create short URL| Web
    Web --> API
    API --> Encoder
    Encoder --> Counter
    Counter --> DB

    User -->|Visit short URL| LB
    LB --> Redirect
    Redirect --> Cache
    Cache -->|miss| Resolver
    Resolver --> DB
    Redirect --> Analytics

    style Core fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Storage fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Chat System (WhatsApp)',
    author: 'ArchiGram',
    description:
      'Real-time messaging system with WebSocket connections, message queuing, and offline delivery.',
    category: 'system-design-interview',
    tags: ['System Design', 'Interview', 'Chat', 'WebSocket'],
    code: `sequenceDiagram
    participant Alice as Alice (Online)
    participant WS1 as WebSocket Server
    participant MQ as Message Queue
    participant Store as Message Store
    participant WS2 as WebSocket Server
    participant Bob as Bob (Offline)

    Alice->>WS1: Send Message
    WS1->>Store: Persist Message
    WS1->>MQ: Publish to User Queue
    Store-->>WS1: Stored (ack)
    WS1-->>Alice: Delivered (single check)

    Note over MQ, Bob: Bob comes online later

    Bob->>WS2: Connect
    WS2->>MQ: Pull Pending Messages
    MQ-->>WS2: Queued Messages
    WS2-->>Bob: Deliver Messages
    WS2->>Store: Mark as Delivered
    WS2-->>Alice: Read Receipt (double check)`,
  },
  {
    title: 'Notification Service',
    author: 'ArchiGram',
    description:
      'Multi-channel notification platform supporting push, email, SMS, and in-app with priority queuing.',
    category: 'system-design-interview',
    tags: ['System Design', 'Interview', 'Notifications'],
    code: `graph TB
    subgraph Triggers["Event Sources"]
        OrderEvt[Order Events]
        UserEvt[User Events]
        SystemEvt[System Alerts]
        CronEvt[Scheduled Jobs]
    end

    subgraph Core["Notification Engine"]
        Router[Event Router]
        Template[Template Engine]
        Priority{Priority Queue}
        Dedup[Deduplication]
    end

    subgraph Channels["Delivery Channels"]
        Push[Push Notifications]
        Email[Email (SES/SendGrid)]
        SMS[SMS (Twilio)]
        InApp[In-App Feed]
    end

    subgraph Storage["Storage"]
        Prefs[(User Preferences)]
        History[(Notification History)]
        DLQ[(Dead Letter Queue)]
    end

    OrderEvt --> Router
    UserEvt --> Router
    SystemEvt --> Router
    CronEvt --> Router
    Router --> Dedup
    Dedup --> Template
    Template --> Priority
    Priority -->|high| Push
    Priority -->|medium| Email
    Priority -->|low| InApp
    Priority --> SMS
    Router --> Prefs
    Push --> History
    Email --> History
    Push -.->|failed| DLQ

    style Core fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Channels fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Rate Limiter',
    author: 'ArchiGram',
    description:
      'Distributed rate limiter using token bucket algorithm with Redis-backed sliding window.',
    category: 'system-design-interview',
    tags: ['System Design', 'Interview', 'Rate Limiting'],
    code: `graph TB
    Client((Client Request))

    subgraph Edge["Edge Layer"]
        LB[Load Balancer]
        IPCheck[IP Rate Check]
    end

    subgraph RateLimiter["Rate Limiter Service"]
        TokenBucket[Token Bucket Algorithm]
        SlidingWindow[Sliding Window Counter]
        Rules[(Rate Limit Rules)]
    end

    subgraph Backend["Application"]
        API[API Server]
        Response[Response]
    end

    subgraph Store["Distributed State"]
        Redis[(Redis Cluster)]
    end

    Client --> LB
    LB --> IPCheck
    IPCheck --> TokenBucket
    TokenBucket --> Redis
    Redis --> SlidingWindow
    SlidingWindow --> Rules

    TokenBucket -->|allowed| API
    TokenBucket -->|rejected| Response
    API --> Response

    Response -->|200 OK| Client
    Response -->|429 Too Many| Client

    style RateLimiter fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Edge fill:#1e293b,stroke:#f59e0b,color:#fff
    style Store fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Twitter/X News Feed',
    author: 'ArchiGram',
    description:
      'Fan-out on write news feed system with timeline caching, celebrity handling, and real-time updates.',
    category: 'system-design-interview',
    tags: ['System Design', 'Interview', 'News Feed', 'Social'],
    code: `graph TB
    User((User Posts Tweet))

    subgraph Write["Write Path (Fan-out)"]
        TweetSvc[Tweet Service]
        FanOut[Fan-Out Service]
        FollowerDB[(Follower Graph)]
    end

    subgraph Cache["Timeline Cache"]
        TimelineCache[(Redis Timelines)]
        Celebrity[Celebrity Queue]
    end

    subgraph Read["Read Path"]
        FeedAPI[Feed API]
        Merger[Timeline Merger]
        Ranker[ML Ranker]
    end

    User --> TweetSvc
    TweetSvc --> FanOut
    FanOut --> FollowerDB
    FanOut -->|push to followers| TimelineCache
    FanOut -->|celebrity fan-out| Celebrity

    Reader((Reader)) --> FeedAPI
    FeedAPI --> Merger
    Merger --> TimelineCache
    Merger --> Celebrity
    Merger --> Ranker
    Ranker --> Reader

    style Write fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Cache fill:#1a4731,stroke:#10b981,color:#fff
    style Read fill:#4a1d6a,stroke:#a78bfa,color:#fff`,
  },
  {
    title: 'Distributed File Storage (GFS)',
    author: 'ArchiGram',
    description:
      'Google File System inspired distributed storage with master-chunkserver architecture.',
    category: 'system-design-interview',
    tags: ['System Design', 'Interview', 'Distributed Storage'],
    code: `graph TB
    Client((Client))

    subgraph Master["Master Server"]
        Meta[(Metadata Store)]
        ChunkMap[Chunk-to-Server Map]
        Heartbeat[Heartbeat Monitor]
    end

    subgraph Storage["Chunk Servers"]
        CS1["Chunk Server 1"]
        CS2["Chunk Server 2"]
        CS3["Chunk Server 3"]
        CS4["Chunk Server 4"]
    end

    Client -->|1. Get chunk locations| Meta
    Meta -->|2. Return server list| Client
    Client -->|3. Read/Write data| CS1
    Client -->|3. Read/Write data| CS2

    CS1 -->|Replicate| CS3
    CS2 -->|Replicate| CS4
    CS1 -->|Heartbeat| Heartbeat
    CS2 -->|Heartbeat| Heartbeat
    CS3 -->|Heartbeat| Heartbeat
    CS4 -->|Heartbeat| Heartbeat

    style Master fill:#1e293b,stroke:#f59e0b,color:#fff
    style Storage fill:#1e3a5f,stroke:#3b82f6,color:#fff`,
  },
  {
    title: 'Search Autocomplete',
    author: 'ArchiGram',
    description:
      'Type-ahead search suggestion system with trie data structure, caching, and personalization.',
    category: 'system-design-interview',
    tags: ['System Design', 'Interview', 'Search', 'Autocomplete'],
    code: `graph LR
    User((User Types))

    subgraph Frontend["Client"]
        Debounce[Debounce 300ms]
        LocalCache[Local Cache]
    end

    subgraph API["Suggestion Service"]
        Gateway[API Gateway]
        TrieServer[Trie Server]
        Personalize[Personalization]
    end

    subgraph Data["Data Layer"]
        Trie[(Trie Index)]
        Redis[(Redis Top-K)]
        Analytics[(Query Analytics)]
    end

    subgraph Pipeline["Offline Pipeline"]
        Aggregator[Query Aggregator]
        TrieBuilder[Trie Builder]
    end

    User --> Debounce
    Debounce --> LocalCache
    LocalCache -->|miss| Gateway
    Gateway --> TrieServer
    TrieServer --> Trie
    TrieServer --> Redis
    Gateway --> Personalize
    Personalize --> User

    Analytics --> Aggregator
    Aggregator --> TrieBuilder
    TrieBuilder --> Trie

    style API fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Data fill:#1a4731,stroke:#10b981,color:#fff
    style Pipeline fill:#4a1d6a,stroke:#8b5cf6,color:#fff`,
  },
  {
    title: 'Video Streaming Platform',
    author: 'ArchiGram',
    description:
      'YouTube-like video platform with upload pipeline, transcoding, CDN distribution, and adaptive streaming.',
    category: 'system-design-interview',
    tags: ['System Design', 'Interview', 'Video Streaming'],
    code: `graph TB
    Creator((Content Creator))
    Viewer((Viewer))

    subgraph Upload["Upload Pipeline"]
        UploadAPI[Upload API]
        ObjStore[(Object Storage)]
        Queue{Transcoding Queue}
    end

    subgraph Processing["Processing"]
        Transcoder[Transcoder Farm]
        Thumbnailer[Thumbnail Gen]
        Metadata[Metadata Extractor]
    end

    subgraph Delivery["Delivery"]
        CDN[Global CDN]
        Adaptive[Adaptive Bitrate]
        DRM[DRM Encryption]
    end

    subgraph Backend["Backend"]
        CatalogDB[(Video Catalog)]
        SearchIdx[(Search Index)]
        RecEngine[Recommendation Engine]
    end

    Creator --> UploadAPI
    UploadAPI --> ObjStore
    UploadAPI --> Queue
    Queue --> Transcoder
    Queue --> Thumbnailer
    Transcoder --> ObjStore
    Thumbnailer --> Metadata
    Metadata --> CatalogDB
    Metadata --> SearchIdx

    Viewer --> CDN
    CDN --> Adaptive
    Adaptive --> DRM
    CDN --> ObjStore
    Viewer --> RecEngine
    RecEngine --> CatalogDB

    style Upload fill:#1e293b,stroke:#f59e0b,color:#fff
    style Processing fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Delivery fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Payment Gateway System',
    author: 'ArchiGram',
    description:
      'PCI-DSS compliant payment processing with tokenization, fraud detection, and multi-PSP routing.',
    category: 'system-design-interview',
    tags: ['System Design', 'Interview', 'Payments', 'FinTech'],
    code: `graph TB
    Merchant((Merchant))

    subgraph Security["Security Layer"]
        TLS[TLS Termination]
        Token[Tokenization Vault]
        PCI[PCI-DSS Boundary]
    end

    subgraph Core["Payment Engine"]
        Router[PSP Router]
        Fraud[Fraud Detection ML]
        Idempotent[Idempotency Check]
        Ledger[(Double-Entry Ledger)]
    end

    subgraph PSPs["Payment Processors"]
        Stripe[Stripe]
        Adyen[Adyen]
        PayPal[PayPal]
    end

    subgraph Async["Async Processing"]
        Webhook[Webhook Handler]
        Reconcile[Reconciliation]
        Settle[Settlement Engine]
    end

    Merchant --> TLS
    TLS --> Token
    Token --> PCI
    PCI --> Idempotent
    Idempotent --> Fraud
    Fraud -->|low risk| Router
    Fraud -->|high risk| Merchant
    Router --> Stripe
    Router --> Adyen
    Router --> PayPal
    Stripe --> Webhook
    Webhook --> Ledger
    Ledger --> Reconcile
    Reconcile --> Settle

    style Security fill:#450a0a,stroke:#ef4444,color:#fff
    style Core fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Async fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Ride-Sharing (Uber/Lyft)',
    author: 'ArchiGram',
    description:
      'Location-based matching system with geospatial indexing, ETA calculation, and real-time tracking.',
    category: 'system-design-interview',
    tags: ['System Design', 'Interview', 'Ride Sharing', 'Geospatial'],
    code: `graph TB
    Rider((Rider App))
    Driver((Driver App))

    subgraph Location["Location Services"]
        GeoIdx[Geospatial Index]
        ETA[ETA Calculator]
        Tracking[Real-time Tracking]
    end

    subgraph Matching["Matching Engine"]
        Matcher[Supply-Demand Matcher]
        Pricing[Dynamic Pricing]
        Dispatch[Dispatch Optimizer]
    end

    subgraph Trip["Trip Management"]
        TripSvc[Trip Service]
        Payment[Payment Service]
        Rating[Rating Service]
    end

    subgraph Infra["Infrastructure"]
        Kafka{Kafka Streams}
        Redis[(Redis GeoHash)]
        PostGIS[(PostGIS)]
    end

    Rider -->|Request ride| Matcher
    Driver -->|Update location| GeoIdx
    GeoIdx --> Redis
    Matcher --> GeoIdx
    Matcher --> Pricing
    Matcher --> Dispatch
    Dispatch --> Driver
    Dispatch --> TripSvc
    TripSvc --> Tracking
    Tracking --> Kafka
    Kafka --> Rider
    TripSvc --> Payment
    TripSvc --> Rating
    ETA --> PostGIS

    style Location fill:#1e293b,stroke:#f59e0b,color:#fff
    style Matching fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Trip fill:#1a4731,stroke:#10b981,color:#fff`,
  },

  // ═══════════════════════════════════════════
  // DATA PIPELINE ARCHITECTURES
  // ═══════════════════════════════════════════
  {
    title: 'Modern Data Stack (ELT)',
    author: 'ArchiGram',
    description:
      'Cloud-native ELT data stack with Fivetran ingestion, Snowflake warehouse, and dbt transformations.',
    category: 'data-pipeline-architectures',
    tags: ['Data Engineering', 'ELT', 'dbt', 'Snowflake'],
    code: `graph LR
    subgraph Sources["Data Sources"]
        Postgres[(PostgreSQL)]
        Stripe[Stripe API]
        GA[Google Analytics]
        Hubspot[HubSpot CRM]
    end

    subgraph Ingest["Ingestion"]
        Fivetran[Fivetran / Airbyte]
    end

    subgraph Warehouse["Data Warehouse"]
        Raw[Raw Layer]
        Staging[Staging Layer]
        Marts[Data Marts]
        Snow[(Snowflake)]
    end

    subgraph Transform["Transformation"]
        dbt[dbt Core]
        Tests[dbt Tests]
        Docs[dbt Docs]
    end

    subgraph BI["Analytics"]
        Looker[Looker / Metabase]
        Notebook[Jupyter Notebooks]
        RevOps[Revenue Ops Dashboard]
    end

    Postgres --> Fivetran
    Stripe --> Fivetran
    GA --> Fivetran
    Hubspot --> Fivetran
    Fivetran --> Raw
    Raw --> Snow
    dbt --> Staging
    dbt --> Marts
    dbt --> Tests
    Staging --> Marts
    Marts --> Looker
    Marts --> Notebook
    Marts --> RevOps

    style Sources fill:#1a1a2e,stroke:#94a3b8,color:#fff
    style Warehouse fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Transform fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style BI fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Real-Time Streaming Pipeline',
    author: 'ArchiGram',
    description:
      'Apache Kafka-based streaming architecture with Flink processing, exactly-once semantics.',
    category: 'data-pipeline-architectures',
    tags: ['Streaming', 'Kafka', 'Flink', 'Real-Time'],
    code: `graph LR
    subgraph Producers["Event Producers"]
        WebApp[Web Application]
        MobileApp[Mobile App]
        IoT[IoT Sensors]
    end

    subgraph Streaming["Kafka Cluster"]
        Topic1[events.clicks]
        Topic2[events.orders]
        Topic3[events.sensor]
        SR[Schema Registry]
    end

    subgraph Processing["Stream Processing"]
        Flink[Apache Flink]
        Enrich[Enrichment]
        Aggregate[Aggregation]
        Alert[Alerting Rules]
    end

    subgraph Sinks["Data Sinks"]
        ES[(Elasticsearch)]
        TS[(TimescaleDB)]
        S3[(S3 Data Lake)]
        PagerDuty[PagerDuty]
    end

    WebApp --> Topic1
    MobileApp --> Topic2
    IoT --> Topic3
    Topic1 --> Flink
    Topic2 --> Flink
    Topic3 --> Flink
    SR --> Flink
    Flink --> Enrich
    Enrich --> Aggregate
    Aggregate --> ES
    Aggregate --> TS
    Flink --> S3
    Alert --> PagerDuty

    style Streaming fill:#3b1f6e,stroke:#8b5cf6,color:#fff
    style Processing fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Sinks fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Change Data Capture (CDC)',
    author: 'ArchiGram',
    description:
      'Debezium-based CDC pipeline capturing database changes for real-time replication and event sourcing.',
    category: 'data-pipeline-architectures',
    tags: ['CDC', 'Debezium', 'Data Replication'],
    code: `graph LR
    subgraph Source["Source Database"]
        PG[(PostgreSQL)]
        WAL[WAL / Binlog]
    end

    subgraph CDC["CDC Engine"]
        Debezium[Debezium Connector]
        Kafka{Kafka Connect}
    end

    subgraph Consumers["Downstream Consumers"]
        Search[(Elasticsearch)]
        Cache[(Redis Cache)]
        Analytics[(Data Warehouse)]
        Audit[(Audit Log)]
    end

    PG --> WAL
    WAL --> Debezium
    Debezium --> Kafka
    Kafka --> Search
    Kafka --> Cache
    Kafka --> Analytics
    Kafka --> Audit

    style Source fill:#1a1a2e,stroke:#94a3b8,color:#fff
    style CDC fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Consumers fill:#1e3a5f,stroke:#3b82f6,color:#fff`,
  },
  {
    title: 'Data Lake Architecture',
    author: 'ArchiGram',
    description:
      'Multi-zone data lake with bronze/silver/gold layers, schema enforcement, and governance.',
    category: 'data-pipeline-architectures',
    tags: ['Data Lake', 'Medallion Architecture', 'Delta Lake'],
    code: `graph TB
    subgraph Sources["Ingestion Sources"]
        BatchFiles[Batch Files]
        StreamEvents[Stream Events]
        APIs[External APIs]
    end

    subgraph Bronze["Bronze Layer (Raw)"]
        RawStore[(Raw Data Store)]
        SchemaEvol[Schema Evolution]
    end

    subgraph Silver["Silver Layer (Clean)"]
        Dedupe[Deduplication]
        Validate[Data Validation]
        CleanStore[(Cleaned Data)]
    end

    subgraph Gold["Gold Layer (Business)"]
        Aggregate[Aggregations]
        Metrics[Business Metrics]
        Features[Feature Tables]
    end

    subgraph Governance["Data Governance"]
        Catalog[Data Catalog]
        Lineage[Data Lineage]
        Quality[Data Quality]
    end

    BatchFiles --> RawStore
    StreamEvents --> RawStore
    APIs --> RawStore
    RawStore --> SchemaEvol
    SchemaEvol --> Dedupe
    Dedupe --> Validate
    Validate --> CleanStore
    CleanStore --> Aggregate
    CleanStore --> Metrics
    CleanStore --> Features
    RawStore --> Catalog
    CleanStore --> Lineage
    Aggregate --> Quality

    style Bronze fill:#92400e,stroke:#f59e0b,color:#fff
    style Silver fill:#374151,stroke:#9ca3af,color:#fff
    style Gold fill:#854d0e,stroke:#eab308,color:#fff
    style Governance fill:#1e3a5f,stroke:#3b82f6,color:#fff`,
  },
  {
    title: 'Batch Processing Pipeline (Spark)',
    author: 'ArchiGram',
    description:
      'Apache Spark batch processing with orchestration, data quality checks, and SLA monitoring.',
    category: 'data-pipeline-architectures',
    tags: ['Batch Processing', 'Spark', 'Airflow'],
    code: `graph TB
    subgraph Orchestrator["Apache Airflow"]
        DAG[DAG Scheduler]
        Monitor[SLA Monitor]
        Retry[Retry Handler]
    end

    subgraph Ingestion["Ingestion"]
        S3Raw[(S3 Raw Data)]
        JDBC[JDBC Sources]
        FileWatch[File Watcher]
    end

    subgraph Spark["Spark Cluster"]
        Driver[Spark Driver]
        Exec1[Executor 1]
        Exec2[Executor 2]
        Exec3[Executor 3]
    end

    subgraph Output["Output"]
        Parquet[(Parquet / Delta)]
        DW[(Data Warehouse)]
        Report[Report Generation]
    end

    DAG --> S3Raw
    DAG --> JDBC
    FileWatch --> DAG
    S3Raw --> Driver
    JDBC --> Driver
    Driver --> Exec1
    Driver --> Exec2
    Driver --> Exec3
    Exec1 --> Parquet
    Exec2 --> Parquet
    Exec3 --> DW
    DW --> Report
    Monitor --> DAG
    Retry --> DAG

    style Orchestrator fill:#1e293b,stroke:#f59e0b,color:#fff
    style Spark fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Output fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Data Mesh Architecture',
    author: 'ArchiGram',
    description:
      'Decentralized data ownership with domain-oriented data products, federated governance, and self-serve platform.',
    category: 'data-pipeline-architectures',
    tags: ['Data Mesh', 'Domain-Driven', 'Data Products'],
    code: `graph TB
    subgraph Platform["Self-Serve Data Platform"]
        Infra[Infrastructure Plane]
        Catalog[Data Product Catalog]
        Governance[Federated Governance]
    end

    subgraph Domain1["Domain: Sales"]
        SalesTeam[Sales Domain Team]
        SalesDP[Sales Data Product]
        SalesStore[(Sales Data Store)]
    end

    subgraph Domain2["Domain: Marketing"]
        MktTeam[Marketing Domain Team]
        MktDP[Marketing Data Product]
        MktStore[(Marketing Data Store)]
    end

    subgraph Domain3["Domain: Product"]
        ProdTeam[Product Domain Team]
        ProdDP[Product Data Product]
        ProdStore[(Product Data Store)]
    end

    SalesTeam --> SalesDP
    SalesDP --> SalesStore
    MktTeam --> MktDP
    MktDP --> MktStore
    ProdTeam --> ProdDP
    ProdDP --> ProdStore

    SalesDP --> Catalog
    MktDP --> Catalog
    ProdDP --> Catalog
    Governance --> SalesDP
    Governance --> MktDP
    Governance --> ProdDP
    Infra --> SalesStore
    Infra --> MktStore
    Infra --> ProdStore

    style Platform fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Domain1 fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Domain2 fill:#1a4731,stroke:#10b981,color:#fff
    style Domain3 fill:#1e293b,stroke:#f59e0b,color:#fff`,
  },
  {
    title: 'Data Quality Pipeline',
    author: 'ArchiGram',
    description:
      'Automated data quality framework with Great Expectations, anomaly detection, and alerting.',
    category: 'data-pipeline-architectures',
    tags: ['Data Quality', 'Testing', 'Great Expectations'],
    code: `graph TB
    subgraph Pipeline["Data Pipeline"]
        Ingest[Data Ingestion]
        Transform[Transformation]
        Load[Load to Warehouse]
    end

    subgraph Quality["Quality Gates"]
        Schema[Schema Validation]
        Freshness[Freshness Check]
        Volume[Volume Anomaly]
        Custom[Custom Rules]
    end

    subgraph Response["Response Actions"]
        Pass[Pipeline Continues]
        Quarantine[(Quarantine Table)]
        Alert[Alert Team]
        Block[Block Pipeline]
    end

    Ingest --> Schema
    Schema -->|pass| Transform
    Schema -->|fail| Quarantine
    Transform --> Freshness
    Transform --> Volume
    Freshness -->|pass| Custom
    Volume -->|anomaly| Alert
    Custom -->|pass| Load
    Custom -->|fail| Block
    Block --> Alert
    Load --> Pass

    style Quality fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Response fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Event-Driven ETL with Serverless',
    author: 'ArchiGram',
    description:
      'Serverless ETL triggered by S3 events with Lambda functions, Step Functions orchestration.',
    category: 'data-pipeline-architectures',
    tags: ['ETL', 'Serverless', 'AWS Lambda', 'Step Functions'],
    code: `graph TB
    S3Upload[S3: File Upload Event]

    subgraph StepFn["Step Functions Workflow"]
        Validate[Lambda: Validate]
        Parse[Lambda: Parse CSV]
        Enrich[Lambda: Enrich Data]
        Decision{Quality Check}
        Load[Lambda: Load to DB]
        Notify[Lambda: Send Notification]
        Error[Lambda: Error Handler]
    end

    subgraph Storage["Storage"]
        RDS[(RDS PostgreSQL)]
        DLQ[(SQS Dead Letter)]
        Logs[(CloudWatch Logs)]
    end

    S3Upload --> Validate
    Validate --> Parse
    Parse --> Enrich
    Enrich --> Decision
    Decision -->|pass| Load
    Decision -->|fail| Error
    Load --> Notify
    Load --> RDS
    Error --> DLQ
    Error --> Notify
    Validate --> Logs
    Parse --> Logs

    style StepFn fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Storage fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Log Aggregation Pipeline',
    author: 'ArchiGram',
    description:
      'Centralized logging with Fluentd collection, Kafka buffering, and Elasticsearch indexing.',
    category: 'data-pipeline-architectures',
    tags: ['Logging', 'ELK', 'Observability', 'Fluentd'],
    code: `graph LR
    subgraph Apps["Application Layer"]
        App1[Service A]
        App2[Service B]
        App3[Service C]
        Infra[Infrastructure]
    end

    subgraph Collect["Collection"]
        Fluentd1[Fluentd Agent]
        Fluentd2[Fluentd Agent]
        Fluentd3[Fluentd Agent]
    end

    subgraph Buffer["Buffer & Route"]
        Kafka{Kafka Topics}
    end

    subgraph Process["Processing"]
        Logstash[Logstash Pipeline]
        Parser[Log Parser]
        Enricher[GeoIP Enricher]
    end

    subgraph Store["Storage & Search"]
        ES[(Elasticsearch)]
        Kibana[Kibana Dashboard]
        Cold[(Cold Storage S3)]
    end

    App1 --> Fluentd1
    App2 --> Fluentd2
    App3 --> Fluentd3
    Infra --> Fluentd3
    Fluentd1 --> Kafka
    Fluentd2 --> Kafka
    Fluentd3 --> Kafka
    Kafka --> Logstash
    Logstash --> Parser
    Parser --> Enricher
    Enricher --> ES
    ES --> Kibana
    ES -->|lifecycle| Cold

    style Collect fill:#1a1a2e,stroke:#94a3b8,color:#fff
    style Buffer fill:#3b1f6e,stroke:#8b5cf6,color:#fff
    style Process fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Store fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Data Warehouse Star Schema',
    author: 'ArchiGram',
    description: 'Dimensional modeling with fact and dimension tables for OLAP analytics queries.',
    category: 'data-pipeline-architectures',
    tags: ['Star Schema', 'Data Warehouse', 'Dimensional Modeling'],
    code: `graph TB
    subgraph Dimensions["Dimension Tables"]
        DimDate[dim_date]
        DimProduct[dim_product]
        DimCustomer[dim_customer]
        DimStore[dim_store]
        DimPromo[dim_promotion]
    end

    subgraph Facts["Fact Table"]
        FactSales[fact_sales]
    end

    subgraph Queries["Analytics Queries"]
        Revenue[Revenue by Region]
        Trending[Trending Products]
        Cohort[Customer Cohorts]
    end

    DimDate --> FactSales
    DimProduct --> FactSales
    DimCustomer --> FactSales
    DimStore --> FactSales
    DimPromo --> FactSales
    FactSales --> Revenue
    FactSales --> Trending
    FactSales --> Cohort

    style Dimensions fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Facts fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Queries fill:#1a4731,stroke:#10b981,color:#fff`,
  },

  // ═══════════════════════════════════════════
  // ML/AI SYSTEM DESIGN
  // ═══════════════════════════════════════════
  {
    title: 'ML Training Pipeline (MLOps)',
    author: 'ArchiGram',
    description:
      'End-to-end ML training pipeline with feature engineering, hyperparameter tuning, and model registry.',
    category: 'ml-ai-system-design',
    tags: ['MLOps', 'Training Pipeline', 'Machine Learning'],
    code: `graph TB
    subgraph Data["Data Preparation"]
        Raw[(Raw Data Lake)]
        FE[Feature Engineering]
        Split[Train/Val/Test Split]
        Store[(Feature Store)]
    end

    subgraph Training["Model Training"]
        HPO[Hyperparameter Tuning]
        Train[Distributed Training]
        Eval[Model Evaluation]
        Registry[(Model Registry)]
    end

    subgraph Experiment["Experiment Tracking"]
        MLflow[MLflow / W&B]
        Metrics[Metrics Dashboard]
        Compare[Model Comparison]
    end

    subgraph Deploy["Deployment"]
        Review{Human Review}
        Stage[Staging Deploy]
        ABTest[A/B Test]
        Prod[Production]
    end

    Raw --> FE
    FE --> Split
    FE --> Store
    Split --> HPO
    HPO --> Train
    Train --> Eval
    Eval --> Registry
    Train --> MLflow
    MLflow --> Metrics
    Metrics --> Compare
    Registry --> Review
    Review -->|approved| Stage
    Stage --> ABTest
    ABTest -->|winner| Prod

    style Data fill:#1a4731,stroke:#10b981,color:#fff
    style Training fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Experiment fill:#4a1d6a,stroke:#a78bfa,color:#fff
    style Deploy fill:#1e293b,stroke:#f59e0b,color:#fff`,
  },
  {
    title: 'Model Serving Architecture',
    author: 'ArchiGram',
    description:
      'Low-latency model serving with TensorFlow Serving, model versioning, and canary deployments.',
    category: 'ml-ai-system-design',
    tags: ['Model Serving', 'Inference', 'TensorFlow'],
    code: `graph TB
    Client((Client Request))

    subgraph Gateway["API Gateway"]
        Router[Request Router]
        RateLimit[Rate Limiter]
        Auth[Authentication]
    end

    subgraph Serving["Model Serving"]
        PreProcess[Pre-Processing]
        ModelA[Model v2.1 - 90%]
        ModelB[Model v2.2 - 10%]
        PostProcess[Post-Processing]
        Ensemble[Ensemble Logic]
    end

    subgraph Infra["Infrastructure"]
        GPU[GPU Pool]
        Cache[(Prediction Cache)]
        Queue{Batch Queue}
    end

    subgraph Monitor["Monitoring"]
        Latency[Latency Tracker]
        Drift[Data Drift Detector]
        Accuracy[Accuracy Monitor]
    end

    Client --> Router
    Router --> Auth
    Auth --> RateLimit
    RateLimit --> PreProcess
    PreProcess --> Cache
    Cache -->|miss| ModelA
    Cache -->|miss| ModelB
    ModelA --> Ensemble
    ModelB --> Ensemble
    Ensemble --> PostProcess
    PostProcess --> Client
    ModelA --> GPU
    ModelB --> GPU
    ModelA --> Latency
    PostProcess --> Drift
    Drift --> Accuracy

    style Serving fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Infra fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Monitor fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'RAG System Architecture',
    author: 'ArchiGram',
    description:
      'Retrieval-Augmented Generation pipeline with document ingestion, vector search, and LLM synthesis.',
    category: 'ml-ai-system-design',
    tags: ['RAG', 'LLM', 'Vector Search', 'GenAI'],
    code: `graph TB
    subgraph Ingestion["Document Ingestion"]
        Docs[Documents / URLs]
        Loader[Document Loader]
        Splitter[Text Splitter]
        Embedder[Embedding Model]
        VectorDB[(Vector Database)]
    end

    subgraph Query["Query Pipeline"]
        User((User Query))
        QueryEmbed[Query Embedding]
        Retriever[Similarity Search]
        Reranker[Cross-Encoder Reranker]
        Context[Context Assembly]
    end

    subgraph Generation["LLM Generation"]
        Prompt[Prompt Template]
        LLM[Large Language Model]
        Guard[Output Guard]
        Response[Response]
    end

    Docs --> Loader
    Loader --> Splitter
    Splitter --> Embedder
    Embedder --> VectorDB

    User --> QueryEmbed
    QueryEmbed --> Retriever
    Retriever --> VectorDB
    VectorDB --> Reranker
    Reranker --> Context

    Context --> Prompt
    User --> Prompt
    Prompt --> LLM
    LLM --> Guard
    Guard --> Response

    style Ingestion fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Query fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Generation fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Feature Store Architecture',
    author: 'ArchiGram',
    description:
      'Centralized feature store with offline/online serving, feature versioning, and point-in-time correctness.',
    category: 'ml-ai-system-design',
    tags: ['Feature Store', 'MLOps', 'Feast'],
    code: `graph TB
    subgraph Sources["Data Sources"]
        Batch[(Batch Data)]
        Stream[Streaming Events]
        ThirdParty[Third-Party APIs]
    end

    subgraph Compute["Feature Computation"]
        BatchCompute[Batch Features (Spark)]
        StreamCompute[Stream Features (Flink)]
        OnDemand[On-Demand Features]
    end

    subgraph Store["Feature Store"]
        Offline[(Offline Store - Parquet)]
        Online[(Online Store - Redis)]
        Registry[Feature Registry]
        Versioning[Feature Versioning]
    end

    subgraph Consumers["Consumers"]
        Training[Model Training]
        Serving[Model Serving]
        Analytics[Data Analytics]
    end

    Batch --> BatchCompute
    Stream --> StreamCompute
    ThirdParty --> OnDemand
    BatchCompute --> Offline
    StreamCompute --> Online
    BatchCompute --> Online
    OnDemand --> Online
    Registry --> Versioning

    Offline --> Training
    Online --> Serving
    Offline --> Analytics

    style Store fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Compute fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Consumers fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'LLM Application Architecture',
    author: 'ArchiGram',
    description:
      'Production LLM application with prompt management, guardrails, caching, and observability.',
    category: 'ml-ai-system-design',
    tags: ['LLM', 'GenAI', 'Prompt Engineering', 'Guardrails'],
    code: `graph TB
    User((User))

    subgraph App["Application Layer"]
        API[API Server]
        PromptMgr[Prompt Manager]
        SessionMgr[Session Manager]
    end

    subgraph Safety["Safety Layer"]
        InputGuard[Input Guardrails]
        OutputGuard[Output Guardrails]
        PII[PII Detection]
        Toxicity[Toxicity Filter]
    end

    subgraph LLMLayer["LLM Orchestration"]
        Router[Model Router]
        Cache[(Semantic Cache)]
        GPT4[GPT-4o]
        Claude[Claude 4]
        Llama[Llama 3]
    end

    subgraph Observe["Observability"]
        Traces[Trace Logging]
        Feedback[User Feedback]
        Cost[Cost Tracker]
        Eval[Auto Evaluator]
    end

    User --> API
    API --> InputGuard
    InputGuard --> PII
    PII --> PromptMgr
    PromptMgr --> SessionMgr
    SessionMgr --> Cache
    Cache -->|miss| Router
    Router --> GPT4
    Router --> Claude
    Router --> Llama
    GPT4 --> OutputGuard
    Claude --> OutputGuard
    OutputGuard --> Toxicity
    Toxicity --> User
    API --> Traces
    User --> Feedback
    Router --> Cost
    OutputGuard --> Eval

    style Safety fill:#450a0a,stroke:#ef4444,color:#fff
    style LLMLayer fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Observe fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'ML Model Monitoring',
    author: 'ArchiGram',
    description:
      'Production model monitoring for data drift, performance degradation, and automated retraining triggers.',
    category: 'ml-ai-system-design',
    tags: ['Monitoring', 'MLOps', 'Data Drift', 'Observability'],
    code: `graph TB
    subgraph Production["Production System"]
        Requests[Incoming Requests]
        Model[Model Serving]
        Predictions[Predictions]
        Logging[Prediction Logger]
    end

    subgraph Monitor["Monitoring Pipeline"]
        DriftDetect[Data Drift Detection]
        PerfMonitor[Performance Monitor]
        BiasCheck[Fairness / Bias Check]
        Anomaly[Anomaly Detection]
    end

    subgraph Response["Response Actions"]
        Dashboard[Monitoring Dashboard]
        Alert[Alert System]
        Retrain[Auto-Retrain Trigger]
        Rollback[Model Rollback]
    end

    subgraph Ground["Ground Truth"]
        Labels[(Ground Truth Labels)]
        Feedback[User Feedback]
    end

    Requests --> Model
    Model --> Predictions
    Predictions --> Logging
    Logging --> DriftDetect
    Logging --> PerfMonitor
    Logging --> BiasCheck
    Logging --> Anomaly
    Labels --> PerfMonitor
    Feedback --> PerfMonitor
    DriftDetect --> Dashboard
    PerfMonitor --> Dashboard
    BiasCheck --> Alert
    Anomaly --> Alert
    Alert --> Retrain
    Alert --> Rollback

    style Monitor fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Production fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Response fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Computer Vision Pipeline',
    author: 'ArchiGram',
    description:
      'Image classification and object detection pipeline with data augmentation, training, and edge deployment.',
    category: 'ml-ai-system-design',
    tags: ['Computer Vision', 'Object Detection', 'Edge AI'],
    code: `graph TB
    subgraph Data["Data Pipeline"]
        Images[(Image Dataset)]
        Label[Labeling Tool]
        Augment[Data Augmentation]
        Split[Train / Val Split]
    end

    subgraph Train["Training"]
        Backbone[Backbone CNN]
        Head[Detection Head]
        Loss[Loss Function]
        Optimizer[Optimizer]
        Checkpoint[(Checkpoints)]
    end

    subgraph Deploy["Deployment"]
        ONNX[ONNX Export]
        Quantize[Quantization]
        Edge[Edge Device]
        Cloud[Cloud Endpoint]
    end

    subgraph Inference["Inference Pipeline"]
        Camera[Camera Input]
        Preprocess[Preprocessing]
        Detect[Object Detection]
        Track[Object Tracking]
        Output[Bounding Boxes]
    end

    Images --> Label
    Label --> Augment
    Augment --> Split
    Split --> Backbone
    Backbone --> Head
    Head --> Loss
    Loss --> Optimizer
    Optimizer --> Checkpoint

    Checkpoint --> ONNX
    ONNX --> Quantize
    Quantize --> Edge
    ONNX --> Cloud

    Camera --> Preprocess
    Preprocess --> Detect
    Detect --> Track
    Track --> Output

    style Data fill:#1a1a2e,stroke:#94a3b8,color:#fff
    style Train fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Deploy fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Inference fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'Recommendation System',
    author: 'ArchiGram',
    description:
      'Hybrid recommendation engine combining collaborative filtering, content-based, and deep learning approaches.',
    category: 'ml-ai-system-design',
    tags: ['Recommendations', 'Collaborative Filtering', 'Deep Learning'],
    code: `graph TB
    User((User Activity))

    subgraph Offline["Offline Processing"]
        UserFeatures[User Feature Extraction]
        ItemFeatures[Item Feature Extraction]
        CF[Collaborative Filtering]
        ContentBased[Content-Based Model]
        DeepModel[Deep Neural Network]
    end

    subgraph Candidate["Candidate Generation"]
        CandidateGen[Candidate Pool]
        Recall[Recall: Top 500]
    end

    subgraph Ranking["Ranking"]
        Scorer[ML Scorer]
        BusinessRules[Business Rules]
        Diversity[Diversity Filter]
        TopK[Top-K Results]
    end

    subgraph Serving["Real-Time Serving"]
        Cache[(Feature Cache)]
        API[Recommendation API]
    end

    User --> UserFeatures
    UserFeatures --> CF
    ItemFeatures --> ContentBased
    UserFeatures --> DeepModel
    CF --> CandidateGen
    ContentBased --> CandidateGen
    DeepModel --> CandidateGen
    CandidateGen --> Recall
    Recall --> Scorer
    Scorer --> BusinessRules
    BusinessRules --> Diversity
    Diversity --> TopK
    TopK --> API
    Cache --> Scorer

    style Offline fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Ranking fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Serving fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'AI Agent Architecture',
    author: 'ArchiGram',
    description:
      'Autonomous AI agent with tool use, planning, memory, and multi-step reasoning loop.',
    category: 'ml-ai-system-design',
    tags: ['AI Agents', 'LLM', 'Tool Use', 'Autonomous'],
    code: `graph TB
    User((User Goal))

    subgraph Agent["AI Agent Core"]
        Planner[Task Planner]
        Reasoner[Reasoning Engine]
        Executor[Action Executor]
        Reflector[Self-Reflection]
    end

    subgraph Memory["Memory Systems"]
        ShortTerm[(Working Memory)]
        LongTerm[(Long-Term Memory)]
        Episodic[(Episodic Memory)]
    end

    subgraph Tools["Available Tools"]
        Search[Web Search]
        Code[Code Interpreter]
        FileIO[File I/O]
        API[External APIs]
        Browser[Browser Control]
    end

    User --> Planner
    Planner --> Reasoner
    Reasoner --> Executor
    Executor --> Tools
    Search --> Reflector
    Code --> Reflector
    FileIO --> Reflector
    API --> Reflector
    Browser --> Reflector
    Reflector -->|iterate| Reasoner
    Reflector -->|done| User
    Reasoner --> ShortTerm
    Reflector --> LongTerm
    Planner --> Episodic

    style Agent fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Memory fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Tools fill:#1a4731,stroke:#10b981,color:#fff`,
  },
  {
    title: 'A/B Testing for ML Models',
    author: 'ArchiGram',
    description:
      'Statistical A/B testing framework for comparing ML model variants with traffic splitting and significance testing.',
    category: 'ml-ai-system-design',
    tags: ['A/B Testing', 'Experimentation', 'ML Deployment'],
    code: `graph TB
    Traffic((Incoming Traffic))

    subgraph Splitter["Traffic Splitter"]
        Hash[User ID Hash]
        Control[Control Group 50%]
        Treatment[Treatment Group 50%]
    end

    subgraph Models["Model Variants"]
        ModelA[Model A - Baseline]
        ModelB[Model B - Challenger]
    end

    subgraph Metrics["Metrics Collection"]
        Logger[Event Logger]
        MetricDB[(Metrics Database)]
    end

    subgraph Analysis["Statistical Analysis"]
        SigTest[Significance Test]
        Power[Power Analysis]
        Decision{p-value < 0.05?}
        Winner[Promote Winner]
        Continue[Continue Test]
    end

    Traffic --> Hash
    Hash --> Control
    Hash --> Treatment
    Control --> ModelA
    Treatment --> ModelB
    ModelA --> Logger
    ModelB --> Logger
    Logger --> MetricDB
    MetricDB --> SigTest
    SigTest --> Power
    Power --> Decision
    Decision -->|yes| Winner
    Decision -->|no| Continue

    style Splitter fill:#1e293b,stroke:#f59e0b,color:#fff
    style Models fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Analysis fill:#1a4731,stroke:#10b981,color:#fff`,
  },
];

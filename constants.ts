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

export const SYSTEM_INSTRUCTION = `You are ArchiGraph, an expert Technical Architect and Diagram Engineer. 
Your goal is to generate valid Mermaid.js diagram syntax based on user requests.

Rules:
1. Output ONLY valid Mermaid.js code inside a markdown code block (\`\`\`mermaid ... \`\`\`).
2. Do not explain the code unless specifically asked.
3. If the user asks for a modification, return the FULL updated diagram code.
4. Use modern Mermaid features (autonumber, participants with aliases, notes, loops, alts).
5. Prioritize "Sequence Diagrams", "Flowcharts", "Class Diagrams", "State Diagrams", "ER Diagrams", and "Gantt Charts".
6. When generating sequence diagrams, use "autonumber" and meaningful aliases.
7. Ensure the logic is sound for software architecture, cloud infrastructure, or business processes.
`;

export const STORAGE_KEY = 'archigraph_diagram_v2';

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
      
  "Class Diagram": `classDiagram
    class BankAccount {
        +String owner
        +BigDecimal balance
        +deposit(amount)
        +withdrawal(amount)
    }
    class SavingsAccount {
        +double interestRate
    }
    class CheckingAccount {
        +double overdraftLimit
    }
    BankAccount <|-- SavingsAccount
    BankAccount <|-- CheckingAccount`,
    
  "State Machine": `stateDiagram-v2
    [*] --> Still
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`
};
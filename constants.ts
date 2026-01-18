
export const INITIAL_CODE = `sequenceDiagram
    autonumber
    actor User as Passenger
    participant App as Mobile App
    participant API as Uber API
    participant DriverAPI as Driver Service
    actor Driver

    Note over User, Driver: Ride Request Flow

    User->>App: Enters Destination
    App->>API: GetFareEstimate(pickup, dropoff)
    API-->>App: Returns Estimate (Price, Time)
    
    User->>App: Confirms Ride
    App->>API: RequestRide(user_id, loc)
    
    API->>DriverAPI: FindNearbyDrivers(loc)
    DriverAPI->>DriverAPI: Filter & Rank Drivers
    
    loop Find Driver
        DriverAPI->>Driver: Send Ride Offer
        alt Driver Accepts
            Driver->>DriverAPI: AcceptRide(ride_id)
            DriverAPI-->>API: Driver Assigned
        else Driver Rejects
            Driver->>DriverAPI: RejectRide
            DriverAPI->>DriverAPI: Select Next Driver
        end
    end

    API-->>App: RideConfirmed(driver_details, eta)
    App-->>User: Show Driver on Map
    
    Note over Driver, User: Ride Execution
    
    Driver->>User: Arrives at Pickup
    Driver->>API: StartRide
    API-->>App: Update Status (In Progress)
    
    Driver->>User: Dropoff at Destination
    Driver->>API: EndRide
    API->>API: ProcessPayment
    API-->>App: Show Receipt & Rating
    User->>App: Submit Rating`;

export const SYSTEM_INSTRUCTION = `You are ArchiGram, an expert Technical Architect and Diagram Engineer. 
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

export const STORAGE_KEY = 'archigram_diagram_v2';

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
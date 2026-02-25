export const FAQ_DATA = [
  {
    question: 'What is ArchiGram.ai?',
    answer:
      'ArchiGram.ai is an open-source, AI-powered diagramming tool designed for software architects and engineers. It uses Gemini 3 Flash to convert natural language descriptions into valid Mermaid.js code, allowing you to visualize system designs, cloud architectures, and ML pipelines instantly.',
  },
  {
    question: 'How does the System Design Copilot work?',
    answer:
      "The System Design Copilot utilizes a Large Language Model (Gemini 3) trained on thousands of architectural patterns. You simply describe your system (e.g., 'A microservices e-commerce app with Redis caching'), and the Copilot generates a syntactically correct, visually structured Mermaid diagram for you.",
  },
  {
    question: 'Is ArchiGram free to use?',
    answer:
      'Yes, ArchiGram.ai is Open Source Software (OSS). The core diagramming studio is free for individuals. We offer an Enterprise tier for teams requiring SSO, RBAC, and private cloud deployment.',
  },
  {
    question: 'Can I export diagrams to other formats?',
    answer:
      'Absolutely. You can export your architectures as high-fidelity SVG (Scalable Vector Graphics) for presentations or PNG images for quick sharing. You can also copy the raw Mermaid code to use in GitHub READMEs or Notion.',
  },
  {
    question: 'Where is my data stored?',
    answer:
      'By default, all your diagrams and projects are stored locally in your browser (localStorage) — nothing is sent to any server. When you choose to publish a diagram to the Community Gallery, it is stored in our Supabase database. Share Links compress your diagram code directly into the URL, so no data ever touches a server for sharing.',
  },
  {
    question: 'Do I need to create an account to use ArchiGram?',
    answer:
      'No account is needed for the core studio experience — open the app and start diagramming immediately. An account (GitHub or Google OAuth) is only required if you want to publish diagrams to the public Community Gallery, leave comments, or save diagrams to the cloud.',
  },
  {
    question: 'What diagram types does ArchiGram support?',
    answer:
      'ArchiGram supports all major Mermaid.js diagram types: Sequence, Flowchart, Class, State, ER, Gantt, Mindmap, Git Graph, Timeline, Quadrant, and more. The PlantUML Studio adds UML Class, Sequence, Component, Activity, and Deployment diagrams. The BPMN Studio handles Business Process Modeling.',
  },
  {
    question: 'How do I share a diagram with a teammate?',
    answer:
      'Click the "Share" button in the header toolbar. ArchiGram compresses your entire diagram code into the URL using LZ-string encoding — no server required. Paste the link and your teammate opens the exact same diagram instantly. For persistent sharing, use "Publish to Gallery" to get a permanent, searchable community link.',
  },
  {
    question: 'Can I use ArchiGram programmatically via an API?',
    answer:
      'Yes. ArchiGram exposes a REST API at /api/v1/generate (POST) that accepts a natural language prompt and returns Mermaid code. There is also an MCP Server that exposes generate_diagram and get_diagram tools for use with Claude and other AI assistants. See the Documentation page for full API reference.',
  },
  {
    question: "What's the difference between Mermaid Studio and PlantUML Studio?",
    answer:
      'Mermaid Studio is the primary AI-powered editor with live preview, AI Copilot, templates, and community features. It is the recommended starting point for most use cases. PlantUML Studio is a dedicated editor for teams already using PlantUML syntax, with a server-rendered preview. Both studios support AI generation from natural language.',
  },
  {
    question: 'How does the Vision AI feature work?',
    answer:
      'Vision AI lets you upload a screenshot, photo, or whiteboard sketch of an existing architecture diagram. ArchiGram uses the Gemini Vision model to analyze the image and reconstruct it as editable Mermaid code. Click the camera icon in the AI Copilot toolbar to upload an image.',
  },
  {
    question: 'Is there a CLI tool for generating diagrams locally?',
    answer:
      'Yes. Install the CLI with `bun install` inside the `cli/` directory, then run `bun run cli "describe your system"`. It calls the Gemini API locally and outputs raw Mermaid code to stdout — useful for scripts, CI pipelines, or generating diagrams from your terminal.',
  },
  {
    question: 'What if the AI generates incorrect or invalid Mermaid code?',
    answer:
      'The editor includes a live diagnostic panel that highlights syntax errors as you type. You can manually fix the code, ask the AI Copilot to "fix the error", or use the Audit feature (Header → Analyze) which runs a dedicated quality pass on the diagram. Invalid diagrams show a friendly error in the preview pane without breaking anything.',
  },
  {
    question: 'Can I self-host ArchiGram.ai?',
    answer:
      'Yes, ArchiGram.ai is MIT-licensed and designed to be self-hosted. Clone the repository, add your VITE_GEMINI_API_KEY, and run `bun run dev`. For production, build with `bun run build` and deploy the dist/ folder to any static host. The app runs entirely client-side; Supabase is optional and only needed for community features.',
  },
];

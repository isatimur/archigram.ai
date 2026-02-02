import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare state: State;
  declare readonly props: Readonly<Props>;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ArchiGram Error Boundary caught:', error, errorInfo);
  }

  render() {
    const { state, props } = this;
    if (state.hasError && state.error) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-white p-8">
          <div className="max-w-md flex flex-col items-center gap-4 text-center">
            <h1 className="text-xl font-bold text-zinc-200">Something went wrong</h1>
            <p className="text-sm text-zinc-500 font-mono">{state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return props.children;
  }
}

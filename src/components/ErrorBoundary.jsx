import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-ink text-linen flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <h1 className="font-display text-2xl">Something went wrong</h1>
            <p className="font-body text-stone text-sm">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-body text-bronze text-sm underline"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

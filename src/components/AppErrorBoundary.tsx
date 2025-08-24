import React from 'react';

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; err?: any }> {
  constructor(props: { children: React.ReactNode }) { 
    super(props); 
    this.state = { hasError: false }; 
  }
  static getDerivedStateFromError(error: any) { 
    return { hasError: true, err: error }; 
  }
  componentDidCatch(error: any, info: any) { 
    console.error('[AppErrorBoundary]', error, info); 
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-xl mx-auto text-center text-white">
          <h1 className="text-2xl font-bold mb-2">Er ging iets mis</h1>
          <p className="text-sm opacity-80">Bekijk de console voor details. Herlaad of ga terug naar de homepage.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
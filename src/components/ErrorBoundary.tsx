import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: string; }

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: '' };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error: error.message };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="rounded-xl border bg-destructive/10 p-6 max-w-lg">
                        <h2 className="font-heading text-xl font-bold text-destructive mb-2">Something went wrong</h2>
                        <p className="text-sm text-muted-foreground mb-4 font-mono break-all">{this.state.error}</p>
                        <button
                            onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

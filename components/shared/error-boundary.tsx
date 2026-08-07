'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

interface Props {
  children: ReactNode;
  /** Shown instead of the default card when provided. */
  fallback?: ReactNode;
  /** Used in the copy so the user knows which part failed. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Route-segment error boundary. Renders a friendly card, never a stack trace
 * (Section 10). Reset re-mounts the subtree rather than reloading the page so
 * the rest of the shell stays interactive.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the detail in the console for debugging; the user sees the card.
    console.error('[ErrorBoundary]', this.props.label ?? 'segment', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  override render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <EmptyState
        tone="error"
        icon={<AlertTriangle className="h-5 w-5" />}
        title={`Couldn't load ${this.props.label ?? 'this section'}`}
        description="Something went wrong on our side. Your connection is fine — try again."
        action={
          <Button variant="secondary" size="sm" onClick={this.reset}>
            <RotateCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        }
      />
    );
  }
}

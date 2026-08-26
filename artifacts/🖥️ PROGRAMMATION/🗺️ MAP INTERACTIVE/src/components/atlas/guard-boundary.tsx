import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { pressProps } from "@/lib/press";

type Props = { children: ReactNode; label?: string };
type State = { error: Error | null };

export class GuardBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[atlas-guard]", this.props.label ?? "ui", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-foreground">
            {this.props.label
              ? `${this.props.label} a rencontré un problème.`
              : "Cette section a rencontré un problème."}
          </p>
          <p className="text-xs break-words text-muted-foreground">
            {this.state.error.message || "Erreur inattendue."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              {...pressProps(() => this.setState({ error: null }))}
            >
              Réessayer
            </Button>
            <Button
              type="button"
              {...pressProps(() => window.location.reload())}
            >
              Recharger
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

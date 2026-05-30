"use client";

import { Component, type ReactNode } from "react";

interface Props {
  toolType: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ToolErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      const name = this.props.toolType.startsWith("tool-")
        ? this.props.toolType.slice("tool-".length)
        : this.props.toolType;
      return (
        <div className="px-3 py-2 text-sm rounded-md border border-dashed text-muted-foreground">
          Could not render result for <span className="text-xs font-mono">{name}</span>
        </div>
      );
    }
    return this.props.children;
  }
}

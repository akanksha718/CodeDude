

"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "../ui/button"



/**
 * @property name- Display name for the panel
 * @property children- The content of the panel
 */

interface PanelErrorBoundaryProps {
    name: string;
    children: ReactNode;
}

/**
 * @property hasError- Indicates if the panel has an error
 * @property error- The caught error object
 */

interface PanelErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}


export class PanelErrorBoundary extends Component<PanelErrorBoundaryProps, PanelErrorBoundaryState> {
    constructor(props: PanelErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error): PanelErrorBoundaryState {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`Error in ${this.props.name} panel:`, error, errorInfo);
    }
    handleReset = () => {
        this.setState({ hasError: false, error: null });
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="flex size-10 items-center justify-center rounded-full bg-red-500/10">
                        <AlertTriangle className="size-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">
                            {this.props.name} panel has encountered an error. Please try refreshing the page or contact support if the issue persists.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {this.state.error?.message || "An unexpected error occurred."}
                        </p>
                    </div>
                    <Button onClick={this.handleReset}
                        variant="outline"
                        className="gap-1.5"
                        size="sm">
                        <RotateCcw className="size-3" />Try Again
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}
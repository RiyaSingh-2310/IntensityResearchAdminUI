import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/shared/PageState'

type Props = { children: ReactNode; className?: string }
type State = { failed: boolean }

/** Keeps a render error or a failed lazy page download from blanking the whole console. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className={this.props.className}>
        <ErrorState
          message="Something went wrong while showing this page. Reload to try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }
}

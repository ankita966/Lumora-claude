import React from 'react';

/**
 * Child-friendly React ErrorBoundary.
 * Prevents camera/audio hardware failures or WebGL context losses
 * from crashing the entire app into a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('[Lumora ErrorBoundary caught an error]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px',
            textAlign: 'center',
            background: 'rgba(18, 24, 48, 0.85)',
            border: '2px solid rgba(79, 216, 255, 0.3)',
            borderRadius: '24px',
            margin: '20px auto',
            maxWidth: '540px',
            color: '#FAF9FC',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
          <h3
            style={{
              fontFamily: '"Baloo 2", sans-serif',
              fontSize: '22px',
              fontWeight: 800,
              color: '#F8DDAA',
              marginBottom: '8px',
            }}
          >
            A magical spark needs a gentle reset!
          </h3>
          <p
            style={{
              fontFamily: '"Lexend", sans-serif',
              fontSize: '14px',
              color: '#c9d7ff',
              lineHeight: 1.5,
              marginBottom: '20px',
              maxWidth: '420px',
            }}
          >
            {this.props.fallbackMessage ||
              'A device sensor or animation had a brief hiccup. Tap below to resume your magical journey.'}
          </p>
          <button
            onClick={this.handleReset}
            className="btn-pill btn-primary"
            style={{
              fontFamily: '"Baloo 2", sans-serif',
              fontSize: '16px',
              fontWeight: 800,
              padding: '12px 28px',
              cursor: 'pointer',
            }}
          >
            ✨ Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

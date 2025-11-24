import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Cập nhật state để render UI fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log lỗi ra console hoặc gửi đến error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Render UI fallback tùy chỉnh
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '40px',
            borderRadius: '16px',
            maxWidth: '600px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</h1>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
              Đã xảy ra lỗi!
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '24px', opacity: 0.9 }}>
              Xin lỗi, có vấn đề xảy ra với ứng dụng. Vui lòng thử lại sau.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '20px',
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '12px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                  Chi tiết lỗi (chỉ hiển thị trong development)
                </summary>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Thử lại
            </button>

            <button
              onClick={() => window.location.href = '/'}
              style={{
                marginTop: '12px',
                padding: '12px 24px',
                background: 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Về trang chủ
            </button>
          </div>
        </div>
      );
    }

    // Render children bình thường nếu không có lỗi
    return this.props.children;
  }
}

export default ErrorBoundary;

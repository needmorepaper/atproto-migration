import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ErrorPageProps {
  statusCode?: number;
  message?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ 
  statusCode = 404,
  message = "The page you're looking for doesn't exist."
}) => {
  const navigate = useNavigate();

  return (
    <div className="page-content" style={{ textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
      <h2 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--error-color)' }}>
        {statusCode}
      </h2>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
        {message}
      </p>
      <div className="button-container" style={{ display: 'inline' }}>
        <button 
          className="continue-button"
          onClick={() => navigate('/')}
        >
          Come back home
        </button>
      </div>
    </div>
  );
};

export default ErrorPage; 
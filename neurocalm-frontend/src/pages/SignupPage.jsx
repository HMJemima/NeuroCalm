import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Upload, Zap, BarChart3 } from 'lucide-react';
import SignupForm from '../components/auth/SignupForm';
import BackgroundEffects from '../components/layout/BackgroundEffects';
import { useAuth } from '../hooks/useAuth';

const brandFeatures = [
  { icon: Upload, text: 'Easy Upload' },
  { icon: Zap, text: 'Fast Processing' },
  { icon: BarChart3, text: 'Detailed Reports' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      await register(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex relative overflow-hidden">
      <BackgroundEffects />

      {/* Left Panel - Brand */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 relative z-10">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <Brain size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold text-text-primary mb-4 leading-tight">
            Understand Your Brain,{' '}
            <span className="gradient-text">Control Your Stress</span>
          </h1>
          <p className="text-base text-text-secondary mb-8">
            Upload fNIRS recordings and get instant AI-powered stress analysis with clinical-grade accuracy.
          </p>
          <div className="space-y-4">
            {brandFeatures.map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                  <feature.icon size={18} className="text-accent-blue" />
                </div>
                <span className="text-sm text-text-secondary">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-md bg-bg-secondary/80 backdrop-blur-[20px] border border-border-color rounded-2xl p-5 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-accent-red/10 border border-accent-red/20 rounded-xl text-sm text-accent-red">
              {error}
            </div>
          )}
          <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-blue hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

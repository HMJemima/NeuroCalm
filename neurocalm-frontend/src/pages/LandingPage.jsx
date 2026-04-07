import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload, Brain, Shield, BarChart3, History, Download,
  ArrowRight, Play, CheckCircle, Zap, Clock,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BackgroundEffects from '../components/layout/BackgroundEffects';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const features = [
  { icon: Upload, title: 'Easy File Upload', desc: 'Drag and drop your EEG files in .mat, .edf, or .csv format for instant analysis.', color: 'bg-accent-blue/10 text-accent-blue' },
  { icon: Brain, title: 'AI-Powered Detection', desc: 'Advanced machine learning models trained on thousands of EEG recordings.', color: 'bg-accent-purple/10 text-accent-purple' },
  { icon: BarChart3, title: 'Detailed Reports', desc: 'Comprehensive band power analysis with delta, theta, alpha, beta, and gamma insights.', color: 'bg-accent-cyan/10 text-accent-cyan' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your brain data is encrypted and processed with enterprise-grade security.', color: 'bg-accent-green/10 text-accent-green' },
  { icon: History, title: 'Analysis History', desc: 'Track your stress patterns over time with a complete analysis history.', color: 'bg-accent-yellow/10 text-accent-yellow' },
  { icon: Download, title: 'Export Results', desc: 'Download detailed PDF or JSON reports for your records or healthcare provider.', color: 'bg-accent-red/10 text-accent-red' },
];

const steps = [
  { num: '01', title: 'Create Account', desc: 'Sign up for free in seconds', icon: CheckCircle },
  { num: '02', title: 'Upload EEG File', desc: 'Drop your .mat, .edf, or .csv file', icon: Upload },
  { num: '03', title: 'AI Processing', desc: 'Our model analyzes brain signals', icon: Zap },
  { num: '04', title: 'Get Results', desc: 'Instant stress detection results', icon: BarChart3 },
];

const stats = [
  { value: '95%', label: 'Accuracy' },
  { value: '10K+', label: 'Analyses' },
  { value: '<30s', label: 'Processing' },
];

const container = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      <BackgroundEffects />
      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <motion.div
            variants={container}
            initial="initial"
            animate="animate"
            className="max-w-[650px]"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="default" className="mb-6">
                <Brain size={14} />
                AI-Powered EEG Analysis
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-[64px] font-display font-bold leading-tight mb-6"
            >
              Detect Stress with{' '}
              <span className="gradient-text">Brain Science</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-text-secondary mb-8 max-w-[520px]">
              Upload your EEG recordings and get instant AI-powered stress analysis.
              Understand your brain patterns with clinical-grade accuracy.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col gap-3 mb-10 sm:flex-row sm:gap-4">
              <Button onClick={() => navigate('/signup')}>
                Try Free Analysis
                <ArrowRight size={16} className="ml-2 inline" />
              </Button>
              <Button variant="ghost">
                <Play size={16} className="mr-2 inline" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 sm:flex sm:gap-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-display font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-muted mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Everything you need for EEG analysis
            </h2>
            <p className="text-text-secondary max-w-md mx-auto">
              From upload to insights, our platform handles the entire stress detection workflow.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp}>
                <Card className="h-full">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold font-display text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-24 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Simple 4-step process
            </h2>
            <p className="text-text-secondary max-w-md mx-auto">
              Get from raw EEG data to actionable stress insights in under 30 seconds.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {steps.map((step) => (
              <motion.div key={step.num} variants={fadeUp}>
                <Card className="text-center relative overflow-hidden">
                  <span className="absolute top-4 right-4 text-5xl font-display font-bold text-border-color">
                    {step.num}
                  </span>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mx-auto mb-4">
                    <step.icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-base font-semibold font-display text-text-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-secondary">{step.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="text-center p-6 border-accent-blue/20 sm:p-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mx-auto mb-6">
                <Brain size={28} className="text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
                Ready to understand your stress?
              </h2>
              <p className="text-text-secondary mb-8 max-w-md mx-auto">
                Join thousands of researchers and clinicians using NeuroCalm for EEG stress analysis.
              </p>
              <Button size="lg" onClick={() => navigate('/signup')}>
                Get Started Free
                <ArrowRight size={18} className="ml-2 inline" />
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

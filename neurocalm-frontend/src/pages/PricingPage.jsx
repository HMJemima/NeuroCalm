import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check, Sparkles, Brain, ArrowRight, Gift, Rocket, Star, Users,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BackgroundEffects from '../components/layout/BackgroundEffects';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const betaFeatures = [
  'Unlimited fNIRS file uploads',
  'AI-powered stress detection',
  'Detailed band power analysis',
  'PDF & JSON report exports',
  'Complete analysis history',
  'Secure data encryption',
  'Priority support access',
  'Early access to new features',
];

const whyFree = [
  {
    icon: Rocket,
    title: 'Early Adopter Advantage',
    desc: 'Be among the first to use cutting-edge fNIRS stress analysis technology and help shape its future.',
    color: 'bg-accent-blue/10 text-accent-blue',
  },
  {
    icon: Users,
    title: 'Community Driven',
    desc: 'Your feedback during beta directly influences our roadmap and feature development.',
    color: 'bg-accent-purple/10 text-accent-purple',
  },
  {
    icon: Star,
    title: 'Full Access, No Limits',
    desc: 'Every feature is unlocked during the beta — no hidden tiers, no usage caps, no credit card needed.',
    color: 'bg-accent-cyan/10 text-accent-cyan',
  },
];

const container = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      <BackgroundEffects />
      <Navbar />

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={container}
            initial="initial"
            animate="animate"
            className="text-center max-w-[700px] mx-auto"
          >
            <motion.div variants={fadeUp}>
              <Badge className="mb-6">
                <Gift size={14} />
                Beta Launch
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-[64px] font-display font-bold leading-tight mb-6"
            >
              Completely{' '}
              <span className="gradient-text">Free</span>{' '}
              During Beta
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-text-secondary mb-4 max-w-[560px] mx-auto">
              We're in our initial beta version and we're happy to share that NeuroCalm is
              completely free for everyone. No credit card, no hidden fees — just powerful fNIRS analysis.
            </motion.p>

            <motion.p variants={fadeUp} className="text-sm text-text-muted mb-8 max-w-[480px] mx-auto">
              Enjoy full access to every feature while we refine the platform with your feedback.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="relative z-10 pb-24">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Card className="p-5 border-accent-blue/30 relative overflow-hidden sm:p-8">
              {/* Glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent-purple/10 rounded-full blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-accent-yellow" />
                  <span className="text-sm font-medium text-accent-yellow">Beta Access</span>
                </div>

                <h3 className="text-2xl font-display font-bold text-text-primary mb-1">
                  Free Plan
                </h3>
                <div className="flex flex-wrap items-baseline gap-1 mb-6">
                  <span className="text-5xl font-display font-bold text-text-primary">$0</span>
                  <span className="text-text-muted text-sm">/ forever during beta</span>
                </div>

                <div className="space-y-3 mb-8">
                  {betaFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent-green/10 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-accent-green" />
                      </div>
                      <span className="text-sm text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button fullWidth onClick={() => navigate('/signup')}>
                  Get Started Free
                  <ArrowRight size={16} className="ml-2 inline" />
                </Button>

                <p className="text-xs text-text-muted text-center mt-4">
                  No credit card required
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Why Free */}
      <section className="relative z-10 py-24 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">Why Free?</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Built for the community
            </h2>
            <p className="text-text-secondary max-w-md mx-auto">
              We believe everyone deserves access to mental health insights. Here's why we're keeping it free.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {whyFree.map((item) => (
              <motion.div key={item.title} variants={fadeUp}>
                <Card className="h-full">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                    <item.icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold font-display text-text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
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
                Start analyzing for free today
              </h2>
              <p className="text-text-secondary mb-8 max-w-md mx-auto">
                Join the beta and get unlimited access to AI-powered fNIRS stress detection — no strings attached.
              </p>
              <Button size="lg" onClick={() => navigate('/signup')}>
                Join the Beta
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

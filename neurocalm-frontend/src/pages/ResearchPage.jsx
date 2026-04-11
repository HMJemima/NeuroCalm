import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, BookOpen, FlaskConical, BarChart3, ArrowRight,
  FileText, Lightbulb, Shield, Activity,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BackgroundEffects from '../components/layout/BackgroundEffects';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const researchAreas = [
  {
    icon: Brain,
    title: 'fNIRS Signal Processing',
    desc: 'We apply advanced signal processing techniques — including wavelet transforms, FFT, and bandpass filtering — to extract meaningful features from raw fNIRS recordings.',
    color: 'bg-accent-blue/10 text-accent-blue',
  },
  {
    icon: Activity,
    title: 'Stress Biomarkers',
    desc: 'Our models identify stress-related patterns across delta, theta, alpha, beta, and gamma frequency bands, correlating brain wave activity with psychological stress states.',
    color: 'bg-accent-purple/10 text-accent-purple',
  },
  {
    icon: FlaskConical,
    title: 'Machine Learning Models',
    desc: 'We leverage ensemble methods and deep learning architectures trained on large annotated fNIRS datasets to achieve high-accuracy stress classification.',
    color: 'bg-accent-cyan/10 text-accent-cyan',
  },
  {
    icon: Shield,
    title: 'Validation & Accuracy',
    desc: 'Our models undergo rigorous cross-validation with independent test sets to ensure reliable, reproducible results suitable for clinical and research applications.',
    color: 'bg-accent-green/10 text-accent-green',
  },
];

const publications = [
  {
    title: 'fNIRS-Based Stress Detection Using Band Power Features and Machine Learning',
    authors: 'NeuroCalm Research Team',
    journal: 'Under Review — Journal of Neural Engineering',
    year: '2026',
    tag: 'Primary Research',
  },
  {
    title: 'Automated fNIRS Preprocessing Pipeline for Real-Time Stress Classification',
    authors: 'NeuroCalm Research Team',
    journal: 'In Preparation',
    year: '2026',
    tag: 'Methodology',
  },
  {
    title: 'Comparative Analysis of Frequency-Domain Features for Mental Stress Detection',
    authors: 'NeuroCalm Research Team',
    journal: 'In Preparation',
    year: '2026',
    tag: 'Feature Engineering',
  },
];

const bandInfo = [
  { name: 'Delta (0.5–4 Hz)', desc: 'Associated with deep sleep and restorative processes. Elevated delta in waking states may indicate fatigue.', color: 'bg-accent-blue' },
  { name: 'Theta (4–8 Hz)', desc: 'Linked to drowsiness, meditation, and creative states. Changes in theta often correlate with cognitive load.', color: 'bg-accent-purple' },
  { name: 'Alpha (8–13 Hz)', desc: 'Prominent during relaxation and calm focus. Reduced alpha power is a well-known indicator of stress.', color: 'bg-accent-cyan' },
  { name: 'Beta (13–30 Hz)', desc: 'Active thinking and alertness. Increased beta activity frequently accompanies anxiety and mental stress.', color: 'bg-accent-yellow' },
  { name: 'Gamma (30–100 Hz)', desc: 'Higher cognitive functions and information processing. Gamma modulation reflects complex neural processing.', color: 'bg-accent-green' },
];

const container = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function ResearchPage() {
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
                <BookOpen size={14} />
                Our Research
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-[64px] font-display font-bold leading-tight mb-6"
            >
              The Science Behind{' '}
              <span className="gradient-text">NeuroCalm</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-text-secondary mb-8 max-w-[560px] mx-auto">
              Built on peer-reviewed neuroscience and validated machine learning techniques,
              NeuroCalm brings research-grade fNIRS analysis to everyone.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Research Areas */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">Core Areas</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Research foundations
            </h2>
            <p className="text-text-secondary max-w-md mx-auto">
              Our approach combines neuroscience, signal processing, and artificial intelligence.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {researchAreas.map((area) => (
              <motion.div key={area.title} variants={fadeUp}>
                <Card className="h-full">
                  <div className={`w-12 h-12 rounded-xl ${area.color} flex items-center justify-center mb-4`}>
                    <area.icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold font-display text-text-primary mb-2">
                    {area.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{area.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Brain Wave Bands */}
      <section className="relative z-10 py-24 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">
              <Activity size={14} />
              fNIRS Frequency Bands
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Understanding brain waves
            </h2>
            <p className="text-text-secondary max-w-md mx-auto">
              fNIRS signals are decomposed into frequency bands, each reflecting different neural processes.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="space-y-4 max-w-3xl mx-auto"
          >
            {bandInfo.map((band) => (
              <motion.div key={band.name} variants={fadeUp}>
                <Card className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full ${band.color} mt-1.5 flex-shrink-0`} />
                  <div>
                    <h3 className="text-base font-semibold font-display text-text-primary mb-1">
                      {band.name}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{band.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Publications */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">
              <FileText size={14} />
              Publications
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Our work
            </h2>
            <p className="text-text-secondary max-w-md mx-auto">
              Research papers and technical contributions from the NeuroCalm team.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="space-y-4 max-w-3xl mx-auto"
          >
            {publications.map((pub) => (
              <motion.div key={pub.title} variants={fadeUp}>
                <Card>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold font-display text-text-primary mb-1">
                        {pub.title}
                      </h3>
                      <p className="text-sm text-text-secondary">{pub.authors}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {pub.journal} &middot; {pub.year}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-accent-blue/10 text-accent-blue whitespace-nowrap flex-shrink-0">
                      {pub.tag}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Methodology Highlights */}
      <section className="relative z-10 py-24 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">
              <Lightbulb size={14} />
              Methodology
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              How our model works
            </h2>
            <p className="text-text-secondary max-w-md mx-auto">
              A high-level overview of the NeuroCalm analysis pipeline.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {[
              { step: '01', title: 'Preprocessing', desc: 'Raw fNIRS signals are cleaned using artifact removal, noise filtering, and channel selection algorithms.' },
              { step: '02', title: 'Feature Extraction', desc: 'Band power features (PSD) are computed using Welch\'s method across all five frequency bands.' },
              { step: '03', title: 'Classification', desc: 'Extracted features are fed into an ensemble ML model that outputs stress probability scores with confidence levels.' },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeUp}>
                <Card className="text-center relative overflow-hidden">
                  <span className="absolute top-4 right-4 text-5xl font-display font-bold text-border-color">
                    {item.step}
                  </span>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mx-auto mb-4">
                    <BarChart3 size={24} className="text-white" />
                  </div>
                  <h3 className="text-base font-semibold font-display text-text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary">{item.desc}</p>
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
                Experience the research firsthand
              </h2>
              <p className="text-text-secondary mb-8 max-w-md mx-auto">
                Try NeuroCalm for free and see how our AI-powered fNIRS analysis works on your own data.
              </p>
              <Button size="lg" onClick={() => navigate('/signup')}>
                Try It Free
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

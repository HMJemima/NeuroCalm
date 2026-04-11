import { motion } from 'framer-motion';
import {
  Brain, Upload, History, BarChart3,
  MessageSquare, Mail,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import useSidebarStore from '../store/sidebarStore';

const guides = [
  {
    icon: Upload,
    title: 'Uploading fNIRS Files',
    desc: 'Learn how to upload .mat, .edf, or .csv files for analysis. Drag and drop or click to browse.',
    color: 'bg-accent-blue/10 text-accent-blue',
  },
  {
    icon: Brain,
    title: 'Understanding Results',
    desc: 'Your analysis shows a stress score, confidence level, and detailed band power breakdown across five frequency bands.',
    color: 'bg-accent-purple/10 text-accent-purple',
  },
  {
    icon: BarChart3,
    title: 'Reading Reports',
    desc: 'Reports summarize your analyses over time. Export as PDF for your records or JSON for further processing.',
    color: 'bg-accent-cyan/10 text-accent-cyan',
  },
  {
    icon: History,
    title: 'Analysis History',
    desc: 'All your past analyses are saved. Search, filter, and revisit previous results anytime.',
    color: 'bg-accent-green/10 text-accent-green',
  },
];

const faq = [
  {
    q: 'What file formats are supported?',
    a: 'NeuroCalm supports .mat (MATLAB), .edf (European Data Format), and .csv files. Ensure your file contains valid fNIRS channel data.',
  },
  {
    q: 'How long does analysis take?',
    a: 'Most analyses complete in under 30 seconds. Processing time depends on file size and the number of channels.',
  },
  {
    q: 'What do the stress levels mean?',
    a: 'The model output is shown as 4 states: Very Relaxed, Relaxed, Moderate, and Stressed. Older score-only results fall back to similar score ranges from low to high stress.',
  },
  {
    q: 'Can I delete my analysis history?',
    a: 'Yes. Go to History, find the analysis you want to remove, and click the delete button. This action cannot be undone.',
  },
  {
    q: 'Is my data private?',
    a: 'All data is encrypted in transit and at rest. We never share your fNIRS data with third parties.',
  },
  {
    q: 'How do I export reports?',
    a: 'Navigate to the Reports page and click the download button on any report. Choose between PDF and JSON formats.',
  },
];

const container = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function HelpPage() {
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />

      {/* Main Content */}
      <main className={`px-4 py-6 pb-28 sm:px-6 md:p-8 md:pb-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[92px]' : 'md:ml-[260px]'}`}>
        <motion.div variants={container} initial="initial" animate="animate" className="space-y-8">
          {/* Header */}
          <motion.div variants={fadeUp}>
            <h1 className="text-2xl font-display font-bold text-text-primary">Help Center</h1>
            <p className="text-sm text-text-secondary mt-1">
              Guides, FAQs, and support resources
            </p>
          </motion.div>

          {/* Quick Guides */}
          <motion.div variants={fadeUp}>
            <h2 className="text-lg font-semibold font-display text-text-primary mb-4">Getting Started</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {guides.map((guide) => (
                <Card key={guide.title} className="h-full">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${guide.color} flex items-center justify-center flex-shrink-0`}>
                      <guide.icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold font-display text-text-primary mb-1">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">{guide.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div variants={fadeUp}>
            <h2 className="text-lg font-semibold font-display text-text-primary mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faq.map((item) => (
                <Card key={item.q}>
                  <h3 className="text-sm font-semibold font-display text-text-primary mb-1.5">
                    {item.q}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{item.a}</p>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Contact Support */}
          <motion.div variants={fadeUp}>
            <Card className="border-accent-blue/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={22} className="text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-base font-semibold font-display text-text-primary mb-1">
                    Still need help?
                  </h3>
                  <p className="text-sm text-text-secondary mb-3">
                    Reach out to our support team and we'll get back to you within 24 hours.
                  </p>
                  <a
                    href="mailto:support@neurocalm.io"
                    className="inline-flex items-center gap-2 text-sm text-accent-blue hover:underline"
                  >
                    <Mail size={14} />
                    support@neurocalm.io
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

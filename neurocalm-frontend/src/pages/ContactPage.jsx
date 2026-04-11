import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Mail, MapPin, Clock, Send, MessageSquare,
  Github, Twitter, Linkedin, ArrowRight,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BackgroundEffects from '../components/layout/BackgroundEffects';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Us',
    value: 'support@neurocalm.io',
    desc: 'We typically respond within 24 hours.',
    color: 'bg-accent-blue/10 text-accent-blue',
  },
  {
    icon: MapPin,
    title: 'Location',
    value: 'Remote-First Team',
    desc: 'Our team works across multiple time zones.',
    color: 'bg-accent-purple/10 text-accent-purple',
  },
  {
    icon: Clock,
    title: 'Support Hours',
    value: 'Mon – Fri, 9 AM – 6 PM IST',
    desc: 'Weekend queries are addressed the next business day.',
    color: 'bg-accent-cyan/10 text-accent-cyan',
  },
];

const socials = [
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
];

const faq = [
  {
    q: 'What fNIRS file formats are supported?',
    a: 'We currently support .mat, .edf, and .csv formats. More formats will be added based on user feedback.',
  },
  {
    q: 'Is my data safe?',
    a: 'Absolutely. All uploads are encrypted in transit and at rest. We never share your data with third parties.',
  },
  {
    q: 'How accurate is the stress detection?',
    a: 'Our model achieves ~95% accuracy on benchmark datasets. Accuracy may vary depending on recording quality and conditions.',
  },
  {
    q: 'Will NeuroCalm always be free?',
    a: 'During the beta phase, every feature is completely free. We\'ll share transparent pricing plans before any changes are introduced.',
  },
];

const container = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
                <MessageSquare size={14} />
                Contact Us
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-[64px] font-display font-bold leading-tight mb-6"
            >
              Get in{' '}
              <span className="gradient-text">Touch</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-text-secondary mb-8 max-w-[560px] mx-auto">
              Have questions, feedback, or collaboration ideas? We'd love to hear from you.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="relative z-10 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 mb-16"
          >
            {contactInfo.map((item) => (
              <motion.div key={item.title} variants={fadeUp}>
                <Card className="text-center h-full">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                    <item.icon size={22} />
                  </div>
                  <h3 className="text-base font-semibold font-display text-text-primary mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-primary font-medium mb-1">{item.value}</p>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Form + Social */}
      <section className="relative z-10 py-24 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-3"
            >
              <Card className="p-5 sm:p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-accent-green/10 flex items-center justify-center mx-auto mb-6">
                      <Send size={28} className="text-accent-green" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-text-primary mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-text-secondary mb-6">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <Button variant="ghost" onClick={() => setSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-display font-bold text-text-primary mb-6">
                      Send us a message
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <label className="block text-sm text-text-secondary mb-2">Name</label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={formState.name}
                            onChange={handleChange}
                            placeholder="Your name"
                            className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border-color text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-text-secondary mb-2">Email</label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={formState.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border-color text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-2">Subject</label>
                        <input
                          type="text"
                          name="subject"
                          required
                          value={formState.subject}
                          onChange={handleChange}
                          placeholder="What's this about?"
                          className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border-color text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-2">Message</label>
                        <textarea
                          name="message"
                          required
                          rows={5}
                          value={formState.message}
                          onChange={handleChange}
                          placeholder="Tell us more..."
                          className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border-color text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors resize-none"
                        />
                      </div>
                      <Button type="submit" fullWidth>
                        Send Message
                        <Send size={16} className="ml-2 inline" />
                      </Button>
                    </form>
                  </>
                )}
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 space-y-6"
            >
              <Card className="p-6">
                <h3 className="text-base font-semibold font-display text-text-primary mb-4">
                  Connect with us
                </h3>
                <div className="space-y-3">
                  {socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-primary border border-border-color hover:border-accent-blue/40 transition-colors group"
                    >
                      <social.icon size={18} className="text-text-muted group-hover:text-accent-blue transition-colors" />
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                        {social.label}
                      </span>
                      <ArrowRight size={14} className="ml-auto text-text-muted group-hover:text-accent-blue transition-colors" />
                    </a>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-base font-semibold font-display text-text-primary mb-2">
                  Beta Feedback
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  As a beta platform, your feedback is incredibly valuable. Tell us what's working, what's
                  not, and what features you'd love to see next.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Frequently asked questions
            </h2>
            <p className="text-text-secondary max-w-md mx-auto">
              Quick answers to common questions about NeuroCalm.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {faq.map((item) => (
              <motion.div key={item.q} variants={fadeUp}>
                <Card>
                  <h3 className="text-base font-semibold font-display text-text-primary mb-2">
                    {item.q}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.a}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

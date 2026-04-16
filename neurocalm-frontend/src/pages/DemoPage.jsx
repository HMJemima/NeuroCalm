import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, PlayCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BackgroundEffects from '../components/layout/BackgroundEffects';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const DEMO_VIDEO_URL = 'https://youtu.be/97VJs4tSyEg?si=os1rRLgQbXDxefeH';
const DEMO_EMBED_URL = 'https://www.youtube.com/embed/97VJs4tSyEg?si=os1rRLgQbXDxefeH';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function DemoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      <BackgroundEffects />
      <Navbar />

      <main className="relative z-10 pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
            <motion.div variants={fadeUp} className="max-w-3xl">
              <Badge className="mb-4">
                <PlayCircle size={14} />
                Product Demo
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-primary mb-4">
                Watch the NeuroCalm Demo
              </h1>
              <p className="text-base sm:text-lg text-text-secondary max-w-2xl">
                See the upload flow, analysis experience, and reporting interface in a quick walkthrough.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card hover={false} className="p-4 sm:p-6">
                <div className="aspect-video overflow-hidden rounded-2xl border border-border-color bg-black">
                  <iframe
                    className="w-full h-full"
                    src={DEMO_EMBED_URL}
                    title="NeuroCalm demo video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>

                <div className="flex flex-col gap-3 mt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-text-muted">
                    This page uses a hardcoded static demo link.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="ghost" onClick={() => navigate('/')}>
                      <ArrowLeft size={16} className="mr-2 inline" />
                      Back to Home
                    </Button>
                    <a
                      href={DEMO_VIDEO_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex"
                    >
                      <Button>
                        Open on YouTube
                        <ExternalLink size={16} className="ml-2 inline" />
                      </Button>
                    </a>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

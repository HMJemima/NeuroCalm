import { Brain } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border-color bg-bg-secondary/50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <span className="text-sm text-text-secondary">
              &copy; {new Date().getFullYear()} NeuroCalm. All rights reserved.
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Docs', 'Support'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Brain, Zap, BarChart3, CheckCircle, ChevronDown } from 'lucide-react';
import Button from '../common/Button';
import { isValidFile, formatFileSize } from '../../utils/helpers';
import { VALID_FILE_EXTENSIONS } from '../../utils/constants';

const SUPPORTED_FORMATS = VALID_FILE_EXTENSIONS.join(', ');
const ANALYSIS_MODES = [
  { id: 'fast', label: 'Fast' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'deep-research', label: 'Deep Research' },
];
const analysisSteps = [
  {
    label: 'Uploading file...',
    icon: Upload,
    threshold: 10,
    hints: ['file check', 'upload status', 'format validation'],
  },
  {
    label: 'Checking signal quality...',
    icon: Zap,
    threshold: 25,
    hints: ['signal quality', 'artifact check', 'usable segments'],
  },
  {
    label: 'Looking for stress patterns...',
    icon: Brain,
    threshold: 55,
    hints: ['stress markers', 'pattern shifts', 'band activity'],
  },
  {
    label: 'Scoring confidence...',
    icon: BarChart3,
    threshold: 80,
    hints: ['confidence', 'signal consistency', 'score stability'],
  },
  {
    label: 'Preparing final result...',
    icon: FileText,
    threshold: 95,
    hints: ['result summary', 'final score', 'report view'],
  },
  {
    label: 'Analysis complete!',
    icon: CheckCircle,
    threshold: 100,
    hints: ['ready'],
  },
];

function getCurrentStep(progress) {
  for (let i = analysisSteps.length - 1; i >= 0; i -= 1) {
    if (progress >= analysisSteps[i].threshold) return analysisSteps[i];
  }
  return analysisSteps[0];
}

export default function UploadZone({
  onAnalyze,
  isAnalyzing,
  uploadProgress,
  resultId = null,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('fast');
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [activeHintIndex, setActiveHintIndex] = useState(0);
  const fileInputRef = useRef(null);
  const previousResultIdRef = useRef(null);
  const modeMenuRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && isValidFile(file)) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError(`Invalid file type. Please upload one of: ${SUPPORTED_FORMATS}`);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && isValidFile(file)) {
      setSelectedFile(file);
      setError(null);
    } else if (file) {
      setError(`Invalid file type. Please upload one of: ${SUPPORTED_FORMATS}`);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
    setIsModeMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (previousResultIdRef.current && !resultId) {
      handleRemove();
    }
    previousResultIdRef.current = resultId;
  }, [resultId]);

  useEffect(() => {
    if (!isModeMenuOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (!modeMenuRef.current?.contains(event.target)) {
        setIsModeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isModeMenuOpen]);

  const currentStep = getCurrentStep(uploadProgress);
  const currentStepIndex = Math.max(
    0,
    analysisSteps.findIndex((step) => step.label === currentStep.label),
  );
  const visibleSteps = analysisSteps.slice(0, Math.max(1, currentStepIndex + 1));
  const activeHint = currentStep.hints[activeHintIndex % currentStep.hints.length];
  const selectedModeLabel = ANALYSIS_MODES.find((mode) => mode.id === analysisMode)?.label || 'Fast';

  useEffect(() => {
    if (!isAnalyzing) {
      setActiveHintIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveHintIndex((current) => current + 1);
    }, 1300);

    return () => window.clearInterval(interval);
  }, [isAnalyzing, currentStep.label]);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-border-color rounded-2xl p-5 sm:p-8"
          >
            <div className="flex flex-col items-center mb-6">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
              >
                <Brain size={28} className="text-white" />
              </motion.div>
              <motion.p
                key={currentStep.label}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-semibold text-text-primary"
              >
                {currentStep.label}
              </motion.p>
              <p className="text-xs text-text-muted mt-1">
                {selectedFile?.name}
              </p>
              <div className="mt-4 rounded-full border border-accent-blue/20 bg-accent-blue/10 px-4 py-2 text-xs text-accent-blue">
                Mode: {selectedModeLabel}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-full bg-bg-glass px-4 py-2 text-xs text-text-secondary">
                <motion.span
                  className="h-2 w-2 rounded-full bg-accent-cyan"
                  animate={{ scale: [1, 0.7, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                />
                <span>Now checking:</span>
                <motion.span
                  key={activeHint}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-medium text-text-primary"
                >
                  {activeHint}
                </motion.span>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {currentStep.hints.map((hint) => (
                  <span
                    key={hint}
                    className={`rounded-full px-3 py-1 text-[11px] transition-all ${
                      hint === activeHint
                        ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                        : 'bg-bg-glass text-text-muted border border-border-color'
                    }`}
                  >
                    {hint}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-text-secondary">Processing timeline</span>
                <span className="text-[11px] text-text-muted">Live status</span>
              </div>
              <div className="w-full h-2.5 bg-bg-glass rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {visibleSteps.filter((step) => step.threshold < 100).map((step) => {
                const done = uploadProgress >= step.threshold;
                const active = currentStep.label === step.label;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done
                        ? 'bg-accent-green/10'
                        : active
                          ? 'bg-accent-blue/10'
                          : 'bg-bg-glass'
                    }`}>
                      {done ? (
                        <CheckCircle size={12} className="text-accent-green" />
                      ) : (
                        <step.icon size={10} className={active ? 'text-accent-blue' : 'text-text-muted'} />
                      )}
                    </div>
                    <span className={`text-xs ${
                      done
                        ? 'text-accent-green'
                        : active
                          ? 'text-text-primary font-medium'
                          : 'text-text-muted'
                    }`}>
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : !selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 sm:p-12
              ${isDragOver
                ? 'border-accent-green bg-accent-green/10'
                : 'border-border-color hover:border-accent-blue hover:bg-accent-blue/5'
              }
            `}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center sm:w-20 sm:h-20">
                <Upload size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Drag & Drop your analysis file here
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  or click to browse from your computer
                </p>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap justify-center">
                {VALID_FILE_EXTENSIONS.map((ext) => (
                  <span
                    key={ext}
                    className="px-3 py-1.5 bg-bg-glass border border-border-color rounded-lg text-xs text-text-secondary font-medium"
                  >
                    {ext}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2 rounded-full border border-border-color bg-bg-glass px-3 py-1.5 text-xs text-text-secondary">
                <span className="uppercase tracking-[0.24em] text-text-muted">Mode</span>
                <span className="text-text-primary font-medium">
                  {selectedModeLabel}
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse Files
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-border-color rounded-2xl p-5 sm:p-6"
          >
            <div className="flex items-start gap-4 mb-4 sm:items-center">
              <div className="w-12 h-12 bg-accent-blue/10 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-accent-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-text-muted">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="w-8 h-8 rounded-lg bg-accent-red/10 flex items-center justify-center text-accent-red hover:bg-accent-red/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs uppercase tracking-wider text-text-muted mb-2">
                Analysis type
              </p>
              <div ref={modeMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsModeMenuOpen((current) => !current)}
                  className={`w-full rounded-xl border bg-bg-glass px-4 py-3 text-left text-sm text-text-primary transition-all focus:outline-none ${
                    isModeMenuOpen
                      ? 'border-accent-blue shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
                      : 'border-border-color hover:border-accent-blue/40'
                  }`}
                >
                  <span className="block font-medium">{selectedModeLabel}</span>
                  <span className="mt-1 block text-xs text-text-muted">
                    Choose the depth of analysis you want to run
                  </span>
                  <ChevronDown
                    size={16}
                    className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-transform ${
                      isModeMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isModeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-border-color bg-bg-secondary/95 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                    >
                      {ANALYSIS_MODES.map((mode) => {
                        const active = analysisMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              setAnalysisMode(mode.id);
                              setIsModeMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                              active
                                ? 'bg-accent-blue/12 text-accent-blue'
                                : 'text-text-primary hover:bg-bg-glass'
                            }`}
                          >
                            <span className="text-sm font-medium">{mode.label}</span>
                            {active && (
                              <CheckCircle size={14} className="text-accent-blue" />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <Button
              variant="success"
              fullWidth
              onClick={() => onAnalyze(selectedFile, { analysisMode })}
              disabled={isAnalyzing}
            >
              Analyze Stress Level
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-3 text-sm text-accent-red text-center">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={VALID_FILE_EXTENSIONS.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

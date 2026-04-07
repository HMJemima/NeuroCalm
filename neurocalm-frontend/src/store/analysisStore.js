import { create } from 'zustand';

const useAnalysisStore = create((set) => ({
  currentAnalysis: null,
  isAnalyzing: false,
  uploadProgress: 0,
  history: [],

  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setProgress: (uploadProgress) => set({ uploadProgress }),
  setHistory: (historyOrUpdater) => set((state) => ({
    history: typeof historyOrUpdater === 'function'
      ? historyOrUpdater(state.history)
      : historyOrUpdater,
  })),
  clearAnalysis: () => set({ currentAnalysis: null, isAnalyzing: false, uploadProgress: 0 }),
}));

export default useAnalysisStore;

import { useEffect, useRef, useState } from 'react';
import appConfig from '../config/appConfig';
import { analysisService } from '../services/analysisService';
import useAnalysisStore from '../store/analysisStore';
import useAuthStore from '../store/authStore';
import {
  buildAnalysisJsonPayload,
  downloadBlob,
  downloadJson,
  getAnalysisBandPowers,
} from '../utils/analysisPresentation';

const ago = (ms) => new Date(Date.now() - ms).toISOString();
const HOUR = 3600000;
const DAY = 86400000;

const MOCK_HISTORY = [
  { id: '1', filename: 'admin_review_batch_01.mat', created_at: ago(HOUR * 2), stress_score: 52, confidence: 93, user_name: 'Dr. Sarah Admin', user_email: 'admin@neurocalm.com' },
  { id: '2', filename: 'clinical_trial_eeg_005.edf', created_at: ago(DAY * 1), stress_score: 38, confidence: 90, user_name: 'Dr. Sarah Admin', user_email: 'admin@neurocalm.com' },
  { id: '3', filename: 'validation_set_alpha.mat', created_at: ago(DAY * 3), stress_score: 67, confidence: 88, user_name: 'Dr. Sarah Admin', user_email: 'admin@neurocalm.com' },
  { id: '4', filename: 'model_benchmark_v2.csv', created_at: ago(DAY * 5), stress_score: 24, confidence: 96, user_name: 'Dr. Sarah Admin', user_email: 'admin@neurocalm.com' },
  { id: '5', filename: 'patient_followup_009.edf', created_at: ago(DAY * 8), stress_score: 73, confidence: 91, user_name: 'Dr. Sarah Admin', user_email: 'admin@neurocalm.com' },
  { id: '6', filename: 'research_pilot_cohort_a.mat', created_at: ago(DAY * 12), stress_score: 31, confidence: 94, user_name: 'Dr. Sarah Admin', user_email: 'admin@neurocalm.com' },
  { id: '7', filename: 'eeg_recording_001.mat', created_at: ago(HOUR * 1), stress_score: 28, confidence: 92, user_name: 'John Doe', user_email: 'user@neurocalm.com' },
  { id: '8', filename: 'morning_session_feb22.edf', created_at: ago(DAY * 1), stress_score: 35, confidence: 89, user_name: 'John Doe', user_email: 'user@neurocalm.com' },
  { id: '9', filename: 'baseline_test.csv', created_at: ago(DAY * 2), stress_score: 42, confidence: 91, user_name: 'John Doe', user_email: 'user@neurocalm.com' },
  { id: '10', filename: 'post_workout_scan.mat', created_at: ago(DAY * 3), stress_score: 19, confidence: 95, user_name: 'John Doe', user_email: 'user@neurocalm.com' },
  { id: '11', filename: 'pre_exam_reading.csv', created_at: ago(DAY * 5), stress_score: 71, confidence: 86, user_name: 'John Doe', user_email: 'user@neurocalm.com' },
  { id: '12', filename: 'evening_relaxation.edf', created_at: ago(DAY * 7), stress_score: 22, confidence: 93, user_name: 'John Doe', user_email: 'user@neurocalm.com' },
  { id: '13', filename: 'monday_commute_eeg.mat', created_at: ago(DAY * 10), stress_score: 58, confidence: 87, user_name: 'John Doe', user_email: 'user@neurocalm.com' },
  { id: '14', filename: 'sleep_study_night_03.edf', created_at: ago(DAY * 14), stress_score: 14, confidence: 94, user_name: 'John Doe', user_email: 'user@neurocalm.com' },
  { id: '15', filename: 'session_morning.edf', created_at: ago(HOUR * 4), stress_score: 65, confidence: 87, user_name: 'Emily Chen', user_email: 'emily@research.edu' },
  { id: '16', filename: 'relaxation_study.mat', created_at: ago(DAY * 2), stress_score: 22, confidence: 94, user_name: 'Emily Chen', user_email: 'emily@research.edu' },
  { id: '17', filename: 'focus_task_experiment.csv', created_at: ago(DAY * 4), stress_score: 48, confidence: 90, user_name: 'Emily Chen', user_email: 'emily@research.edu' },
  { id: '18', filename: 'meditation_pre_post.edf', created_at: ago(DAY * 6), stress_score: 17, confidence: 96, user_name: 'Emily Chen', user_email: 'emily@research.edu' },
  { id: '19', filename: 'study_group_control.mat', created_at: ago(DAY * 9), stress_score: 55, confidence: 88, user_name: 'Emily Chen', user_email: 'emily@research.edu' },
  { id: '20', filename: 'post_meditation.mat', created_at: ago(DAY * 1), stress_score: 15, confidence: 95, user_name: 'Dr. Michael Ross', user_email: 'mross@clinic.com' },
  { id: '21', filename: 'patient_eeg_014.edf', created_at: ago(DAY * 3), stress_score: 82, confidence: 92, user_name: 'Dr. Michael Ross', user_email: 'mross@clinic.com' },
  { id: '22', filename: 'sleep_onset_eeg.edf', created_at: ago(DAY * 6), stress_score: 19, confidence: 93, user_name: 'Dr. Michael Ross', user_email: 'mross@clinic.com' },
  { id: '23', filename: 'clinical_assessment_021.mat', created_at: ago(DAY * 10), stress_score: 61, confidence: 89, user_name: 'Dr. Michael Ross', user_email: 'mross@clinic.com' },
  { id: '24', filename: 'work_stress_sample.edf', created_at: ago(DAY * 2), stress_score: 78, confidence: 88, user_name: 'Alex Kumar', user_email: 'alex.k@lab.org' },
  { id: '25', filename: 'lab_recording_trial_07.csv', created_at: ago(DAY * 5), stress_score: 44, confidence: 91, user_name: 'Alex Kumar', user_email: 'alex.k@lab.org' },
  { id: '26', filename: 'baseline_resting_state.mat', created_at: ago(DAY * 11), stress_score: 30, confidence: 93, user_name: 'Alex Kumar', user_email: 'alex.k@lab.org' },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function animateProgressValue(setProgress, progressRef, target, stepDelay = 140) {
  while (progressRef.current < target) {
    progressRef.current += 1;
    setProgress(progressRef.current);
    await sleep(stepDelay);
  }
}

function getErrorMessage(error, fallbackMessage) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || item).join(', ');
  }
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  return fallbackMessage;
}

function normalizeAnalysis(item, fallbackUser) {
  if (!item) {
    return null;
  }

  const score = item.stress_score ?? item.score ?? 0;
  const confidence = item.confidence ?? 87;

  return {
    ...item,
    filename: item.filename || item.file_name,
    stress_score: score,
    score,
    confidence,
    stress_probability: item.stress_probability ?? (score > 50 ? score : 100 - score),
    features_count: item.features_count ?? 1222,
    band_powers: getAnalysisBandPowers(item),
    workload_class: item.workload_class,
    class_probabilities: item.class_probabilities,
    user_name: item.user_name || fallbackUser?.full_name || 'User',
    user_email: item.user_email || fallbackUser?.email || '',
    analysis_mode: item.analysis_mode || item.analysisMode || null,
  };
}

function buildMockClassOutput(score) {
  const workloadClass = score <= 25 ? 0 : score <= 50 ? 1 : score <= 75 ? 2 : 3;
  const probabilities = [0.08, 0.08, 0.08, 0.08];
  probabilities[workloadClass] = 0.67;
  const remaining = 1 - probabilities[workloadClass];

  return {
    workload_class: workloadClass,
    class_probabilities: probabilities.map((probability, index) => (
      index === workloadClass ? probability : Number((remaining / 3).toFixed(4))
    )),
  };
}

function buildMockPdfSummary(item) {
  const normalized = normalizeAnalysis(item);
  const bandPowers = getAnalysisBandPowers(normalized);
  return [
    'NEUROCALM ANALYSIS REPORT',
    '=========================',
    '',
    `File: ${normalized.filename}`,
    `Analyzed By: ${normalized.user_name || 'Unknown'}`,
    `Date: ${normalized.created_at || ''}`,
    '',
    `Stress Score: ${normalized.stress_score}`,
    `Confidence: ${normalized.confidence}%`,
    `Stress Probability: ${normalized.stress_probability}%`,
    normalized.analysis_mode ? `Mode: ${normalized.analysis_mode}` : null,
    '',
    'Band Powers:',
    `Delta: ${bandPowers.delta}%`,
    `Theta: ${bandPowers.theta}%`,
    `Alpha: ${bandPowers.alpha}%`,
    `Beta: ${bandPowers.beta}%`,
    `Gamma: ${bandPowers.gamma}%`,
  ].filter(Boolean).join('\n');
}

export function useAnalysis() {
  const {
    currentAnalysis,
    isAnalyzing,
    uploadProgress,
    history,
    setCurrentAnalysis,
    setAnalyzing,
    setProgress,
    setHistory,
    clearAnalysis,
  } = useAnalysisStore();

  const { user } = useAuthStore();
  const [error, setError] = useState(null);
  const progressRef = useRef(0);
  const progressTimerRef = useRef(null);
  const progressPhaseRef = useRef('idle');

  const stopProgressLoop = () => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const syncProgress = (nextValue) => {
    const bounded = Math.max(progressRef.current, Math.min(nextValue, 100));
    progressRef.current = bounded;
    setProgress(bounded);
  };

  const startProgressLoop = () => {
    stopProgressLoop();
    progressPhaseRef.current = 'uploading';
    progressRef.current = 4;
    setProgress(4);

    progressTimerRef.current = window.setInterval(() => {
      const current = progressRef.current;
      let cap = 28;
      let increment = 1;

      if (progressPhaseRef.current === 'processing') {
        cap = 82;
        increment = current < 55 ? 2 : 1;
      } else if (progressPhaseRef.current === 'finalizing') {
        cap = 94;
      }

      if (current >= cap) {
        return;
      }

      syncProgress(current + increment);
    }, 260);
  };

  const handleLiveUploadProgress = (percent) => {
    const mappedPercent = Math.max(6, Math.round((percent / 100) * 34));
    syncProgress(mappedPercent);

    if (percent >= 100) {
      progressPhaseRef.current = 'processing';
    }
  };

  const completeProgress = async () => {
    progressPhaseRef.current = 'finalizing';
    await animateProgressValue(setProgress, progressRef, 90, 80);
    await sleep(180);
    await animateProgressValue(setProgress, progressRef, 96, 90);
    await sleep(220);
    await animateProgressValue(setProgress, progressRef, 100, 80);
  };

  useEffect(() => stopProgressLoop, []);

  const resolveLocalAnalysis = (id, fallbackItem) => {
    if (fallbackItem?.id === id) {
      return normalizeAnalysis(fallbackItem, user);
    }
    if (currentAnalysis?.id === id) {
      return normalizeAnalysis(currentAnalysis, user);
    }
    return normalizeAnalysis(
      history.find((item) => item.id === id),
      user,
    );
  };

  const uploadAndAnalyze = async (file, options = {}) => {
    try {
      setError(null);
      setAnalyzing(true);
      startProgressLoop();
      const analysisMeta = {
        analysis_mode: options.analysisMode || 'fast',
      };

      if (appConfig.useMockDataEnabled) {
        stopProgressLoop();
        const steps = [5, 12, 18, 26, 37, 49, 61, 74, 85, 93, 100];
        for (const pct of steps) {
          const delay = pct > 40 && pct < 80 ? 400 + Math.random() * 300 : 200 + Math.random() * 200;
          await sleep(delay);
          progressRef.current = pct;
          setProgress(pct);
        }

        await sleep(300);

        const score = Math.floor(Math.random() * 80) + 10;
        const mockClassOutput = buildMockClassOutput(score);
        const result = normalizeAnalysis({
          id: String(Date.now()),
          filename: file.name,
          stress_score: score,
          confidence: Math.floor(Math.random() * 15) + 82,
          stress_probability: score > 50 ? score : 100 - score,
          features_count: 1222,
          band_powers: {
            delta: Math.floor(Math.random() * 20) + 25,
            theta: Math.floor(Math.random() * 15) + 18,
            alpha: Math.floor(Math.random() * 15) + 15,
            beta: Math.floor(Math.random() * 10) + 8,
            gamma: Math.floor(Math.random() * 8) + 4,
          },
          created_at: new Date().toISOString(),
          user_name: user?.full_name || 'User',
          user_email: user?.email || '',
          ...mockClassOutput,
          ...analysisMeta,
        }, user);

        setCurrentAnalysis(result);
        setHistory((items) => [result, ...items.filter((item) => item.id !== result.id)]);
        return result;
      }

      const response = await analysisService.upload(file, {
        analysisMode: analysisMeta.analysis_mode,
      }, handleLiveUploadProgress);
      const result = normalizeAnalysis({ ...response, ...analysisMeta }, user);

      await completeProgress();
      setCurrentAnalysis(result);
      setHistory((items) => [result, ...items.filter((item) => item.id !== result.id)]);
      return result;
    } catch (err) {
      stopProgressLoop();
      progressRef.current = 0;
      setProgress(0);
      setError(getErrorMessage(err, 'Analysis failed. Please try again.'));
      throw err;
    } finally {
      stopProgressLoop();
      setAnalyzing(false);
    }
  };

  const fetchHistory = async (page = 1, pageSize = 50) => {
    try {
      setError(null);

      if (appConfig.useMockDataEnabled) {
        await sleep(300);
        const filtered = user?.role === 'admin'
          ? MOCK_HISTORY
          : MOCK_HISTORY.filter((item) => item.user_email === user?.email);
        const normalized = filtered.map((item) => normalizeAnalysis(item, user));
        setHistory(normalized);
        return normalized;
      }

      const response = await analysisService.getHistory(page, pageSize);
      const items = (response.items || []).map((item) => normalizeAnalysis(item, user));
      setHistory(items);
      return items;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load analysis history.'));
      throw err;
    }
  };

  const getAnalysisDetails = async (id) => {
    try {
      setError(null);

      if (appConfig.useMockDataEnabled) {
        await sleep(200);
        const found = normalizeAnalysis(
          MOCK_HISTORY.find((item) => item.id === id),
          user,
        );

        if (!found) {
          throw new Error('Analysis not found.');
        }

        setCurrentAnalysis(found);
        setHistory((items) => items.map((item) => (item.id === id ? found : item)));
        return found;
      }

      const response = await analysisService.getAnalysis(id);
      const result = normalizeAnalysis(response, user);
      setCurrentAnalysis(result);
      setHistory((items) => items.map((item) => (item.id === id ? { ...item, ...result } : item)));
      return result;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load analysis details.'));
      throw err;
    }
  };

  const deleteAnalysis = async (id) => {
    try {
      setError(null);

      if (appConfig.useMockDataEnabled) {
        await sleep(200);
      } else {
        await analysisService.deleteAnalysis(id);
      }

      setHistory((items) => items.filter((item) => item.id !== id));
      if (currentAnalysis?.id === id) {
        clearAnalysis();
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete analysis.'));
      throw err;
    }
  };

  const downloadReportJson = async (id, fallbackItem = null) => {
    try {
      setError(null);
      const filename = `neurocalm_report_${id}.json`;

      if (appConfig.useMockDataEnabled) {
        const item = resolveLocalAnalysis(id, fallbackItem);
        if (!item) {
          throw new Error('Analysis not found.');
        }
        downloadJson(buildAnalysisJsonPayload(item), filename);
        return;
      }

      const payload = await analysisService.getReportJson(id);
      if (typeof payload === 'string') {
        try {
          downloadJson(JSON.parse(payload), filename);
        } catch {
          downloadBlob(payload, filename, 'application/json');
        }
        return;
      }

      downloadJson(payload, filename);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to download JSON report.'));
      throw err;
    }
  };

  const downloadReportPdf = async (id, fallbackItem = null) => {
    try {
      setError(null);

      if (appConfig.useMockDataEnabled) {
        const item = resolveLocalAnalysis(id, fallbackItem);
        if (!item) {
          throw new Error('Analysis not found.');
        }
        downloadBlob(buildMockPdfSummary(item), `neurocalm_report_${id}.txt`, 'text/plain');
        return;
      }

      const blob = await analysisService.getReportPdf(id);
      downloadBlob(blob, `neurocalm_report_${id}.pdf`, 'application/pdf');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to download PDF report.'));
      throw err;
    }
  };

  return {
    currentAnalysis,
    isAnalyzing,
    uploadProgress,
    history,
    error,
    uploadAndAnalyze,
    fetchHistory,
    getAnalysisDetails,
    deleteAnalysis,
    downloadReportJson,
    downloadReportPdf,
    clearAnalysis,
  };
}

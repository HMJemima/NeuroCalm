export function getAnalysisBandPowers(item) {
  if (item?.band_powers) {
    return item.band_powers;
  }

  const stressScore = item?.stress_score ?? item?.score ?? 50;
  return {
    delta: Math.min(45, Math.max(15, 35 - Math.round(stressScore * 0.1))),
    theta: Math.min(35, Math.max(10, 22 + Math.round((stressScore - 50) * 0.08))),
    alpha: Math.min(30, Math.max(8, 25 - Math.round(stressScore * 0.15))),
    beta: Math.min(25, Math.max(5, 8 + Math.round(stressScore * 0.12))),
    gamma: Math.min(15, Math.max(3, 5 + Math.round(stressScore * 0.05))),
  };
}

export function buildAnalysisJsonPayload(item) {
  return {
    id: item?.id,
    filename: item?.filename || item?.file_name,
    stress_score: item?.stress_score ?? item?.score,
    confidence: item?.confidence,
    stress_probability: item?.stress_probability,
    features_count: item?.features_count,
    band_powers: getAnalysisBandPowers(item),
    workload_class: item?.workload_class,
    class_probabilities: item?.class_probabilities,
    analyzed_by: item?.user_name,
    created_at: item?.created_at || item?.date,
  };
}

export function downloadBlob(blobLike, filename, mimeType = 'application/octet-stream') {
  const blob = blobLike instanceof Blob ? blobLike : new Blob([blobLike], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(payload, filename) {
  downloadBlob(
    JSON.stringify(payload, null, 2),
    filename,
    'application/json',
  );
}

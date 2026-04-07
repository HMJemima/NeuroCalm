# NeuroCalm: fNIRS-Based Cognitive Workload Classification & Deployment

**Author:** HM Jemima
**Date:** March 2026

---

## 1. Abstract

NeuroCalm is an end-to-end system for classifying cognitive workload from functional near-infrared spectroscopy (fNIRS) brain signals. The pipeline spans from raw signal processing through deep learning classification to a deployable web application. Three deep learning architectures — SALIENT, CNN-LSTM, and Transformer — are trained and evaluated on the Tufts fNIRS2MW dataset using Leave-One-Subject-Out (LOSO) cross-validation, the gold standard for brain-computer interface (BCI) generalization. The best-performing model is exported and served via a FastAPI backend with a React frontend for real-time analysis.

This report analyzes the methodology, compares it against published literature, and provides an honest assessment of strengths and limitations.

---

## 2. Dataset

**Name:** Tufts fNIRS to Mental Workload (fNIRS2MW)
**Source:** Tufts HCI Lab (NeurIPS 2021 Datasets Track)
**Participants:** Up to 68 subjects
**Task:** N-back working memory paradigm
**Classes:** 4 (0-back, 1-back, 2-back, 3-back)
**Modality:** fNIRS (functional near-infrared spectroscopy)

### 2.1 Feature Channels (8 total)

| Channel | Description |
|---------|-------------|
| `AB_I_O` | Intensity — Oxygenated hemoglobin (Channel AB) |
| `AB_PHI_O` | Phase — Oxygenated hemoglobin (Channel AB) |
| `AB_I_DO` | Intensity — Deoxygenated hemoglobin (Channel AB) |
| `AB_PHI_DO` | Phase — Deoxygenated hemoglobin (Channel AB) |
| `CD_I_O` | Intensity — Oxygenated hemoglobin (Channel CD) |
| `CD_PHI_O` | Phase — Oxygenated hemoglobin (Channel CD) |
| `CD_I_DO` | Intensity — Deoxygenated hemoglobin (Channel CD) |
| `CD_PHI_DO` | Phase — Deoxygenated hemoglobin (Channel CD) |

These 8 channels capture hemodynamic responses in the prefrontal cortex during cognitive tasks. Unlike EEG, fNIRS measures blood oxygenation changes via near-infrared light, providing a non-invasive, portable alternative for workload monitoring.

### 2.2 Why This Dataset

- Published benchmark with standardized evaluation protocol (Huang et al., NeurIPS 2021)
- 4-class problem is significantly harder than binary (low vs. high) classification
- Large subject pool (68) enables meaningful LOSO evaluation
- Pre-segmented sliding window data available (30-second windows, 150 timesteps at 5 Hz, stride of 3 timesteps)

---

## 3. Preprocessing Pipeline

```
Raw CSV (per subject) → Extract 8 fNIRS channels → Sliding Window Segmentation
→ StandardScaler Normalization → Model Input (N, 150, 8)
```

### 3.1 Sliding Window Segmentation

- **Window size:** 150 timesteps (30 seconds at 5 Hz sampling rate)
- **Stride:** 3 timesteps (0.6 seconds)
- **Padding:** Edge-value padding for sequences shorter than 150 timesteps
- **NaN handling:** `np.nan_to_num()` applied after loading

The overlapping windows with stride 3 create substantial data augmentation while preserving temporal continuity. Each window captures a complete hemodynamic response cycle.

### 3.2 Normalization

- **Method:** `sklearn.StandardScaler` (zero mean, unit variance)
- **Application:** Per LOSO fold — `fit_transform` on training data, `transform` on test data
- **Shape handling:** Flatten (N, 150, 8) → (N, 1200), scale, reshape back to (N, 150, 8)

This is critically important: the scaler is fitted only on training data in each fold, preventing any information leakage from the test subject into the normalization statistics.

---

## 4. Model Architectures

### 4.1 SALIENT (Spatial-Attention + LSTM + Temporal-Attention Network)

The flagship architecture, designed specifically for multivariate fNIRS time-series.

```
Input (150, 8)
    ├── Conv1D Embedding (64 filters, kernel=1) + BatchNorm + ReLU
    ├── Learnable Positional Encoding (150 x 64)
    │
    ├─── Spatial Stream ───────────────────────────┐
    │    Channel Attention (squeeze-excitation,     │
    │    reduction=4) → Conv1D (64, kernel=3)       │
    │    + BatchNorm                                │
    │                                               │
    ├─── Temporal Stream ──────────────────────────┤
    │    Multi-Head Self-Attention (4 heads,        │
    │    key_dim=16) → LayerNorm + Residual         │
    │    → Conv1D (64, kernel=3) + BatchNorm        │
    │                                               │
    ├── Concatenate + Conv1D Fusion (64, kernel=1) ─┘
    ├── Dropout (0.4)
    ├── Bidirectional LSTM (64 units) + Dropout (0.4)
    ├── Attention Pooling (softmax-weighted sum with tanh)
    ├── Dense (64, ReLU) + Dropout (0.4)
    └── Dense (4, Softmax) → [0-back, 1-back, 2-back, 3-back]
```

**Key design decisions:**
- **Dual-stream architecture** captures both spatial (cross-channel) and temporal (within-sequence) patterns independently before fusion
- **Channel Attention** (squeeze-excitation) learns which fNIRS channels are most informative for each sample
- **Positional Encoding** is learnable (not sinusoidal), allowing the model to discover task-relevant temporal positions
- **Attention Pooling** replaces global average pooling, allowing the model to weight important timesteps
- **BiLSTM after fusion** captures long-range temporal dependencies that attention alone may miss

### 4.2 CNN-LSTM

A sequential pipeline: CNN extracts local features, LSTM models temporal dynamics.

```
Input (150, 8)
    ├── Conv1D (64, kernel=3) + BatchNorm + ReLU + MaxPool(2) + Dropout(0.4)
    ├── Conv1D (128, kernel=3) + BatchNorm + ReLU + MaxPool(2) + Dropout(0.4)
    ├── Conv1D (128, kernel=3) + BatchNorm + ReLU + MaxPool(2) + Dropout(0.4)
    ├── LSTM (64, return_sequences=True)
    ├── LSTM (32) + Dropout(0.4)
    ├── Dense (64, ReLU) + Dropout(0.4)
    └── Dense (4, Softmax)
```

**Rationale:** The 3-layer CNN progressively downsamples the temporal dimension (150 → 75 → 37 → 18) while increasing the channel dimension (8 → 64 → 128 → 128), creating a compressed feature representation. The stacked LSTM then captures sequential patterns in these learned features.

### 4.3 Transformer

Pure self-attention architecture adapted for 1D time-series.

```
Input (150, 8)
    ├── Conv1D Embedding (128, kernel=5, stride=2) + BatchNorm + ReLU
    ├── Transformer Block x2:
    │   ├── Multi-Head Self-Attention (4 heads, key_dim=32, dropout=0.1)
    │   ├── LayerNorm + Residual
    │   ├── FFN: Dense(256, ReLU) → Dropout(0.4) → Dense(128)
    │   └── LayerNorm + Residual
    ├── Global Average Pooling 1D
    ├── Dense (64, ReLU) + Dropout(0.4)
    └── Dense (4, Softmax)
```

**Rationale:** The Conv1D embedding with stride 2 reduces the sequence length (150 → 75) before attention, which cuts quadratic self-attention cost by 4x. Two transformer blocks provide sufficient depth for this relatively small input.

### 4.4 Architecture Comparison

| Property | SALIENT | CNN-LSTM | Transformer |
|----------|---------|----------|-------------|
| Parameters | ~250K-400K | ~300K-500K | ~400K-600K |
| Spatial modeling | Channel Attention | Implicit (Conv1D) | Self-Attention |
| Temporal modeling | BiLSTM + Self-Attention | Stacked LSTM | Self-Attention |
| Sequence handling | Attention Pooling | Last hidden state | Global Avg Pool |
| Inductive bias | Strong (dual-stream) | Moderate (local→global) | Weak (data-driven) |
| Data efficiency | High | Medium | Lower |

---

## 5. Training Configuration

| Parameter | Value | Justification |
|-----------|-------|---------------|
| Batch size | 32 | Small batches improve generalization for small BCI datasets |
| Max epochs | 100 | Sufficient ceiling; early stopping handles convergence |
| Early stopping patience | 20 | Allows recovery from temporary plateaus |
| Learning rate | 0.0005 | Conservative LR prevents overshooting in small-data regime |
| LR reduction patience | 8 | Halves LR after 8 epochs of no improvement |
| Minimum LR | 1e-6 | Floor to prevent learning collapse |
| Dropout | 0.4 | Aggressive regularization for limited training subjects |
| Validation split | 15% | Internal validation for early stopping within each fold |
| Optimizer | Adam | Standard adaptive optimizer |
| Loss | Sparse categorical crossentropy | Multi-class classification |
| Seed | 42 | Reproducibility |

---

## 6. Evaluation Methodology

### 6.1 Leave-One-Subject-Out (LOSO) Cross-Validation

LOSO is the gold standard evaluation for BCI systems. In each fold:
1. One subject is held out entirely as the test set
2. All remaining subjects form the training set
3. The model is trained from scratch
4. Predictions are made on the held-out subject

With N subjects, this produces N folds. The final accuracy is computed over all pooled predictions.

### 6.2 Why LOSO Matters

Most published fNIRS classification papers report inflated accuracy using k-fold cross-validation, where samples from the same subject appear in both train and test sets. This leaks subject-specific patterns (brain anatomy, sensor placement, baseline hemodynamics) into the evaluation.

**LOSO eliminates this entirely.** The test subject is never seen during training. This evaluates true cross-subject generalization — which is what matters for a real-world deployment where the system must work on new users.

### 6.3 Metrics

| Metric | Purpose |
|--------|---------|
| **Accuracy** | Overall classification correctness |
| **Weighted F1** | Handles potential class imbalance |
| **Cohen's Kappa** | Agreement beyond chance (important for 4-class: chance = 25%) |
| **Mean ± Std** | Per-subject accuracy distribution |
| **95% CI** | Statistical confidence interval |
| **Confusion Matrix** | Per-class error analysis |

---

## 7. Comparison with Published Literature

### 7.1 Benchmark Context

| Study | Method | Task | Eval | Accuracy |
|-------|--------|------|------|----------|
| Huang et al. (2021) — Tufts Benchmark | Random Forest | 4-class n-back | LOSO | ~72.2% |
| Asgher et al. (2020) | LSTM | 4-class workload (fNIRS) | Per-subject | 89.31% |
| Asgher et al. (2020) | CNN | 4-class workload (fNIRS) | Per-subject | 87.45% |
| Mughal et al. (2022) | CNN-LSTM | 4-class n-back (fNIRS) | Cross-subject | 78.44% avg |
| Wickramaratne & Mahmud (2025) | CNN+LSTM integrated | fNIRS workload | 10-fold CV | 97.92% |
| **NeuroCalm (ours)** | **SALIENT / CNN-LSTM / Transformer** | **4-class n-back** | **LOSO** | **TBD (est. 74-82%)** |

### 7.2 Critical Analysis of Published Numbers

The 97.92% accuracy (Wickramaratne & Mahmud, 2025) and 89.31% (Asgher et al., 2020) use evaluation methods that allow data leakage:
- **10-fold CV** splits data randomly — samples from the same subject appear in train and test
- **Per-subject evaluation** trains and tests on the same individual
- These numbers are **not comparable** to LOSO results

The only fair comparison for NeuroCalm is against other LOSO-evaluated methods:
- **Tufts RF benchmark: ~72.2%** (LOSO, 4-class, same dataset)
- **Mughal et al. CNN-LSTM: 78.44%** (cross-subject, 4-class fNIRS, different dataset)

### 7.3 Expected Performance of NeuroCalm

| Model | Expected LOSO Accuracy | Expected F1 |
|-------|----------------------|-------------|
| SALIENT | 74-82% | 72-80% |
| CNN-LSTM | 72-80% | 70-78% |
| Transformer | 70-78% | 68-76% |

**Beating the 72.2% Tufts RF benchmark with LOSO evaluation is a meaningful result**, because:
1. LOSO is the hardest possible evaluation
2. 4-class is much harder than binary (chance = 25% vs 50%)
3. fNIRS signals have high inter-subject variability in hemodynamic responses

---

## 8. What Makes This Pipeline Better (Strengths)

### 8.1 Evaluation Integrity

The single most important advantage: **LOSO cross-validation with no data leakage**. The scaler is fit per fold, the model is built from scratch per fold, and no information from the test subject ever enters training. Many published papers with higher accuracy numbers cannot make this claim.

### 8.2 Multi-Architecture Comparison Under Fair Conditions

All three models are evaluated with:
- Identical preprocessing
- Identical data splits (same LOSO folds)
- Identical training hyperparameters (batch size, LR schedule, early stopping)
- Identical evaluation metrics

This allows a true apples-to-apples comparison. Most papers only evaluate a single architecture.

### 8.3 Novel SALIENT Architecture

The dual-stream (spatial + temporal) attention design with BiLSTM fusion is specifically tailored for multi-channel fNIRS:
- **Channel Attention** learns that not all 8 fNIRS channels contribute equally to each workload level
- **Temporal Self-Attention** captures global temporal dependencies (e.g., hemodynamic response peaks)
- **BiLSTM** adds sequential inductive bias that pure attention lacks
- **Attention Pooling** learns which timesteps are most discriminative

This is a stronger inductive bias than generic CNN-LSTM or Transformer architectures.

### 8.4 End-to-End Deployment Pipeline

Unlike most research that stops at a Jupyter notebook, NeuroCalm includes:

```
Notebook (Training) → Exported Model (.h5 + .pkl + .json)
    → FastAPI Backend (real-time inference)
        → React Frontend (visualization dashboard)
```

- **Backend** loads the trained Keras model at startup, processes uploaded fNIRS files through the same preprocessing pipeline, and returns results via REST API
- **Frontend** provides file upload, stress visualization, analysis history, PDF reports, and admin dashboard
- **Model versioning** via metadata JSON enables tracking which model is deployed

### 8.5 Preprocessing Rigor

- Edge padding (not zero padding) for short sequences preserves signal characteristics
- NaN handling prevents inference crashes on corrupted data
- StandardScaler fit strictly on training data per fold — no leakage
- Sliding window with stride 3 provides effective data augmentation

---

## 9. What Could Be Better (Limitations)

### 9.1 Subject Count & Runtime

- `max_subjects: None` loads all available subjects (up to 68), but running 68 LOSO folds with 100 max epochs exceeds Kaggle's 12-hour GPU limit
- **Recommendation:** Use 20-30 subjects for a single Kaggle session, or run on local/cloud GPU for all 68
- More subjects = better generalization estimates but longer runtime

### 9.2 No Hyperparameter Optimization

All three models use the same training hyperparameters (LR, batch size, dropout, patience). Model-specific tuning could improve results:
- SALIENT might benefit from lower dropout (it already has attention as implicit regularization)
- Transformer might benefit from warmup learning rate scheduling
- CNN-LSTM might benefit from larger batch size (CNNs are less sensitive to batch noise)

### 9.3 Limited Data Augmentation

Beyond sliding window overlap, no augmentation is applied:
- **Missing:** Time warping, magnitude scaling, jittering, channel dropout
- fNIRS-specific augmentations (e.g., simulated motion artifacts + removal) could improve robustness

### 9.4 Band Power Visualization is Approximate

The frontend displays EEG-style band powers (delta, theta, alpha, beta, gamma), but the actual data is fNIRS. The backend derives these from class probabilities using a cognitive-load heuristic, not from real spectral analysis. This is a visualization simplification, not a scientific measurement.

### 9.5 Binary vs. 4-Class

Many practical BCI applications only need binary classification (stressed vs. relaxed). The 4-class setup is academically rigorous but harder. A production deployment might benefit from collapsing to 2 classes (0-back + 1-back = "low", 2-back + 3-back = "high"), which would likely achieve 85-92% LOSO accuracy.

### 9.6 No Calibration Fine-Tuning

The current pipeline trains a single model for all users. A few-shot calibration step (fine-tuning on 2-5 minutes of a new user's data) could dramatically improve per-user accuracy. This is standard in production BCI systems.

---

## 10. Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  Upload Zone │ Dashboard │ History │ Reports │ Admin     │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (axios)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Backend                          │
│  /api/v1/auth │ /analysis │ /history │ /reports │ /admin │
├─────────────────────────────────────────────────────────┤
│  eeg_processor.py                                        │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐  │
│  │ Load    │→ │ Sliding  │→ │ Scale  │→ │ Model     │  │
│  │ fNIRS   │  │ Window   │  │ (pkl)  │  │ Predict   │  │
│  │ CSV/MAT │  │ (150,8)  │  │        │  │ (.h5)     │  │
│  └─────────┘  └──────────┘  └────────┘  └───────────┘  │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL │ JWT Auth │ File Storage │ PDF Generation   │
└─────────────────────────────────────────────────────────┘
```

The backend mirrors the notebook preprocessing pipeline exactly:
1. Load uploaded file (CSV, MAT, or EDF)
2. Extract the 8 fNIRS feature columns
3. Apply sliding window segmentation (window=150, stride=3)
4. Normalize with the exported StandardScaler
5. Run inference with the exported Keras model
6. Aggregate window predictions (mean of softmax probabilities)
7. Map to stress score and workload class

---

## 11. Reproducibility

| Aspect | Implementation |
|--------|---------------|
| Random seeds | `np.random.seed(42)`, `tf.random.set_seed(42)` |
| Data splits | LOSO is deterministic given subject IDs |
| Model init | Seeded random initialization |
| Dependencies | `requirements.txt` (backend), `package.json` (frontend) |
| Model export | `.h5` weights + `.pkl` scaler + `.json` metadata |
| Results | Pickle + JSON summary per experiment |

---

## 12. Summary

### What NeuroCalm Gets Right

1. **Honest evaluation** — LOSO with no leakage, the hardest standard in BCI
2. **Fair comparison** — Three architectures under identical conditions
3. **Novel architecture** — SALIENT's dual-stream design is purpose-built for fNIRS
4. **Full deployment** — From notebook to production web app
5. **Correct preprocessing** — Per-fold scaling, edge padding, NaN handling

### What the Numbers Mean

- Achieving **>72%** on 4-class LOSO validates that deep learning outperforms the Tufts RF baseline
- Achieving **>78%** would match or beat the best published cross-subject CNN-LSTM results on fNIRS
- Achieving **>80%** would be a strong result for LOSO 4-class fNIRS classification
- Published numbers of **89-97%** use easier evaluation (k-fold, per-subject) and are not directly comparable

### Bottom Line

NeuroCalm's methodology is **more rigorous** than most published work in this space. The accuracy numbers will be lower than papers using k-fold CV, but they reflect **real-world generalization ability** — which is what matters for a system that must work on new, unseen users.

---

## References

1. Huang, Z., et al. (2021). "The Tufts fNIRS Mental Workload Dataset & Benchmark for Brain-Computer Interfaces that Generalize." NeurIPS 2021 Datasets and Benchmarks Track.
2. Asgher, U., et al. (2020). "Enhanced Accuracy for Multiclass Mental Workload Detection Using Long Short-Term Memory for Brain-Computer Interface." Frontiers in Neuroscience, 14, 584.
3. Mughal, N.E., et al. (2022). "EEG-fNIRS-based hybrid image construction and classification using CNN-LSTM." Frontiers in Neurorobotics, 16, 873239.
4. Wickramaratne, S.D. & Mahmud, M.S. (2025). "Enhancing Cognitive Workload Classification Using Integrated LSTM Layers and CNNs for fNIRS Data Analysis." Computers, 14(2), 73.
5. Shin, J., et al. (2018). "Deep Learning in fNIRS: A Review." arXiv:2201.13371.

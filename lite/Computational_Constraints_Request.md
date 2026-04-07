# Computational Resource Request for fNIRS Mental Workload Classification Project

**Student:** HM Jemima  
**Project:** Deep Learning-Based Cognitive Workload Classification Using fNIRS Data  
**Dataset:** Tufts fNIRS2MW (4-class N-back task)  
**Date:** March 2026

---

## 1. Project Summary

This project compares three deep learning architectures for classifying cognitive workload levels (0-back, 1-back, 2-back, 3-back) from functional near-infrared spectroscopy (fNIRS) brain signals, using the publicly available Tufts fNIRS2MW dataset. The three models being evaluated are:

- **SALIENT** — A dual-stream architecture combining spatial channel attention with temporal multi-head self-attention, fused through a BiLSTM classifier.
- **CNN-LSTM** — A sequential pipeline of 1D convolutional feature extraction (3 layers: 64→128→128 filters) followed by stacked LSTM layers (64→32 units) for temporal modeling.
- **Transformer** — A standard encoder-only Transformer with 2 attention blocks (4 heads, 128-dim embeddings, 256-dim feed-forward), using convolutional tokenization.

All three models are benchmarked against the Tufts team's published Random Forest baseline of **72.20% accuracy**.

---

## 2. Why the Current Implementation Requires Significant Compute

### 2.1 Leave-One-Subject-Out (LOSO) Cross-Validation

The evaluation protocol used is **Leave-One-Subject-Out (LOSO)** cross-validation, which is the gold standard for BCI and neuroimaging research because it tests whether a model generalizes to entirely unseen individuals. However, LOSO is extremely expensive:

- The Tufts fNIRS2MW dataset contains approximately **68 subjects**.
- LOSO requires training **68 separate models** — one full training run per subject.
- Each fold trains on ~67 subjects' data and tests on the held-out subject.
- Each fold runs for up to **100 epochs** with early stopping (patience = 20).

This means the total training workload is approximately:

| Component | Per Fold | Total (68 Folds) |
|---|---|---|
| Epochs (worst case) | 100 | 6,800 |
| Epochs (typical w/ early stopping) | ~40–60 | ~2,700–4,080 |
| Approximate time per fold (T4 GPU) | ~8–15 min | ~9–17 hours |

**Per model**, a full LOSO run takes roughly **10–17 hours on a T4 GPU**. Since I am training **3 models**, the total required GPU time is approximately **30–51 hours**.

### 2.2 Model Complexity

Each model involves non-trivial architectures with attention mechanisms, recurrent layers, or both:

| Model | Key Layers | Approximate Parameters |
|---|---|---|
| SALIENT | Multi-head attention + channel attention + BiLSTM | ~200K–400K |
| CNN-LSTM | 3 Conv1D layers + 2 LSTM layers | ~300K–500K |
| Transformer | 2 Transformer blocks (4 heads each) + Conv embedding | ~400K–600K |

While these are not enormous models, the **repeated training across 68 folds** is what makes computation infeasible on free-tier platforms.

### 2.3 Data Preprocessing Per Fold

Each LOSO fold also requires per-fold StandardScaler normalization (fitted only on training data), class weight computation, and data reshaping — adding overhead that compounds across 68 iterations.

---

## 3. Kaggle Free Tier Limitations

I am currently using **Kaggle's free GPU tier**, which provides:

| Resource | Kaggle Free Limit |
|---|---|
| GPU type | NVIDIA Tesla T4 (16 GB VRAM) |
| Session time limit | **~12 hours maximum** |
| Weekly GPU quota | **~30 hours/week** |
| Persistent storage | Limited (outputs cleared between sessions) |
| Session stability | Sessions may disconnect or time out unpredictably |

### The Core Problem

A single model's LOSO training takes **10–17 hours**, which already exceeds or approaches Kaggle's 12-hour session limit. In practice, my sessions are terminated at approximately the 50% mark (around fold 30–35 of 68), meaning:

- No single model can complete training in one session.
- Even if one model finishes, I cannot run all three within the weekly GPU quota.
- Kaggle sessions disconnect without saving intermediate state, so partial progress is lost entirely.
- The comparison notebook (Notebook 4) requires all three models' results to run, creating a hard dependency chain.

I have already attempted multiple runs, each consuming hours of GPU time before being terminated, with no usable results to show for it.

---

## 4. Why This Implementation Approach Is the Correct One

Despite the computational cost, the current implementation follows best practices that should not be compromised:

### 4.1 LOSO Is Required, Not Optional

Standard k-fold cross-validation is **not appropriate** for BCI/neuroimaging research because it allows data from the same subject to appear in both training and test sets. This causes artificially inflated accuracy due to inter-subject data leakage. LOSO is the accepted standard in this domain and is what the Tufts benchmark uses. Switching to k-fold would make results incomparable to the published benchmark and scientifically invalid.

### 4.2 Three-Model Comparison Is Central to the Project

The project's contribution is the **systematic comparison** of these three architectures on fNIRS data. Reducing to a single model would eliminate the comparative analysis, which is the main research question.

### 4.3 Hyperparameters Are Already Conservative

The current configuration already uses restrained settings to minimize training time:

- **Batch size:** 32 (efficient for T4 memory)
- **Max epochs:** 100 with **early stopping (patience=20)** — most folds terminate around epoch 40–60
- **Learning rate:** 0.0005 with ReduceLROnPlateau scheduler
- **Dropout:** 0.4 (regularizes well, reducing need for longer training)
- **Embedding dimensions:** 64 (SALIENT), 128 (Transformer) — modest sizes

Further reducing these would risk degrading model performance to the point where the comparison becomes meaningless.

---

## 5. What I Am Requesting

I am requesting one of the following accommodations to complete this project:

### Option A: Access to University/Department GPU Resources
Access to a university compute cluster or lab machine with a GPU (any NVIDIA GPU with ≥8 GB VRAM) and no session time limit. Each model would need approximately 12–17 hours of uninterrupted GPU time.

### Option B: Extended Kaggle or Cloud Credits
Kaggle Pro or Google Colab Pro+ would provide longer session times (up to 24 hours) and priority GPU access. Alternatively, a small cloud computing credit (~$20–30 on Google Cloud or AWS) would cover the required ~50 GPU-hours on a T4 instance.

### Option C: Adjusted Evaluation Criteria
If no additional compute is available, I would propose submitting:

- The complete, ready-to-run code (all 4 notebooks) as evidence of implementation correctness.
- Partial results from the folds that did complete before session termination.
- A detailed written analysis of the architectures, methodology, and expected outcomes based on related literature.

---

## 6. Estimated Resource Requirements Summary

| Requirement | Details |
|---|---|
| GPU type needed | NVIDIA T4 or better (≥8 GB VRAM) |
| Time per model | 10–17 hours (LOSO, 68 folds, up to 100 epochs each) |
| Total for 3 models | ~30–51 hours |
| Comparison notebook | ~5 minutes (once all results exist) |
| Minimum uninterrupted session | ~17 hours (for the slowest model) |
| Kaggle free session limit | ~12 hours (insufficient) |

---

## 7. Appendix: Notebook Overview

| Notebook | Purpose | Status |
|---|---|---|
| `1_SALIENT_Final.ipynb` | SALIENT model — dual-stream attention + BiLSTM | Code complete, cannot finish on Kaggle free tier |
| `2_CNN_LSTM_Final.ipynb` | CNN-LSTM model — Conv1D feature extraction + LSTM | Code complete, cannot finish on Kaggle free tier |
| `3_Transformer_Final.ipynb` | Transformer encoder model | Code complete, cannot finish on Kaggle free tier |
| `4_Compare_Results.ipynb` | Load all 3 results, generate comparison table, plots, LaTeX | Code complete, blocked on model results |
| `SALIENT_Kaggle_Verbose.ipynb` | Verbose version of SALIENT with detailed training logs | Code complete, used for debugging/monitoring |

All notebooks are fully implemented, tested for correctness, and ready to execute given sufficient compute resources.

---

*I am happy to demonstrate the code, walk through the architecture decisions, or provide any additional technical detail upon request.*

# Chest X-Ray Triage System: Project Review

## 1. Overview

This project is a triage tool, not a diagnostic tool. It takes a chest X-ray, produces a pneumonia-related risk score, and uses that score to prioritise the scan in a queue for clinician review. The goal is to help higher-risk scans reach clinical review sooner — the final diagnosis is always left to the clinician.

I also used Grad-CAM to generate heatmaps showing which parts of each image had the greatest influence on the model's prediction, to support interpretability.

**Key results at a glance:**

| Metric | Validation | Test |
|---|---|---|
| Sensitivity | 90.24% | 89.25% |
| Specificity | 65.99% | 66.21% |
| ROC-AUC | 0.8794 | 0.8610 |
| Precision | — | 44.53% |
| F1 Score | — | 0.5942 |

**Stack:** Pretrained ResNet18 (transfer learning), fine-tuned on chest X-ray data, threshold tuned for ~90% sensitivity.

---

## 2. Problem Framing

As a triage tool, the model's mistakes carry asymmetric risk:

- **False positive** — a negative scan is reviewed earlier than necessary (inefficient, but not dangerous).
- **False negative** — a genuinely positive scan is assigned a lower priority (more concerning, as it could delay care).

Because of this asymmetry, I treated false negatives as more costly than false positives throughout the project — from loss weighting through to threshold selection.

---

## 3. Dataset

**Size:** 28,448 adult frontal chest X-rays after filtering, split into:
- Training: 19,913 images (~23.3% positive)
- Validation: 4,267 images
- Test: 4,268 images

**Target definition:** Each image's annotation was converted into a binary target:
- **Positive class:** Lung Opacity
- **Negative class:** Normal *and* No Lung Opacity / Not Normal

Abnormal-but-not-opacity scans were deliberately kept in the negative class so the model would learn to distinguish opacity-specific patterns rather than just "normal vs. abnormal."

**Filtering decisions:**
- Restricted to patients aged 18+, since paediatric X-rays differ substantially from adult ones and would add unwanted variation.
- Restricted to anteroposterior and posteroanterior views only, keeping the imaging perspective consistent.

**Split strategy:** Training set for parameter optimisation, validation set for model selection and threshold tuning, and a held-out test set evaluated only once the model and threshold were fixed — giving a less biased estimate of real-world performance.

---

## 4. Data Preprocessing

- **Resizing:** All images resized to 224×224 to match ResNet18's expected input, reducing compute cost versus raw DICOM resolution.
- **DICOM standardisation:** Images using the MONOCHROME1 convention were inverted so intensity direction was consistent across the dataset; pixel intensities were then scaled consistently.
- **Channel duplication:** Grayscale images were duplicated across 3 channels to match ResNet18's expected input, without introducing any actual colour information.
- **Normalisation:** Applied using ImageNet mean/std, matching the pretrained network's expectations.
- **Augmentation:** Small random rotations applied during training only (not validation/test), reducing overfitting to a single orientation while keeping evaluation reproducible.

---

## 5. Model Architecture

- **Base model:** ResNet18 pretrained on ImageNet, fine-tuned end-to-end rather than trained from scratch — leveraging existing shape/texture features while requiring far less data and compute.
- **Output layer:** Replaced with a single logit output for binary classification. A larger positive logit indicates stronger evidence for the positive class.
- **Class imbalance handling:** Positive class weighted at 3.29 in the binary cross-entropy loss, increasing the penalty for misclassified positive scans.

---

## 6. Training Procedure

- **Optimiser:** Adam, with a relatively small learning rate to let the pretrained features adapt gradually rather than being overwritten.
- **Schedule:** 10 epochs, batch size 32.
- **Model selection:** Validation loss and ROC-AUC recorded after every epoch; the checkpoint with the lowest validation loss was kept, rather than defaulting to the final epoch's weights.

**Overfitting observed:** Best validation loss occurred at epoch 2 (loss 0.6800, ROC-AUC 0.8794). Beyond that point, training accuracy kept climbing (reaching 94.81% by epoch 10), but validation loss increased and validation ROC-AUC stopped improving — a clear overfitting signal. The epoch 2 checkpoint was used for final evaluation.

---

## 7. Threshold Selection & Evaluation

**Threshold tuning:** Using the validation set, I selected a fixed threshold of 0.3824, targeting ~90% sensitivity. This gave:
- Validation sensitivity: 90.24%
- Validation specificity: 65.99%

This trade-off was intentional — accepting more false positives in order to catch more true positives, consistent with the triage use case.

**Test set results (threshold fixed beforehand):**
- Sensitivity: 89.25%
- Specificity: 66.21%
- Precision: 44.53%
- F1 Score: 0.5942
- ROC-AUC: 0.8610

The test ROC-AUC was slightly lower than validation (0.8610 vs. 0.8794), but still indicates the model generalised reasonably well to unseen data. The relatively low precision is an expected consequence of prioritising sensitivity.

---

## 8. Explainability (Grad-CAM)

Grad-CAM heatmaps highlight the image regions most influential to each prediction, giving clinicians insight into whether the model focused on relevant lung regions or unrelated features.

**Important caveat:** these heatmaps show influence, not confirmed disease location — they should not be treated as diagnostic evidence.

---

## 9. Limitations & Reflection

- **Split granularity:** The dataset was split at image level rather than a verified patient level, since the available identifier appeared unique per image. This means full independence between splits couldn't be confirmed, risking some information leakage.
- **Label validity:** Labels reflect the challenge-defined "lung opacity" target, not a clinically confirmed pneumonia diagnosis.
- **Single-source data:** The model was trained and evaluated on one dataset only, with no external validation across hospitals or imaging systems.
- **Calibration:** Risk scores should not be interpreted as calibrated clinical probabilities.

## 10. Future Work

- External validation on data from other hospitals/imaging systems
- Probability calibration
- Stronger data augmentation
- Patient-level (verified) data splitting
- Comparison against alternative architectures
- Deeper analysis of false positive/negative cases
- Threshold review in collaboration with clinicians

---

## 11. Conclusion

This project delivered an end-to-end medical image classification pipeline: DICOM preprocessing, transfer learning, class imbalance handling, threshold selection, evaluation, and explainability. The model is **not suitable for clinical deployment**, but demonstrates how machine learning could support triage by helping prioritise higher-risk scans — while keeping the final diagnostic decision with the clinician.

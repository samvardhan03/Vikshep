# OmniPulse: Agentic Model Context Protocol (MCP) for Universal Transient Signal Processing

[![PyPI version](https://badge.fury.io/py/omnipulse.svg)](https://badge.fury.io/py/omnipulse)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Build Status](https://github.com/samvardhan03/OmniPulse/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/samvardhan03/OmniPulse/actions)

Welcome to **OmniPulse**, a domain-agnostic, enterprise-grade Agentic MLOps pipeline designed natively for high-noise transient detection. By bridging cutting-edge temporal signal processing mathematics with autonomous Large Language Model (LLM) orchestration via the **Model Context Protocol (MCP)**, OmniPulse sets a new standard for processing extreme time-series anomalies.

Developed by **[Samvardhan Singh](https://github.com/samvardhan03)**.

---

## The Scientific Context: Why Wavelet Scattering?

In fields like Neurology (EEG analysis for epilepsy or emotion recognition) and Astrophysics (Fast Radio Bursts / FRB detection), researchers are constantly battling non-stationary transients hiding within extreme Gaussian white noise and instrumental artifacts. 

Traditional Fourier Transforms perform poorly on non-stationary signals because they lose temporal localization. Even baseline Continuous Wavelet Transforms (CWT) struggle because they are not translation parameter invariant—a slight shift in the signal severely alters the mathematical representation, crashing downstream machine learning classifiers.

### The Cascaded Wavelet Scattering Transform (WST)
OmniPulse utilizes the **Wavelet Scattering Transform (WST)** mathematically backed by the `kymatio` engine. The WST solves translation-variance by passing the signal through a deep, convolutional-like cascade of wavelet modulus operators and low-pass filters:

1. **S0 (Zeroth Order)**: The raw signal is heavily smoothed via a low-pass filter, capturing the baseline average.
2. **S1 (First Order)**: The signal is convoluted with high-frequency Morlet wavelets, and the absolute modulus is taken before applying the low-pass filter. This mathematically isolates the amplitude envelopes of primary transients.
3. **S2 (Second Order)**: The scattered energy from S1 is recursively convoluted again, extracting the interference patterns of the amplitude envelopes, revealing deep, non-linear harmonic structures that hidden transients rely on.

This non-linear translation invariance provides a pristine, mathematically guaranteed extraction of anomalies regardless of where they occur in the temporal sequence.

---

## Architectural Philosophy: The Decoupled Paradigm

OmniPulse abandons monolithic design. Mathematical engines are best written in Python; autonomous LLM orchestrators are best written in TypeScript. 

To merge these, OmniPulse utilizes the **Model Context Protocol (MCP)** via a native `stdio` transport, physically isolating the Python Scientific Engine from the TypeScript Agentic Orchestrator while allowing seamless, type-safe RPC (Remote Procedure Call) interoperability.

### 1. The Python Scientific Engine (`omnipulse` / PyPI)
The backend is a strictly typed PyTorch/Kymatio microservice. It manages:
- Memory-safe signal loading and NaN/Inf anomaly sanitization.
- Wavelet Scattering Transform generation.
- Principal Component Analysis (PCA) manifold compression using `scikit-learn` to retain 95% statistical variance while reducing dimensionality from tens of thousands of parameters down to a highly constrained `K-dimensional` vector.
- A `FastMCP` server wrapper that exposes these highly complex mathematical sequences as isolated, runnable node tools.

### 2. The TypeScript Agentic Orchestrator (`agent/` / Bun)
The frontend loop acts as the "Brain". It manages:
- Spawning the Python backend dynamically via `bun spawn`.
- Parsing continuous `.npy` evaluation datasets.
- Hand-shaking the `initialize` JSON-RPC MCP connection.
- Reading the JSON outputs of the Python engine to make heuristic decisions. If rigorous statistical thresholds (e.g., `Mean + 3σ`) are breached by an astronomical variance anomaly, the TypeScript engine autonomously flags the data for Denoising, Approval, or an emergency Halt.

---

## Installation

OmniPulse requires **Python 3.10+** and **Bun v1.0+**. 

### Installing the Mathematical Backend
The pure Python engine can be installed standalone from PyPI for local notebook evaluation or microservice integrations:

```bash
pip install omnipulse
```

### Full Repository Install (Orchestrator + Backend)
To run the autonomous TypeScript pipeline and contribute to the MCP tools, clone the monolithic structure:

```bash
git clone https://github.com/samvardhan03/OmniPulse.git
cd OmniPulse

# 1. Setup Python Environment
cd open-source-wst
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cd ..

# 2. Setup TypeScript Orchestrator
cd agent
bun install
```

---

## Usage Examples

### 1. Python API (Direct Scientific Usage)
If you are a Data Scientist who simply wants the Kymatio PCA compression without the LLM overhead:

```python
import numpy as np
from transient_wst.io import SignalLoader
from transient_wst.core import WaveletScatteringExtractor
from transient_wst.reduction import PCAReducer

# Generate a fake 2000-sample signal at 1000Hz
raw_signal = np.random.randn(2000)

# Instantiate the WST (J=6 scales, Q=8 filters per octave)
extractor = WaveletScatteringExtractor(J=6, Q=8, sample_rate=1000)
scattering_paths = extractor.extract(raw_signal)

# Compress the deep nested vectors (e.g., path size [74, 31]) into a flat 2D manifold
reducer = PCAReducer(n_components=5)
# Expects batch of signals, so we add a batch dimension
reduced_tensor = reducer.fit_transform(np.expand_dims(scattering_paths, axis=0))

print(f"Compressed Representation Shape: {reduced_tensor.shape}")
```

### 2. The Bun CLI (Agentic Execution)
To run the real magic—the autonomous agent that decides *what* to do with the mathematics natively:

```bash
# Generate 50 simulated noisy transients
python open-source-wst/scripts/generate_sim_data.py

# Launch the TS Orchestrator Loop
cd agent
bun run src/main.ts process \
  --input ../open-source-wst/data/raw_sim \
  --output ../open-source-wst/data/processed
```

The agent will seamlessly boot the Python background process, map the `execute_wst` tool, calculate PCA distributions, cross-reference standard deviations against its configured prompt schema, and reject explicit anomalies natively!

---

## Credits
**OmniPulse** is developed, maintained, and mathematically formulated by:
**Samvardhan Singh**
- GitHub: [samvardhan03](https://github.com/samvardhan03)
- LinkedIn: [Samvardhan Singh](https://www.linkedin.com/in/samvardhan-singh/)

## License

This architecture is physically released for Academic and Open-Source usage under the **Apache 2.0 License**.

```
Copyright 2026 Samvardhan Singh

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

For Custom Lab implementations, Exascale Kubernetes adaptations, and proprietary quantum-kernel hardware bindings, please contact via the Enterprise Consulting tier.

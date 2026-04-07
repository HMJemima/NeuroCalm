# How to Use University Lab GPUs — Beginner's Guide

**For:** HM Jemima  
**Context:** Running fNIRS deep learning notebooks that need 10–17 hours of GPU time  
**Your comfort level:** Windows + Kaggle notebooks  

---

## Step 0: Find Out What Your Lab Has

Before anything else, you need to ask your teacher or lab admin **one simple question:**

> "I need to run deep learning training on a GPU for about 15 hours per model. 
> What GPU resources does the department have, and how do I get access?"

They will likely describe one of the **three scenarios** below. Skip to whichever one matches.

---

## Scenario A: A Physical Lab Machine with a GPU

**What it is:** A desktop/workstation in the lab (or your teacher's office) with an NVIDIA GPU installed. This is the most common setup in smaller departments.

### What to ask for:
- Can I get the machine's **IP address** and a **username/password**?
- Is **SSH** enabled? (It should be on Linux machines)
- Is **Anaconda** or **Python** already installed?

### Step-by-step:

**1. Connect to the machine remotely using SSH**

On your Windows PC, open **PowerShell** or install [MobaXterm](https://mobaxterm.mobatek.net/) (free, beginner-friendly), then type:

```
ssh username@192.168.x.x
```
(Replace with the actual username and IP address they give you)

It will ask for a password. Type it (nothing will show on screen — that's normal) and press Enter.

**2. Check that the GPU is available**

Once logged in, type:
```bash
nvidia-smi
```
You should see your GPU listed (e.g., RTX 3090, A100, etc.) with memory info. If this command works, you're good.

**3. Set up your environment**

```bash
# Check if conda exists
conda --version

# If it does, create an environment for your project
conda create -n fnirs python=3.10 -y
conda activate fnirs

# Install what you need
pip install tensorflow numpy pandas scikit-learn matplotlib seaborn tqdm

# If the machine has CUDA properly set up, TensorFlow will auto-detect the GPU
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

If conda is NOT installed, use plain pip:
```bash
pip install --user tensorflow numpy pandas scikit-learn matplotlib seaborn tqdm
```

**4. Upload your notebooks and data**

Option A — Use **scp** (secure copy) from your Windows PowerShell:
```
scp C:\Users\YourName\Downloads\1_SALIENT_Final.ipynb username@192.168.x.x:~/project/
```

Option B — Use **MobaXterm's** drag-and-drop file browser (easiest for beginners).

Option C — If the machine has internet, just download from Kaggle directly:
```bash
pip install kaggle
kaggle datasets download -d hmjemima/tufts-fnirs2mw
```

**5. Convert your notebook to a Python script**

Your Kaggle notebooks (.ipynb) need to become regular Python scripts (.py) so they can run without a browser:

```bash
pip install jupyter
jupyter nbconvert --to script 1_SALIENT_Final.ipynb
```

This creates `1_SALIENT_Final.py`. Do this for all 3 model notebooks.

**6. Fix the paths in the script**

Open the script and change the Kaggle paths to local paths:

```python
# CHANGE THIS:
BASE_PATH = '/kaggle/input/datasets/hmjemima/tufts-fnirs2mw/slide_window_data/'
OUTPUT_PATH = '/kaggle/working/SALIENT_Results/'

# TO THIS (wherever you put your data):
BASE_PATH = '/home/username/project/data/slide_window_data/'
OUTPUT_PATH = '/home/username/project/SALIENT_Results/'
```

**7. Run it in the background (so it keeps going even if you disconnect)**

This is the key trick — use `nohup` or `screen` so the training survives if your laptop goes to sleep:

```bash
# Method 1: nohup (simplest)
nohup python 1_SALIENT_Final.py > salient_log.txt 2>&1 &

# Check progress anytime:
tail -f salient_log.txt

# Method 2: screen (more control)
screen -S training
python 1_SALIENT_Final.py
# Press Ctrl+A then D to detach (it keeps running)
# Reconnect later:
screen -r training
```

**8. Download results when done**

From your Windows PowerShell:
```
scp -r username@192.168.x.x:~/project/SALIENT_Results/ C:\Users\YourName\Downloads\
```

---

## Scenario B: University HPC Cluster (SLURM)

**What it is:** A shared computing cluster that many students use. You submit "jobs" and wait in a queue. Common at larger universities.

**How to recognize it:** They'll mention words like "SLURM," "cluster," "job queue," "HPC," "submit a job," or give you a login address like `hpc.university.edu`.

### What to ask for:
- What is the **login address**?
- What **account/partition** should I use?
- Is there a **getting started guide** for the cluster?

### Step-by-step:

**1. Connect via SSH** (same as Scenario A)
```
ssh username@hpc.university.edu
```

**2. Load required modules**

HPC clusters use "modules" instead of installing software yourself:
```bash
module avail                    # See what's available
module load python/3.10         # Load Python
module load cuda/11.8           # Load CUDA for GPU
module load anaconda3           # If available
```

**3. Create your environment and install packages**
```bash
conda create -n fnirs python=3.10 -y
conda activate fnirs
pip install tensorflow numpy pandas scikit-learn matplotlib seaborn tqdm
```

**4. Upload data and convert notebooks** (same as Scenario A, steps 4–6)

**5. Create a job submission script**

Create a file called `run_salient.sh`:
```bash
#!/bin/bash
#SBATCH --job-name=salient
#SBATCH --output=salient_%j.log
#SBATCH --gres=gpu:1
#SBATCH --time=20:00:00
#SBATCH --mem=32G
#SBATCH --cpus-per-task=4

module load python/3.10 cuda/11.8
conda activate fnirs

python 1_SALIENT_Final.py
```

> **Note:** The exact `#SBATCH` options depend on your cluster. Ask your admin which 
> partition and account to use. They may need to add something like:
> `#SBATCH --partition=gpu` or `#SBATCH --account=your_dept`

**6. Submit the job**
```bash
sbatch run_salient.sh
```

**7. Monitor progress**
```bash
squeue -u username          # See your jobs in the queue
tail -f salient_*.log       # Watch the output
scancel <job_id>            # Cancel if needed
```

The job runs even when you're disconnected. Come back later and check results.

---

## Scenario C: Cloud Platform via University

**What it is:** Your university has an account on Google Cloud, AWS, or Azure and can give you credits or a VM.

### What to ask for:
- Can I get a **cloud VM with a GPU**?
- Do you have **student credits** for GCP/AWS/Azure?

### If they give you a Google Cloud / AWS VM:

It works exactly like **Scenario A** — you'll get an IP address, SSH in, set up Python, upload your files, and run with `nohup` or `screen`. The only difference is the machine is in the cloud instead of physically in the lab.

---

## Scenario D: They Let You Use the Lab Machine Physically

If you can sit at the machine in person, it's even simpler.

### If the machine runs Linux (most likely):

1. Open the **Terminal** application
2. Follow steps 2–7 from Scenario A (skip the SSH part since you're already there)
3. Use `screen` so you can leave the lab and let it run overnight

### If the machine runs Windows:

1. Open **Anaconda Prompt** or **Command Prompt**
2. Install packages: `pip install tensorflow numpy pandas scikit-learn matplotlib seaborn tqdm`
3. Check GPU: `python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"`
4. Convert notebooks: `jupyter nbconvert --to script 1_SALIENT_Final.ipynb`
5. Fix paths to point to wherever you saved the data (e.g., `C:\Users\...\project\data\`)
6. Run: `python 1_SALIENT_Final.py`

> **Important:** If running on a Windows machine, make sure nobody will log you out 
> or restart the machine. Ask the lab admin to keep it running overnight.

---

## Quick Reference: Path Changes

In ALL scenarios, you need to change these paths in each notebook/script:

| What to change | Kaggle path | Local path (adjust to your setup) |
|---|---|---|
| Data input | `/kaggle/input/datasets/hmjemima/tufts-fnirs2mw/...` | `/home/username/project/data/...` |
| SALIENT output | `/kaggle/working/SALIENT_Results/` | `/home/username/project/SALIENT_Results/` |
| CNN-LSTM output | `/kaggle/working/CNN_LSTM_Results/` | `/home/username/project/CNN_LSTM_Results/` |
| Transformer output | `/kaggle/working/Transformer_Results/` | `/home/username/project/Transformer_Results/` |
| Figures | `/kaggle/working/` | `/home/username/project/` |

---

## Quick Reference: Essential Commands Cheat Sheet

```bash
# Connect remotely
ssh username@ip_address

# Check GPU is working
nvidia-smi

# Run training in background (won't stop when you disconnect)
nohup python 1_SALIENT_Final.py > salient_log.txt 2>&1 &
nohup python 2_CNN_LSTM_Final.py > cnn_lstm_log.txt 2>&1 &
nohup python 3_Transformer_Final.py > transformer_log.txt 2>&1 &

# Watch progress
tail -f salient_log.txt

# Check if it's still running
ps aux | grep python

# Download results to your Windows PC (run from PowerShell)
scp -r username@ip_address:~/project/*_Results/ C:\Users\YourName\Downloads\
```

---

## After All 3 Models Finish

1. Download all three result folders to your PC
2. Upload them back to Kaggle as datasets
3. Run `4_Compare_Results.ipynb` on Kaggle (no GPU needed, runs in seconds)
4. You'll get your comparison table, bar charts, confusion matrices, and LaTeX table

---

## If You Get Stuck

Common issues and quick fixes:

| Problem | Fix |
|---|---|
| `nvidia-smi` not found | CUDA drivers not installed — ask admin to install them |
| TensorFlow doesn't see GPU | Run `pip install tensorflow[and-cuda]` or ask admin to check CUDA version |
| "Permission denied" on SSH | Ask admin to enable your account / reset password |
| Training crashes with OOM | Reduce `batch_size` from 32 to 16 in the CONFIG |
| "No module named tensorflow" | You forgot to activate your environment: `conda activate fnirs` |
| Script runs on CPU (very slow) | Check `tf.config.list_physical_devices('GPU')` — if empty, CUDA isn't set up |

---

*Don't worry if this feels like a lot — once you SSH in and run the first command, it clicks quickly. The most important thing is `nohup` — it lets your training run for 15+ hours even after you close your laptop and go home.*

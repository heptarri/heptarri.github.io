# 基于 mjLab 仿真的宇树 G1 强化学习示例

## 环境搭建

先根据需求安装 miniconda：

```bash
mkdir -p ~/miniconda3
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
rm ~/miniconda3/miniconda.sh
```

此后初始化 Conda：

```bash
~/miniconda3/bin/conda init --all
source ~/.bashrc
```

然后用 Conda 创建一个新的环境并启用：

```bash
conda create -n unitree_rl_mjlab python=3.11
conda activate unitree_rl_mjlab
```

在运行完成没有错误后，从 GitHub 拉取 `Unitree_rl_mjlab` 项目：

```bash
git clone https://github.com/unitreerobotics/unitree_rl_mjlab.git
```

然后对其安装依赖：

```bash
sudo apt install -y libyaml-cpp-dev libboost-all-dev libeigen3-dev libspdlog-dev libfmt-dev

cd unitree_rl_mjlab
pip install -e .
```

> 上面的步骤可能会花费很长时间。

## 训练模型

```bash
python scripts/train.py Unitree-G1-Flat --env.scene.num-envs=4096
```

第一个参数（例如 Mjlab-Velocity-Flat-Unitree-G1）指定了训练任务。可用的速度跟踪任务：
- Unitree-Go2-Flat  
- Unitree-G1-Flat 
- Unitree-G1-23Dof-Flat  
- Unitree-H1_2-Flat  
- Unitree-A2-Flat  
- Unitree-R1-Flat

另一个可以用来训练的模型：

```bash
python scripts/csv_to_npz.py \
--input-file src/assets/motions/g1/dance1_subject2.csv \
--output-name dance1_subject2.npz \
--input-fps 30 \
--output-fps 50
```

NPZ 文件将存储在：`src/motions/g1/...`

生成 NPZ 文件后，启动模拟训练：

```bash
python scripts/train.py Unitree-G1-Tracking --motion_file=src/assets/motions/g1/dance1_subject2.npz --env.scene.num-envs=4096
```

## 仿真验证

```bash
python scripts/play.py Unitree-G1-Flat --checkpoint_file=logs/rsl_rl/g1_velocity/2026-xx-xx_xx-xx-xx/model_xx.pt
```

```bash
python scripts/play.py Unitree-G1-Tracking --motion_file=src/assets/motions/g1/dance1_subject2.npz --checkpoint_file=logs/rsl_rl/g1_tracking/2026-xx-xx_xx-xx-xx/model_xx.pt
```

其中具体的模型名称 `model_xx.pt` 及其路径需要根据情景进行修改。
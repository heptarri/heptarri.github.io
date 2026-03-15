# 机器人动作强化学习 mjLab 仿真部署

本文提供了一套从视频流提取动作序列、基于该动作序列进行强化学习并利用 MuJoCo 仿真的流程。

![alt text](<assets/机器人动作强化学习 mjLab 仿真部署/截图 2026-03-13 11-42-35.png>)

## 环境安装

### GVHMR

[GVHMR](https://github.com/zju3dv/GVHMR) 是浙江大学开源的一个从单目 RGB 视频中恢复全局人体运动的算法。其可以生成一个 `pt` 文件，记录了从视频中提取的权重文件，包含了对视频进行解算后得到的三维运动特征结果集。

首先从 GitHub 下载 GVHMR 本体：

```bash
git clone https://github.com/zju3dv/GVHMR.git
```

之后按照其 [安装教程](https://github.com/zju3dv/GVHMR/blob/main/docs/INSTALL.md) 安装。

安装完成后，激活 Conda 环境，在 `GVHMR/`运行：

```bash
python tools/demo/demo.py --video=docs/example_video/tennis.mp4 -s
```

若报错，考虑以下原因：

#### PyTorch 版本与本机 CUDA 不匹配

需要卸载 PyTorch/TorchVision，然后重新安装：

```bash
pip uninstall torch torchvision
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu130 # 根据自己的机器情况选择
```

#### 缺少 chumpy/PyTorch3D

通过以下命令安装：

```bash
pip install chumpy --no-build-isolation
```

```bash
pip install "git+https://github.com/facebookresearch/pytorch3d.git" --no-build-isolation
```

#### 报错 UnpicklingError

其提示：

> Weights only load failed. This file can still be loaded, to do so you have two options, do those steps only if you trust the source of the checkpoint. 

在 `tools/demo/demo.py` 开头添加以下代码：

```python
import functools
torch.load = functools.partial(torch.load, weights_only=False)
```

#### 报错找不到 CUDA：

添加 CUDA 安装路径到 LD_LIBRARY_PATH：

```bash
export LD_LIBRARY_PATH=/home/hep/miniconda3/envs/gvhmr/lib/python3.10/site-packages/nvidia/cu13/lib:$LD_LIBRARY_PATH
```

#### 报错找不到 ffmpeg

通过 `apt` 安装 ffmpeg：

```bash
sudo apt install ffmpeg
```

#### 提示找不到 SMPL_NEUTRAL.pkl

更改 `GVHMR/inputs/checkpoints/body_models/smpl` 中的模型分别为：

- `SMPL_FEMALE.pkl`
- `SMPL_MALE.pkl`
- `SMPL_NEUTRAL.pkl`

> 其在文件命名中有所体现。如：`l`,`f`,`neutral`。

#### 其他错误

考虑 `inputs/` 文件夹中的插件是否安装完整：

```bash

inputs/checkpoints/
├── body_models/smplx/
│   └── SMPLX_{GENDER}.npz # SMPLX (We predict SMPLX params + evaluation)
└── body_models/smpl/
    └── SMPL_{GENDER}.pkl  # SMPL (rendering and evaluation)

inputs/checkpoints/
├── dpvo/
│   └── dpvo.pth
├── gvhmr/
│   └── gvhmr_siga24_release.ckpt
├── hmr2/
│   └── epoch=10-step=25000.ckpt
├── vitpose/
│   └── vitpose-h-multi-coco.pth
└── yolo/

```

<!-- ## GVHMR

pip install "git+https://github.com/facebookresearch/pytorch3d.git" --no-build-isolation
pip install chumpy --no-build-isolation

更改requirements.txt 改pytorch版本

在 tools/demo/demo.py 添加

```python
import functools
torch.load = functools.partial(torch.load, weights_only=False)
```

官方插件inputs/安装完整！

export LD_LIBRARY_PATH=/home/hep/miniconda3/envs/gvhmr/lib/python3.10/site-packages/nvidia/cu13/lib:$LD_LIBRARY_PATH

SMPL 命名

sudo apt install ffmpeg

python tools/demo/demo.py --video=docs/example_video/tennis.mp4 -s -->

### GMR

[GMR](https://github.com/YanjieZe/GMR) 用于将人类的动作实时、高质量地同步（重定向）到各种不同的类人机器人上。其可以将 `GVHMR` 生成的 `.pt` 文件转化为绑定在特定机器人（如 `Unitree-G1`）上的关节空间轨迹数据。

首先从 GitHub 上落取仓库：

```bash
git clone https://github.com/YanjieZe/GMR.git
```

然后依照 [官方教程](https://github.com/YanjieZe/GMR) 安装。

安装后需要在 `assets/body_models/smplx` 中粘贴前一步骤下载的 SMPLX 的三个 `.pkl` 文件：
- `SMPLX_NEUTRAL.pkl`
- `SMPLX_FEMALE.pkl`
- `SMPLX_MALE.pkl`

### Unitree_rl_mjlab

mjlab 是新型的开源机器人强化学习（RL）框架。其结合了 MuJoCo Warp（MuJoCo 的 GPU 加速版本），借鉴了 IsaacLab 的 Manager-based API，且足够轻量。其内部集成了一个官方维护的 BeyondMimic 的复现版本（Reproduction）。

BeyondMimic 是一个由 UC Berkeley 发布的通用类人机器人控制框架，是目前类人机器人领域最前沿的动作模仿与生成框架之一。

Unitree 公司对 mjlab 进行了改进适配。

此部分安装参见 [另一篇文章](./基于%20mjLab%20的强化学习示例.md)。

## 工作流程

本文以 GVHMR 示例视频为例，展示整个工作流程。

### 从视频流生成三维运动特征

进入 GVHMR 文件夹，并激活 gvhmr 环境。

运行以下命令，对 `docs/example_video/tennis.mps` 进行三维运动特征提取：

```bash
python tools/demo/demo.py --video=docs/example_video/tennis.mp4 -s
```

其中 `demo.py` 为示例提供的训练脚本，`tennis.mp` 为训练视频源。运行完毕并没有错误后，其会在 `outputs/demo/tennis` 中生成结果（该路径会在日志中提示）：

- hmr4d_results.pt
- *.mp4

其中的 `pt` 文件就是生成的三维运动特征文件，体现为 PyTorch 权重。一系列 mp4 文件显示了原视频以及提取的三维特征示意：

<video controls src="./assets/机器人动作强化学习 mjLab 仿真部署/tennis_3_incam_global_horiz.mp4" title="Title"></video>

### 将三维运动特征权重文件绑定实体

这一部根据根据不同的机器人模型，生成关节空间轨迹数据。

进入 GMR 文件夹，并激活 gmr 环境。

运行以下命令，从 GVHMR 提取的三维人体运动特征映射到 Unitree G1 的物理关节上，生成对应的 `pkl` 文件。

```bash
python scripts/gvhmr_to_robot.py --gvhmr_pred_file <path_to_hmr4d_results.pt> --robot unitree_g1 --record_video --save_path motions/G1/G1.pkl
```

> 必须提供 `--save_path` 参数，以声明生成文件的保存位置。

然后，将该 `pkl` 文件转化为 `csv` 文件，用于 mjlab 读取：

```bash
python scripts/batch_gmr_pkl_to_csv.py --folder motions/G1/
```

> 以上步骤的完成建立在 SMPLX 正确放置的前提下。

### 利用 mjlab 进行强化学习

进入 unitree_rl_mjlab 文件夹，激活 unitree_rl_mjlab 环境。

运行以下命令将上一步生成的 `csv` 文件转化为 `npz` 文件：

```bash
python scripts/csv_to_npz.py --input-file src/assets/motions/g1/G1.csv --output-name G1.npz --input-fps 30 --output-fps 50
```

然后运行以下命令进行训练：

```bash
python scripts/train.py Unitree-G1-Tracking --motion_file=src/assets/motions/g1/G1.npz --env.scene.num-envs=4096
```

其会要求注册并填写 wandb 的 API，这是用于远程监控训练进度：

![alt text](<assets/机器人动作强化学习 mjLab 仿真部署/image-1.png>)

> 训练进度如果较慢，可以适当降低 `--env.scene.num-envs` 的值，但是效果可能会相应受影响。

在训练完成后，其会在 `logs/rsl_rl/g1_tracking/2026-xx-xx_xx-xx-xx/` 中生成相应文件：

- `model_0.pt` 初始化的随机模型
- `model_500.pt` 训练到 500 次迭代的快照
- `model_*.pt` 最新迭代的快照
- `policy.onnx` 包含从观测输入（Observations）到动作输出（Actions）的计算图，是纯策略网络模型，作为训练结果
- `2026-xx-xx_xx-xx-xx.onnx` 带有时间戳的备份文件
- ...

运行以下命令，使用 MuJoCo 展示训练效果：

```bash
python scripts/play.py Unitree-G1-Tracking --motion_file=src/assets/motions/g1/dance1_subject2.npz --checkpoint_file=logs/rsl_rl/g1_tracking/2026-xx-xx_xx-xx-xx/model_xx.pt
```

![alt text](<assets/机器人动作强化学习 mjLab 仿真部署/image.png>)

<!-- 记得安装 SMPLX

python scripts/gvhmr_to_robot.py --gvhmr_pred_file <path_to_hmr4d_results.pt> --robot unitree_g1 --record_video --save_path motions/G1/G1.pkl

必须有 --save_path 参数


导出为 CSV 文件：
python scripts/batch_gmr_pkl_to_csv.py --folder motions/G1/ -->

<!-- ## Unitree_rl_mjlab

python scripts/csv_to_npz.py --input-file src/assets/motions/g1/G1.csv --output-name G1.npz --input-fps 30 --output-fps 50

python scripts/train.py Unitree-G1-Tracking --motion_file=src/assets/motions/g1/G1.npz --env.scene.num-envs=4096

python scripts/play.py Unitree-G1-Tracking --motion_file=src/assets/motions/g1/dance1_subject2.npz --checkpoint_file=logs/rsl_rl/g1_tracking/2026-xx-xx_xx-xx-xx/model_xx.pt -->

## 参考链接

[Unitree_rl_mjlab](https://github.com/unitreerobotics/unitree_rl_mjlab)

[GMR](https://github.com/YanjieZe/GMR)

[GVHMR](https://github.com/zju3dv/GVHMR/)

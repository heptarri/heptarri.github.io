# Unitree-MuJoCo 仿真环境搭建

Unitree 为在虚拟环境下调试机器人，提供了一套基于 Google DeepMind MuJoCo 的仿真环境。

> MuJoCo 是一套开源的物理引擎，提供一系列物理效果。

Unitree-MuJoCo 是一个基于 Unitree SDK 和 MuJoCo 开发的模拟器，其可以集成 Unitree SDK 2、Unitree ROS 2 开发的控制程序到模拟器中，实现无缝过渡。

> 本文默认使用 C++ / ROS 2 for C++ 搭建。官方教程为 Ubuntu 20.04/22.04 + ROS Foxy，笔者实测 Ubuntu 24.04 + ROS Jazzy 同样可行。

## 基础环境搭建

首先需要安装 Unitree SDK 2。

### 依赖关系

```bash
sudo apt install libyaml-cpp-dev libspdlog-dev libboost-all-dev libglfw3-dev
```

### Unitree SDK 2
```bash
git clone https://github.com/unitreerobotics/unitree_sdk2.git
cd unitree_sdk2/
mkdir build
cd build
cmake .. -DCMAKE_INSTALL_PREFIX=/opt/unitree_robotics
sudo make install
```

### MuJoCO
在 [MuJoCo 官方下载页面](https://github.com/google-deepmind/mujoco/releases) 下载最新的 Release，解压到 `~/.mujoco` 目录。然后将其软链接到 `unitree_mujoco/simulate/mujoco` 中：

```bash
cd unitree_mujoco/simulate/
ln -s ~/.mujoco/mujoco-3.3.6 mujoco
```

然后进行编译：

```bash
cd unitree_mujoco/simulate
mkdir build && cd build
cmake ..
make -j4
```

此时会出现报错，提示缺少 `uint8_t` 等基础类型。这是因为在 `unitree_mujoco/simulate/src` 中的一个文件缺少头文件的引用。

在 `unitree_mujoco/simulate/src/joystick/jstest.cc` 中，添加头文件：

```cpp
#include <cstdint>
```

即可解决问题。

## 运行仿真环境

在 `unitree_mujoco/simulate/build` 目录下运行：

```bash
./unitree_mujoco -r g1
```

即可打开 MuJoCo 仿真器。可能会遇到以下报错：

```bash
unitree_mujoco: ./src/core/ddsc/src/dds_write.c:318: dds_writecdr_impl_common: Assertion `(wr->m_iox_pub == NULL) == (d->a.iox_chunk == NULL)' failed.

unitree_mujoco： ./src/core/ddsc/src/dds_write.c：318： dds_writecdr_impl_common： 断言 '（wr->m_iox_pub == NULL） == （d->a.iox_chunk == NULL）' 失败。

已中止 (核心已转储)
```

这是由于 ROS2 和 CycloneDDS 环境冲突。可以通过清理在运行环境中的相关变量解决：

```bash

# Clear ROS2 environment
unset ROS_DISTRO AMENT_PREFIX_PATH CMAKE_PREFIX_PATH LD_LIBRARY_PATH

# Minimal paths
export LD_LIBRARY_PATH=/usr/local/lib:/usr/lib/x86_64-linux-gnu

# Disable Iceoryx in CycloneDDS
export CYCLONEDDS_URI='<CycloneDDS><Domain><Iceoryx><Enable>false</Enable></Iceoryx></Domain></CycloneDDS>'

# Run
cd unitree_mujoco/simulate/build
./unitree_mujoco -r go2
```

即可运行起仿真环境。

## 运行示例

Unitree_MuJoCo 提供了一系列 examples 用于测试。进入 `unitree_mujoco/examples/cpp`，运行以下命令编译启动：

```bash
mkdir build && cd build
cmake ..
make -j4

./stand_go2
```

即可启动。可以观察到，在 MuJoCo 仿真环境中，机器人缓慢站立。

> 在此之前也有可能需要清理 ROS 环境。Unitree-MuJoCo 仅给出了 Go2 的例程，G1 需要进行更改。

## 参考链接

[Unitree SDK 2](https://github.com/unitreerobotics/unitree_sdk2)

[Unitree Mujoco](https://github.com/unitreerobotics/unitree_mujoco)

[Issue 103: Unitree Mujoco](https://github.com/unitreerobotics/unitree_mujoco/issues/103)


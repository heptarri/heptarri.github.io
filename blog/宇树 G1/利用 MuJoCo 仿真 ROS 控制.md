# 利用 MuJoCo 仿真 ROS 控制 G1 机器人

在 [搭建了 Unitree-MuJoCo 仿真环境](./Unitree-MuJoCo%20仿真环境.md) 的基础上，我们可以编写 ROS 信息并桥接到 MuJoCo 中进行仿真。具体方法如下。

## 环境准备

首先需要编译 `Unitree-ROS2` 包，并将其加入到环境变量中调用。这会覆盖掉本机的 ROS2 环境（ROS2 Jazzy），并引入新的 Package 等。

```bash
source ~/unitree_ros2/setup.sh
cd example/ros2
colcon build
```

然后 source `setup_local` 包，运行编译后的 ROS 程序。

## 运行 MuJoCo 示例程序

```bash
source ~/unitree_ros2/setup_local.sh
export ROS_DOMAIN_ID=1
./install/stand_go2/bin/stand_go2
```

> MoJuCo 可能会没有反应。尝试将 `unitree_mujoco/simulate/config.yaml` 中的 `interface` 字段设置为 `lo`，即回环模式。

> unitree_ros2 中的 `setup.sh` 与 `setup_local.sh` 的区别就是其 `NetworkInterface` 中 `name` 字段不同。`setup_local.sh` 为 `lo` 用于回环，`setup.sh` 中为连接机器人的实际设备地址，如 `enp3s0`。

> Unitree_ROS2 Examples 中的 CMakeLists.txt 编写方式和通用 ROS2 不同，所以不可以通过 `ros2 run` 的方式运行。Examples 中的方式为：

```cmake
install(TARGETS 
        stand_go2
        ${PROJECT_NAME})
```

> 若想使用通用的方法即 `ros2 run`，可以更改为：

```cmake
install(TARGETS 
        stand_go2
        DESTINATION lib/${PROJECT_NAME})
```

## 运行 Unitree ROS2 示例程序

在 `unitree/unitree_ros2/example` 中存在一系列示例，包含了 G1 在内的众多型号。

首先需要运行 MuJoCo 仿真环境：

```bash
cd unitree_mujoco/simulate/build
./unitree_mujoco -r g1
```

进入 Unitree ROS2 示例目录 `unitree_ros2/example`,编译并运行：

```bash
colcon build
source install/setup.sh
./install/unitree_ros2_example/bin/g1_ankle_swing_example 
```

如果发现 MuJoCo 中机器人没有动作，设置 `ROS_DOMAIN_ID` 值：

```bash
export ROS_DOMAIN_ID=1
```

然后重新运行 `./install/unitree_ros2_example/bin/g1_ankle_swing_example `。

## 参考链接

[Unitree Mujoco](https://github.com/unitreerobotics/unitree_mujoco)

[Unitree ROS 2](https://github.com/unitreerobotics/unitree_ros2/)

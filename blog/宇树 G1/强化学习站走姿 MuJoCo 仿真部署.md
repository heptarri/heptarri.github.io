# 强化学习站、走姿的 MuJoCo 仿真部署

Unitree 在 GitHub 上开源了 Reinforce Learning 相关仿真的模型和例程。可以借此利用 MuJoCo 仿真工具实现对强化学习后 G1 形态的仿真。

## 环境搭建

首先 Git clone 该仓库：

```bash
git clone https://github.com/unitreerobotics/unitree_rl_lab.git
```

> 需要注意的是，我们并不需要安装 IsaacLab 就可以进行站/走姿的部署。训练部分会在其它文档（待补充）中提到。

在 [安装好 MuJoCo 仿真环境](./Unitree-MuJoCo%20仿真环境.md) 和 [Unitree SDK 2](https://github.com/unitreerobotics/unitree_sdk2) 后，进入 `deploy` 文件夹，对相应的模型进行编译。

```bash
cd unitree_rl_lab/deploy/robots/g1_29dof
mkdir build && cd build
cmake .. && make
```

然后打开 `unitree_mujoco/simulate/config.yaml`,对其进行以下设置：

- 将 `robot` 设置为 `g1`
- 将 `domain_id` 设置为 `0` 
- 将 `use_joystick` 设置为 `1`
- 将 `enable_elastic_band` 设置为 `1`
- 将 `joystick_type` 和 `joystick_device` 设置为对应的硬件设备型号。

以上操作设定机器人模型为 G1 模型，将 ROS 域 ID 设置为 0,并且设置使用虚拟绑带（防止跌到）和手柄控制。

> 手柄的具体设备地址可以通过命令 `ls /dev/input/js*` 查看。地址每次可能有所不同。

> 必须使用手柄，且是 Xbox 和 Switch 其中一个。

一个可能的配置文件如下：

```yaml
robot: "g1"  # Robot name, "go2", "b2", "b2w", "h1", "go2w", "g1"
robot_scene: "scene.xml" # Robot scene, /unitree_robots/[robot]/scene.xml 

domain_id: 0  # Domain id
interface: "lo" # Interface 

use_joystick: 1 # Simulate Unitree WirelessController using a gamepad
joystick_type: "xbox" # support "xbox" and "switch" gamepad layout
joystick_device: "/dev/input/js0" # Device path
joystick_bits: 16 # Some game controllers may only have 8-bit accuracy

print_scene_information: 1 # Print link, joint and sensors information of robot

enable_elastic_band: 1 # Virtual spring band, used for lifting h1
```

启用 `unitree_mujoco`，可以发现一 G1 机器人模型悬挂在空中。这是
虚拟绑带的作用。

![alt text](<assets/强化学习站走姿 MuJoCo 仿真部署/image.png>)

然后进入 `unitree_rl_lab/deploy/robots/g1_29dof/build` ，文件夹，执行：

```bash
./g1_ctrl -n lo
```

如果连接成功，其终端会输出以下内容：

```bash
 --- Unitree Robotics --- 
     G1-29dof Controller 
1773373056.315180 [0]    g1_ctrl: selected interface "lo" is not multicast-capable: disabling multicast
[2026-03-13 11:37:36.616] [info] Waiting for connection to robot...
[2026-03-13 11:37:36.816] [info] Connected to robot.
[2026-03-13 11:37:36.917] [info] Initializing State_Passive ...
[2026-03-13 11:37:36.917] [info] Initializing State_FixStand ...
[2026-03-13 11:37:36.917] [info] Initializing State_Velocity ...
[2026-03-13 11:37:36.917] [info] Policy directory: /home/hep/workspace/unitree/unitree_rl_lab/deploy/robots/g1_29dof/config/policy/velocity/v0
[2026-03-13 11:37:36.933] [info] Initializing State_Mimic_Dance_102 ...
[2026-03-13 11:37:36.933] [info] Policy directory: /home/hep/workspace/unitree/unitree_rl_lab/deploy/robots/g1_29dof/config/policy/mimic/dance_102/
[2026-03-13 11:37:36.946] [info] Loaded motion file 'G1_Take_102.bvh_60hz' with duration 29.15s
[2026-03-13 11:37:36.950] [info] Initializing State_Mimic_Gangnam_Style ...
[2026-03-13 11:37:36.950] [info] Policy directory: /home/hep/workspace/unitree/unitree_rl_lab/deploy/robots/g1_29dof/config/policy/mimic/gangnam_style/
[2026-03-13 11:37:36.964] [info] Loaded motion file 'G1_gangnam_style_V01.bvh_60hz' with duration 32.37s
[2026-03-13 11:37:36.967] [info] FSM: Start Passive
Press [L2 + Up] to enter FixStand mode.
And then press [R1 + X] to start controlling the robot.

```

其提示使用手柄按键 [L2 + Up] 让其进入站立模式，使用 [R1 + X] 开始控制。

> L2（在Xbox 上为 LT）为握持状态下左手食指下侧的按钮（扳机键），Up 为左侧圆盘按钮的向上键，R1（在Xbox 上为 RB）是右手食指上侧的按钮。X 在按钮上有标识。

按下后可以发现机器人形态有所变化（跳动）。

逐步放下并松开虚拟绑带，可以发现其站立在地面上。

> 按键 7 为上升绑带，8 为下降，9 为松开。

![alt text](<assets/强化学习站走姿 MuJoCo 仿真部署/image-1.png>)

使用左侧摇杆控制其移动。
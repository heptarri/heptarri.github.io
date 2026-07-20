# Simulink 联合 ROS 进行 MBD 开发

可以利用 Simulink 联合 MATLAB ROS Toolbox，实现在 Simulink 中设计模型、与 ROS API 交互并一键部署。

作为开发环境，笔者在 Ubuntu 24.04 上安装了 MATLAB 2026a 及其全部工具包、ROS2 Jazzy、GCC 13.3。MATLAB 同时还支持远程调试，即在 Windows 机上设计模型，将代码生成在网络上的远程工控机上。

## 本机代码生成与编译

进入 MATLAB，新建 Simulink 空模型。在建模 → 库浏览器中找到 ROS Toolbox。下拉菜单中有 Publish、Subscribe 等常用的 ROS API 用来交互。如下图所示。

![](assets/Pasted%20image%2020260719160501.png)

根据 Simulink 开发经验，搭建以下模型作为测试。

![](assets/Pasted%20image%2020260719160548.png)

![](assets/Pasted%20image%2020260719160600.png)

> 该部分代码中包含一个函数触发子系统（Function-Call Subsystem），触发源为 Function-Call Generator。其中包含了一个 Bus 总线（这是 ROS Toolbox 所要求的）。Bus 总线由 Blank Message 模块提供，类型需要和 Publisher 一致。data 为传输的数据。该子系统输出的总线最终被 Publish 模块发送为 ROS 话题。

ROS Toolbox 提供了一系列设置用于对生成的代码进行控制。在顶栏 App 中选择 ROS 并打开相关标签页。可以在其中选择 ROS1/2、在何处部署（本地部署即为 localhost）、什么样的节点等等。我们在最后一项的下拉菜单中选择 Generate Code。

这之中可能遇到一系列错误，最典型的是 Python 版本不匹配。可以通过以下方式安装合适版本（3.9.x/3.10.x）的 Python：

```bash
curl https://pyenv.run | bash

export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
source ~/.bashrc

pyenv install 3.9.18
```

以上代码安装了 pyenv 工具，并用其安装了 python 3.9.18，位置在 `~/.pyenv/versions/3.9.18/bin/python` 。通过 MATLAB 报错提示就可以选择这个版本的 Python。

如果遇到点击 Generate Code 闪退的问题，运行：

```bash
sudo locale-gen en_US.UTF-8
sudo update-locale LANG=en_US.UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

即可解决。这是由于编码问题导致的。

可以看到，点击 Generate Code 后，其生成了一系列文件：

![456](assets/Pasted%20image%2020260719160628.png)

我们只需要关注其中 `src/` 中的代码。Simulink 会从 model_ert_rtw 中 复制代码到这里，构建起一个可以被编译运行的 ROS2 Colcon 项目（可以更改为其他构建工具，如下图）。

![](assets/Pasted%20image%2020260719160649.png)

`src/` 文件夹的结构如下图：

![292](assets/Pasted%20image%2020260719160659.png)

在 `src/model/CMakeLists.txt` 的后半段把下面的内容注释：

```bash
"/usr/local/MATLAB/R2026a/sys/os/glnxa64/orig/libstdc++.so.6"
```

之后，进入 `src/model`  目录，运行 `colcon build` 编译、`ros2 run` 运行，可以发现其是一个完整可编译运行的 ROS 节点，如下图所示。

![](assets/Pasted%20image%2020260719160713.png)

通过 `ros2 topic echo` ，可以发现其稳定地向 `/my_topic` 话题发布数据。

![](assets/Pasted%20image%2020260719160722.png)

## 远程代码生成与编译

笔者在 Windows 11 下安装 MATLAB 2025b 及其全部工具箱用于进行模型设计和编译，并远程下载到一台装有 Ubuntu 24.04 的工控机设备上。工控机安装了 ROS2 Jazzy。

首先，利用局域网或者广域网的方式，将工控机和本机连接（即可以通过 SSH/TCP/IP 访问）。之后，在 Simulink → ROS → CONNECT 中，选择 Deploy to Remote Devices，点击下拉菜单中 Remote Device Manage，打开远程设备管理器。

![](assets/Pasted%20image%2020260719160735.png)

在此处，可以填写设备 IP、用户名密码、ROS2 安装地址、ROS2 工作空间等信息。

![](assets/Pasted%20image%2020260719160743.png)

> 需要注意的是，ROS2 的命名空间可以是已经存在的项目。此时，Simulink 在下载代码到设备上时会自动将代码放入 `ros2_ws/src/<model name>`  文件夹中，和现有代码共存。
> 

之后，点击 Test Connection 按钮，测试连接情况。

![](assets/Pasted%20image%2020260719160751.png)

如果此前没有创建 ros2 工作目录，其会提示创建目录，点击修复（fix）即可。

如果看到 `Done with connection test.` 字样，表示连接成功。

依旧准备好在上一节中的模型（如下图所示）。

![](assets/Pasted%20image%2020260719160759.png)

在顶栏 ROS 页面的”部署“栏目，选择 Build & Run：

![](assets/Pasted%20image%2020260719160807.png)

Simulink 会生成代码、将代码下载到远程设备上，并利用在模型设置中的编译工具（Colcon build）进行编译，如下图所示。

![](assets/Pasted%20image%2020260719160815.png)

此时，进入工作空间中，可以发现代码已经被下载到 `ros2_ws/src/<model name>` 文件夹下。

![](assets/Pasted%20image%2020260719160824.png)

编译运行，发现符合预期。

![](assets/Pasted%20image%2020260719160831.png)

![](assets/Pasted%20image%2020260719160837.png)
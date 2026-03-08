# STM32Cube for VS Code 插件

STM32Cube 系列 HAL 库工具包为 Visual Studio Code 提供了一系列插件，用于在 VS Code 下进行 STM32 系列单片机开发。

## 插件安装

在 VS Code 左栏搜索 STM32CubeIDE for Visual Studio Code，点击安装 Extension Pack 的全部内容。其中的 STM32Cube Clangd 会和 C/C++ 插件产生冲突，选择忽略。安装后，在左栏会显示 STM32Cube 图标和 CMake 图标等。

## 项目配置

首先，需要在 STM32CubeMX 中配置文件，这一点在此不在概述。插件需要 CubeMX 生成的 .ioc 文件和 CMake 相关构建配置文件。

在 STM32CubeMX 生成代码时，需要选择生成的 IDE 为 CMake，如图所示。

![alt text](<assets/STM32Cube for VS Code 插件/image.png>)

然后，在生成的目录下打开 VS Code，进入到左栏 STM32Cube 中。右下角会提示检测到有 STM32CubeMX 项目，选择打开。或者，其会自动加载 CMakeLists.txt 文件。

CubeMX 生成的 `main.c` 文件在目录 `Core/Src` 中。

在左栏选择 CMake，会出现 Project Status、Project Outline 等信息，如下图所示。

![alt text](<assets/STM32Cube for VS Code 插件/image-1.png>)

选择 Project Outline 中对应项目（Nucleo_LED）,选择右侧的 Build 按钮进行编译构建。如上图所示。如无任何报错则证明构建成功。

找到位于文件夹 `build/Debug` 中的 `Nucleo_LED.map` 文件，右键选择 `Open Memories Analysis`，即可查看对于该芯片的内存分析，如图所示。

![alt text](<assets/STM32Cube for VS Code 插件/image-6.png>)

## 调试

点击左栏 Run and Debug，进入运行调试界面。创建新的 `launch.json`，新建配置 `STM32Cube: STM32 Launch ST-Link GDB Server`。新建后界面如图所示。

![alt text](<assets/STM32Cube for VS Code 插件/image-2.png>)

点击绿色按钮运行。此时会进入调试界面，如图所示。

![alt text](<assets/STM32Cube for VS Code 插件/image-3.png>)

在顶栏中的七个按钮分别为重新开始（软件复位）、全速仿真、步入、步进、步出、重新开始、停止。左侧可以观察其变量、CPU 寄存器值，也可以看调用堆栈、断点等，如图所示。

![alt text](<assets/STM32Cube for VS Code 插件/image-5.png>)

在左栏最下侧的 STM32CUBE REGISTERS TREE 中，可以看到该芯片所有外设的寄存器值，如图所示。

![alt text](<assets/STM32Cube for VS Code 插件/image-4.png>)


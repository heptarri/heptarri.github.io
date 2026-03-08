# Zephyr IDE 工具

Zephyr 为众多 IDE 提供了辅助工具用于开发，其中在 Visual Studio Code 中提供了 Zephyr IDE Extension 作为拓展提供项目构建、调试、下载、分析等众多功能。

## 安装与配置

在 VS Code 左栏“插件”界面搜索 Zephyr IDE Extension Pack 并安装。其由 mylonics 发行。安装后，左栏将出现“Zephyr”图标，如下图所示：

![alt text](<assets/Zephyr IDE 工具/image.png>)

点击其会出现五个栏目：

- Zephyr IDE and Workspace Setup
- West Workspaces
- Projects
- Project Config
- Active project

首先点击 `Zephyr IDE and Workspace Setup` 栏目中的 `Zephyr IDE Configuration`，进入 Host Tools、Workspace、SDK 的配置。理论上，如果按照笔者的文档或者官方文档进行正确的配置并打开 `zephyrproject` 根目录作为 VS Code 工作目录，这三者应该是配置好的。

此时，在 West Workspaces 中，应该会出现 `zephyrproject` 行，指示安装完成。

## 配置项目

在 Projects 栏点击右侧第二个按钮 `Create Project from Template`，可以选择某个模板作为新建项目，如图所示：

![cpft](<assets/Zephyr IDE 工具/image-1.png>)

搜索并选择 Blinky Sample，新建项目。其会在左侧 Projects 栏显示，右侧会自动打开 `main.c` 。其中有调用 `led0` 闪烁的代码。点击左侧项目 `blinky` 右侧的 + 号，新建 Build。此时可以选择目标开发板，用于进行针对平台的构建。此处选择 `nucleo_f411re`。 继续点击 Build 右侧的 + 号，新建 Runner。此时可以选择烧录设备，用以向设备烧录代码和调试。此处添加 `stm32cubeprogrammer`，即 ST Link。最后效果如图所示。

![xiaoguo](<assets/Zephyr IDE 工具/image-2.png>)

鼠标悬浮在 Build 上会显示构建、从头构建、Menu Config 设置等，鼠标悬浮在 Runner 上会显示 Flash 烧录功能。

每个项目可以新建多个 Build 用以在多个平台进行开发，每个 Build 可以选择多个不同的烧录器和调试探针用以进行烧录调试工作。

在 Projects 下方有栏目 Project Config，其显示了需要用到的多种配置文件的直接跳转入口，如图所示。

![alt text](<assets/Zephyr IDE 工具/image-3.png>)

在 blinky 下，其中 main 为 `main.c` 文件，即业务逻辑的源文件；CMake 为该项目的 CMakeLists.txt，即 CMake 构建配置文件；KConfig 为针对该项目的 KConfig 配置文件， DTC Overlay 为针对原有 board 设备树的覆盖文件，用以进行硬件资源的自定义。

在 build/nucleo_f411re 下，其中 Board 为该开发板（Nucleo_F411RE）的 DTC 设备树文件，Board Dir 为该开发板对应芯片（SoC）的 DTC 设备树文件。其他的 Args 作用不再赘述。

其中不存在的内容可以通过点击右侧的 + 号新建。

在 Active Project 栏目（即打开项目后的 BLINKY:BUILD/NUCLEO_F411RE 栏目），可以进行以下操作：

- Build Pristine：全量编译
- Build： 增量编译
- Flash： 烧录
- Debug： 调试
- ...

其中 Debug 功能需要进行特殊配置。

## 调试项目

在 VS Code 左侧 `Run and Debug` 页面，点击 `create a launch.json file`，新建一个配置文件，在其中点击 `Add Configuration`，选择 `Zephyr IDE: Debug openOCD`，新建一个调试配置。

![alt text](<assets/Zephyr IDE 工具/image-4.png>)

修改其 `configFiles` 中 `"target/nrf52.cfg"` 为 `"target/stm32f4x.cfg"`。

此时，`launch.json` 文件如下所示：

```json
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Zephyr IDE: Debug",
            "cwd": "${workspaceFolder}",
            "gdbPath": "${command:zephyr-ide.get-gdb-path}",
            "executable": "${command:zephyr-ide.get-zephyr-elf}",
            "request": "launch",
            "type": "cortex-debug",
            "servertype": "openocd",
            "configFiles": [
                "interface/stlink.cfg",
                "target/stm32f4x.cfg"
            ],
            "rtos": "Zephyr",
            "searchDir": [],
            "runToEntryPoint": "main",
            "showDevDebugOutput": "none",
            "rttConfig": {
                "enabled": true,
                "address": "auto",
                "rtt_start_retry": 1000,
                "decoders": [
                    {
                        "label": "RTT channel 0",
                        "port": 0,
                        "type": "console"
                    }
                ]
            }
        }
    ]
}
```

此时，在 Zephyr IDE 可以看到 Debug 行后面出现提示：`Zephyr IDE: Debug`。点击，进行调试。

![debug](<assets/Zephyr IDE 工具/image-5.png>)

在顶栏中的七个按钮分别为重新开始（软件复位）、全速仿真、步入、步进、步出、重新开始、停止。左侧可以观察其变量、CPU 寄存器值，也可以看调用堆栈、断点等。

在底栏的 XRTOS 中，可以启用 RTOS 感知，实时监测线程的内存占用情况，如图所示。

![XRTOS](<assets/Zephyr IDE 工具/image-6.png>)
# Keil RTE 工具配置项目

Keil RTE (Run-time Environment) 是 MDK 工具链的核心组件之一。其是一种基于 CMSIS-Pack 标准的管理机制，允许使用库管理器的方式引入新的软件组件。开发者可以通过这种方式引入众多软件组件（比如 RTOS、FS、各驱动程序等），自动集成到工程中。

本文在 Nucleo_F411RE 开发板的基础上，介绍了如何利用 Keil RTE 工具集成 CubeMX HAL 库。

## 项目配置

打开 Keil，新建项目。此时，Keil 会自动打开 RTE 工具。手动打开的方式如下图所示。

![alt text](<assets/Keil RTE 工具/image.png>)

RTE 工具中列举了已经下载的软件组件。如下图所示。

![alt text](<assets/Keil RTE 工具/image-1.png>)

在下载 STM32F4XX_DFP 的过程中，Keil 自动安装了 Device 系列组件，即芯片厂商提供的设备相关软件组建。展开，即可找到 CubeMX 组件。勾选，并点击右侧的启动按钮。

![alt text](<assets/Keil RTE 工具/image-2.png>)

此时，Keil 会自动打开 CubeMX 软件，并新建 CubeMX 配置文件在项目文件夹中。进行 HAL 库配置并生成代码后，Keil 会在 Keil Project 配置文件的文件目录结构中添加对应生成 HAL 库头、源文件的位置，如图所示。

![alt text](<assets/Keil RTE 工具/image-3.png>)

> 其中文件夹图标的表示由 Keil 构建的文件目录，绿色 “Pack” 图标的表示已经添加到该项目的软件组件。可以发现 Device 组件已经被添加到项目中。

编译，发现没有报错，证明已经成功引入了 HAL 库组件。这些组件存放在项目根目录下。

## 其他组件

Keil 提供了一套完善的包管理器用于进行软件组件的安装。点击 `Pack Installer` 按钮，打开包安装器（管理器）。

> Pack Installer 会在每次打开时与线上库进行同步，所以会有暂时的卡顿。

![alt text](<assets/Keil RTE 工具/image-4.png>)

左侧是按照供应商分类的设备/开发版目录，点击就可以在右侧显示适用于该平台的软件组件。

点击 STMicroelectronics 下属的 STM32F4 Series，可以看到右侧出现了平台特有（Device Specific）的 DFP 支持组件（即标准库），以及共有组件（Generic）。

![alt text](<assets/Keil RTE 工具/image-5.png>)

可以看到，支持该系列芯片的软件组件包括了：

- RTOS (ARM::CMSIS-FreeRTOS)
- 协议驱动（MDK-Packs::HTTP_Parser、MDK-Packs::PahoMQTT）
- 功能库（LVGL::lvgl、tensorflow::tensorflow-lite-micro）
- 设备驱动（MDK-Packs::QCA400x_WiFi_Driver）
- ...

用户可以根据需求下载并集成到 Keil 中。


## 开发辅助工具

Keil 在 RTE 组件的基础上提供了集成在软件内部的帮助文档。点击左栏下方的 Books 按钮。

![alt text](<assets/Keil RTE 工具/image-6.png>)

其会出现一系列的文档，分为 Device Specific 和 Generic 两部分，和 Pack Installer 中相对应。这是关于这些软件组建的文档。当在项目中引入了某个组件，其就会在 Books 页面引用这个组件的文档。双击即可查看，如图所示。

![alt text](<assets/Keil RTE 工具/image-7.png>)

当然，这部分时可以设置的。点击 Pack Installer 按钮左侧的 File Extensions, Books and Environment... 按钮，如下图所示。

![alt text](<assets/Keil RTE 工具/image-8.png>)

进入 Books 页面，就可以看到所有文档的索引。可以自行添加文档。

![alt text](<assets/Keil RTE 工具/image-9.png>)
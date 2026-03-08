# Zephyr 开发配置

本文描述了如何在 Windows 上基于 Zephyr RTOS 进行开发，以开发板 `STMicroelectronics Nucleo-F411RE` 为例，构建一个用于终端输出日志的程序。

Linux 与 Windows 基本相同，具体参见 Zephyr 官方文档。

## 环境搭建

首先，根据官方文档，安装所需要的工具，包括 Git, Python 3.12, CMake, DTC, 7z 等。

```powershell
winget install Kitware.CMake Ninja-build.Ninja oss-winget.gperf Python.Python.3.12 Git.Git oss-winget.dtc wget 7zip.7zip
```

然后，需要新建一个 Python 虚拟环境，用以安装 zephyr 的相关工具和文件目录等。同时，给该环境的 activate 激活足够的权限。然后激活这个环境。

```powershell
cd %HOMEPATH%
python -m venv zephyrproject\.venv
```

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

```powershell
zephyrproject\.venv\Scripts\Activate.ps1
```

之后，在我们新建的 Zephyr 环境中安装 west 工具，并用该工具自定义 zephyr 目录并更新：

```powershell
pip install west

west init zephyrproject
cd zephyrproject
west update
```

然后，利用 west 工具来将 Zephyr 的内容导出到 CMake 中。

```powershell
west zephyr-export
```

然后，下载 zephyr 的 Python 拓展：

```powershell
python -m pip install @((west packages pip) -split ' ')
```

到此，我们安装了 zephyr 的主要内容。然后，需要在一个新的位置安装 zephyr SDK，其中包含了各种平台相关的构建、编译工具等。

```powershell
cd $Env:HOMEPATH\zephyrproject\zephyr
west sdk install
```

> 如果命令行下载太慢，可以手动下载 [Zephyr SDK 0.17.4](https://github.com/zephyrproject-rtos/sdk-ng/releases/tag/v0.17.4) 后运行 `setup.cmd` 配置。

到此，我们的 Zephyr 环境全部配置完成。

## 新建项目

在 zephyr 目录中新建文件夹，叫做 `led_blink`,与项目名一致。然后，在其中创建文件夹 `src` 用于存储源码。在 `led_blink` 目录下新建 `CMakeLists.txt` 用于 CMake 构建编译。

`CMakeLists.txt` 内容如下。

```cmake
cmake_minimum_required(VERSION 3.20.0)

find_package(Zephyr)
project(led_blinky)

target_sources(app PRIVATE src/main.c)
```

在 `led_blink` 目录下新建 `Kconfig` 文件，内容大致如下：

```kconfig
mainmenu "Your Application Name"
source "Kconfig.zephyr"
```

新建 `prj.conf` 文件用于配置，内容大致如下：

```conf
CONFIG_CPP=y
CONFIG_WARN_EXPERIMENTAL=y
```

最后，在 `src` 文件夹中新建文件 `main.c`，并编写代码：

```c
#include <zephyr/kernel.h>
#include <zephyr/sys/printk.h>

#define PRIORITY 7
#define SLEEPTIME 500
#define STACKSIZE 1024

K_THREAD_STACK_DEFINE(thread_a_stack_area, STACKSIZE);

static struct k_thread thread_a_data;

static uint8_t cnt = 0;

void thread_a_entry_point(void* dummy1, void* dummy2, void* dummy3) {
  ARG_UNUSED(dummy1);
  ARG_UNUSED(dummy2);
  ARG_UNUSED(dummy3);

  

  while (1) {
    k_msleep(500);
    printk("Thread 1 callback\n");

    ++cnt;
  }
}

int main(void) {
  k_thread_create(&thread_a_data, thread_a_stack_area,
                  K_THREAD_STACK_SIZEOF(thread_a_stack_area),
                  thread_a_entry_point, NULL, NULL, NULL, PRIORITY, 0,
                  K_FOREVER);

  k_thread_name_set(&thread_a_data, "thread_1");
  k_thread_start(&thread_a_data);

  return 0;
}
```

打开终端，进入 `led_blink` 目录，运行以下命令构建：

```powershell
west build -b nucleo_f411re
```

没有报错（构建成功）后运行以下命令烧录到开发板中：

```powershell
west flash
```

观测串口 Uart2 `COM5 - STMicroelectronics ST Virtual Com Port`，可以发现代码传出的日志：

```txt
*** Booting Zephyr OS build v4.3.0-7236-g0be72dd4cbbc ***
Thread 1 callback
Thread 1 callback
Thread 1 callback
```

这说明我们的代码成功运行了。
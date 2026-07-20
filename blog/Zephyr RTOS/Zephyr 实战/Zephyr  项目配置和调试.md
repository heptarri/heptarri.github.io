# Zephyr 项目配置和调试

本文详细讲述了怎么从新的目录建立一个新的 Zephyr 项目。

本项目所属内容建立在 [Zephyr 入门配置](../Zephyr%20入门配置.md) 的基础上。其中部分内容在上文中有所描述。另外，建议阅读 [Zephyr 工作逻辑](../Zephyr%20工作逻辑.md)。

## 项目配置

在工作空间目录 `zephyr_ws` 目录下新建文件夹 `tmpl_prj`。这里的工作空间可以是任意的，即便他不在 `$ZEPHYR_BASE` 下。

在 `tmpl_prj` 目录下创建以下结构：

```
tmpl_prj
├── CMakeLists.txt
├── prj.conf
└── src
    └── main.c
```

这是一个完全的 CMake 项目。其中 `CMakeLists.txt` 用于 CMake 项目配置，`prj.conf` 用于对于 Zephyr 功能的裁剪和配置，`src` 目录下这是源码。

在 `CMakeLists.txt` 中添加以下内容：

```txt
cmake_minimum_required(VERSION 3.20.0)

set(BOARD qemu_riscv32)

find_package(Zephyr REQUIRED HINTS ${ENV}ZEPHYR_BASE)
project(tmpl_prj)

target_sources(app PRIVATE
	src/main.c
)
```

其利用 `find_package` 在环境变量 `ZEPHR_BASE` 中寻找 Zephyr 相关的支持包。利用 `target_sources` 组织项目内的源文件。用 `set` 来设置 CMake 变量 `-DBOARD` 指定板子类型，这里选用 `qemu_riscv32`。

> 在进行命令行操作前，需要先 `source` 安装 zephyr 的 Python 虚拟环境以使用 west。如：`source ~/zephyrproject/.venv/bin/activate`。

此时，该项目即可编译：

```sh
west build
```

此后，命令行出现以下内容：

```sh
-- west build: building application
[1/126] Preparing syscall dependency handling  

[3/126] Generating include/generated/zephyr/version.h
-- Zephyr version: 4.4.99 (/Users/hepmac/zephyrproject/zephyr), build: v4.4.0-1950-ge4f97dd49a84
[126/126] Linking C executable zephyr/zephyr.elf
Memory region         Used Size  Region Size  %age Used
             RAM:       28784 B       256 MB      0.01%
        IDT_LIST:           0 B         4 KB      0.00%
Generating files from /Users/hepmac/Workspace/zephyr_ws/tmpl_prj/build/zephyr/zephyr.elf for board: qemu_riscv32/qemu_vi
```

证明编译完成。

在 `main.c` 中编写以下内容：

```c
#include <stdio.h>
#include <zephyr/kernel.h>  

int main() {
printk("Hello, world!\n");  

return 0;
}
```

如果在 Visual Studio Code 中编写，可能会出现下划线报错。在下面点击 Quick fix 即可。

![](assets/Pasted%20image%2020260515222403.png)

其会在 C/C++ Extension 中添加 Include Path 参数，如下图所示。

![](assets/Pasted%20image%2020260515222436.png)

此时，重新运行 `west build`，然后运行 `west build -t run`，会发现其打开了 qemu，输出 `Hello, world!`。

![](assets/Pasted%20image%2020260515222603.png)

可以按下 `Ctrl A, X` 退出。

## QEMU 调试

在调试之前建议阅读文章：[GDB 调试](../../ARM%20Cortex-M/GDB%20调试.md)

根据文章描述，GDB 可以连接到 GDB server 进行远程调试。Zephyr 的调试均是以这种逻辑进行的。首先，运行以下命令。

```sh
west build -t debugserver_qemu
```

此时，west 会打开 qemu 的 debug 模式，然后监听端口 `localhost:1234`。这就是所谓的 GDB server。现在，需要一个 GDB 去和他通信。

打开 VS Code 左侧的 Run and Debug 界面。点击 `create a launch.json`。在 `configuration` 下添加以下配置：

```json
{
	"name": "(gdb) Launch",
	"type": "cppdbg",
	"request": "launch",
	"program": "${workspaceFolder}/build/zephyr/zephyr.elf",
	"args": [],
	"stopAtEntry": false,
	"cwd": "${fileDirname}",
	"environment": [],
	"externalConsole": false,
	"MIMode": "gdb",
	"miDebuggerServerAddress": "localhost:1234"
}
```

其中比较关键的参数有：

- `program`：填写编译生成的二进制文件地址
- `MIMode`：填写 `gdb`
- `miDebuggerServerAddress`：Debug Server 的地址，就是前面所说的 `localhost:1234`

为了方便调试，我们将 `main.c` 修改为带有 `while(1)` 的形式，并在 `printk` 处添加断点。此后，点击 `Start Debugging` 按钮或按 `F5`，开始调试，如下图所示。

![](assets/Pasted%20image%2020260515223647.png)

> 如果遇到断点和行号对不上的情况，检查编译优化问题。在 `prj.conf` 文件中添加：`CONFIG_DEBUG_OPTIMIZATIONS=y`。

## GDB 硬件调试

除了利用 QEMU 进行软件模拟调试外，当然可以进行硬件调试。在 `CMakeLists.txt` 中将 `BOARD` 变量改为 `nucleo_f411re` 后，删除 `build`  目录并重新编译，在 `launch.json` 中将 Debug Server 改为 `localhost:3333`。运行以下命令：

```sh
west debugserver
```

其会利用 OpenOCD 启动 GDB Server，供 VS Code 使用。然后在 VS Code 中启动调试。

![](assets/Pasted%20image%2020260515224814.png)

可以看到 Nucleo F411RE 开发板的串口中输出了 `Hello, world!`。这是设备树文件决定的。

## LLDB 调试

可以利用 Clangd + LLDB 工具链达到更好的体验，前置文章：[VS Code 使用 Clangd](../../杂项/VS%20Code%20使用%20Clangd.md)。

`launch.json` 配置如下：

```json
	{
      "type": "lldb",
      "request": "launch",
      "name": "LLDB Launch",
      "targetCreateCommands": [
        "target create ${workspaceFolder}/build/zephyr/zephyr.elf"
      ],
      "processCreateCommands": [
        "gdb-remote localhost:1234"
      ]
    }
```

之后按下 `F5` 进行调试。

## 利用 Cortex-Debug 调试

ARM Cortex 提供了 VS Code 插件用于进行硬件调试。

首先，在 VS Code 左栏 Extension 中搜索 Cortex Debug，安装。

![](assets/Pasted%20image%2020260516000516.png)

安装后在 `launch.json` 中写一个 `configuration`：

```json
{
	"cwd": "${workspaceRoot}",
	"executable": "${workspaceFolder}/build/zephyr/zephyr.elf",
	"name": "Debug with OpenOCD",
    "request": "launch",
    "type": "cortex-debug",
    "servertype": "external",
    "runToEntryPoint": "main",
    "showDevDebugOutput": "none",
    "svdFile": "/Users/hepmac/Workspace/cmsis_svd_stm32/stm32f4/stm32f411.svd",
    "gdbTarget": "localhost:3333"
},
```

其中，`svdFile` 字段为使用的芯片的 `SVD` 文件路径。这个文件中定义了外设寄存器的相关映射等硬件信息。

终端运行 `west debugserver`，在 VS Code 左侧选择配置，开始调试：

![](assets/Pasted%20image%2020260516000926.png)

可以看到其包含了更加全面的功能，包括寄存器查看、Live Watch、软件复位等。在底栏 XRTOS 页还可以查看当前线程的信息。

![](assets/Pasted%20image%2020260516113822.png)

## 资源

本文项目链接：[GitHub - heptarri](https://github.com/heptarri/zephyr_prj_tmpl)
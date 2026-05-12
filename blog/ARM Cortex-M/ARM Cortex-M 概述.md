# ARM Cortex-M 概述

在 ([STM32 外设说明](../STM32%20系列/STM32%20外设说明.md)) 中，我们尽可能详细的说明了 STM32 的芯片内部外设及其工作原理，并解释其总线信号来自于 ARM Cortex-M 核心。本部分就以 ARM Cortex-M3 为例，介绍其内部运行原理，打通从生成代码到总线发出信号的过程。

从逻辑上来讲，当在 C 语言中写下 `g_data = 0x12;` 时，通过 CMSIS提供的头文件，我们建立了代码和底层寄存器之间的逻辑关系。

> CMSIS （Common Microcontroller Software Interface Standard）是 ARM 公司为芯片厂商提供的通用标准协议，将外设等的地址转化为 C 语言的结构体和指针，统一了中断、系统 Tick 时钟等 API。

之后，在编译过程中，通过 ARM Compiler，我们将各个源文件编译为 `.o` 文件，然后链接器（Linker）根据分散加载文件（`.sct`）决定每个源文件的内容在 Flash 的具体位置，并将其合成一个镜像（`.bin` 、`.hex`、`.s19` 等等）。

> 在 GCC 体系中，分散加载文件就是链接脚本 Linker Script，后缀为 `.ld`。`.sct` 文件是在 Keil 中的特殊文件。

在烧录阶段，镜像文件被写入 Flash。

当烧录完成，按下 Reset 复位键时，硬件电路让 CPU 指向 Flash 的起始位置，那里有启动文件用 ARM Thumb-2 设置好的堆栈指针 MSP。在进行一系列处理后，运行到 `__main`。

当代码运行到 `g_data++;` 时，CPU 发出一条汇编指令 `LDR`，其根据存储器映射指向 SRAM 中的地址，进行硬件连接。

但是，对于学习方式来讲，这或许不是最好的顺序。笔者建议按照以下顺序阅读：

1. [Cortex-M 启动文件](Cortex-M%20启动文件.md)
2. [ARM 链接文件](ARM%20链接文件.md)
3. [ARM 汇编](ARM%20汇编.md)
4. [ARM 存储器映射和 CMSIS](ARM%20存储器映射和%20CMSIS.md)
5. [ARM Compiler 编译原理](ARM%20Compiler%20编译原理.md)
6. [Flash 烧录](Flash%20烧录.md)
7. [GDB 调试](GDB%20调试.md)
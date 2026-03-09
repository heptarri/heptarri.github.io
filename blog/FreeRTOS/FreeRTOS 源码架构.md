# FreeRTOS 源码架构

首先通过 Git clone FreeRTOS 源码开始：

```bash
git clone https://github.com/FreeRTOS/FreeRTOS.git
```

可以发现，其源码可以分为三个主要部分：FreeRTOS、FreeRTOS-Plus 和 Tools。

其中主要对 FreeRTOS 内容进行了解。

## 总体结构

内核源文件和演示目录包含在两个子目录中：

```c
FreeRTOS
|
+-Demo      Contains the demo application projects.
|
+-Source    Contains the real time kernel source code.
```

以下的目录说明以 FreeRTOS/Source 为根目录。

其中核心 RTOS 代码包含在三个文件中：task.c、queue.c、list.c。

同一目录包含 timers.c 和 croutine.c 可选文件，用于进行软件计时器和协程功能。

## 可移植层 （Portable）

为了支持不同的处理器架构，需要进行移植，即为 RTOS 可移植层，位于 Portable 文件夹中。

其结构为：portable/[compiler]/[architecture]

如：portable/gcc/arm_cm3，指的是利用gcc编译时，ARM Cortex-M3 架构的移植代码。

对于堆的分配方案也位于可移植层中，分配方案文件 heap_x.c 位于 portable/MemBang 文件夹中。

原因：各个嵌入式系统对于RAM和定时要求可能不同。所以相关内存分配的 API 在可移植层，便于进行特定的适配。与传统的在操作系统上运行的C语言不同，当 RTOS 需要 RAM 时，不调用 malloc() 而是 pvPortMalloc()，释放 RAM 时不调用 free() 而是 vPortFree()。

对于 MemBang 文件夹中不同文件的说明：

- heap_1 - 最简单的，不允许释放内存。
- heap_2 - 允许释放，但不会合并相邻的空闲块。
- heap_3 - 简单包装了 malloc() 和 free()，用于线程安全。
- heap_4 - 允许合并相邻的空闲块，包含了绝对地址选择。
- heap_5 - 允许合并跨越不相邻的内存区域。

> 官方认为 heap_4 是最佳选择。

## 其他文件

除此以外，Kernal 中还包含 include/ 目录，其中包含了 FreeRTOS 内核的主要头文件。

example/ 文件夹中主要包含了三个文件夹：

### cmake_example

包含了一个最小的 FreeRTOS 示例项目，使用了 template_configuration 目录中的配置文件。

对于配置文件的引用可以在 CMakeLists.txt 中看到：

```cmake
target_include_directories(freertos_config
    INTERFACE
    "../template_configuration"
)
```

### coverity

用于检查 MISRA 合规性。其中有一个用于运行 Synopsys Coverity 的项目。

### template_configuration

包含一个示例文件：FreeRTOSConfig.h。每个 FreeRTOS 项目都需要包含 FreeRTOSConfig.h 文件。

该文件用于进行某些 FreeRTOS 基础量（如：栈大小、TICK 频率等）：

```c
#define configCPU_CLOCK_HZ    ( ( unsigned long ) 20000000 )
// ...
#define configTICK_RATE_HZ                         100
// ...
#define configMAX_PRIORITIES                       5
// ...
```

总之，对于内核部分的代码，其主要结构可以总结如下：

```c
FreeRTOS
    |
    +-Source        The core FreeRTOS kernel files
        |
        +-include   The core FreeRTOS kernel header files
        |
        +-Portable  Processor specific code.
            |
            +-Compiler x    All the ports supported for compiler x
            +-Compiler y    All the ports supported for compiler y
            +-MemMang       The sample heap implementations
```
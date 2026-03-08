# FreeRTOS 移植

对于 FreeRTOS 移植，首先需要了解其源码架构：[FreeRTOS 源码架构](FreeRTOS%20源码架构.md)

也可以根据 FreeRTOS 官方的 Demo 来建立：

[FreeRTOS/FreeRTOS/Demo at main · FreeRTOS/FreeRTOS](https://github.com/FreeRTOS/FreeRTOS/tree/main/FreeRTOS/Demo)

## 移植文件

首先，将特定编译器的移植文件放到目录中。如：FreeRTOS/Source/Portable/GCC/TriCore_1782 目录中的所有两个文件。

其次，将 portable/MemBang 中的 heap_x.c 文件移植过来。

> 官方建议使用 heap_4.c 文件作为内存管理策略。

> 建议移植时保留 portable 目录的结构。

## 必要的头文件

根据官方文档，项目中必须至少包含：

- FreeRTOS/Source/tasks.c
- FreeRTOS/Source/queue.c
- FreeRTOS/Source/list.c

以下文件是根据功能需要可选的：

- FreeRTOS/Source/timers.c
- FreeRTOS/Source/event_groups.c
- FreeRTOS/Source/stream_buffer.c
- FreeRTOS/Source/croutine.c

以及以下目录中必须位于编译器的 include 路径中：

- FreeRTOS/Source/include
- FreeRTOS/Source/portable/[compiler]/[architecture]

## 配置文件

项目需要 FreeRTOSConfig.h 配置文件，对于 RTOS 内核参数进行设置。

建议寻找相同微控制架构的 Demo 进行参考。

## 官方 Demo 举例

以官方的 Demo 为例，说明项目架构：

官方将所有必要的、通用的文件放在 Demo/Common 目录下。但仅有以下几个起作用：

- include - 包含必要的头文件
- Minimal - 对于 Full 中的最小化实现
- Full - 包含了对于 FreeRTOS 各个功能的实现范例

对于示例 [CORTEX_LM3S811_GCC](https://github.com/FreeRTOS/FreeRTOS/tree/main/FreeRTOS/Demo/CORTEX_LM3S811_GCC) 而言，其在 Makefile 中引用了上述文件：

```c
RTOS_SOURCE_DIR=../../Source
DEMO_SOURCE_DIR=../Common/Minimal

CFLAGS+=-I hw_include -I . -I ${RTOS_SOURCE_DIR}/include -I ${RTOS_SOURCE_DIR}/portable/GCC/ARM_CM3 -I ../Common/include -D GCC_ARMCM3_LM3S102 -D inline=

VPATH=${RTOS_SOURCE_DIR}:${RTOS_SOURCE_DIR}/portable/MemMang:${RTOS_SOURCE_DIR}/portable/GCC/ARM_CM3:${DEMO_SOURCE_DIR}:init:hw_include
```
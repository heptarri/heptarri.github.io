# ARM Compiler 编译原理

本文描述了 ARM Compiler 怎么从 C 语言编译为 ARM 汇编语言。

以以下代码为例：

```c
#include "stm32f10x.h" // CMSIS 提供的头文件

int g_data = 0x12;    // RW Data：已初始化的全局变量
int g_bss;            // ZI Data：未初始化的全局变量

void Delay(void) {
    g_data++;
}

int main(void) {
    Delay();
    while(1);
}
```

当我们编写完这段 C 语言代码并开始编译时，编译器（如 ARM Compiler）会进行空间规划。如，`g_data` 是已经初始化的全局变量，应该放到 RW 段，`g_bss` 应该放到 ZI 段，`Delay()` 函数段应当放到 RO 段。RO 段是只读段（Read Only），我们的代码生成的汇编也会放在这里。

当编译器完成编译之后，链接器会根据分散加载文件 `.sct` 将上面这些段压缩到一起，生成一个二进制块，这就是烧录到 Flash 的内容。同时，其会插入到镜像中一些特殊的符号，用于标记一些特殊的地址。

同时，
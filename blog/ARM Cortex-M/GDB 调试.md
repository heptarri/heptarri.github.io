# GDB 调试

GDB（GNU Debugger）是 GNU 提供的调试器，其可以用来调试由 GCC 生成的程序。本文将介绍 GDB 的调试原理，解释 GDB 通过什么机制控制被调试程序的执行。

## GDB 调试模型

GDB 包含两个程序：GDB 程序和被调试程序。被调试程序可以是远程的，也可以是本地的。对于一般的 STM32 调试，往往利用的是远程调试，即 GDB 程序在本机，被调试程序在芯片上。基本的结构如下图所示。

![](assets/Pasted%20image%2020260512103148.png)

其中可视化调试程序由各 IDE 提供。与本地调试相比，其多了一个 `GdbServer` 程序，和目标程序一起运行在目标机中，如 STM32 中。GdbServer 和 GDB 之间通过网络或其他方式进行通讯，使用 RSP 协议（GDB Remote Serial Protocol）。简单而言，其有固定的开始字符 `$` 和固定的结束字符 `#`，中间为命令，在结束字符后面还有两个 16 进制的 ASCII 字符用作校验。如下图所示。

![](assets/Pasted%20image%2020260512103507.png)

## GDB 基础命令

为了完整性，本文在此简略的列出可能用到的 GDB 命令。其往往和 IDE 中的可视化按钮是对应的。

### 基本命令

|命令|简写|作用|
|---|---|---|
|`run`|`r`|运行程序|
|`start`|无|从 `main` 开始运行并停下|
|`quit`|`q`|退出 GDB|
|`help`|`h`|查看帮助|

### 断电控制

|命令|简写|作用|
|---|---|---|
|`break main`|`b main`|在函数下断点|
|`break 20`|`b 20`|在第 20 行下断点|
|`break file.c:20`|无|指定文件行断点|
|`info breakpoints`|`i b`|查看所有断点|
|`delete 1`|无|删除编号 1 的断点|
|`delete`|无|删除所有断点|
|`disable 1`|无|禁用断点|
|`enable 1`|无|启用断点|
|`clear 20`|无|删除指定行断点|
|`tbreak 20`|无|临时断点，触发一次后删除|
### 运行控制

|命令|简写|作用|
|---|---|---|
|`continue`|`c`|继续运行|
|`next`|`n`|单步执行，不进入函数|
|`step`|`s`|单步进入函数|
|`finish`|无|跑完当前函数|
|`until`|无|运行到当前循环结束|
|`jump 20`|无|跳转执行到第 20 行|
|`signal SIGINT`|无|给程序发送信号|

### 查看代码

|命令|简写|作用|
|---|---|---|
|`list`|`l`|查看源码|
|`list 20`|无|查看第 20 行附近|
|`list main`|无|查看函数源码|
|`layout src`|无|TUI 源码窗口|
|`layout asm`|无|TUI 汇编窗口|
|`layout split`|无|源码+汇编|
|`refresh`|无|刷新 TUI|

### 查看变量

|命令|简写|作用|
|---|---|---|
|`print x`|`p x`|打印变量|
|`print/x x`|无|十六进制打印|
|`print/d x`|无|十进制打印|
|`print/t x`|无|二进制打印|
|`print &x`|无|查看变量地址|
|`ptype x`|无|查看变量类型|
|`set var x=10`|无|修改变量值|
|`display x`|无|每次停下自动显示|
|`undisplay 1`|无|删除自动显示|

### 查看内存

|命令|简写|作用|
|---|---|---|
|`x/4x 0x20000000`|无|查看内存|
|`x/16bx addr`|无|按 byte 查看|
|`x/8hx addr`|无|按 halfword 查看|
|`x/4wx addr`|无|按 word 查看|
|`x/2gx addr`|无|按 64 位查看|
|`x/s addr`|无|当字符串查看|
|`x/i addr`|无|反汇编一条指令|
### 寄存器

|命令|简写|作用|
|---|---|---|
|`info registers`|`i r`|查看全部寄存器|
|`print $pc`|无|查看 PC|
|`print $sp`|无|查看 SP|
|`print $lr`|无|查看 LR|
|`set $pc=0x08000100`|无|修改 PC|
|`set $r0=1`|无|修改寄存器|

等等。


## GDB 和被调试程序

当我们调用 `arm-none-eabi-gdb test.elf` 启动 GDB 调试时，系统会建立 `gdb` 进程，并加载 `elf` 文件。这时，GDB 解析了 ELF 文件，读取了其中包含的调试信息，然后建立符号表。

> ELF 当中含有各种段信息，如 `.text` `.data` 等，GDB 会读取其中的符号表。这样，当执行 `break main` 时才知道具体 break 的地址。同时，ELF 文件中还含有 DWARF 调试信息，即源码行号和指令地址的对应关系、变量类型、栈布局、函数参数等，如 `main.c:35 → 0x0800124C`。这样，gdb 才能找到下一行、下一步具体的地址。

此时的 GDB 并没有连接硬件，只是在本地分析 ELF。当启动 OpenOCD（以此为例）时，OpenOCD 会监听 TCP 3333 端口，即 `localhost:3333`。当在 GDB 中执行 `target remote localhost:3333` 时，OpenOCD 和 GDB 建立链接。此时，GDB 是 TCP Client，OpenOCD 是 TCP Server。

当链接建立后，如上文所说，GDB 会向 OpenOCD 不断发送协议包。通常，GDB 会先发送 `qSupported` 指令，询问其支持的功能。如下所示。

```
+$qSupported:multiprocess+;swbreak+;hwbreak+;qRelocInsn+;fork-events+;vfork-events+;exec-events+;vContSupported+;QThreadEvents+;no-resumed+;xmlRegisters=i386#6a
```

其中，`+` 表示在不稳定环境中进行 Packet Acknowledgement。`qSupported:` 后面的参数是询问是否支持这些参数。OpenOCD 会给出回应：`PacketSize` 是多少，支持硬件中断等等，如下所示。

```
+$PacketSize=1024;hwbreak+;QStartNoAckMode+#57
```


再进行一系列其他的校验后，就可以进行通信了：

```
<-: $p20#d2
->: +$0020380600000000#13
```

诸如此类。

在 OpenOCD 接收到这些指令后，OpenOCD 发送给 DAP-Link（以此为例），然后 DAP-Link 将其转化为 SWD/JTAG 消息。此后，SWD/JTAG 会通过芯片上的 SWDIO/SWCLK 引脚将消息传给芯片 DP。

> 关于 DP 的概念参考 [Flash 烧录](Flash%20烧录.md)。

STM32 芯片内部的 Cortex-M 内核中存在寄存器：DHCSR，即 Debug Halting Control and Status Register。当 SWD 接收到如 `next` 的命令时，其会写 DHCSR：

```
C_STEP = 1
C_DEBUGEN = 1
```

并清除 `C_HALT`。此时，即允许 CPU 执行一步。访问寄存器等操作和 [Flash 烧录](Flash%20烧录.md) 中所描述的相似。
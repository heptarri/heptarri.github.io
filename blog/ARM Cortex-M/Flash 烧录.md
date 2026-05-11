# Flash 烧录

当我们根据 [ARM Compiler 编译原理](ARM%20Compiler%20编译原理.md) 中的描述将代码编译为 `.elf`/`.hex`/`.bin` 后，各种烧录器（如 ST-Link、J-Link 等）会将这个二进制文件烧录到芯片的 Flash 中。本文将详细描述这一过程。

根据 [ARM 存储器映射和 CMSIS](ARM%20存储器映射和%20CMSIS.md) 中的说明，我们知道，ARM 内核程序上电时会访问地址 `0x00000000`，而STM32 的程序位置起始在 `0x08000000` 处。这是由 Boot 引脚的高低电平定义决定的。CPU 在硬件上自动将程序真实的地址映射到 `0x00000000` 处。

而在 `0x08000000` 处开始存放的就是我们编译生成的二进制文件。

> 目前，市面上有多种二进制文件的格式。其中 `elf` 文件是最完整的，其包含了所有的调剂信息、段表、符号等，在调试中较为重要；`hex` 文件是带地址的文本格式，其每一行都具有地址、数据、校验，下载器可以从中知道该文件的数据应当写在哪里。`bin` 是最精简的格式，其只有裸数据，不包含地址、段和符号，所以烧录 `bin` 时应当手动指定开始的地址 `0x08000000`。

上面提到的下载器，本质上是主机和目标 CPU 之间的调试桥接器。其内部也是一块完整功能的 MCU， 其负责接收来自 PC 的指令，将其转化为 SWD 等时序，然后操作目标芯片。无论是 ST-Link、J-Link、DAP-Link，都是这样。

下面以 ST-Link 为例，从 `PC->烧录器`、`烧录器->MCU` 两个步骤来说明。

## 从 PC 到 ST-Link

当我们在 CLion 中配置好 ST-Link 下载器，点击运行/调试时，其本质上是调用了 `STM32_Programmer_CLI`，运行的命令可能类似为：

```bash
STM32_Programmer_CLI \
-c port=SWD \
-w build/app.elf \
-v \
-rst
```

其中 `-c` 表示 `connect`，指示建立和目标 STM32 之间的连接；`port=SWD` 表示利用 SWD（Serial Wire Debug）接口链接。`-w build/app.elf` 指写入（write）的文件尾 `app.elf`，`-v` 表示 `verify`，即下载后进行校验，`-rst` 表示下载后自动复位。

> 在许多编译器和 IDE（如 Keil）中，可以选择使用的接口类型，比如 SWD、JTAG 等。他们都是 ARM 的调试接口，均可以用来下载程序、调试、读写内存等。SWD 是较新的 ARM 专为 Cortex-M 推出的两线串行调试协议（`DIO`+`CLK`），可以减少引脚占用，提高适配性。JTAG 是较早的边界扫描调试端口，具有至少 `TCK` 时钟、`TMS` 模式选择、`TDI` 数据输入、`TDO` 数据输出等引脚。

STM32_Cube_Programmer 本质是用户态程序，其不能直接操作 USB 硬件。以 macOS 为例，当插入 ST-Link 后，macOS 作为 USB Host 会读取设备信息（VID、PID、Endpoint、Descripter 等），从而识别到这是 ST-Link。之后会根据此创建 USB Device，通过系统的 IOKit 和 USB Stack 管理这个设备。此时，CubeProgrammer 就可以通过 `libusb` 库调用 macOS 的 USB API 来操作 USB 硬件了。

当 CubeProgrammer 和 ST-Link 建立链接，其会首先解析 `elf` 文件，读取其 Program Header 和 Load Segment，得到地址+数据的对。然后生成调试命令。这里传输的是 ST-Link 的私有调试协议包，我们无从得知。此时，ST-Link 中的 MCU 负责接收发送的包，识别写目标地址，然后控制 SWCLK 和 SWDIO 口和芯片通信。

**由于对于 ST-Link 和 J-Link 调试器，PC 与调试器之间的通信尚未完全公开，下面用开源、协议公开的 DAP-Link 为例，介绍 PC 和调试器之间的通信协议。**

DAP-Link 的上位机（类似于 STM32_Cube_Programmer）可以是 OpenOCD，这同样是一个开源、协议公开的调试服务器。其用法大概为：

```bash
openocd \
-f interface/cmsis-dap.cfg \
-f target/stm32f4x.cfg \
-c "program build/app.elf verify reset exit"
```

其在 macOS 上访问 DAP-Link 的方式和 ST-Link 基本相同。OpenOCD 通过参数传入 `interface/cmsis-dap.cfg` 知道，下载器使用的是 CMSIS-DAP 协议。于是，OpenOCD 会加载 cmsis_dap driver，并选择 swd。内容如下所示。

```
adapter driver cmsis-dap
transport select swd
```

此后，OpenOCD 和 DAP-Link 之间开始通信。其通信的本质和 ST-Link 相同，即 OpenOCD 不断发送 CMSIS-DAP 命令包，DAP-Link 不断返回结果，一个基本的命令包的结构可能如下：

```
[Command ID][Payload]
```

其中 `Command ID` 为命令 ID，例如：`0x02` 表示链接 DAP-Link（DAP_Connect），`0x05` 表示 DP/AP 寄存器访问。比如，OpenOCD 向 DAP-Link 发送：
```
02 01
```

表示 `DAP_Connect`，Payload 值为 `01`，即进入 SWD 模式。

接着发送：

```
11 40 1F 00 00
```

表示 `DAP_SWJ_Clock` 设置 SWD 时钟为 `1f0000`，等等一系列设置。之后，OpenOCD 发送：

```
DAP_Transfer
AP Write
ADDR=...
DATA=...
```

（当然是以二进制表示的）写入数据。然后，DAP-Link 将其转化为 SWD 时序，与芯片通信。

用类似的方法，其还可以链接 GDB，用于进行调试。具体架构如下图所示。

![](assets/Pasted%20image%2020260511131649.png)

## 从 ST-Link 到芯片

ST-Link 从上位机（STM32_Programmer）接收到数据包后，会将其转化为 SWD 时序，输出到芯片引脚 `SWDIO` 和 `SWCLK` 上。之后，SWD 数据被发送的 DP 和 AP 中。

> DP 和 AP 是 ARM CoreSight 调试架构的核心模块。DP 负责和 SWD 外设通信，AP 负责操作总线（芯片内部资源）。由烧录器传输的 SWD 数据由 DP 进行接收，DP 进行解析后将读写请求转化给 AP。AP 通过发起总线任务，通知 AHB 总线执行，从而访问到 Flash/RAM 等存储外设。当然，还可以通过通知其他的总线访问更多的寄存器等。

如果 ST-Link 将要访问 0x20000000，则其会写寄存器 `TAR`（Transfer Address Register），告诉 AP 其要访问什么地址。之后，会写寄存器 `DRW`（Data Read/Write Register），写入要写入该地址的值。接下来 AHB-AP 就会向总线 AHB 发送写操作：`*(0x20000000)=0x12345678`。

上面是对于写 RAM 和其他外设寄存器的操作方式。如果是 Flash，则是一套不同的方式，因为 Flash 在写之前需要先擦除，且具有编程电压、Busy 状态、对齐等要求。所以需要通过 Flash Controller 完成。

> RAM 是多晶体管锁存器（参见 [STM32 外设说明](../STM32%20系列/STM32%20外设说明.md)），其可以通过输入点评更改其锁存状态，但是掉电丢失。而 Flash 是浮栅晶体管，数据是由浮栅中是否有电子决定的。其掉电时浮栅中的电子存在与否不会发生改变，所以掉电不丢失。但是其不可以单独设置某个浮栅中的电子，只可以将其全部抽走或者给某个浮栅利用量子隧穿效应加入电子。即，其只可以被全部置 1，或者单独置 0。因此，对 Flash 的操作需要单独控制，而不是由 CPU 执行。

Flash Controller 是 MCU 中的一个单独模块，被挂载在 AHB 总线上，负责对于 Flash 的管理。Flash Controller 接收到来自 AHB 总线消息，即来自 AP 的读写请求时，会作出反应并操作 Flash。具体如下。

调试器会首先通过 SWD 向 FLASH_KEYR 寄存器写入 KEY 值完成解锁，Flash Controller 内部的寄存器逻辑在时钟边沿锁存该数据，并更新内部状态机，将 `Flash Locked` 状态切换为 `Unlocked`。

之后调试器继续写 FLASH_CR，设置：

```
PG  = 1
SER = 1
SNB = x
```

这些位本质上是 Flash Controller 内部状态机的控制输入。比如 PG 表示进入 Program Mode，SER 表示 Sector Erase 模式，SNB 用于指定擦除目标 Sector。此时仍然没有真正操作 Flash Array，只是配置了内部编程状态机的运行模式。

接下来，总线主设备开始对 Flash 地址空间本身发起写事务。例如：

```
0x08000000 = 0x12345678
```

对于普通 SRAM 而言，这会被解释成一次普通内存写入；但 Flash Interface 位于 AHB 与 Flash Array 之间，它会持续监控所有针对 Flash 地址空间的访问。当它检测到以下代码时，它不会把此次事务当成普通写内存操作，而是会将其解释为一次 Flash Program 请求。

```
HWRITE = 1
ADDR ∈ Flash Region
PG = 1
```

随后 Flash Controller 会首先锁存本次事务的信息，包括目标地址、写入数据、写入宽度（半字/字/双字），然后启动内部的 Program FSM（Finite State Machine，有限状态机）。此时 FLASH_SR.BSY 会被置位，表示 Flash Array 已进入 Busy 状态。

接下来 Flash Controller 会启动内部 Charge Pump。因为 Flash 单元的编程需要远高于芯片供电电压的电场，通常需要 10V~20V 的栅压，而 STM32 外部只有 3.3V 供电，因此 Flash 内部集成了升压电路，通过电荷泵逐级提升电压。

升压完成后，Program FSM 会根据目标地址定位到具体 Flash Cell。STM32 Flash 本质上是大量浮栅二极管阵列，每个 bit 对应一个浮栅晶体管。擦除后的状态通常为 1，即浮栅中没有电子。

编程时，Flash Controller 会对目标 Cell 施加高电场，使电子通过 Fowler–Nordheim Tunneling 穿过氧化层进入浮栅。电子进入后，会改变晶体管阈值电压，使该 bit 读取结果变为 0。

因此 Flash 编程本质上是一个将 1 变成 0 的过程，且不可逆。电子不会自动离开浮栅，必须通过整页/整 Sector 擦除才能恢复。

在编程脉冲结束后，Flash Controller 会进入 Verify 阶段。它会重新读取目标 Cell 的阈值状态，判断编程是否成功。如果阈值未达到要求，控制器可能会重新施加 Program Pulse；若仍失败，则置位错误标志，例如：

```
PGERR
WRPERR
PGAERR
```

整个过程中，CPU 或调试器会轮询 `FLASH_SR.BSY`，等待 Busy 清零。当 FSM 结束后，BSY 被清除，说明 Flash Array 已重新回到 Read Mode，此时 I-Code/D-Code 和系统总线等才能重新正常访问 Flash。
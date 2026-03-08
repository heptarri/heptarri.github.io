# Uart

注：配置 Uart 模块需要同步添加 Platform 模块用于 Async 中断配置、Mcu 模块用于时钟配置、Port 模块用于输出端口配置。

在 Module Configuration 中添加 Mcu、Port、 Uart 和 Platform 模块。

打开 Uart 模块，在 General 中选择 Post Build Variant Build，Config Variant 中同步设置 VariantPostBuild。该步的设置使在代码中设置 Uart_Init 时需要手动指定配置结构体（见代码）。

关于 UartClockRef 时钟参考点即时钟配置，需要在 Mcu 模块中配置：

在Mcu -> McuClockSettingConfig 中新建并进入。

启用 SOSC、SIRC、FIRC、PLL，并在 PeripheralClockConfig （时钟外设）中开启 LPUART1 时钟为 SPLL。

在 ClockReferencePoint 中添加 Point 为 McuClockReferencePoint_LPUART （时钟参考点）为 LPUART1_CLK。

关于输入输出端口需要在 Port 中配置：

添加 PortPin：CH340_RX、CH340_TX，并分别设置为 LPUART1_RX、LPUART1_TX，其他设置如图所示：

![](/attachments/Pasted%20image%2020260124171820.png)

![](/attachments/Pasted%20image%2020260124171829.png)

接下来是 Uart 模块配置。

新建 Uart Channel。在 UartHwUsing 中选择 LPUART_IP，Channel ID 设置为 0，该 ID 在代码中用于指定外设。

Uart hardware channel 可以设置为任意，但 Channel ID 始终为上面设置的值(0)。

DesireBardrate 设置为 115200。

Uart Asynchronous Method 设置为 USING INTERRUPTS，即使用中断异步而非 DMA。

其他设置如图所示：

![](/attachments/Pasted%20image%2020260124171841.png)

![](/attachments/Pasted%20image%2020260124171850.png)

为配置中断，需要在 Platform 模块中配置中断。在 Interrupt Controller 新建一个并进入，进入 Interrupt Configuration 页，找到 LPUART1_RxTx_IRQn，启用 Interrupt Enabled 选项，并设置优先级。

在 Platform -> Generic Interrupt Settings 中，找到 LPUART1_RxTx_IRQn，选择启用（M4），并设置相应 IRQ Handler：`LPUART_UART_IP_1_IRQHandler`。

该函数名可以在 RTD 中 Uart -> src -> Lpuart_Uart_Ip_Irq.c 中找到（Line 142）：

```
#if (LPUART_UART_IP_NUMBER_OF_INSTANCES > 1U)
#ifdef LPUART_UART_IP_INSTANCE_USING_1
/* Implementation of Lpuart1 handler named in startup code. */
ISR(LPUART_UART_IP_1_IRQHandler)
{
    Lpuart_Uart_Ip_IrqHandler(1U);
    EXIT_INTERRUPT();
}
#endif
#endif

```

至此，在 EB Tresos 中的所有关于 Uart 的配置全部完成。进入 S32DS，开始代码配置：

主要代码如下所示：

```
Uart_Init(&Uart_xConfig);

Uart_AsyncSend((uint8)0U, (uint8 *)log, (uint32)size);
Uart_SyncSend((uint8)0U, (uint8 *)log, (uint32)size, 10000);

```

需要注意的是，Send 函数的第一个参数的值即为 Channel ID 的值。

代码注释：

UART（通用异步收发传输器）通信接口操作，主要实现了 UART 的初始化和数据发送功能，具体解析如下：

1. `Uart_Init(&Uart_xConfig);`

- 功能：初始化 UART 外设，配置通信参数。
- 参数：`&Uart_xConfig` 是一个 UART 配置结构体的指针，结构体中通常包含：
    - 波特率（如 9600、115200 ）
    - 数据位（如 8 位）
    - 停止位（如 1 位）
    - 校验位（如无校验、奇校验、偶校验）
    - 硬件流控设置（如是否启用 RTS/CTS）等。
- 作用：通过该函数完成 UART 外设的底层配置，使其满足特定的通信协议要求，为后续数据收发做准备。

2. `Uart_AsyncSend((uint8)0U, (uint8 *)log, (uint32)size);`

- 功能：异步发送数据（非阻塞方式）。
- 参数解析：
    - `(uint8)0U`：UART 通道号（通常一个 MCU 可能有多个 UART 外设，此处指定使用第 0 号 UART）。
    - `(uint8 *)log`：待发送的数据缓冲区指针（将`log`指针转换为`uint8*`类型，指向要发送的字节数据）。
    - `(uint32)size`：待发送的数据长度（以字节为单位，转换为 32 位无符号整数）。
- 特点：调用后立即返回，数据发送过程在后台（通常通过中断或 DMA）完成，不会阻塞当前程序执行流程。适用于对实时性要求高、不希望等待发送完成的场景。

3. `Uart_SyncSend((uint8)0U, (uint8 *)log, (uint32)size, 10000);`

- 功能：同步发送数据（阻塞方式）。
- 参数解析：前三个参数与`Uart_AsyncSend`一致，最后一个参数`10000`是超时时间（单位通常为毫秒或系统滴答数）。
- 特点：调用后会阻塞当前程序，直到数据发送完成，或等待时间超过超时时间后返回。适用于需要确保数据发送成功后再执行后续操作的场景（如关键指令传输）。

### 总结

这组代码的典型执行流程是：

1. 先通过`Uart_Init`完成 UART 的参数配置；
2. 按需选择`Uart_AsyncSend`（非阻塞）或`Uart_SyncSend`（阻塞 + 超时控制）发送数据，实现与外部设备的串行通信。

实际使用时，需确保`Uart_xConfig`结构体的参数与通信对方匹配（尤其是波特率、校验方式等），否则会出现数据传输错误。

至此配置完毕。
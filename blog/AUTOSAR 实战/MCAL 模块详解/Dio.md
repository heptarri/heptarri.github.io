# Dio

Dio 模块提供了对于以下硬件的读写服务：

- DIO 通道（端口）
- DIO端口
- DIO 通道组

Dio 模块只对于在 PORT 中完成适当设置的端口起作用。因此，对于 Port 部分的初始化设置并不在 Dio 模块中。详细说明见 [Port](Port.md)。

被 Dio 驱动配置的硬件是 GPIO。通道到引脚的映射可以通过查看 IO Muxing documention 得出。

实际通道的值可以通过以下公式得出：

> Channel = DioChannelId + DioPortId*32

其中，DioPortId 是每个 Dio Port 口的数字标识，即对 PortA/B/C/D/E 映射为0/1/2/3/4，而DioChannelId 即每个端口的各个通道 Id，如：

对于通道 GPIO[35]，可以在 Reference Manual 中找到是 PTB3。其 DioChannelId = 3，DioPortId = 1。

对于 Dio 的配置方式和 API 使用，UM/Driver usage and configuration tips 中给出以下描述：

Dio驱动的 API 以通道、端口和通道组为单位工作。

对于 Dio 通道：

可以对于指定引脚使用 Dio_ReadChannel(), Dio_WriteChannel(), Dio_FlipChannel() 函数操作。但是在此之前，需要进行以下操作（以 PE[5] 为例）：

1. 根据上述说明，DioPortId = 4, DioChannelId = 5。
2. 在 DioPort 中新建一个新的 Port，将其 Id 改为 4。
3. 进入该 Port 中，新建一个 DioChannel，进行命名，并将其 DioChannelId 改为 13。
4. 进入 `Generate/include/Dio_Cfg.h`，在 DEFINES AND MACROS 中寻找到上述设定的命名，并找到其标识符对应的宏定义。如：`DioConf_DioChannel_DioChannel_0`。
5. 利用上述 API 进行操作。

同样的，AUTOSAR 还规定了可以对于一组 Port 进行操作的 API：

- Dio_ReadPort()
- Dio_WritePort()
- Dio_MaskedWritePort()

用法与对于 Channel 的相似。

关于单个函数的定义与使用方式可以参考 UM/Module Documentation/Function Reference（6.1.3.x)。

对于 Dio 的各项配置说明由于理解难度不大，在此不再赘述，详情请参考 User Manual。
# Base

Base 模块包含了一系列 Mcal 配置所需要的参数，包括对 OsIf （Operating System Interface）的配置等。所有的 Mcal 模块都需要依赖 Base。

## General

General 中包含了一系列开关（复选框），对应着一系列宏定义是否被定义（define）。下面进行说明。

### OsIfMulticoreSupport

控制 OsIf 是否支持多核。如果开启，需要对各外设的 PartitionRef 进行设置。

> 目前车队所用的芯片暂时不需要这项功能。

### OsIfEnableUserModeSupport

控制 OsIf 是否支持 User Mode。如果开启，需要手动编写相关代码。

> User Mode 是 AUTOSAR标准包含的一套针对处理器访问权限（尤其是特权级别）的安全机制，依托操作系统配置与硬件 MPU 支持，用于增强任务隔离与系统安全性。

### OsIfDevErrorDetect

是否启用错误检测 (development error detection and notification)，需要启用 Det 模块。

### OsIfUseSystemTimer

是否使用系统定时器。

### OsIfUseCustomTimer

是否启用自定义定时器。启用后 Mcal 不再自动提供定时器源，需要手动实现一个返回当前时间戳的函数。

### OsIfInstanceId

在启用 Custom Timer 时，其不具有意义。如果默认使用 Gpt 等时，决定使用哪个定时器实例。

### OsIfOperatingSystemType

选择 Os Interface 类型，包括使用AutosarOS、FreeRTOS、Baramental。

## OsIfCounterConfig

是 OsIf 模块内部用于初始化并使用硬件定时器的配置结构体。

### OsIfSystemTimerClockRef

系统时钟源参考。

这个时钟源驱动 CPU 上的应用运行。

该选项在 Mcu 中被配置，详见 [[Mcu]]。
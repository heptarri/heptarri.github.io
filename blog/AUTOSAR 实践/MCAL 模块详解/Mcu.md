# Mcu

Mcu 模块主要控制时钟、电源管理、RAM等的配置。

## General

这部分包含了 MCU 驱动的总体配置。

### Default Error Detect

是否启用 Det 错误检查。 需要启用 Det 模块。

### Version Info API

是否开放模块版本的 API。该API将在 Mcu_Cfg.h 中被定义。

### Mcu Get Ram State API

选择是否启用 获取 RAM 状态的API。

### Mcu Init Clock API

选择是否开启使用 MCU 初始化时钟的 API。如果不开启，将无法使用该函数用于利用 MCU 初始化 Clock 模块，Clock 将通过写寄存器或者启动软件(bootloader) 负责初始化。

### Mcu No PLL

如果芯片不支持 PLL，需要开启该开关。

> PLL：PLL，全称为 Phase-Locked Loop（锁相环）,可以使一个振荡器的相位和输入信号保持同步。锁定后可以提供稳定、高速系统时钟源。

### Mcu Loops TimeOut

Mcu 超时的滴答时刻(Ticks)数。范围是[0,42949672955]

### Mcu Perform Reset API

选择是否开放软件触发复位的 API：`Mcu_PerformReset()`。

### McuCalloutBeforePerformReset

选择是否在软件触发复位之前执行回调函数。回调函数由 McuPerformResetCallout 的指针指向决定。

### McuPerformResetCallout

选择上述回调函数的指针（函数名），该指针指向的函数将在执行 `Mcu_PerformReset()`之前执行。

### Mcu Timeout Method

选择 Mcu 超时判断基于的时钟。

## McuResetReasonConf

该栏列举了一系列复位（reset）的原因，这些原因带有各自的编号（McuResetReason）。可以被函数 Mcu_GetResetReason 检索。

这些原因是在 EcuM 中被参数 EcuMResetReason 定义的。

## McuClockSettingConfig

这是关于 MCU 时钟的设置。

对于每一个新的设置，通常包含数项内容，下面进行选择性诠释。

### McuPeripheralClockConfig

这是对于芯片内各个外设的时钟配置，即对于某个特定的外设的时钟设置。如：是否启用该外设；分频数等。

对于创建的新项目，该栏目是空的。可以点击右侧的 Add required elements 按钮，软件将通过在 Resource 中设定好的芯片，检索需要的外设时钟，自动添加配置。

### McuClockReferencePoint

这是 MCU 时钟参考点的设置。这里定义了 MCU 时钟树的参考基点。其定义了时钟基准频率，其他模块可以将其作为输入（就像在 Base 中选择的那样）。可以选择不同的时钟作为基准。
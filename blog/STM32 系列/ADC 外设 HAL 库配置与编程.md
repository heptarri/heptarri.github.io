# ADC 外设 HAL 库配置与编程

本教程依托长安大学电子与控制工程学院机器人工程系《嵌入式系统及其应用》课程实验编写，旨在介绍 Nucleo-F411RE 核心芯片（STM32F411RET6）中 模数转换器 (ADC) 的工作机理、STM32CubeMX 配置逻辑以及底层代码实现。

## ADC 介绍

ADC（Analog-to-Digital Converter）即模数转换器，负责将连续的模拟电压信号（如传感器输出）转换为数字序列，供微控制器（MCU）处理。

STM32F411 最高支持 12 位 ADC，即支持将电压信号转换为占 12 位的数字，这代表了他的精度（分辨率）。12 位意味着其分辨率可以到 $2^{12}=4096$。也就是说，对于 0 ~ 3.3V 的电压，芯片可以将其转换为 0 ~ 4095 的数字。其转换时间最快为 1us,当 ADC 时钟为 14HMz 时。

## ADC 基本结构

![alt text](<assets/HAL 库 CubeMX 配置/image.png>)

这是 STM32F4xx 系列 User Manual 中提供的单路 ADC 的结构图。其揭示了芯片内部有关 ADC 的硬件结构设计。可以看到，对于一个 ADC，其具有多个通道（CH，Channel），其经过模块 `GPIO ports` 传入单片机中，经过模拟多路开关 `Analog mux` 进入 ADC 核心。模拟多路开关决定了是哪些通道传入到核心。其中，最多 4 个通道传输到注入通道 `Injected channels`，最多 16 个传输到规则通道 `Regular channels`。这两个通道通过相应的数据寄存器传输到地址/数据总线 `Address/data bus` 上，从而进行控制和数据传输。其中，以规则通道为例，其触发（开启）收到定时器组（启动触发器 `Start trigger (regular group)`）控制，定时器信号是否发送、边沿设定通过寄存器 `EXTEN` 控制，定时器 `TIMx` 通过寄存器 `EXTSEL` 选线。同时，其还支持选择外部中断 `EXTI_11` 作为触发源。

> Regular channels 相当于规则通道组，为转换主任务，Injected channels 相当于中断任务，当规则组转换时注入组被触发，它会打断规则组优先进行转换，转换完后再恢复规则组。

通道的数据寄存器除了直接抵达总线外，还会触发中断。其通过一组标志位识别转换结束 `EOC`、注入转换结束 `JEOC`，以及一组使能位控制中断是否触发：`EOCIE/JEOCIE`，该组中断被配置触发后会发送信号至 NVIC 的 ADC 中断。

此外，可以注意到其时钟信号来自 ADCCLK，这是总线 APB2 时钟 PCLK2 分频（Prescale）的结果。同时，模拟多路开关有其他几个输入：Temp.sensor 是来自单片机内核的温度传感器信号，$V_{REFINT}$ 是内部参考电压，用于校准，$V_{BAT}$ 为引脚电压。

下面有一个更为简单的图用于描述上述结构：

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image.png>)

根据上面的描述，ADC 触发读取（扫描/转换）有以下方式：

- 软件触发，程序中调用函数启动转换
- 硬件触发，通过定时器/外部中断引脚触发

## ADC 转换模式

根据转换次数和转换方式分类，其分为单次转换和连续转换。单次转换仅触发一次，转换一个通道或一组通道，完成后停止。连续转换触发一次后循环转换，无需重复触发。

根据通道数量，可以分为非扫描模式和扫描模式。非扫描模式每次仅转换单个通道，扫描模式按序列依次转换多个通道。扫描模式需要利用 DMA 等方式转运数据。

以上方式可以随意排列组合：

- 单次转换，非扫描模式

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image-1.png>)

- 连续转换，非扫描模式

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image-2.png>)

- 单次转换，扫描模式

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image-3.png>)

- 连续转换，扫描模式

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image-4.png>)

## ADC 数据对齐

其提供了两种数据对齐方式：左/右对齐。

右对齐指 12 位数据存放在寄存器低 12 位（默认方式），直接读取即可得到原始值；左对齐指 12 位数据存放在寄存器高 12 位，低 4 位补 0，适用于需要降低分辨率的场景（如转换为 8 位数据）。


## 逐次逼近型 ADC 工作原理

STM32 微控制器中内置的ADC使用SAR（逐次逼近）原则，分多步执行转换。转换步骤数等 于ADC转换器中的位数。每个步骤均由ADC时钟驱动。每个ADC时钟从结果到输出产生一 位。ADC的内部设计基于切换电容技术。

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image-5.png>)

具体细节在此不再赘述，可以参考：

[SAR ADC 逐次逼近型ADC Successive Approximation Register ADC](https://zhuanlan.zhihu.com/p/1977414760770339709)

## CubeMX 配置

首先在 STM32CubeMX 中新建 STM32F411RET6 工程，配置时钟、SYS、Usart，作为单片机运行基础设施和调试接口。启用 ADC1 中 IN9 接口（本文以此为例）。

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image-6.png>)

下侧 Configuration - Parameter Settings 中可以配置上面所述的各项参数：

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image-7.png>)

包括分辨率（Resolution）、时钟分频（ClockPrescaler）、数据对齐（Data Alignment）、扫描模式（Scan Conversion Mode）、连续/非连续转换模式（Continuous/Discontinuous） Conversion Mode、是否需要 DMA 等等。本文保持默认配置，即采用 4 分频的 PCLK2（即 APB2 外设时钟），12 位分辨率，数据右对齐，且单次转换、非扫描模式。

在 Configuration - NVIC Settings 中勾选 ADC1 global interrupt。

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image-8.png>)

然后点击 Generate Code 生成代码。

## 代码编写

在 `/* USER CODE BEGIN 4 */` 和 `/* USER CODE END 4 */` 中编写以下代码：

```c
int fputc(int ch, FILE* f) {
  HAL_UART_Transmit(&huart2, (uint8_t*)&ch, 1, HAL_MAX_DELAY);
  return ch;
}

uint16_t ADC_Value = 0, light = 0;
void ADC1_Get_Value() {
  HAL_ADC_Start(&hadc1);
  if (HAL_ADC_PollForConversion(&hadc1, 100) == HAL_OK) {
    ADC_Value = HAL_ADC_GetValue(&hadc1);
    light = ADC_Value * 3300 / 4096;
    printf("ADC Value: %d, Light Intensity: %d mV\r\n", ADC_Value, light);

    HAL_ADC_Stop(&hadc1);
  }
}
```

在 `/* USER CODE BEGIN PFP */` 和 `/* USER CODE END PFP */` 之间添加一下函数声明：

```c
void ADC1_Get_Value(void);
```

其中重载 `fputc` 函数是为了可以使用 `printf` 函数作为串口输出，方便调试；`ADC1_Get_Value` 函数为 ADC1 外设的读取函数：

`HAL_ADC_Start` 为开启（使能）该外设，`HAL_ADC_PollForConversion` 为启用一次 ADC 轮询转换，如果其转换成功（`HAL_OK`）就手动计算 `ADC_Value` 值和 `light` 值（计算仅供参考）。最后，利用重载后的 `printf` 函数利用 `Usart2` 外设输出值。最后，利用 `HAL_ADC_Stop` 函数失能该外设。

最后，在 `while(1)` 内的 `/* USER CODE BEGIN 3 */` 和 `/* USER CODE END 3 */` 之间添加以下代码：

```c
    ADC1_Get_Value();
    HAL_Delay(1000);
```

即每经过 1s，转换并输出一次 ADC 读取的值。

在 Keil uVision 5 软件中点击 `Options...` 按钮，在 `Target` 选项卡点击 `Use MicroLIB`，并重新编译：

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image-9.png>)

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image-10.png>)

利用串口工具，可以通过串口读取 ADC 获取到的值：

![alt text](<assets/ADC 外设 HAL 库 CubeMX 配置/image-11.png>)

## 参考文档

[STM32 ADC内部原理](https://shequ.stmicroelectronics.cn/thread-627296-1-1.html)

[STM32F411xce User Manual](https://www.st.com/resource/en/reference_manual/rm0383-stm32f411xce-advanced-armbased-32bit-mcus-stmicroelectronics.pdf)
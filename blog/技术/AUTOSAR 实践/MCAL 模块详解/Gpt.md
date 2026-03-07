注：配置 Gpt （通用 PWM 定时器，General PWM Timer）模块需要同步添加 Platform 模块用于 Async 中断配置、Mcu 模块用于时钟配置。

在 Module Configuration 中添加 Mcu、 Gpt 和 Platform 模块。

打开 Gpt 模块，在 General 中**取消**选择 Post Build Variant Build，Config Variant 中同步设置 VariantPreCompile。该步的设置使在代码中设置 Gpt_Init 时无需手动指定配置结构体（见代码）。

关于 UartClockRef 时钟参考点即时钟配置，需要在 Mcu 模块中配置：

在Mcu -> McuClockSettingConfig 中新建并进入（也可以直接用之前建立的）。

启用 SOSC、SIRC、FIRC、PLL，并在 PeripheralClockConfig 中开启 LPIT0 时钟为 SPLL。

打开 Gpt 模块。

勾选 GptPredefTimerFunctionalityApi（预定义定时功能），在 GptDriverConfiguration 中选择 GptPredefTimer1usEnablingGrade 为 PT_PREDEF_TIMER_1US_DISABLED（配置 “1 微秒精度预定义定时器” 的使能状态），然后关闭 GptPredefTimerFunctionalityApi。

在 GptConfigurationOfOptApiServices 中勾选 GptEnableDisableNotificationApi。

在 GptHwConfiguration 页建立 GptHwConfiguration_0，即 LPIT_0_CH_0，开启 GptIsrEnable 和 GptChannelIsUsed 选项。此时注意把所有的ISR端口加进去（也可以直接点右上角的小人叫Add required elements），不然会出现报错，如下图所示。

![](attachments/Pasted%20image%2020260124171913.png)

在 ClockReferencePoint 中添加 Point 为 McuClockReferencePoint_LPIT 为 LPIT0_CLK，如下所示。

![](attachments/Pasted%20image%2020260124171919.png)

在 GptLpit 中添加一项，进入后 添加 GptLpitChannels 一项，选择 LPit Channel 为刚才开启的 LPIT_0_CH_0。

在 GptChannelConfiguration 中新建一项并进入。配置如下图所示。

![](attachments/Pasted%20image%2020260124171923.png)

其中时钟参考点同 Uart 配置中所示。

进入 Platform 页面，开启中断并设置中断 handler：LPIT_0_CH_0_ISR。该名称可在 LPit_Gpt_Ip.c 中找到（Line 823）：

```
#ifdef LPIT_0_CH_0_ISR_USED

extern ISR(LPIT_0_CH_0_ISR);

/**
* @brief   Interrupt handler for LPIT_0_CH_0 channels.
* @details Interrupt Service Routine corresponding to LPIT_0_CH_0 hw module.
* @param[in] none
* @return  void
* @isr
* @pre      The driver needs to be initialized
*/
ISR(LPIT_0_CH_0_ISR)
{
    Lpit_Gpt_Ip_ProcessCommonInterrupt(0U, 0U);
    EXIT_INTERRUPT();
}
#endif

```

生成代码，进入 S32DS。

进行以下代码编写：

```
#define TIMEOUT_PERIOD 40000000 // Freq of clk = 1s

// Gpt Lpit Irq Init
Platform_Init(NULL_PTR);
Platform_InstallIrqHandler(LPIT0_Ch0_IRQn, &LPIT_0_CH_0_ISR, NULL_PTR);

/* Gpt Initialization */
Gpt_Init(NULL_PTR);
Gpt_StartTimer((Gpt_ChannelType)0U, TIMEOUT_PERIOD);
Gpt_EnableNotification((Gpt_ChannelType)0U);

```

中断函数配置如下：

```
void Gpt_LpitNotification(void)
{
        Dio_FlipChannel(DioConf_DioChannel_DioChannel_LED1);
}

```

其中需要说明的是：

对于宏 `TIMEOUT_PERIOD = 40000000`：

将其设为时钟频率，则为 1s 的定时；降低频率则对应比例升高该值，反之亦然。

中断函数名与在 GptChannelConfiguration 配置的相同。

至此配置完毕。
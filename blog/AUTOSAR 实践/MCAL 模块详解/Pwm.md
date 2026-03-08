# Pwm

Pwm 的基础配置与前几个相同，故不再赘述。

在 PwmConfigurationOfOptApiServices 中添加所需要的 Api：

![](assets/Pasted%20image%2020260124171935.png)

进入 PwmFtm 页 -> PwmFtmCh 页，添加一个 Ftm 时钟通道（FTM是灵活定时器模块）。

在该通道中进行对应选择：

![](assets/Pasted%20image%2020260124171940.png)

在 Ftm Sync 页面中进行配置：

![](assets/Pasted%20image%2020260124171947.png)

在 Ftm Modules 中配置：

![](assets/Pasted%20image%2020260124171952.png)

回到上级页面，添加一个 Pwm 通道，进行如下配置：

![](assets/Pasted%20image%2020260124171958.png)

该 Pwm 通道将通过 FTM_0_CH_0 端口输出 Pwm 波。

同之前的模块相同，需要在 Port 中进行相应设置：

![](assets/Pasted%20image%2020260124172010.png)

同样的，需要在 Mcu 中将 FTM0 的时钟设置为 SPLL，并设置时钟参考点为 RUN_SYS_CLK。

接下来进入代码部分：

```
/* Pwm Initialization */
Pwm_Init(&Pwm_Config);
Pwm_SetPeriodAndDuty((Pwm_ChannelType)0U, 0x5000, 0x2000);
Pwm_SetDutyCycle((Pwm_ChannelType)0U, 0x7000);

```

其中 Pwm_Config 可以在 `Pwm_PBcfg.c` 中找到 (Line 176):

```
const Pwm_ConfigType Pwm_Config=
{
    /** @brief  Number of configured PWM channels */
    (Pwm_ChannelType)PWM_PB_CFG_CHANNELS_COUNT,
    /** @brief  Pointer to array of PWM channels */
    &Pwm_Channels_PB,
#if (PWM_HW_INSTANCE_USED == STD_ON)
    /** @brief  Number of Pwm configured instances */
    (Pwm_InstanceType)PWM_PB_CFG_INSTANCES_COUNT,
    /** @brief  Pointer to the list of Pwm configured channels */
    &Pwm_Instances_PB,
#endif
};

```

至此配置完毕。
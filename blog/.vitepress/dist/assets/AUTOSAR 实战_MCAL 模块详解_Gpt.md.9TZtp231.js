import{_ as a,o as s,c as p,ak as i,as as e,at as t,au as l}from"./chunks/framework.DTkRX0Ot.js";const f=JSON.parse('{"title":"Gpt","description":"","frontmatter":{},"headers":[],"relativePath":"AUTOSAR 实战/MCAL 模块详解/Gpt.md","filePath":"AUTOSAR 实战/MCAL 模块详解/Gpt.md"}'),r={name:"AUTOSAR 实战/MCAL 模块详解/Gpt.md"};function o(c,n,_,d,h,C){return s(),p("div",null,[...n[0]||(n[0]=[i('<h1 id="gpt" tabindex="-1">Gpt <a class="header-anchor" href="#gpt" aria-label="Permalink to “Gpt”">​</a></h1><p>注：配置 Gpt （通用 PWM 定时器，General PWM Timer）模块需要同步添加 Platform 模块用于 Async 中断配置、Mcu 模块用于时钟配置。</p><p>在 Module Configuration 中添加 Mcu、 Gpt 和 Platform 模块。</p><p>打开 Gpt 模块，在 General 中<strong>取消</strong>选择 Post Build Variant Build，Config Variant 中同步设置 VariantPreCompile。该步的设置使在代码中设置 Gpt_Init 时无需手动指定配置结构体（见代码）。</p><p>关于 UartClockRef 时钟参考点即时钟配置，需要在 Mcu 模块中配置：</p><p>在Mcu -&gt; McuClockSettingConfig 中新建并进入（也可以直接用之前建立的）。</p><p>启用 SOSC、SIRC、FIRC、PLL，并在 PeripheralClockConfig 中开启 LPIT0 时钟为 SPLL。</p><p>打开 Gpt 模块。</p><p>勾选 GptPredefTimerFunctionalityApi（预定义定时功能），在 GptDriverConfiguration 中选择 GptPredefTimer1usEnablingGrade 为 PT_PREDEF_TIMER_1US_DISABLED（配置 “1 微秒精度预定义定时器” 的使能状态），然后关闭 GptPredefTimerFunctionalityApi。</p><p>在 GptConfigurationOfOptApiServices 中勾选 GptEnableDisableNotificationApi。</p><p>在 GptHwConfiguration 页建立 GptHwConfiguration_0，即 LPIT_0_CH_0，开启 GptIsrEnable 和 GptChannelIsUsed 选项。此时注意把所有的ISR端口加进去（也可以直接点右上角的小人叫Add required elements），不然会出现报错，如下图所示。</p><p><img src="'+e+'" alt=""></p><p>在 ClockReferencePoint 中添加 Point 为 McuClockReferencePoint_LPIT 为 LPIT0_CLK，如下所示。</p><p><img src="'+t+'" alt=""></p><p>在 GptLpit 中添加一项，进入后 添加 GptLpitChannels 一项，选择 LPit Channel 为刚才开启的 LPIT_0_CH_0。</p><p>在 GptChannelConfiguration 中新建一项并进入。配置如下图所示。</p><p><img src="'+l+`" alt=""></p><p>其中时钟参考点同 Uart 配置中所示。</p><p>进入 Platform 页面，开启中断并设置中断 handler：LPIT_0_CH_0_ISR。该名称可在 LPit_Gpt_Ip.c 中找到（Line 823）：</p><div class="language-"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span>#ifdef LPIT_0_CH_0_ISR_USED</span></span>
<span class="line"><span></span></span>
<span class="line"><span>extern ISR(LPIT_0_CH_0_ISR);</span></span>
<span class="line"><span></span></span>
<span class="line"><span>/**</span></span>
<span class="line"><span>* @brief   Interrupt handler for LPIT_0_CH_0 channels.</span></span>
<span class="line"><span>* @details Interrupt Service Routine corresponding to LPIT_0_CH_0 hw module.</span></span>
<span class="line"><span>* @param[in] none</span></span>
<span class="line"><span>* @return  void</span></span>
<span class="line"><span>* @isr</span></span>
<span class="line"><span>* @pre      The driver needs to be initialized</span></span>
<span class="line"><span>*/</span></span>
<span class="line"><span>ISR(LPIT_0_CH_0_ISR)</span></span>
<span class="line"><span>{</span></span>
<span class="line"><span>    Lpit_Gpt_Ip_ProcessCommonInterrupt(0U, 0U);</span></span>
<span class="line"><span>    EXIT_INTERRUPT();</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>#endif</span></span></code></pre></div><p>生成代码，进入 S32DS。</p><p>进行以下代码编写：</p><div class="language-"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span>#define TIMEOUT_PERIOD 40000000</span><span> // Freq of clk = 1s</span></span>
<span class="line"><span></span></span>
<span class="line"><span>// Gpt Lpit Irq Init</span></span>
<span class="line"><span>Platform_Init(NULL_PTR);</span></span>
<span class="line"><span>Platform_InstallIrqHandler(LPIT0_Ch0_IRQn, &amp;LPIT_0_CH_0_ISR, NULL_PTR);</span></span>
<span class="line"><span></span></span>
<span class="line"><span>/* Gpt Initialization */</span></span>
<span class="line"><span>Gpt_Init(NULL_PTR);</span></span>
<span class="line"><span>Gpt_StartTimer((Gpt_ChannelType)0U, TIMEOUT_PERIOD);</span></span>
<span class="line"><span>Gpt_EnableNotification((Gpt_ChannelType)0U);</span></span></code></pre></div><p>中断函数配置如下：</p><div class="language-"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span>void Gpt_LpitNotification(void)</span></span>
<span class="line"><span>{</span></span>
<span class="line"><span>        Dio_FlipChannel(DioConf_DioChannel_DioChannel_LED1);</span></span>
<span class="line"><span>}</span></span></code></pre></div><p>其中需要说明的是：</p><p>对于宏 <code>TIMEOUT_PERIOD = 40000000</code>：</p><p>将其设为时钟频率，则为 1s 的定时；降低频率则对应比例升高该值，反之亦然。</p><p>中断函数名与在 GptChannelConfiguration 配置的相同。</p><p>至此配置完毕。</p>`,30)])])}const I=a(r,[["render",o]]);export{f as __pageData,I as default};

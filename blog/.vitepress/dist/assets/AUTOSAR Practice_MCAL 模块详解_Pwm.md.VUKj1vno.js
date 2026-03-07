import{_ as a,o as n,c as p,ak as e,aw as i,ax as t,ay as l,az as c,aA as _,aB as r}from"./chunks/framework.DXL0ymeD.js";const C=JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"AUTOSAR Practice/MCAL 模块详解/Pwm.md","filePath":"AUTOSAR Practice/MCAL 模块详解/Pwm.md"}'),o={name:"AUTOSAR Practice/MCAL 模块详解/Pwm.md"};function m(P,s,d,g,h,f){return n(),p("div",null,[...s[0]||(s[0]=[e('<p>Pwm 的基础配置与前几个相同，故不再赘述。</p><p>在 PwmConfigurationOfOptApiServices 中添加所需要的 Api：</p><p><img src="'+i+'" alt=""></p><p>进入 PwmFtm 页 -&gt; PwmFtmCh 页，添加一个 Ftm 时钟通道（FTM是灵活定时器模块）。</p><p>在该通道中进行对应选择：</p><p><img src="'+t+'" alt=""></p><p>在 Ftm Sync 页面中进行配置：</p><p><img src="'+l+'" alt=""></p><p>在 Ftm Modules 中配置：</p><p><img src="'+c+'" alt=""></p><p>回到上级页面，添加一个 Pwm 通道，进行如下配置：</p><p><img src="'+_+'" alt=""></p><p>该 Pwm 通道将通过 FTM_0_CH_0 端口输出 Pwm 波。</p><p>同之前的模块相同，需要在 Port 中进行相应设置：</p><p><img src="'+r+`" alt=""></p><p>同样的，需要在 Mcu 中将 FTM0 的时钟设置为 SPLL，并设置时钟参考点为 RUN_SYS_CLK。</p><p>接下来进入代码部分：</p><div class="language-"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span>/* Pwm Initialization */</span></span>
<span class="line"><span>Pwm_Init(&amp;Pwm_Config);</span></span>
<span class="line"><span>Pwm_SetPeriodAndDuty((Pwm_ChannelType)0U, 0x5000, 0x2000);</span></span>
<span class="line"><span>Pwm_SetDutyCycle((Pwm_ChannelType)0U, 0x7000);</span></span></code></pre></div><p>其中 Pwm_Config 可以在 <code>Pwm_PBcfg.c</code> 中找到 (Line 176):</p><div class="language-"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span>const Pwm_ConfigType Pwm_Config=</span></span>
<span class="line"><span>{</span></span>
<span class="line"><span>    /** @brief  Number of configured PWM channels */</span></span>
<span class="line"><span>    (Pwm_ChannelType)PWM_PB_CFG_CHANNELS_COUNT,</span></span>
<span class="line"><span>    /** @brief  Pointer to array of PWM channels */</span></span>
<span class="line"><span>    &amp;Pwm_Channels_PB,</span></span>
<span class="line"><span>#if (PWM_HW_INSTANCE_USED == STD_ON)</span></span>
<span class="line"><span>    /** @brief  Number of Pwm configured instances */</span></span>
<span class="line"><span>    (Pwm_InstanceType)PWM_PB_CFG_INSTANCES_COUNT,</span></span>
<span class="line"><span>    /** @brief  Pointer to the list of Pwm configured channels */</span></span>
<span class="line"><span>    &amp;Pwm_Instances_PB,</span></span>
<span class="line"><span>#endif</span></span>
<span class="line"><span>};</span></span></code></pre></div><p>至此配置完毕。</p>`,21)])])}const u=a(o,[["render",m]]);export{C as __pageData,u as default};

import{_ as a,o as n,c as i,ak as p}from"./chunks/framework.CQiT2oQt.js";const o=JSON.parse('{"title":"Zephyr 工作逻辑","description":"","frontmatter":{},"headers":[],"relativePath":"Zephyr RTOS/Zephyr 工作逻辑.md","filePath":"Zephyr RTOS/Zephyr 工作逻辑.md"}'),e={name:"Zephyr RTOS/Zephyr 工作逻辑.md"};function l(t,s,h,c,r,k){return n(),i("div",null,[...s[0]||(s[0]=[p(`<h1 id="zephyr-工作逻辑" tabindex="-1">Zephyr 工作逻辑 <a class="header-anchor" href="#zephyr-工作逻辑" aria-label="Permalink to “Zephyr 工作逻辑”">​</a></h1><p>本文介绍了针对某一特定板卡下 zephyr 的工作逻辑，包括从 arch 层的适配到上层 core 属性的调用。</p><h2 id="逐层覆盖结构" tabindex="-1">逐层覆盖结构 <a class="header-anchor" href="#逐层覆盖结构" aria-label="Permalink to “逐层覆盖结构”">​</a></h2><p>zephyr 利用设备树进行外设管理，且这些外设的配置是独立于业务代码的。这使得在合适的配置下， zephyr 可以保证在更改运行平台时，不更改业务代码的任何部分。zephyr 将外设分为以下层级：</p><ul><li>Architecture</li><li>SoC</li><li>Boards</li><li>Custom parts</li></ul><h3 id="architecture" tabindex="-1">Architecture <a class="header-anchor" href="#architecture" aria-label="Permalink to “Architecture”">​</a></h3><p>首先，zephyr 社区对于目前主流的架构进行了适配。其在 <code>zephyr/arch</code> 目录下提供了对于如中断处理、上下文切换、内存管理等架构相关的驱动代码。通常情况下，开发者不需要关注这部分代码的内部细节。笔者将在后续的文档中说明这部分代码的组成。这是外设层级的第一层（最底层），利用 C 语言和汇编语言编写。</p><h3 id="soc" tabindex="-1">SoC <a class="header-anchor" href="#soc" aria-label="Permalink to “SoC”">​</a></h3><p>其次，芯片厂商和 zephyr 社区对其设计生产的芯片进行 SoC 层的适配，体现为提供了一系列 C 语言头文件/源文件供下一级驱动文件（drivers）等调用，同时提供了 <code>dtsi</code> 设备树文件，为 boards 等下一级设备树文件调用。下列代码为节选自 <code>stm32f411.dtsi</code> ，即 ST 公司为其 stm32f411 系列芯片外设进行的硬件描述。一般情况下，开发者也不需要关注这部分代码的内部细节，因为其在芯片厂商的参考手册中有所对应。</p><div class="language-dts"><button title="Copy Code" class="copy"></button><span class="lang">dts</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span>/ {</span></span>
<span class="line"><span>    soc {</span></span>
<span class="line"><span>        compatible = &quot;st,stm32f411&quot;, &quot;st,stm32f4&quot;, &quot;simple-bus&quot;;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        spi5: spi@40015000 {</span></span>
<span class="line"><span>            compatible = &quot;st,stm32-spi&quot;;</span></span>
<span class="line"><span>            #address-cells = &lt;1&gt;;</span></span>
<span class="line"><span>            #size-cells = &lt;0&gt;;</span></span>
<span class="line"><span>            reg = &lt;0x40015000 0x400&gt;;</span></span>
<span class="line"><span>            clocks = &lt;&amp;rcc STM32_CLOCK(APB2, 20)&gt;;</span></span>
<span class="line"><span>            interrupts = &lt;85 5&gt;;</span></span>
<span class="line"><span>            st,spi-data-width = &quot;limited-8-16-bit&quot;;</span></span>
<span class="line"><span>            status = &quot;disabled&quot;;</span></span>
<span class="line"><span>        };</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        i2s1: i2s@40013000 {</span></span>
<span class="line"><span>            compatible = &quot;st,stm32-i2s&quot;;</span></span>
<span class="line"><span>            #address-cells = &lt;1&gt;;</span></span>
<span class="line"><span>            #size-cells = &lt;0&gt;;</span></span>
<span class="line"><span>            reg = &lt;0x40013000 0x400&gt;;</span></span>
<span class="line"><span>            clocks = &lt;&amp;rcc STM32_CLOCK(APB2, 12)&gt;;</span></span>
<span class="line"><span>            interrupts = &lt;35 5&gt;;</span></span>
<span class="line"><span>            dmas = &lt;&amp;dma2 3 3 STM32_DMA_MEM_INC STM32_DMA_FIFO_FULL&gt;,</span></span>
<span class="line"><span>                   &lt;&amp;dma2 2 3 STM32_DMA_MEM_INC STM32_DMA_FIFO_FULL&gt;;</span></span>
<span class="line"><span>            dma-names = &quot;tx&quot;, &quot;rx&quot;;</span></span>
<span class="line"><span>            status = &quot;disabled&quot;;</span></span>
<span class="line"><span>        };</span></span></code></pre></div><p>stm32f411 是一系列芯片，并非一个。但是其拥有一系列外设（硬件资源）作为其“最大公约数”。于是，<code>stm32f411.dtsi</code> 描述了这些最大公约数的内容。</p><p>同时，对于 stm32f411 系列的下属芯片分类，如 stm32f411Xe（其中 X 表示任意），其拥有在最大公约数之外的硬件资源。则可以在 dtsi 文件中引用 <code>stm32f411.dtsi</code>，然后只描述不同的部分：</p><div class="language-dtsi"><button title="Copy Code" class="copy"></button><span class="lang">dtsi</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span>#include &lt;st/f4/stm32f411.dtsi&gt;</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>/ {</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    sram0: memory@20000000 {</span></span>
<span class="line"><span>        reg = &lt;0x20000000 DT_SIZE_K(128)&gt;;</span></span>
<span class="line"><span>    };</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    soc {</span></span>
<span class="line"><span>        flash-controller@40023c00 {</span></span>
<span class="line"><span>            flash0: flash@8000000 {</span></span>
<span class="line"><span>                reg = &lt;0x08000000 DT_SIZE_K(512)&gt;;</span></span>
<span class="line"><span>            };</span></span>
<span class="line"><span>        };</span></span>
<span class="line"><span>    };</span></span>
<span class="line"><span>};</span></span></code></pre></div><p>其在 sram 和 flash 上有所差别，则仅对这部分进行描述。</p><blockquote><p>这是设备树文件描述硬件资源的逻辑，即文件之间允许包含覆盖。这在 Zephyr RTOS 和 Linux 中均是通用的。后续的 boards 的 dts 文件和自定义的 dts 文件（即 overlay 文件）都是如此。</p></blockquote><h3 id="boards" tabindex="-1">Boards <a class="header-anchor" href="#boards" aria-label="Permalink to “Boards”">​</a></h3><p>然后，开发版的设计者（有可能是 soc 厂商本身，比如 stm32-nucleo 系列）会基于 soc 提供的信息进行板卡的外设资源设计，更多的是时钟设置、各外设参数设置、外设别名设置等。如 nucleo_f411re 开发版，其内容大致如下（节选）：</p><div class="language-dts"><button title="Copy Code" class="copy"></button><span class="lang">dts</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span>/dts-v1/;</span></span>
<span class="line"><span>#include &lt;st/f4/stm32f411Xe.dtsi&gt;</span></span>
<span class="line"><span>#include &lt;st/f4/stm32f411r(c-e)tx-pinctrl.dtsi&gt;</span></span>
<span class="line"><span>#include &quot;arduino_r3_connector.dtsi&quot;</span></span>
<span class="line"><span>#include &quot;st_morpho_connector.dtsi&quot;</span></span>
<span class="line"><span>#include &lt;zephyr/dt-bindings/input/input-event-codes.h&gt;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>/ {</span></span>
<span class="line"><span>    model = &quot;STMicroelectronics STM32F411RE-NUCLEO board&quot;;</span></span>
<span class="line"><span>    compatible = &quot;st,stm32f411re-nucleo&quot;;  </span></span>
<span class="line"><span></span></span>
<span class="line"><span>    chosen {</span></span>
<span class="line"><span>        zephyr,console = &amp;usart2;</span></span>
<span class="line"><span>        zephyr,shell-uart = &amp;usart2;</span></span>
<span class="line"><span>        zephyr,sram = &amp;sram0;</span></span>
<span class="line"><span>        zephyr,flash = &amp;flash0;</span></span>
<span class="line"><span>    };</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    leds: leds {</span></span>
<span class="line"><span>        compatible = &quot;gpio-leds&quot;;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        green_led_2: led_2 {</span></span>
<span class="line"><span>            gpios = &lt;&amp;gpioa 5 GPIO_ACTIVE_HIGH&gt;;</span></span>
<span class="line"><span>	        label = &quot;User LD2&quot;;</span></span>
<span class="line"><span>        };</span></span>
<span class="line"><span>    };</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    gpio_keys {</span></span>
<span class="line"><span>        compatible = &quot;gpio-keys&quot;;</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>        user_button: button {</span></span>
<span class="line"><span>            label = &quot;User&quot;;</span></span>
<span class="line"><span>            gpios = &lt;&amp;gpioc 13 GPIO_ACTIVE_LOW&gt;;</span></span>
<span class="line"><span>            zephyr,code = &lt;INPUT_KEY_0&gt;;</span></span>
<span class="line"><span>        };</span></span>
<span class="line"><span>    };</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>    aliases {</span></span>
<span class="line"><span>        led0 = &amp;green_led_2;</span></span>
<span class="line"><span>        sw0 = &amp;user_button;</span></span>
<span class="line"><span>    };</span></span>
<span class="line"><span>};</span></span>
<span class="line"><span> </span></span>
<span class="line"><span>&amp;clk_lsi {</span></span>
<span class="line"><span>    status = &quot;okay&quot;;</span></span>
<span class="line"><span>};</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>&amp;clk_hse {</span></span>
<span class="line"><span>    hse-bypass;</span></span>
<span class="line"><span>    clock-frequency = &lt;DT_FREQ_M(8)&gt;; /* STLink 8MHz clock */</span></span>
<span class="line"><span>    status = &quot;okay&quot;;</span></span>
<span class="line"><span>};</span></span></code></pre></div><p>可见其依然是引用了上一级的设备树文件，然后在此基础上进行延伸。</p><blockquote><p>我们不建议更改以上三部分的配置，因为其作为公共产品，其属性是固定的。</p></blockquote><h3 id="custom-parts" tabindex="-1">Custom parts <a class="header-anchor" href="#custom-parts" aria-label="Permalink to “Custom parts”">​</a></h3><p>我们在设计新的电路板时，在硬件上往往会参照开发版的设计方案。在软件上也是如此。我们在开启一个新的硬件定制版的板级支持包（BSP）设计时，也会在现有的开发版的设备树文件的基础上进行衍生更改。Zephyr 提供了 DeviceTree Overlay 文件用于进行覆盖。</p><p>开发者在自己的工程目录下创建 app.overlay 文件。这不需要修改 zephyr 仓库里的任何代码，就可以在现有开发版的基础上进行覆盖修改。这是逐层覆盖逻辑的终点。如：</p><div class="language-overlay"><button title="Copy Code" class="copy"></button><span class="lang">overlay</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span>&amp;spi5 {</span></span>
<span class="line"><span>    status = &quot;okay&quot;;          </span></span>
<span class="line"><span>    pinctrl-0 = &lt;&amp;spi5_default&gt;; </span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    my_sensor: sensor@0 {</span></span>
<span class="line"><span>        compatible = &quot;zephyr,bme280&quot;;</span></span>
<span class="line"><span>        reg = &lt;0&gt;;</span></span>
<span class="line"><span>        spi-max-frequency = &lt;1000000&gt;;</span></span>
<span class="line"><span>    };</span></span>
<span class="line"><span>};</span></span>
<span class="line"><span></span></span>
<span class="line"><span>/ {</span></span>
<span class="line"><span>    aliases {</span></span>
<span class="line"><span>        sensor0 = &amp;my_sensor;</span></span>
<span class="line"><span>    };</span></span>
<span class="line"><span>};</span></span></code></pre></div><p>这段代码的 SPI 在 SoC 层级的 status 为 disabled，我们可以在 overlay 文件中开启。这将覆盖原来的属性。我们将其挂载在 my_sensor 名下，用于进行具体的外设驱动。同时，我们用 sensor0 别名代替 my_sensor。</p><p>同时，Zephyr 的构建系统之一 Kconfig 提供了在 prj.conf 文件中进行定义开关的功能，即：</p><div class="language-conf"><button title="Copy Code" class="copy"></button><span class="lang">conf</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span>CONFIG_SPI=y</span></span>
<span class="line"><span>CONFIG_SENSOR=y</span></span>
<span class="line"><span>CONFIG_BME280=y</span></span></code></pre></div><h2 id="构建过程" tabindex="-1">构建过程 <a class="header-anchor" href="#构建过程" aria-label="Permalink to “构建过程”">​</a></h2><p>在设备树的基础上，Zephyr 利用其构建系统将上面四层的设备树合并为一个扁平的设备树文件，然后提取其 compatible 属性，并根据 <code>zephyr/dts/bindings</code> 中寻找对应的 yaml 绑定文件，其定义了该设备的合法属性。然后，将其生成一个 <code>devicetree_generated.h</code> 宏定义头文件，其包含了设备树中所有的属性设置，如：</p><div class="language-c"><button title="Copy Code" class="copy"></button><span class="lang">c</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// Example</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">#define</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> DT_N_S_soc_S_spi_40015000_S_sensor_0_P_reg</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 0</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">#define</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> DT_N_S_soc_S_spi_40015000_S_sensor_0_P_spi_max_frequency</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 1000000</span></span></code></pre></div><p>此后，这些宏定义在驱动文件（如 <code>drivers/sensor/bme280/bme280.c</code> ）中被调用，用于实例化这些宏定义。此时，编译器在内存中创建了一个结构体常量对象，用于存储该设备的信息。在 <code>main()</code> 启动之前，内核会根据宏定义指定的等级和优先级依次调用每个设备的初始化函数，并标记为 <code>ready</code>。</p><p>此时，该设备对象被静态的存放在内存中。当开发者需要使用时，就可以通过某种宏定义钩子（如 <code>DEVICE_DT_GET</code> 获取该内存对象。</p><blockquote><p>需要知道的是，在构建过程之前，dts 和 dtsi 文件就已经存在。直到我们在构建时给出参数，构建系统才能确定要编译的平台，才能根据上面的过程确定调用链。</p></blockquote><p>在构建时，构建系统根据我们传入的构建参数（-DBOARD=?）确认编译的平台，并根据某处的宏定义，连接不同的外设驱动文件，比如 <code>zephyr/drivers/spi/spi_ll_stm32.c</code>。这个文件中引用了针对该平台的 HAL 库。同时，根据上面提到的过程，构建系统静态的定义外设对象。</p><p>因为外设驱动文件（drivers）向上提供了完全相同的 API 驱动函数以实现完全屏蔽硬件差异。所以开发者可以通过完全相同的方式来调用这些外设对象。这就是 Zephyr 的通用设备模型。</p><p>在这个模型中，每个设备对象都有一个 api 指针，其指向驱动程序实现的一组函数功能表，如：</p><div class="language-c"><button title="Copy Code" class="copy"></button><span class="lang">c</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">static</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> const</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> struct</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> spi_driver_api stm32_spi_api </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    .transceive </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> spi_stm32_transceive,  </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    .release </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> spi_stm32_release,</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">#ifdef</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> CONFIG_SPI_ASYNC</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    .transceive_async </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> spi_stm32_transceive_async,</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">#endif</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">};</span></span></code></pre></div><p>其中 <code>spi_stm32_transceive</code> 等函数映射到 stm32 HAL 库的具体实现，如：</p><div class="language-c"><button title="Copy Code" class="copy"></button><span class="lang">c</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">static</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> inline</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> int</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> spi_transceive</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> struct</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> device </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">*</span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">dev</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, ...) {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    const</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> struct</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> spi_driver_api </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">*</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">api </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> struct</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> spi_driver_api </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">*</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)dev-&gt;api;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    return</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> api-&gt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">transceive</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(dev, ...);</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"> // 通过指针跳转到驱动实现</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>对于应用层，调用的函数名永远叫 <code>spi_transceive</code>，但是因为 dev 指针在运行时根据外设对象不同指向不同的 <code>struct device</code> 实例，其就自然跳转到对应的硬件操作函数。</p><p>在 HAL 库中，其对于硬件的处理会非常直接：</p><div class="language-c"><button title="Copy Code" class="copy"></button><span class="lang">c</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">static</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> int</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> spi_stm32_init</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> struct</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> device </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">*</span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">dev</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    const</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> struct</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> spi_stm32_config </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">*</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">cfg </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> dev-&gt;config; </span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    </span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    LL_SPI_Disable</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">((SPI_TypeDef </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">*</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)cfg-&gt;regs); </span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    // ...</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    return</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>其中 <code>cfg-&gt;reg</code> 就是由 <code>devicetree_generated.h</code> 提供的值。这是设备树中定义的寄存器地址。</p><p>自此，zephyr 的构建系统实现了从硬件描述到上层 API 调用再到底层映射实现的全流程。</p><h2 id="zephyr-哲学" tabindex="-1">Zephyr 哲学 <a class="header-anchor" href="#zephyr-哲学" aria-label="Permalink to “Zephyr 哲学”">​</a></h2><p>Zephyr 的驱动模型在本质上是一套约束协议：</p><ul><li>通过 <code>west</code> 和 <code>modules</code> 管理厂商提供的各式各样的、混乱的 HAL 库，实现“向下控制”；</li><li>通过一套标准的 <code>drivers</code> 接口，实现向上的接口统一，在设备树的基础上实现硬件的完全屏蔽，即“向上承诺”。</li></ul>`,47)])])}const g=a(e,[["render",l]]);export{o as __pageData,g as default};

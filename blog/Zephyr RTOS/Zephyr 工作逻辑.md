
本文介绍了针对某一特定板卡下 zephyr 的工作逻辑，包括从 arch 层的适配到上层 core 属性的调用。

## 逐层覆盖结构

zephyr 利用设备树进行外设管理，且这些外设的配置是独立于业务代码的。这使得在合适的配置下， zephyr 可以保证在更改运行平台时，不更改业务代码的任何部分。zephyr 将外设分为以下层级：

- Architecture
- SoC
- Boards
- Custom parts

### Architecture

首先，zephyr 社区对于目前主流的架构进行了适配。其在 `zephyr/arch` 目录下提供了对于如中断处理、上下文切换、内存管理等架构相关的驱动代码。通常情况下，开发者不需要关注这部分代码的内部细节。笔者将在后续的文档中说明这部分代码的组成。这是外设层级的第一层（最底层），利用 C 语言和汇编语言编写。

### SoC

其次，芯片厂商和 zephyr 社区对其设计生产的芯片进行 SoC 层的适配，体现为提供了一系列 C 语言头文件/源文件供下一级驱动文件（drivers）等调用，同时提供了 `dtsi` 设备树文件，为 boards 等下一级设备树文件调用。下列代码为节选自 `stm32f411.dtsi` ，即 ST 公司为其 stm32f411 系列芯片外设进行的硬件描述。一般情况下，开发者也不需要关注这部分代码的内部细节，因为其在芯片厂商的参考手册中有所对应。

```dts
/ {
    soc {
        compatible = "st,stm32f411", "st,stm32f4", "simple-bus";

        spi5: spi@40015000 {
            compatible = "st,stm32-spi";
            #address-cells = <1>;
            #size-cells = <0>;
            reg = <0x40015000 0x400>;
            clocks = <&rcc STM32_CLOCK(APB2, 20)>;
            interrupts = <85 5>;
            st,spi-data-width = "limited-8-16-bit";
            status = "disabled";
        };

        i2s1: i2s@40013000 {
            compatible = "st,stm32-i2s";
            #address-cells = <1>;
            #size-cells = <0>;
            reg = <0x40013000 0x400>;
            clocks = <&rcc STM32_CLOCK(APB2, 12)>;
            interrupts = <35 5>;
            dmas = <&dma2 3 3 STM32_DMA_MEM_INC STM32_DMA_FIFO_FULL>,
                   <&dma2 2 3 STM32_DMA_MEM_INC STM32_DMA_FIFO_FULL>;
            dma-names = "tx", "rx";
            status = "disabled";
        };
```

stm32f411 是一系列芯片，并非一个。但是其拥有一系列外设（硬件资源）作为其“最大公约数”。于是，`stm32f411.dtsi` 描述了这些最大公约数的内容。

同时，对于 stm32f411 系列的下属芯片分类，如 stm32f411Xe（其中 X 表示任意），其拥有在最大公约数之外的硬件资源。则可以在 dtsi 文件中引用 `stm32f411.dtsi`，然后只描述不同的部分：

```dtsi
#include <st/f4/stm32f411.dtsi>
  
/ {

    sram0: memory@20000000 {
        reg = <0x20000000 DT_SIZE_K(128)>;
    };

    soc {
        flash-controller@40023c00 {
            flash0: flash@8000000 {
                reg = <0x08000000 DT_SIZE_K(512)>;
            };
        };
    };
};
```

其在 sram 和 flash 上有所差别，则仅对这部分进行描述。

> 这是设备树文件描述硬件资源的逻辑，即文件之间允许包含覆盖。这在 Zephyr RTOS 和 Linux 中均是通用的。后续的 boards 的 dts 文件和自定义的 dts 文件（即 overlay 文件）都是如此。


### Boards

然后，开发版的设计者（有可能是 soc 厂商本身，比如 stm32-nucleo 系列）会基于 soc 提供的信息进行板卡的外设资源设计，更多的是时钟设置、各外设参数设置、外设别名设置等。如 nucleo_f411re 开发版，其内容大致如下（节选）：

```dts
/dts-v1/;
#include <st/f4/stm32f411Xe.dtsi>
#include <st/f4/stm32f411r(c-e)tx-pinctrl.dtsi>
#include "arduino_r3_connector.dtsi"
#include "st_morpho_connector.dtsi"
#include <zephyr/dt-bindings/input/input-event-codes.h>

/ {
    model = "STMicroelectronics STM32F411RE-NUCLEO board";
    compatible = "st,stm32f411re-nucleo";  

    chosen {
        zephyr,console = &usart2;
        zephyr,shell-uart = &usart2;
        zephyr,sram = &sram0;
        zephyr,flash = &flash0;
    };

    leds: leds {
        compatible = "gpio-leds";

        green_led_2: led_2 {
            gpios = <&gpioa 5 GPIO_ACTIVE_HIGH>;
	        label = "User LD2";
        };
    };

    gpio_keys {
        compatible = "gpio-keys";
  
        user_button: button {
            label = "User";
            gpios = <&gpioc 13 GPIO_ACTIVE_LOW>;
            zephyr,code = <INPUT_KEY_0>;
        };
    };
  
    aliases {
        led0 = &green_led_2;
        sw0 = &user_button;
    };
};
 
&clk_lsi {
    status = "okay";
};
  
&clk_hse {
    hse-bypass;
    clock-frequency = <DT_FREQ_M(8)>; /* STLink 8MHz clock */
    status = "okay";
};
```

可见其依然是引用了上一级的设备树文件，然后在此基础上进行延伸。

> 我们不建议更改以上三部分的配置，因为其作为公共产品，其属性是固定的。

### Custom parts

我们在设计新的电路板时，在硬件上往往会参照开发版的设计方案。在软件上也是如此。我们在开启一个新的硬件定制版的板级支持包（BSP）设计时，也会在现有的开发版的设备树文件的基础上进行衍生更改。Zephyr 提供了 DeviceTree Overlay 文件用于进行覆盖。

开发者在自己的工程目录下创建 app.overlay 文件。这不需要修改 zephyr 仓库里的任何代码，就可以在现有开发版的基础上进行覆盖修改。这是逐层覆盖逻辑的终点。如：

```overlay
&spi5 {
    status = "okay";          
    pinctrl-0 = <&spi5_default>; 
    
    my_sensor: sensor@0 {
        compatible = "zephyr,bme280";
        reg = <0>;
        spi-max-frequency = <1000000>;
    };
};

/ {
    aliases {
        sensor0 = &my_sensor;
    };
};
```

这段代码的 SPI 在 SoC 层级的 status 为 disabled，我们可以在 overlay 文件中开启。这将覆盖原来的属性。我们将其挂载在 my_sensor 名下，用于进行具体的外设驱动。同时，我们用 sensor0 别名代替 my_sensor。

同时，Zephyr 的构建系统之一 Kconfig 提供了在 prj.conf 文件中进行定义开关的功能，即：

```conf
CONFIG_SPI=y
CONFIG_SENSOR=y
CONFIG_BME280=y
```

## 构建过程

在设备树的基础上，Zephyr 利用其构建系统将上面四层的设备树合并为一个扁平的设备树文件，然后提取其 compatible 属性，并根据 `zephyr/dts/bindings` 中寻找对应的 yaml 绑定文件，其定义了该设备的合法属性。然后，将其生成一个 `devicetree_generated.h` 宏定义头文件，其包含了设备树中所有的属性设置，如：

```c
// Example
#define DT_N_S_soc_S_spi_40015000_S_sensor_0_P_reg 0
#define DT_N_S_soc_S_spi_40015000_S_sensor_0_P_spi_max_frequency 1000000
```

此后，这些宏定义在驱动文件（如 `drivers/sensor/bme280/bme280.c` ）中被调用，用于实例化这些宏定义。此时，编译器在内存中创建了一个结构体常量对象，用于存储该设备的信息。在 `main()` 启动之前，内核会根据宏定义指定的等级和优先级依次调用每个设备的初始化函数，并标记为 `ready`。

此时，该设备对象被静态的存放在内存中。当开发者需要使用时，就可以通过某种宏定义钩子（如 `DEVICE_DT_GET`  获取该内存对象。

> 需要知道的是，在构建过程之前，dts 和 dtsi 文件就已经存在。直到我们在构建时给出参数，构建系统才能确定要编译的平台，才能根据上面的过程确定调用链。

在构建时，构建系统根据我们传入的构建参数（-DBOARD=?）确认编译的平台，并根据某处的宏定义，连接不同的外设驱动文件，比如 `zephyr/drivers/spi/spi_ll_stm32.c`。这个文件中引用了针对该平台的 HAL 库。同时，根据上面提到的过程，构建系统静态的定义外设对象。

因为外设驱动文件（drivers）向上提供了完全相同的 API 驱动函数以实现完全屏蔽硬件差异。所以开发者可以通过完全相同的方式来调用这些外设对象。这就是 Zephyr 的通用设备模型。

在这个模型中，每个设备对象都有一个 api 指针，其指向驱动程序实现的一组函数功能表，如：

```c
static const struct spi_driver_api stm32_spi_api = {
    .transceive = spi_stm32_transceive,  
    .release = spi_stm32_release,
#ifdef CONFIG_SPI_ASYNC
    .transceive_async = spi_stm32_transceive_async,
#endif
};
```

其中 `spi_stm32_transceive` 等函数映射到 stm32 HAL 库的具体实现，如：

```c
static inline int spi_transceive(const struct device *dev, ...) {
    const struct spi_driver_api *api = (const struct spi_driver_api *)dev->api;
    return api->transceive(dev, ...); // 通过指针跳转到驱动实现
}
```

对于应用层，调用的函数名永远叫 `spi_transceive`，但是因为 dev 指针在运行时根据外设对象不同指向不同的 `struct device` 实例，其就自然跳转到对应的硬件操作函数。

在 HAL 库中，其对于硬件的处理会非常直接：

```c
static int spi_stm32_init(const struct device *dev) {
    const struct spi_stm32_config *cfg = dev->config; 
    
    LL_SPI_Disable((SPI_TypeDef *)cfg->regs); 
    // ...
    return 0;
}
```

其中 `cfg->reg` 就是由 `devicetree_generated.h` 提供的值。这是设备树中定义的寄存器地址。

自此，zephyr 的构建系统实现了从硬件描述到上层 API 调用再到底层映射实现的全流程。

## Zephyr 哲学

Zephyr 的驱动模型在本质上是一套约束协议：

- 通过 `west` 和 `modules` 管理厂商提供的各式各样的、混乱的 HAL 库，实现“向下控制”；
- 通过一套标准的 `drivers` 接口，实现向上的接口统一，在设备树的基础上实现硬件的完全屏蔽，即“向上承诺”。



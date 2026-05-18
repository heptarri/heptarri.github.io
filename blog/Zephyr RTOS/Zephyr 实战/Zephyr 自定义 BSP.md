# Zephyr 自定义 BSP

Zephyr 提供了自定义 board 的功能，可以通过 Device Tree 的方式配置外设，与 Linux 相似。本文介绍如何在 `$ZEPHYR_BASE` 目录之外新建项目。

本文的项目是在 [Zephyr  项目配置和调试](Zephyr%20%20项目配置和调试.md) 的基础上进行的。另外，阅读本文之前建议查阅 [Zephyr 工作逻辑](../Zephyr%20工作逻辑.md)。

## 项目结构

首先，新建 `boards/<vendor>` 文件夹。笔者手中板子的 `<vendor>` 供应商为 `st`，故设置目录为 `boards/st`。假设我们的板子名为 `my_board`，则在该目录下新建以下文件：

- `my_board.dts`：这就是设备树文件，描述了其外设的配置信息。
- `Kconfig.my_board`：板子有关 SoC 的配置文件。
- `my_board_defconfig`：有关 Zephyr 的对于该板子的配置裁剪文件。
- `board.yml`：板子描述信息，`west` 根据这个文件检索板子。
- `board.cmake`：描述了编译、烧录等功能的 `cmake` 文件。
- `support/`：该目录为 `openocd` 等工具的配置文件目录，用于调试。

## 各文件说明

### `Kconfig.my_board`

内容如下：

```my_board
config BOARD_MY_BOARD
    select SOC_STM32F411XE
```

其指明了这块板子使用的 SOC 型号。之后，Zephyr 会在 soc 中寻找该芯片的配置文件等。本处为 `STM32F411XE`。

### `my_board_defconfig`

内容如下：

```
# SPDX-License-Identifier: Apache-2.0

# Enable MPU
CONFIG_ARM_MPU=y

# Enable HW stack protection
CONFIG_HW_STACK_PROTECTION=y

CONFIG_SERIAL=y

# console
CONFIG_CONSOLE=y
CONFIG_UART_CONSOLE=y

# enable GPIO
CONFIG_GPIO=y
```

其规定了某些 Zephyr 功能的开关情况，比如 `CONFIG_GPIO` 指定了是否使用 GPIO 等。

### `board.yml`

内容如下：

```yml
board:
name: my_board
full_name: ST Nucleo F411RE Copy
vendor: st
socs:
- name: stm32f411xe
```

其描述了板子的基本信息，包括板子名称、可读的名称、供应商和 SoC。west 根据这个文件索引板子列表。

### `board.cmake`

内容如下：

```cmake
# keep first
board_runner_args(stm32cubeprogrammer "--port=swd" "--reset-mode=hw")
board_runner_args(jlink "--device=STM32F411RE" "--speed=4000")

# keep first
include(${ZEPHYR_BASE}/boards/common/stm32cubeprogrammer.board.cmake)
include(${ZEPHYR_BASE}/boards/common/openocd-stm32.board.cmake)
include(${ZEPHYR_BASE}/boards/common/jlink.board.cmake)
include(${ZEPHYR_BASE}/boards/common/stlink_gdbserver.board.cmake)
```

可以看到，其描述了烧录用的工具等。有了这个文件的描述，就可以进行 `west flash` 等操作。

### `support/openocd.cfg`

该目录下暂时只有一个文件：`openocd.cfg`。他描述了 OpenOCD 的一些行为。内容如下：

```cfg
source [find board/st_nucleo_f4.cfg]

$_TARGETNAME configure -event gdb-attach {
	echo "Debugger attaching: halting execution"
	reset halt
	gdb_breakpoint_override hard
}

$_TARGETNAME configure -event gdb-detach {
	echo "Debugger detaching: resuming execution"
	resume
}
```

有了这个文件，结合 `board.cmake`，就可以进行 `west debug`、`west debugserver` 等操作。

### `my_board.dts`

这是描述外设的设备树文件，内容如下：

```
/dts-v1/;

#include <st/f4/stm32f411Xe.dtsi>
#include <st/f4/stm32f411r(c-e)tx-pinctrl.dtsi>
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

&pll {
    div-m = <8>;
    mul-n = <384>;
    div-p = <4>;
    div-q = <8>;
    clocks = <&clk_hse>;
    status = "okay";
};

&rcc {
    clocks = <&pll>;
    clock-frequency = <DT_FREQ_M(96)>;
    ahb-prescaler = <1>;
    apb1-prescaler = <2>;
    apb2-prescaler = <1>;
};


&usart2 {
    pinctrl-0 = <&usart2_tx_pa2 &usart2_rx_pa3>;
    pinctrl-names = "default";
    current-speed = <115200>;
    status = "okay";
};
```

具体的解析详见 [Zephyr 编写设备树文件](Zephyr%20编写设备树文件.md)。

## 引用 BSP

由于该 BSP 的位置不在 `$ZEPHYR_BASE` 内，所以需要在 CMakeLists 中添加内容：

```txt
list(APPEND BOARD_ROOT ${CMAKE_SOURCE_DIR})
set(BOARD my_board)
```

这样，west 就可以将当前目录添加到 `BOARD_ROOT` 目录中，我们的 BSP 就可以被搜索到。运行 `west build` 编译。

上面的 BSP 中包含了串口、LED 和按键的外设配置。所以可以在 `main.c` 中调用以测试：

```c
#include <stdio.h>
#include <zephyr/kernel.h>

#include "zephyr/drivers/gpio.h"

static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(DT_ALIAS(led0), gpios);
static const struct gpio_dt_spec button =
    GPIO_DT_SPEC_GET(DT_ALIAS(sw0), gpios);

int main() {
  int ret;

  if (!gpio_is_ready_dt(&led) || !gpio_is_ready_dt(&button)) {
    return 0;
  }

  ret = gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);
  if (ret < 0) return 0;

  ret = gpio_pin_configure_dt(&button, GPIO_INPUT);
  if (ret < 0) return 0;

  while (1) {
    int val = gpio_pin_get_dt(&button);

    if (val > 0) {
      gpio_pin_toggle_dt(&led);
      k_sleep(K_MSEC(100));
    } else {
      gpio_pin_toggle_dt(&led);
      k_sleep(K_MSEC(1000));
    }

    printk("LED STATE: %d\n", val);
  }

  return 0;
}
```

可以观察到，LED 成功亮起，受按钮控制。

## 资源

本文项目链接：[GitHub - heptarri](https://github.com/heptarri/zephyr_prj_tmpl)
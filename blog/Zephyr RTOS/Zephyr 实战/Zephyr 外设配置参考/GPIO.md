# GPIO

## 设备树文件

```dts
/ {
    led {
        compatible = "gpio-leds";

        ld_2: led {
            gpios = <&gpioa 5 GPIO_ACTIVE_HIGH>;
            label = "User LD2";
        };
    };
    
    key {
		compatible = "gpio-keys";

		b_1: button {
			label = "User";
			gpios = <&gpioc 13 GPIO_ACTIVE_LOW>;
		};
	};
    
    aliases {
        led0 = &ld_2;
        sw0 = &b_1;
    };
}
```

## 配置文件

```conf
CONFIG_GPIO=y
```

## 代码调用部分

```cpp
#include <zephyr/drivers/gpio.h>
#include <zephyr/kernel.h>

static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(DT_ALIAS(led0), gpios);
static const struct gpio_dt_spec bt = GPIO_DT_SPEC_GET(DT_ALIAS(sw0), gpios);

void user_gpio_entry() {
  int ret;

  if (!gpio_is_ready_dt(&led) || !gpio_is_ready_dt(&bt)) {
    printk("GPIO Initialization failed!\n");

    return;
  }

  ret = gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);
  if (ret < 0) return;

  ret = gpio_pin_configure_dt(&bt, GPIO_INPUT);
  if (ret < 0) return;

  while (1) {
    gpio_pin_toggle_dt(&led);
    int value = gpio_pin_get_dt(&bt);

    printk("Val: %d\n", value);

    k_sleep(K_SECONDS(1));
  }
}

K_THREAD_DEFINE(tid_gpio, 1024, user_gpio_entry, NULL, NULL, NULL, 7, 0, 0);
```
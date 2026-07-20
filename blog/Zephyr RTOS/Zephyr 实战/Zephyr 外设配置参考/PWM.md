# PWM

## 设备树文件

```dts
/ {
	led {
		compatible = "pwm-leds";

		ld_2: led {
			pwms = <&pwm2 1 PWM_MSEC(20) PWM_POLARITY_NORMAL>;
			label = "User LD2";
		};
	};
	
	aliases {
		led0 = &ld_2;
	};
};

&timers2 {
	status = "okay";

	pwm2: pwm {
		status = "okay";
		pinctrl-0 = <&tim2_ch1_pa5>;
		pinctrl-names = "default";
	};
};
```

## 配置文件

```conf
CONFIG_PWM=y
```

## 代码调用部分

```cpp
#include <zephyr/drivers/pwm.h>
#include <zephyr/kernel.h>

static const struct pwm_dt_spec led = PWM_DT_SPEC_GET(DT_ALIAS(led0));

void user_pwm_entry() {
  if (!pwm_is_ready_dt(&led)) return;

  uint32_t pulse = 0;
  uint32_t period = led.period;
  uint32_t step = 200000;

  while (1) {
    pwm_set_pulse_dt(&led, pulse);
    pulse += step;

    if (pulse >= period)
      pulse = period, step = -step;
    else if (pulse <= 0)
      pulse = 0, step = -step;

    k_sleep(K_MSEC(10));
  }
}

K_THREAD_DEFINE(tid_pwm, 1024, user_pwm_entry, NULL, NULL, NULL, 7, 0, 0);
```

## 备注

需要注意的是，由于 `nucleo_f411re` 官方开发板会默认开启 SPI1，占用 PA5 引脚，所以需要在设备树文件中关闭：

```dts
&spi1 {
	status = "disabled";
};
```


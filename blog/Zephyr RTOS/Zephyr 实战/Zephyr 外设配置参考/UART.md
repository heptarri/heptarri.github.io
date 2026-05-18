# UART

## 设备树文件

```dts
&usart1 {
	status = "okay";

  pinctrl-0 = <&usart1_tx_pa9 &usart1_rx_pa10>;
  pinctrl-names = "default";
	
  current-speed = <115200>;
};
```

## 配置文件

```conf
CONFIG_LOG=y
```

## 代码调用部分

```cpp
#include <zephyr/device.h>
#include <zephyr/drivers/uart.h>
#include <zephyr/kernel.h>

void user_uart_entry() {
  const struct device* const uart_dev = DEVICE_DT_GET(DT_NODELABEL(usart1));
  unsigned char recv_char;

  if (!device_is_ready(uart_dev)) {
    return;
  }
  while (1) {
    char* init_str = "USART1 IO Ready. Speed: 115200\r\n";
    while (*init_str != '\0') {
      uart_poll_out(uart_dev, *init_str);
      init_str++;
    }

    k_sleep(K_SECONDS(1));
  }

  // Send the received bytes.
  // while (1) {
  //   if (uart_poll_in(uart_dev, &recv_char) == 0) {
  //     uart_poll_out(uart_dev, recv_char);
  //   }

  //   k_sleep(K_MSEC(1));
  // }
}

K_THREAD_DEFINE(tid_uart, 1024, user_uart_entry, NULL, NULL, NULL, 7, 0, 0);
```
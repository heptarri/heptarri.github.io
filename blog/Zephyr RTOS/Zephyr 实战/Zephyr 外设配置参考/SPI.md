# SPI

## 设备树文件

```dts
/ {
	aliases {
		spi-1 = &spi3;
	};
};

&spi3 {
	status = "okay";
	
	pinctrl-0 = <&spi3_sck_pc10 &spi3_miso_pc11 &spi3_mosi_pc12>;
	pinctrl-names = "default";
};
```

## 配置文件

```conf
CONFIG_SPI=y
```

## 代码调用部分

```cpp
#include <zephyr/device.h>
#include <zephyr/drivers/spi.h>
#include <zephyr/kernel.h>

const struct device* spi;
struct spi_config spi_cfg = {0};

void user_spi_entry() {
  spi = DEVICE_DT_GET(DT_ALIAS(spi_1));

  if (!device_is_ready(spi)) return;

  struct spi_config spi_cfg = {
      .frequency = 256000U,
      .operation = SPI_WORD_SET(8),
  };

  int ret;

  while (1) {
    uint8_t buf[] = {
        0xAA,
        0xBB,
        0xCC,
    };

    struct spi_buf tx_buf = {
        .buf = buf,
        .len = sizeof(buf),
    };

    struct spi_buf_set tx = {
        .buffers = &tx_buf,
        .count = 1,
    };

    ret = spi_write(spi, &spi_cfg, &tx);
    printk("Spi message sent successfully. return value: %d.\n", ret);

    k_msleep(500);
  }
}

K_THREAD_DEFINE(tid_spi, 1024, user_spi_entry, NULL, NULL, NULL, 7, 0, 0);
```

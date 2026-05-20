# Thread

```cpp
#include <stdio.h>
#include <zephyr/kernel.h>

void task_cb(void* dummy) {
  ARG_UNUSED(dummy);

  while (1) {
    printk("running task1...\n");

    k_sleep(K_MSEC(500));
  }
}

K_THREAD_DEFINE(task_id, 1024, task_cb, NULL, NULL, NULL, 2, 0, 0);
```
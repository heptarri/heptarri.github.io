# Work

```cpp
#include <stdio.h>
#include <zephyr/kernel.h>

void work_handler(struct k_work* work) {
  printk("Work handler started.\n");

  k_sleep(K_SECONDS(1));

  printk("Work handler ended.\n");
}

K_WORK_DEFINE(work_id, work_handler);

void user_work_cb() {
  while (1) {
    printk("User work task running...\n");
    k_work_submit(&work_id);

    k_sleep(K_MSEC(500));
  }

  return;
}

K_THREAD_DEFINE(work_task_id, 1024, user_work_cb, NULL, NULL, NULL, 2, 0, 0);
```
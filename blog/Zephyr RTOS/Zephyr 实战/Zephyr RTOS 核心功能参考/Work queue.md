# Work queue

```cpp
#include <stdio.h>
#include <zephyr/kernel.h>

K_THREAD_STACK_DEFINE(user_workq_stack, 1024);

static struct k_work_q user_workq;

static void work_handler(struct k_work* work) {
  printk("Work in queue started.\n");

  k_sleep(K_SECONDS(1));

  printk("Work in queue ended.\n");
}

K_WORK_DEFINE(work_queue_id, work_handler);

void user_work_queue_cb() {
  k_work_queue_start(&user_workq, user_workq_stack,
                     K_THREAD_STACK_SIZEOF(user_workq_stack), 2, NULL);

  k_work_submit_to_queue(&user_workq, &work_queue_id);

  while (1) {
    k_sleep(K_SECONDS(1));
  }
}

K_THREAD_DEFINE(work_queue_task_id, 1024, user_work_queue_cb, NULL, NULL, NULL, 2, 0, 0);
```
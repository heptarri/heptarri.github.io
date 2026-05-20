# Semaphore

```cpp
#include <zephyr/kernel.h>

K_SEM_DEFINE(user_sem, 0, 1);

void producer_task(void) {
  while (1) {
    printk("Producer give sem.\n");

    k_sem_give(&user_sem);

    k_sleep(K_SECONDS(1));
  }
}

void consumer_task(void) {
  while (1) {
    k_sem_take(&user_sem, K_FOREVER);

    printk("Consumer taken sum.\n");
  }
}

K_THREAD_DEFINE(sem_producer_id, 1024, producer_task, NULL, NULL, NULL, 2, 0,
                0);

K_THREAD_DEFINE(sem_consumer_id, 1024, consumer_task, NULL, NULL, NULL, 2, 0,
                0);
```
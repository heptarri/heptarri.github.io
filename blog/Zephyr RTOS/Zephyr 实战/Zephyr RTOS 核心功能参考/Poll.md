# Poll

```cpp
#include <stdio.h>
#include <zephyr/kernel.h>

K_SEM_DEFINE(sem1, 0, 1);
K_SEM_DEFINE(sem2, 0, 1);

void thread_sem1_cb() {
  while (1) {
    k_sleep(K_SECONDS(1));

    printk("Given sem1.\n");

    k_sem_give(&sem1);
  }
}

void thread_sem2_cb() {
  while (1) {
    k_sleep(K_SECONDS(3));

    printk("Given sem2.\n");

    k_sem_give(&sem2);
  }
}

void poll_thread_cb() {
  struct k_poll_event events[2] = {
      K_POLL_EVENT_STATIC_INITIALIZER(K_POLL_TYPE_SEM_AVAILABLE,
                                      K_POLL_MODE_NOTIFY_ONLY, &sem1, 0),
      K_POLL_EVENT_STATIC_INITIALIZER(K_POLL_TYPE_SEM_AVAILABLE,
                                      K_POLL_MODE_NOTIFY_ONLY, &sem2, 0),
  };

  while (1) {
    printk("Poll waiting...\n");

    k_poll(events, 2, K_FOREVER);

    if (events[0].state == K_POLL_STATE_SEM_AVAILABLE) {
      k_sem_take(&sem1, K_NO_WAIT);

      printk("Received sem1.\n");

      events[0].state = K_POLL_STATE_NOT_READY;
    }

    if (events[1].state == K_POLL_STATE_SEM_AVAILABLE) {
      k_sem_take(&sem2, K_NO_WAIT);

      printk("recv sem2\n");

      events[1].state = K_POLL_STATE_NOT_READY;
    }
  }
}

K_THREAD_DEFINE(thread1_id, 1024, thread_sem1_cb, NULL, NULL, NULL, 5, 0, 0);

K_THREAD_DEFINE(thread2_id, 1024, thread_sem2_cb, NULL, NULL, NULL, 5, 0, 0);

K_THREAD_DEFINE(poll_id, 1024, poll_thread_cb, NULL, NULL, NULL, 5, 0, 0);
```

> 需要在 `prj.conf` 中定义 `CONFIG_POLL=y`。
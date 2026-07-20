# Condvar

```cpp
#include <zephyr/kernel.h>

K_CONDVAR_DEFINE(user_condvar);
K_MUTEX_DEFINE(user_mutex_c);

static bool condition_met = false;

void consumer_handle() {
  printk("Consumer: Thread started. acquiring mutex...\n");

  k_mutex_lock(&user_mutex_c, K_FOREVER);

  while (!condition_met) {
    printk("Consumer: Condition not met. Wait on condvar...\n");

    k_condvar_wait(&user_condvar, &user_mutex_c, K_FOREVER);

    printk("Consumer: Woke up! Re-checking the condition...\n");
  }

  printk("Consumer: Condition is met! Done.\n");

  k_mutex_unlock(&user_mutex_c);
}

void producer_handle() {
  k_sleep(K_SECONDS(2));

  printk("Producer: Preparing to change condtion...\n");

  k_mutex_lock(&user_mutex_c, K_FOREVER);

  condition_met = true;

  printk("Producer: Condition changed! Signaling condvar...\n");

  k_condvar_signal(&user_condvar);

  k_mutex_unlock(&user_mutex_c);
}
K_THREAD_DEFINE(condvar_cons_id, 1024, consumer_handle, NULL, NULL, NULL, 2, 0,
                0);

K_THREAD_DEFINE(condvar_prod_id, 1024, producer_handle, NULL, NULL, NULL, 2, 0,
                0);x
```
# 线程 Thread

Zephyr 可以新建线程，通过动态或者静态的方式。通过这种方式，开发者可以虚拟“并行”的运行数个任务。Zephyr 会自动分配 CPU 时间用于运行这些线程。这与其他的 RTOS 是类似的。

下面是一个新建线程并在其中输出 "Thread 1 callback" 的例程：

```c
#include <zephyr/kernel.h>
#include <zephyr/sys/printk.h>

#define PRIORITY 7
#define SLEEPTIME 500
#define STACKSIZE 1024


K_THREAD_STACK_DEFINE(thread_a_stack_area, STACKSIZE);

static struct k_thread thread_a_data; 

static uint8_t cnt = 0;


void thread_a_entry_point(void* dummy1, void* dummy2, void* dummy3) {
  ARG_UNUSED(dummy1);
  ARG_UNUSED(dummy2);
  ARG_UNUSED(dummy3);  

  while (1) {
    k_msleep(500);
    printk("Thread 1 callback\n");

    ++cnt;
  }
}

int main(void) {
  k_thread_create(&thread_a_data, thread_a_stack_area,
                  K_THREAD_STACK_SIZEOF(thread_a_stack_area),
                  thread_a_entry_point, NULL, NULL, NULL, PRIORITY, 0,
                  K_FOREVER);

  k_thread_name_set(&thread_a_data, "thread_1");
  k_thread_start(&thread_a_data);

  return 0;
}
```

> Zephyr 支持在设备树中定义某个 uart 外设作为 console/shell，从而可以通过重定义的 `printf` 或者 `printk` 来输出日志。
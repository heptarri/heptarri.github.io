# RAII 与资源管理

本章是现代 C++ 资源管理的基础，先于智能指针、容器和异常安全等内容展开。

## 存储布局

我们的程序始终运行在由操作系统管理的进程中。每一个进程均具有其自己的虚拟内存空间供程序使用。也就是说，下文中提到的指针、堆栈均是在虚拟内存空间语境下的结果，地址也是在虚拟内存空间的地址而不是真实的物理地址。下图为虚拟内存空间的地址布局。从下往上看，地址通常递增。运行时堆为程序在堆上分配内存的区域，用户栈为在程序栈上分配内存的区域。内核空间供 OS 内核使用，用户态程序无法访问。

![620](assets/Pasted%20image%2020260818160231.png)

在一切之前，需要说明堆或栈在分配内存的时候，其分得的内存空间的地址的增长方式。堆的地址增长方式是从低到高的，而栈的地址增长方式是从高到低的。（仅指的是 x86 系统）

> 之所以它们会呈现出相反的两种地址增长方式是有其历史原因的。早期的机器上内存的大小十分有限，如果堆和栈使用相同的地址增长方式（比如，都是从低到高），假设，一段内存空间的起始位置（先忽略其他段）设置为堆的起始地址，那么栈的起始地址必然在这段内存空间的中间某处，这个起始点如果选择得太靠后，则可能导致栈的内存大小不够，太靠前则会导致堆在分配内存的时候，可能与栈地址冲突。这时，x86 系统的设计师们，巧妙地将栈的起始位置定于内存空间的另一端，而其地址增长方式也是和堆相反的从高到低，这样从一定程度上，减轻了堆栈内存地址冲突或栈空间不足的可能性。

## 程序中的资源

在传统 C++ 程序中，程序会调用诸多资源。资源不仅仅是静态占用的内存，还包括动态分配的内存、文件描述符和句柄、互斥锁、数据库、网络、操作系统句柄、临时文件、显卡等外设、一些逻辑资源等。程序需要对资源进行完整的、贯穿生命周期的管理。对于 C++ 来说，资源通常需要进行显式的获取，且必须通过某种方式释放（否则就会造成内存泄露）——获取和释放往往是成对出现的。同时，获取和释放的顺序很大程度上会影响程序的正确性。

对于上面的描述，我们举例说明：

```cpp
void process() {
    Resource* resource = acquire();
    use(resource);
    release(resource);
}
```

上面是一段典型的处理事务的函数。其申请了类型为 `Resource` 的对象，并使用对象（`use(resource)`)，最后释放对象所占的内存（`release(resource)`）。但是，其在执行中会出现一系列问题，比如，如果 use 函数抛出异常，中途返回（return），那么 release 函数就不会被执行，资源 resource 也不会被释放。

所以，资源的内存释放不能仅依靠在最后一行编写代码进行（就像 C 那样）。因此，资源释放应当绑定到对象本身的生命周期，在对象建时获取资源，对象被销毁时释放资源。这就是 RAII 的核心思想。接下来看最常见的载体：栈对象。

## 栈对象与析构

首先来构建一个局部对象：

```cpp
void example() {
    File file;
    // 使用 file
}
```

对象 file 的生命周期由三部分组成：其在进入作用域时构造，执行作用域内的代码，在离开作用域时自动析构。离开作用域的方式有四种：正常直行到末尾；被 return 返回中止执行；被 break 等流程控制语句强制离开作用域；抛出异常。析构函数在类体中定义：

```cpp
class Logger {
public:
    Logger() {
        std::cout << "construct\n";
    }

    ~Logger() {
        std::cout << "destroy\n";
    }
};

void test() {
    Logger logger;
    std::cout << "inside\n";
}
```

对于对象 logger，其预期输出为：

```
construct
inside
destroy
```

符合上文中关于生命周期流程的阐述。通常，我们在析构函数中释放资源、恢复状态，解锁进程锁、清理临时资源等，用于消除该对象存在的痕迹。

对于同一作用域内，局部对象按照构造逆序来析构（符合栈对象出入的顺序）。从逻辑上，这是合理的。如果多个资源具有相互依赖关系，即后创建的对象依赖于前创建的对象，那么先析构后创建的对象就可以逐级接触这种依赖关系。

对于成员对象（如下面所示），其析构顺序和创建顺序相反。也就是说，成员初始化顺序由声明顺序决定，而不是初始化列表中的书写顺序。

```cpp
class Service {
private:
    File file_;
    Mutex mutex_;
};
```

## RAII

RAII 指的是 Resource Acquisition Is Initiaolization，即资源获取即初始化。其主导，析构函数负责释放资源、构造函数负责获取资源，对象的生命周期就是资源的生命周期。所以，只要对象被正确地管理，那么资源就不会被遗忘。一个典型的复合 RAII 思想的模型如下：

```cpp
class ResourceGuard {
public:
    ResourceGuard()
        : resource_(acquire()) {}

    ~ResourceGuard() {
        release(resource_);
    }

private:
    Resource resource_;
};

// usage
void process() {
    ResourceGuard guard;
    use_resource(guard);
}
```

对于这样的典型场景，RAII 具有一系列限制。资源必须在构造阶段建立。也就是说，如果我们确认对象已经创建，那么相应的资源应当也是准备妥当的。同理，析构函数必须释放资源，当析构函数成功执行，那么资源一定被正确释放。所以，析构函数不应当抛出异常，以免打断资源释放。

## 作用域和所有权

对于栈对象，作用域决定了对象的生命周期。作用域越小，资源持有时间通常越短。在 C++ 中，对象的作用域一般由一对括号 {} 限制。

对于同一种资源，可能会有一个或者多个对象可以访问。那么当多个对象访问同一资源时，资源的申请和释放就会发生冲突。这时，所有权机制提供了管理对象的方式。

> 离开作用域自动销毁只适用于对象具有明确生命周期的情况。对于栈对象，这一条永远适用。不过对于函数如 `create_file()` 而言，其拥有的对象（文件本身）存在跨作用域的情况，他的资源被创建在堆上（堆对象）。这时，虽然函数 create_file 返回了，但是对象依旧存在。这时，就需要所有权机制明确资源的拥有者、销毁事务。

对于资源的所有权，C++ 提供了多种形式。

1. 独占所有权。资源的申请和释放由一个对象完成，其他对象不能随意操作，比如 [智能指针](智能指针.md) 中提到的 `std::unique_ptr<T>` 。
2. 共享所有权。多个对象共同持有资源，由最后一个未被销毁的对象负责释放资源。比如 `std::shared_ptr<T>`。
3. 非拥有型引用。对象可以使用资源，但是没有权利释放。比如 `std::weak_ptr<T>`。

为了更加明确的体现所有权机制，我们建议所有权需要体现在接口类型中，利用智能指针进行类型定义：

```cpp
void process(File& file);                    // 借用，不接管所有权
void process(std::unique_ptr<File> file);    // 接管独占所有权
void process(std::shared_ptr<File> file);    // 共享所有权
```

在实际场景中，一般这么使用：

```cpp
void process(File& file); // 只使用，不负责销毁

File file("a.txt");
process(file);
// file 仍由调用者拥有，仍可继续使用
```

```cpp
void process(std::unique_ptr<File> file); // 接管独占所有权

auto file = std::make_unique<File>("a.txt");
process(std::move(file));
// file 已被移走，调用者不再拥有它
```

> std::move 表示将所有权交给 process 函数，调用者不拥有这个 file 对象的资源。释放资源由函数 process 完成。

```cpp
void process(std::shared_ptr<File> file); // 共享所有权

auto file = std::make_shared<File>("a.txt");
process(file);
// process 和调用者在函数执行期间共同持有资源
// 调用者仍然可以使用 file
```

shared_ptr 会维护引用计数变量，用来记录有多少个角色拥有资源。最后一个对象被销毁时，文件才会关闭。

这样，就合理的实现了不同函数、不可预知调用关系之间的资源的相互利用和管理。

## `new`/`delete` 问题

在以往的 C++ 中，常见的管理资源的方式如下：

```cpp
void process() {
    auto* data = new Data;
    use(data);
    delete data;
}
```

这种写法需要调用者处理 new 是否成功、每条控制语句是否都会最终执行 delete、会不会重复 delete、是否存在异常路径、是否使用 delete[]、资源是否传递到其他对象中等等问题，如下：

```cpp
void process(bool failed) {
    Data* data = new Data;

    if (failed) {
        return; // 忘记 delete
    }

    delete data;
}
```

```cpp
void process() {
    Data* data = new Data;

    risky_operation(); // 抛出异常

    delete data;
}
```

```cpp
void process() {
    File* file = new File("data.txt");
    Socket* socket = new Socket();

    initialize(socket); // 可能抛异常

    delete socket;
    delete file;
}
```

```cpp
auto* values = new int[10];
delete values; // 错误，应该使用 delete[] values;
```

这些错误往往是 C++ 内存风险的重要原因。

## 为什么 RAII 可以解决问题？

对于上面的例子：

```cpp
void process() {
    File file("data.txt");
    risky_operation();
}

void process_unsafe() {
    File* file = new File("data.txt");
    risky_operation();
    delete file;
}
```

当 `risky_operation()` 函数抛出异常，异常会沿着调用栈向上传播，从而离开当前的作用域。根据 RAII，离开作用域时，局部对象会自动析构，从而销毁对象，文件句柄被关闭，异常继续向上层传播。

对比不安全写法，当 risky_operation() 抛出异常后，delete 行并不会被执行，对象不会被销毁，从而产生泄露。

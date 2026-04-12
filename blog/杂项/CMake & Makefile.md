# CMake & Makefile

## CMake 文件结构和基础语法

CMakeLists.txt 文件使用一系列的 CMake 指令来描述构建过程，如：

1. 指定 CMake 最低版本需求：

```cmake
cmake_minimum_requireda(VERSION <version>)
```

2. 定义项目名称和使用的编程语言：

```cmake
project(<project_name> [<language>...])
```

3. 指定要生成的可执行文件和源文件：

```cmake
add_excutable(<target> <source_files>...)
```

4. 创建一个库及其源文件

```cmake
add_library(<target> <source_files>...)
```

5. 连接目标文件和其他库：
```cmake
target_link_libraries(<target> <libraries>...)
```

6. 添加头文件搜索路径：
```cmake
include_directories(<dirs>...)
```

7. 设置变量值：

```cmake
set(<variable> <value>...)
```

8. 设置目标属性：

```cmake
target_include_directories(TARGET target_name
							[BEFORE | AFTER]
							[SYSTEM] [PUBLIC | PRIVATE | INTERFACE]
							[items1...])
```

9. 安装规则：

```cmake
install(TARGETS target1 [target2 ...]
        [RUNTIME DESTINATION dir]
        [LIBRARY DESTINATION dir]
        [ARCHIVE DESTINATION dir]
        [INCLUDES DESTINATION [dir ...]]
        [PRIVATE_HEADER DESTINATION dir]
        [PUBLIC_HEADER DESTINATION dir])
```

10. 条件语句：

```cmake
if(expression)
  # Commands
elseif(expression)
  # Commands
else()
  # Commands
endif()
```

等等。

## 变量和缓存

CMake 可以使用变量传递信息。

定义变量：

```cmake
set(MY_VAR "Hello world!")

message(STATUS "Variable MY_VAR is ${MY_VAR}")
```

## 查找库和包

CMake 可以通过 `find_package()` 指令检测和配置外部包，常用于查找系统安装的库或者第三方库。

如：

```cmake
find_package(Boost 1.70 REQUIRED)
```

还可以指定路径：

```cmake
find_package(OpenCV REQUIRED PATHS /path/to/opencv)
```

使用查找的库：

```cmake
target_link_libraries(MyExecutable Boost:Boost)
```

设置包含目录和连接：

```cmake
include_directories(${Boost_INCLUDE_DIRS})
link_directories(${Boost_LIBRARY_DIRS})
```

> `include_directories` 是为编译器指定头文件，`link_directories` 是为链接器指定库文件路径。前者用于编译阶段，后者在链接阶段。

> C 程序构建主要有四个阶段：预处理（Preprocessing）、编译（Compilation）、汇编（Assembly）和链接（Linking）。预处理用于处理预编译指令，如 `include` `define` `ifdef` 等。然后将头文件插入源文件中，展开宏定义，删除注释，输出 `.i` 文件。编译阶段将其翻译成汇编代码 `.s` 文件。汇编阶段将汇编代码转化为机器码，生成目标文件 `.o` 。链接阶段将多个目标文件和库文件合并，生成可执行文件。链接可能是动态链接，也可能是静态链接（将库代码打包进可执行文件）或者动态链接（运行时加载 `.so` 或者 `.dll` ）。

## 使用第三方库

假设在项目中使用 Boost 库，则可以编写 CMakeLists.txt 文件如下：

```cmake
cmake_minimum_required(VERSION 3.10)
project(MyProject CXX)

find_package(Boost REQUIRED)

add_excutable(MyExecutable main.cc)

target_link_libraries(MyExecutable Boost::Boost)
```

## CMake 构建流程


CMake 构建通常分为以下流程：

![](assets/Pasted%20image%2020260126132526.png)

### 创建构建目录

CMake 推荐使用 `Out of source` 构建方式，即将构建文件与源代码目录剥离。即：

```bash
mkdir build && cd build
cmake ..
```

### 使用 CMake 生成构建文件

在构建目录 `build` 中运行 CMake 命令，指定源代码目录。源代码目录是包含 CMakeLists.txt 文件的目录。即：

```bash
cmake ..
```

### 编译项目

如果生成了 Makefile（在大多数类 Unix 系统中默认生成），可以使用 make 命令进行编译：

```bash
make
```

然后在构建目录中就可以运行可执行文件：

```bash
./MyExecutable
```

### 使用 CMake 清理构建文件

如果在 CMakeLists.txt 中定义了清理规则，可以使用 make clean 命令：

```bash
make clean
```

不过，我们常使用手动删除：

```bash
rm -rf build
```


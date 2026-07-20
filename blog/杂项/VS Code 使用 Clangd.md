# VS Code 使用 Clangd

鉴于 Visual Studio Code 中的 Cpptools 插件过于难用，可以利用 clangd 作为自动补全的插件替代。

## 工具链

- `clang`：Clang 是一种用于 C、C++、Objective-C 编程语言的编译器前端。它是 LLVM 项目的一部分。LLVM 项目是一个模块化和可重用的编译器和工具链技术集合。
- `clangd`：Clangd 是一个基于 Clang 编译器的语言服务器，用于提供 C/C++ 语言的代码补全、语义分析和代码导航等功能。
- `lldb` 是一个开源的调试器，用于调试 C、C++、Objective-C 和 Swift 等编程语言的应用程序。

## 配置 clangd

首先在本机安装 clangd。以 macOS 为例：

```sh
brew instal llvm
```

安装后，查看当前 clangd 版本：

```
/opt/homebrew/opt/llvm/bin/clangd --version
```

可以看到以下输出：

```sh
Homebrew clangd version 22.1.5
Features: mac+xpc
Platform: arm64-apple-darwin25.4.0
```

此后，在 Visual Studio Code 中安装 clangd 插件：

![](assets/Pasted%20image%2020260521144644.png)

安装后，按下 `Command+Shift+P`，输入 `user settings json` 查找：

![](assets/Pasted%20image%2020260521144732.png)

在文件末尾添加：

```json
    "C_Cpp.intelliSenseEngine": "disabled",
    "clangd.path": "/opt/homebrew/opt/llvm/bin/clangd",
    "clangd.arguments": [
        "--compile-commands-dir=build",
        "--background-index",
        "--query-driver=/opt/homebrew/bin/*"
    ]
```

即可。在 C/C++ 文件中编码即可使用其代码补全等功能：

![](assets/Pasted%20image%2020260521144841.png)

## 配置 LLDB

该配置项相对简单。在 Visual Studio Code 插件库中搜索 CodeLLDB：

![](assets/Pasted%20image%2020260521144941.png)

安装即可。安装后，在 `launch.json` 中就可以找到 LLDB 相关配置了。

![](assets/Pasted%20image%2020260521145023.png)
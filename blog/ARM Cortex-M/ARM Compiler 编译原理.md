# ARM Compiler 编译原理

ARM Compiler 可以在任意机器（如 x86、ARM）上将 C 代码编译为可被 ARM 设备执行的汇编。我们利用 GCC 的交叉编译工具链也可以完成这项功能（参考 [GCC 交叉编译](GCC%20交叉编译.md)）。本文以 ARM Compiler 为例讲解其如何将 C 文件转化为 ARM 汇编的。

其整个编译过程如下图所示：

```txt
C源文件
  ↓ 预处理（Preprocess）
  ↓ 编译（Compile）
  ↓ 汇编（Assemble）
  ↓ 链接（Link）
ELF/AXF 可执行文件
  ↓ 转换（Objcopy / fromelf）
HEX/BIN
```

## C 语言预处理

例如，对于如下的 C 代码：

```c
#include <stdio.h>

#define ADD(a,b) ((a)+(b))

int main(void)
{
    int c = ADD(1,2);
    return c;
}
```

编译器会首先展开宏定义，处理 `include`、条件编译等预编译命令，然后删除注释，得到：

```c
int main(void)
{
    int c = ((1)+(2));
    return c;
}
```

这一步以 armclang 为例的命令为：

```bash
armclang -E main.c
```

## 编译

这一步实现了从 C 到 ARM 汇编的过程。在这一步中，编译器前端通过词法、字法分析将代码转化为 AST（抽象语法树），然后转化为 IR 中间表示。然后编译器后端通过指令选择、寄存器分配等生成 ARM 汇编。具体如下。

### Lexer 词法分析

对于 `int` `add` 等源码中的字符，其会被拆分成关键字、标识符、符号、运算符等等元素。Lexer 为有限状态机，其会逐字符扫描知道发现关键字，然后转化为如 `Token(KEYWORD_INT)`、`Token(IDENTIFIER,"add")` 的形式。最后，其会生成 Token 流，如下所示。

```txt
INT
IDENT(add)
(
INT
IDENT(a)
,
INT
IDENT(b)
)
{
RETURN
IDENT(a)
+
IDENT(b)
;
}
```

> Token 的本质是一个结构体，其中存储了类型、位置和值等信息。对于下一步的分析（Parser），其不应该关注字符本身，而是关注 Token 流中描述的语言结构。

### Parser 语法分析

在这一步，Parse 根据上一步生成的 Token 流构建语法树。例如，对于 `a+b*c`，其会生成：

```txt
      +
    /   \
   a     *
        / \
       b   c
```

这一步主要是根据文法构建树的结构。Parser 的本质是利用递归下降或者 LR 的自动机。

### 构建 AST 抽象语法树

AST 会在语法树的基础上，去掉无意义的语法节点，只保留语义核心。如对于 `return a+b`，其会转化为如下的 AST：

```txt
ReturnStmt
   BinaryOperator(+)
      DeclRefExpr(a)
      DeclRefExpr(b)
```

### 语义分析

从这一步开始，编译器开始理解程序所表达的含义。比如对于一个加法 `int + float`，其会插入 `ImplicitCastExpr`，表示从 `int -> float`。

编译器维护了一张符号表，记录了从名字到实体的映射关系。同时，编译器还维护了一个 `scope stack` 用于处理变量的作用堆栈和生命周期。接下来，AST 会被转化为 IR 中间表示。以 armclang 使用的 LLVM IR 为例，如下的 C 代码会被转化会如下的 IR：

```c
int add(int a,int b){
    return a+b;
}
```

```txt
define i32 @add(i32 %a, i32 %b) {
entry:
    %0 = add i32 %a, %b
    ret i32 %0
}
```

> 在 IR 之前的部分被称为“编译器前端”，主要用于处理不同语言文本的语法特性，在 IR 层面达到统一。前端与 CPU 无关，只负责理解语言。在现代编译器中还存在编译器中端，负责进行 IR 优化，只对 IR 进行处理，与语言和 CPU 均无关；编译器后端用于将 IR 转化为目标 CPU 的汇编语言。其主要进行指令选择、合法化、寄存器分配、调度等等，和硬件 CPU 强相关。

> 而交叉编译就是在相同的前端 IR 的基础之上，选择不同目标平台的后端，进而生成不同的汇编/机器码。在 x86 平台上生成适用于 STM32 单片机等 ARM 平台的程序就是利用交叉编译实现的。

### 优化
#### SSA
LLVM IR 默认是 SSA 的，即每个变量只能赋值一次。这使得数据依赖变得非常明确。所以，需要将重复的变量赋值进行处理，以适应 SSA。

如对于：

```c
a = 1;
a = a + 1;
```

SSA 之后会变为：

```txt
a1 = 1
a2 = a1 + 1
```

这使得变量变为数学表达式，从而方便编译器做大量的代数优化。

#### CFG 控制流图

编译器不会按照源码的顺序理解程序，而是建立控制流图（Control Flow Graph)，如下所示：

```c
if(a)
    x=1;
else
    x=2;

return x;
```

转化为 CFG：

```txt
        entry
        /   \
    true   false
      |      |
     x=1   x=2
        \  /
        merge
          |
       return
```

对于 CPU 来说，其执行的是在基本块之间进行跳转逻辑，符合控制流图的思想。对于 CPU 中的每个节点，ARM Compiler 定义其为 `basic block` 基本块，在其中只有出入口而没有中间跳转（类似状态机）。

#### 其他

在 CFG 之后还具有大量的位于编译器中端的优化，例如PHI、DCE、CSE、Loop Optim 等。在此不再赘述。

### SelectionDAG 

从此，编译路径进入后端。在此，LLVM 不会直接将 IR 转化为 ARM 汇编指令，而是通过 DAG 建图，使用图匹配的形式匹配能够实现 IR 指令的最优汇编指令组合。如，其在 DAG 图中发现可以通过 `mla` 来替代 `mul` 和 `add` 指令，就可以通过某种最短路的方式计算更加短的汇编指令。

### Machine IR

至此，其生成的指令已经很接近 ARM 汇编：

```asm
%vreg1 = ADD %vreg2,%vreg3
```

这是，可以发现其寄存器依然是 IR 虚拟的寄存器，需要进行寄存器分配。编译器通过分析变量的活动区间（Live Range）确定其生命周期，并根据一系列规划算法分配 R0 - R15 的寄存器。此外还有溢出 Spill 等其他方式处理寄存器不足的情况。不过 Spill 应该是尽量避免的，因为其具有较高的时间开销。

### 指令调度

现代 ARM CPU  会有流水线等一系列处理，需要通过调整指令顺序等优化速度以减少 Stall。

### 其他处理

接下来，编译器还需要进行以下处理，才能将原始指令转变为符合标准的 ARM 汇编：

- ABI
- 栈帧生成
- Prologue / Epilogue
- ASM Emission

具体细节在此不再赘述。

> 在 ASM Emission 部分，编译器开始切换和组织目标 section，并在汇编代码中插入 `.text`、`.data` 等伪指令。

此后，其输出类似的 ARM 汇编代码：

```asm
.text
.global add

add:
    adds r0,r0,r1
    bx lr

.data
value:
    .word 123
```

## 汇编

在编译器将其转化为汇编后，汇编器会将汇编转化为机器码，如：

```asm
mov w0, #3
ret
```

会转化为：

```txt
52800060
D65F03C0
```

在这一步，其会输出 `main.o`，即 `obj` 文件。

> 汇编器将汇编代码转变为二进制机器码的过程和编译过程类似。其会将汇编拆分成 Token 流，然后根据 ISA 指令集手册将其翻译为二进制编码。

## 链接

在这一步，根据众多源文件生成的 `.o` 文件会输入给链接器 Linker。链接器首先会合并段：将在不同 `.o` 文件中的 `.text`、`.data` 等段合并在一起。此后，链接器根据链接脚本（或者分散加载文件）决定每个段的具体地址。链接脚本的具体分析参考 [ARM 链接文件](ARM%20链接文件.md)。

之后，其会生成 `.elf` 或者 `.axf` 文件。此时，各个段的地址已经固定，可以被烧录和运行。通过 `fromelf` 等文件，其可以被转化为 `hex`、`bin`、`s19` 等文件格式，供 MCU 烧录。


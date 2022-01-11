---
title: "Use golang library with python"
path: "golang_library_with_python"
template: "golang_library_with_python.html"
date: 2022-01-09T01:53:34+08:00
lastmod: 2022-01-06T01:53:34+08:00
tags: ["golang", "wrapper", "python", "c"]
categories: ["tutorial"]
---

A few weeks ago I wrote URL tokenizer in Python and the code was very similar to a Go project.
I invested some hours to find out a solution to use the Go code in python and here are my results.

<!--more-->

## How to reuse Go code in python

 - Go and Python programs can communicate between each other using gRPC
 - Translate Go code into Python code with [GoToPy](https://github.com/go-python/gotopy)
 - Export Go as C-Library and write a Python wrapper

I decided to try out the C-Library export and here are my results.

## How to export the C

`go build -o awesome.so -buildmode=c-shared awesome.go`

The resulting binary format depends on the operating system. For other platforms you can use the cross compiler as follows:

`GOOS=linux GOARCH=arm64 go build -o awesome.so -buildmode=c-shared awesome.go`

All available GOOS/GOARCH's combinations in Go 1.7 you can list with:

`go tool dist list`

## How to write exportable Go code
We need to use `import "C"` to activate cgo.

The preamble may contain any C code, including function and variable declarations and definitions and `#include <stdlib.h>` is the must have.

Each function that we want to export, we must tag with `export function_name`.

Python and Go types an not directly compatible and therefore we have to use ctypes. Complex structs are not directly supported but we can use a simple JSON string for Unmarshal. In the following example we use a list of URLs.

```Go
package main

/*
#include <stdlib.h>
*/
import "C"

import (
	"encoding/binary"
	"encoding/json"
	"unsafe"

	tok "github.com/emetriq/gourltokenizer/tokenizer"
)

//export Tokenize
func Tokenize(urlsByte *C.char, size C.int) unsafe.Pointer {
	d := C.GoBytes(unsafe.Pointer(urlsByte), size)
	urls := make([]string, 0, size)
	_ = json.Unmarshal([]byte(d), &urls)
	result := make([][]string, 0, len(urls))
	for _, url := range urls {
		result = append(result, tok.TokenizeV2(url, tok.IsEnglishStopWord))
	}
	resultByte, _ := json.Marshal(result)
	length := make([]byte, 8)
	binary.LittleEndian.PutUint64(length, uint64(len(resultByte)))
	return C.CBytes(append(length, resultByte...))
}

//export Free
func Free(addr *C.char) {
	C.free(unsafe.Pointer(addr))
}

func main() {}
```

In the python code we have to load the lib and we see the first disadvantage. For example, distribution of prebuilt wheel packages is a major challenge when you think about all the possible GOOS/GOARCH's combinations and personally, I don't like the ugly C types.

```python
import ctypes as ct
from typing import List
import json

_lib = ct.cdll.LoadLibrary("./tokenizer.so")

_lib.TokenizeEng.argtypes = [ct.c_char_p, ct.c_int]
_lib.TokenizeEng.restype = ct.POINTER(ct.c_ubyte*8)
_lib.Free.argtypes = ct.c_void_p,
_lib.Free.restype = None

tokenize = _lib.Tokenize
free = _lib.Free

def tokenize(urls: List[str]):
    try:
        data = json.dumps(urls).encode('utf-8')
        ptr = tokenize(data, len(data))
        length = int.from_bytes(ptr.contents, byteorder='little')
        data = bytes(ct.cast(ptr,
                ct.POINTER(ct.c_ubyte*(8 + length))
                ).contents[8:])
        return json.loads(data.decode('utf-8'))
    finally:
        free(ptr)

print(tokenize(["https://www.google.com/hallo/essen",
"https://www.facebook.com/autos/geld/news"]))
```

## Conclusions

Python wrappers are cool, but pre-built packages for all platforms require a lot of work in your CI/CD pipeline.

I think if you would like to reach max performance you always have to use native code in combination with a unique unit test spec for all programming languages.

If the performance is not so important, you can give [jsii](https://github.com/aws/jsii) a try. The base code is TypeScript and jsii is able to convert the code to Python, Java, C# and Go. But under the hood there is always a jsii runtime environment, so we can't talk about 100% native code here.
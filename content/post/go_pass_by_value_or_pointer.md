---
title: "Pass by value or pointer?"
path: "go_pass_by_value_or_pointer"
template: "travis_decrypt.html"
date: 2020-11-16T04:12:34+08:00
date: 2020-11-16T04:12:34+08:00
tags: ["go", "pointers", "reference", "value"]
categories: ["go"]
---

In this post I will describe when you should passed a type by value or pointer in Go.

<!--more-->

## Reference types in Go

There are 6 types you do not need to pass by pointer to improve performance:

1. pointers
2. slices
3. maps
4. channels
5. interfaces
6. function

Everything in Go is passed by value. Even pointers are a type and assigned the value of the memory address. So they are values too.

## Is there a performance difference for slices?

For example when you pass a slice to a function, a copy will be made from this header and not from the underlying data.

The header of a slice looks like this:

```golang
type sliceHeader struct {
    Length        int
    Capacity      int
    Data          *byte
}
```

A copy of primitive data type is cheap so the copy won't harm.
When you chose pass by pointer, you would have to dereference pointers, which does not cost much, but it can add up.

In the following benchmark you can see that pass by pointer and value has nearly the same performance:

```golang
func BenchmarkCallByValue10(b *testing.B) {
	mySlice := rand.Perm(100000)
	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		AddToSliceByValue(mySlice)
	}
}

func BenchmarkCallByPointer(b *testing.B) {
	mySlice := rand.Perm(100000)
	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		AddToSliceByPointer(&mySlice)
	}
}

func AddToSliceByValue(mySlice []int) {
	for idx := range mySlice {
		mySlice[idx]++
	}
}

func AddToSliceByPointer(mySlice *[]int) {
	for idx := range *mySlice {
		(*mySlice)[idx]++
	}
}
```

Result:

AddByValue-12    5.02µs ± 0%

AddByPointer-12  5.11µs ± 1%


## Advices for Parameter Passing to Function

* If the parameter is a map, func or chan, don't use a pointer to it.
* If the parameter is a slice and the method may need to modify the length or capacity, which changes the value of the slice, use a pointer to it.
* If the method needs to mutate the parameter, the parameter must be a pointer.
* If the parameter is a struct that contains a sync.Mutex or similar synchronizing field, the parameter must be a pointer to avoid copying.
* If the parameter is a large struct or array, a pointer to it is more efficient.

You can also use this advices for receivers.
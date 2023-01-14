# Code Style
This is an opinionated guide on best practices when coding in TypeScript. JavaScript is a very flexible language, and TypeScript overlays a very necessary type system over the top of it. Because of the flexibility of the language, there are many things you **can** do, but just because you *can* do something, doesn't mean you *should* do it.

## Variables
There are multiple ways to declare variables, but only a couple of them are acceptable. One of them was entirely deprecated and is considered very bad practice. 

### Private
- Non-exported or Private global variables should always be underscored. 

This is actually a style stolen from C++. Some use `snake_case` but I prefer `_underscoreFirst` instead. The benefit here, is that when you have a single file with multiple global variables, it's hard to know at a glance what's global or local scope if you're deep into a file. If you know a variable is global, it's easier to understand its necessity.

### Const
- Always use `const` unless you're mutating the variable.

The default linting rules already enforce this, but it's good to understand why this is a rule. I'm not a purist, so I won't say that mutation is *inherently* bad, but in most cases, you should actively avoid mutation where possible. Mutation causes side effects, which result in code that is difficult to debug, unless the mutation is isolated, which brings us to the next rule...

### Mutation
- If you **must** mutate a variable, make sure it's as isolated as possible.

When working with objects, it's easy to want to mutate them over the course of multiple functions, but this is bad practice. When the state of properties on an object change, they're updated for all references to that object. This means that tracking down changes can be a real pain if there are multiple functions mutating a single object.

The best ways to mitigate this, is to either clone the object (passing it by value) or create a state machine.

### Let
- Only use `let` in a local context, where mutation only happens within the scope of a single Function or Class.

Again, mutation should be avoided where possible, but of course it can't be avoided altogether. `for` loops, for instance (pun intended), require a mutable index. Another good example are counters, which are also required to be mutable. The emphasis should be: *locally scoped mutation only*.

### Var
- **Never Ever** use `var`. This is the deprecated way to declare a variable. Because of [hoisting](https://www.w3schools.com/js/js_hoisting.asp), it's become the most problematic way to declare a variable.

## Functions
It's generally straight forward how to declare functions and use them, but there are some caveats where some declarations are more "clean" than others, in terms of code organization and readability.

### Lambda vs Function declaration
- If you're writing an unnamed, anonymous function, then use **Lambda**.
- If a function does one very simple task and is nested in another function, use **Lambda**.
- If a function is very simple, but is **not** nested, then use the **function** keyword.
- If a function is complex, it should use the **function** keyword, unless it's an anonymous function.

This is probably an unpopular opinion, but **Lambda** functions are not nearly as readable as standard functions. Just about every programming language declares functions the same way: 
```
<function keyword> <function name>(<parameters>) {
	// Body of function
}
```
Since the advent of Lambda functions within JavaScript, people have been using them instead of *normal* function declarations:
```
const <function name> = (<parameters>) => {
	// Body of fucntion
}
```
A lambda function is basically a variable declaration, which makes spotting them in your code a bit more difficult. As someone who's used to looking at keywords for hints about what code is doing, when I see the `const` keyword instead of the `function` keyword, I almost instinctually pass over it when I'm looking for a function.

When using Lambda functions, there's almost no hint to indicate whether the variable is a function or a standard variable other than by naming convention. That means I have to look at every variable declaration to see if it's a function.

### Hoisting
> These rules only apply to functions being called within the same file they were declared.

- All functions created with the **function** keyword:
	- Should be declared after the code that is executing them.
	- Should be declared in the order they are called.

When a function is hoisted, it means you can declare it anywhere in a file, and it will still execute as if it was declared at the top of the file, even if the code calling the function is declared before the function.

### Ordering
> This rule only applies to applications that use primarily single-use functions, stored in a single file.
- When possible, order functions within a file based on the order in which they're called in your application.

It makes it a little easier to mentally map out the order of operations within your code, if the code is organized in a top-to-bottom fashion, where the first function call is the first implemented function in a file.


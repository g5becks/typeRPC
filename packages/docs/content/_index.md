---
title: "Typerpc"
date: 2020-09-22T10:39:33-04:00
draft: false
---

![Typerpc Logo](https://raw.githubusercontent.com/typerpc/typerpc/master/packages/docs/static/typerpc_logo.png)

### *What is typerpc ?*

[Typerpc](http://typerpc.run) is a schema-driven universal rpc framework written in [typescript](https://www.typescriptlang.org/) that aims to increase developer productivity by eliminating much of the work that goes into creating api servers and clients. How does it achieve this goal?  Code generation to the rescue! Declare your service definitions using our custom typescript based dsl, then run `typerpc gen -t ./tsconfig.json` and typerpc will generate statically typed clients and servers in your desired programming language(s) and framework(s). Json or Cbor serialization/deserialization, routing, and all other networking code is taken care of for you so you can focus on writing the code that is important to your business.

### *What does it look Like?*

Here is a very small example of a typerpc schema definition for a simple user service. From this schema, typerpc will generate  
```ts
// basic types used for service definitionsimport {$, rpc} from '@typerpc/types'
 
// A type that will be used to transfer data between client(s) and server(s).  
type User = rpc.Msg<{
    id: $.int8
    name: $.str
    password: $.str
}>

// A query service used to query User data from the server using HTTP GET requests.
type UserQueries = rpc.QuerySvc<{
    getUserById(id: $.int8): User
}>

// A mutation service used to create or mutate data using HTTP POST requests.
type UserMutations = rpc.MutationSvc<{
    createUser(username: $.str, password: $.str): User
    updatePassword(password: $.str): $.bool
}>

```

the judge runner for node.js

# Sandbox
build on [sandbox](https://www.npmjs.com/package/sandbox), for more information, see [https://github.com/gf3/sandbox](https://github.com/gf3/sandbox)

# Process model
```
##############################
#      current process       #
#########|########^###########
         |        ^
 command | (pipe) | message
         v        |
*********v********|***********
* child process (Sandbox VM) *
******************************
```

# Project structure
```
|- index.js         * the main logic, will bootstap a Sandbox to run user code
+- data
  |- cases          * all use cases to be running
    |- 1.in         * input file for case 1
    |- 1.out        * expect output for case 1
  |- source.js      * the source code of solution
  |- result.json    * the result (score and outputs)
```
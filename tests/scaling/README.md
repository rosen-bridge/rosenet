# RoseNet scaling test

## Table of contents

- [Introduction](#introduction)
- [Usage](#usage)

## Introduction

RoseNet scaling test

## Usage

You need to have [OpenTofu](https://opentofu.org/) installed. Then, after
[passing required variables](https://opentofu.org/docs/language/values/variables/#assigning-values-to-root-module-variables) (defined in [`variables.tf`](./variables.tf)),
run the following commands. It should complete with no errors.

```bash
tofu init
tofu apply
```

Finally run `tofu destroy` to destroy the infrastructure.

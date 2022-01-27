---
title: "Debug streamlit app in vscode"
path: "debug_streamlit_app_in_vscode"
template: "debug_streamlit_app_in_vscode.html"
date: 2022-01-27T01:53:34+08:00
lastmod: 2022-01-27T01:53:34+08:00
tags: ["python", "vscode", "streamlit", "debug"]
categories: ["configuration"]
---
Today I want to share my vscode launch configuration for [streamlit](https://github.com/streamlit) live debugging.

<!--more-->

## How to debug streamlit app in vscode

Usually I use the `"program": "${file}"` pattern to debug my python scripts. But this is not very useful for [streamlit](https://github.com/streamlit)  applications. I found a setup to debug a Python module instead, and I use it for my [streamlit](https://github.com/streamlit) case.

```json
{
   "version": "0.2.0",
   "configurations": [{
        "name": "Python: Streamlit",
        "type": "python",
        "request": "launch",
        "module": "streamlit",
        "env": {
            "STREAMLIT_APP": "app.py",
            "STREAMLIT_ENV": "development",
            "AWS_PROFILE": "mega_root",
            "PYTHONPATH": "${workspaceRoot}/src",
        },
        "args": [
            "run",
            "/Users/projects/streamlit/app.py"
        ],
        "jinja": true
    }
   ]
}
```
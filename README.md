# react-beaker ![build status](https://travis-ci.org/wizawu/react-beaker.svg)

A devtool built on webpack for cutting down heavy dependencies/devDependencies of [React](https://facebook.github.io/react/) projects.

For example, in many cases, you may need a `package.json` like

```javascript
{
    "scripts": {
        "build": "...",
        "start": "...",
        "watch": "...",
        "publish": "...",
        ...
    },
    "dependencies": {
        "react": "...",
        "react-dom": "...",
        "react-router": "...",
        "redux": "...",
        ...
        "other-libs": "..."
    },
    "devDependencies": {
        "webpack": "...",
        "many-webpack-plugins": "...",
        "babel": "...",
        "many-babel-plugins": "...",
        "uglifyjs": "...",
        ...
    }
}
```

With `react-beaker`, you can simply write

```javascript
{
    "dependencies": {
        "other-libs": "..."
    }
}
```

### Installation

It is recommended to install `react-beaker` globally.

```shell
npm install -g react-beaker
```

### Usage

1. Project structure (or the frontend part) should be as follow.

    ```shell
    path/to/source
    +-- html
    +-- js
    |   +-- entries
    +-- package.json (optional)
    ```

2. Commands

    ```shell
    # If there is package.json in the source directory, you need to run `npm install` first

    react-beaker watch path/to/source
    react-beaker build path/to/source
    react-beaker publish path/to/source
    ```

    For `watch` and `publish`, all source files with extensions `.js` or `.jsx` will be output with extension `.min.js` to `dist`.

    ```shell
    path/to/source
    +-- js
    |   +-- entries
    |       +-- a.js
    |       +-- b.jsx
    +-- dist
        +-- a.min.js
        +-- b.min.js
    ```

    For `build`, the extension would be `.js`.

    ```shell
    path/to/source
    +-- js
    |   +-- entries
    |       +-- a.js
    |       +-- b.jsx
    +-- dist
        +-- a.js
        +-- b.js
    ```

    Meanwhile, HTML source files will also be compiled to `dist`.

    ```shell
    path/to/source
    +-- html
    |   +-- app.html
    +-- dist
        +-- app.html
    ```
    
3. Options

|Option|Explanation|Type|
|---|---|---|
|`--publicPath, -p`| customized publicPath | string

#### `--publicPath, -p`

When `publicPath` is provided, `publish` command will append a `chunkhash` to output chunks; For example:
```
path/to/source
    +-- js
    |   +-- entries
    |       +-- index.js
    |       +-- a.jsx
    +-- dist
        +-- index.88483fa4cece1dc223d5.min.js
        +-- a.82d503654d047fcf5145.min.js
```

Then you will be able to use assets with chunkhash suffix in your HTML template by concating chunkName to
publicPath. For example, you have a HTML file which looks like this:
```html
<script src="{%= o.webpack.publicPath + o.webpack.assetsByChunkName.index %}"></script>
```
and you run `react-beaker publish path/to/source` with `-p //mycdn.com/dist/`, the output HTML will include a reference to
assets with publicPath and chunkhash:
```html
<script src="//mycdn.com/dist/b.afbcf233f5eae79598db.min.js"></script>
```

### Advanced

#### React Stuff

You will find `react-toolkit.min.js` in `dist`, which should be included in your HTML.

```html
<script src="./react-toolkit.min.js"></script>
```

Then you are able to import the following React libraries without adding them to `package.json`.

```javascript
import React from "react";
import ReactDOM from "react-dom";
import Redux from "redux";
import { IndexRoute, Route, Router } from "react-router";
```

#### Source Map

Source map is enabled when using `react-beaker watch`.

#### CSS and Less

```javascript
import "../css/default.css";
import "../css/theme.less";
```

## application

### start server

*development*

```js
node www/development.js
```

*testing*

```js
node www/testing.js
```

*production*

```js
node www/production.js
```

or use pm2 to manage node:

```
pm2 start www/production.js
```

### compile es6 code

```
npm run compile
```

### how to link resource

*in template file*

```html

<script src="/static/js/a.js"></script>

<img src="/static/img/a.png" alt="">

<link rel="stylesheet" href="/static/css/a.js">

```

*link image in css*

```css
.a{
    background: url(../img/a.png) no-repeat;
}
```

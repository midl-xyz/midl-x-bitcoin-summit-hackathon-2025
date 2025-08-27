"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/@zag-js+types@1.21.9";
exports.ids = ["vendor-chunks/@zag-js+types@1.21.9"];
exports.modules = {

/***/ "(ssr)/./node_modules/.pnpm/@zag-js+types@1.21.9/node_modules/@zag-js/types/dist/index.mjs":
/*!*******************************************************************************************!*\
  !*** ./node_modules/.pnpm/@zag-js+types@1.21.9/node_modules/@zag-js/types/dist/index.mjs ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createNormalizer: () => (/* binding */ createNormalizer),\n/* harmony export */   createProps: () => (/* binding */ createProps)\n/* harmony export */ });\n// src/prop-types.ts\nfunction createNormalizer(fn) {\n  return new Proxy({}, {\n    get(_target, key) {\n      if (key === \"style\")\n        return (props) => {\n          return fn({ style: props }).style;\n        };\n      return fn;\n    }\n  });\n}\n\n// src/create-props.ts\nvar createProps = () => (props) => Array.from(new Set(props));\n\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvLnBucG0vQHphZy1qcyt0eXBlc0AxLjIxLjkvbm9kZV9tb2R1bGVzL0B6YWctanMvdHlwZXMvZGlzdC9pbmRleC5tanMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQixjQUFjO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBOztBQUV5QyIsInNvdXJjZXMiOlsiL1VzZXJzL2J0Yy9taWRsLXgtYml0Y29pbi1zdW1taXQtaGFja2F0aG9uLTIwMjUvdXR4by1wc2J0LWRlbW8vbm9kZV9tb2R1bGVzLy5wbnBtL0B6YWctanMrdHlwZXNAMS4yMS45L25vZGVfbW9kdWxlcy9AemFnLWpzL3R5cGVzL2Rpc3QvaW5kZXgubWpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHNyYy9wcm9wLXR5cGVzLnRzXG5mdW5jdGlvbiBjcmVhdGVOb3JtYWxpemVyKGZuKSB7XG4gIHJldHVybiBuZXcgUHJveHkoe30sIHtcbiAgICBnZXQoX3RhcmdldCwga2V5KSB7XG4gICAgICBpZiAoa2V5ID09PSBcInN0eWxlXCIpXG4gICAgICAgIHJldHVybiAocHJvcHMpID0+IHtcbiAgICAgICAgICByZXR1cm4gZm4oeyBzdHlsZTogcHJvcHMgfSkuc3R5bGU7XG4gICAgICAgIH07XG4gICAgICByZXR1cm4gZm47XG4gICAgfVxuICB9KTtcbn1cblxuLy8gc3JjL2NyZWF0ZS1wcm9wcy50c1xudmFyIGNyZWF0ZVByb3BzID0gKCkgPT4gKHByb3BzKSA9PiBBcnJheS5mcm9tKG5ldyBTZXQocHJvcHMpKTtcblxuZXhwb3J0IHsgY3JlYXRlTm9ybWFsaXplciwgY3JlYXRlUHJvcHMgfTtcbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/.pnpm/@zag-js+types@1.21.9/node_modules/@zag-js/types/dist/index.mjs\n");

/***/ })

};
;
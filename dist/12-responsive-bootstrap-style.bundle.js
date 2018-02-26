webpackJsonp([10],{

/***/ 50:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _jsx = function () { var REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol.for && Symbol.for("react.element") || 0xeac7; return function createRawReactElement(type, props, key, children) { var defaultProps = type && type.defaultProps; var childrenLength = arguments.length - 3; if (!props && childrenLength !== 0) { props = {}; } if (props && defaultProps) { for (var propName in defaultProps) { if (props[propName] === void 0) { props[propName] = defaultProps[propName]; } } } else if (!props) { props = defaultProps || {}; } if (childrenLength === 1) { props.children = children; } else if (childrenLength > 1) { var childArray = Array(childrenLength); for (var i = 0; i < childrenLength; i++) { childArray[i] = arguments[i + 3]; } props.children = childArray; } return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null }; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _reactGridLayout = __webpack_require__(2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ResponsiveReactGridLayout = (0, _reactGridLayout.WidthProvider)(_reactGridLayout.Responsive);

/**
 * This example illustrates how to let grid items lay themselves out with a bootstrap-style specification.
 */

var BootstrapStyleLayout = function (_React$PureComponent) {
  _inherits(BootstrapStyleLayout, _React$PureComponent);

  function BootstrapStyleLayout() {
    _classCallCheck(this, BootstrapStyleLayout);

    return _possibleConstructorReturn(this, _React$PureComponent.apply(this, arguments));
  }

  BootstrapStyleLayout.prototype.onLayoutChange = function onLayoutChange(layout) {
    this.props.onLayoutChange(layout);
  };

  BootstrapStyleLayout.prototype.render = function render() {
    return _react2.default.createElement(
      ResponsiveReactGridLayout,
      _extends({
        onLayoutChange: this.onLayoutChange
      }, this.props),
      _jsx("div", {
        "data-grid": {
          w: { lg: 6, md: 5, sm: 3, xs: 4, xxs: 2 },
          h: { lg: 4, xxs: 3 }
        }
      }, void 0, "0")
    );
  };

  return BootstrapStyleLayout;
}(_react2.default.PureComponent);

BootstrapStyleLayout.defaultProps = {
  isDraggable: true,
  isResizable: true,
  items: 20,
  rowHeight: 30,
  onLayoutChange: function onLayoutChange() {},
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }
};


module.exports = BootstrapStyleLayout;

if (__webpack_require__.c[__webpack_require__.s] === module) {
  __webpack_require__(3)(module.exports);
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)(module)))

/***/ })

},[50]);
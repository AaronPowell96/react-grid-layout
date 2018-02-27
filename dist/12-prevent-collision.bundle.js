webpackJsonp([11],{

/***/ 49:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _jsx = function () { var REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol.for && Symbol.for("react.element") || 0xeac7; return function createRawReactElement(type, props, key, children) { var defaultProps = type && type.defaultProps; var childrenLength = arguments.length - 3; if (!props && childrenLength !== 0) { props = {}; } if (props && defaultProps) { for (var propName in defaultProps) { if (props[propName] === void 0) { props[propName] = defaultProps[propName]; } } } else if (!props) { props = defaultProps || {}; } if (childrenLength === 1) { props.children = children; } else if (childrenLength > 1) { var childArray = Array(childrenLength); for (var i = 0; i < childrenLength; i++) { childArray[i] = arguments[i + 3]; } props.children = childArray; } return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null }; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _lodash = __webpack_require__(4);

var _lodash2 = _interopRequireDefault(_lodash);

var _reactGridLayout = __webpack_require__(2);

var _reactGridLayout2 = _interopRequireDefault(_reactGridLayout);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ReactGridLayout = (0, _reactGridLayout.WidthProvider)(_reactGridLayout2.default);

var NoCompactingLayout = function (_React$PureComponent) {
  _inherits(NoCompactingLayout, _React$PureComponent);

  function NoCompactingLayout(props) {
    _classCallCheck(this, NoCompactingLayout);

    var _this = _possibleConstructorReturn(this, _React$PureComponent.call(this, props));

    var layout = _this.generateLayout();
    _this.state = { layout: layout };
    return _this;
  }

  NoCompactingLayout.prototype.generateDOM = function generateDOM() {
    return _lodash2.default.map(_lodash2.default.range(this.props.items), function (i) {
      return _jsx("div", {}, i, _jsx("span", {
        className: "text"
      }, void 0, i));
    });
  };

  NoCompactingLayout.prototype.generateLayout = function generateLayout() {
    var p = this.props;
    return _lodash2.default.map(new Array(p.items), function (item, i) {
      var y = _lodash2.default.result(p, "y") || Math.ceil(Math.random() * 4) + 1;
      return {
        x: i * 2 % 12,
        y: Math.floor(i / 6) * y,
        w: 2,
        h: y,
        i: i.toString()
      };
    });
  };

  NoCompactingLayout.prototype.onLayoutChange = function onLayoutChange(layout) {
    this.props.onLayoutChange(layout);
  };

  NoCompactingLayout.prototype.render = function render() {
    return _react2.default.createElement(
      ReactGridLayout,
      _extends({
        layout: this.state.layout,
        onLayoutChange: this.onLayoutChange
      }, this.props),
      this.generateDOM()
    );
  };

  return NoCompactingLayout;
}(_react2.default.PureComponent);

NoCompactingLayout.defaultProps = {
  className: "layout",
  items: 50,
  cols: 12,
  rowHeight: 30,
  onLayoutChange: function onLayoutChange() {},
  // This turns off compaction so you can place items wherever.
  verticalCompact: false,
  // This turns off rearrangement so items will not be pushed arround.
  preventCollision: true
};


module.exports = NoCompactingLayout;

if (__webpack_require__.c[__webpack_require__.s] === module) {
  __webpack_require__(3)(module.exports);
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)(module)))

/***/ })

},[49]);
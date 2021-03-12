// @flow
import React from "react";
import PropTypes from "prop-types";
import isEqual from "lodash.isequal";
import classNames from "classnames";
import {
  autoBindHandlers,
  bottom,
  nodesCollide,
  childrenEqual,
  cloneLayoutItem,
  compact,
  correctBounds,
  getLayoutItem,
  moveElement,
  synchronizeLayoutWithChildren,
  validateLayout,
  getAllCollisions,
  noop
} from "./utils";
import { calcXY } from "./calculateUtils";
import GridItem from "./GridItem";
import type {
  ChildrenArray as ReactChildrenArray,
  Element as ReactElement
} from "react";

// Types
import type {
  EventCallback,
  CompactType,
  GridResizeEvent,
  GridDragEvent,
  Layout,
  LayoutItem
} from "./utils";

type State = {
  activeDrag: ?LayoutItem,
  layout: Layout,
  mounted: boolean,
  oldDragItem: ?LayoutItem,
  oldLayout: ?Layout,
  oldResizeItem: ?LayoutItem,
  draggingOverToolbox: boolean
};

import type { Props } from "./ReactGridLayoutPropTypes";
// End Types

/**
 * A reactive, fluid grid layout with draggable, resizable components.
 */

export default class ReactGridLayout extends React.Component<Props, State> {
  // TODO publish internal ReactClass displayName transform
  static displayName = "ReactGridLayout";

  static propTypes = {
    //
    // Basic props
    //
    className: PropTypes.string,
    style: PropTypes.object,

    // This can be set explicitly. If it is not set, it will automatically
    // be set to the container width. Note that resizes will *not* cause this to adjust.
    // If you need that behavior, use WidthProvider.
    width: PropTypes.number,

    // If true, the container height swells and contracts to fit contents
    autoSize: PropTypes.bool,
    // # of cols.
    cols: PropTypes.number,

    // A selector that will not be draggable.
    draggableCancel: PropTypes.string,
    // A selector for the draggable handler
    draggableHandle: PropTypes.string,

    // Deprecated
    verticalCompact: function (props: Props) {
      if (
        props.verticalCompact === false &&
        process.env.NODE_ENV !== "production"
      ) {
        console.warn(
          // eslint-disable-line no-console
          "`verticalCompact` on <ReactGridLayout> is deprecated and will be removed soon. " +
            'Use `compactType`: "horizontal" | "vertical" | null.'
        );
      }
    },
    // Choose vertical or hotizontal compaction
    compactType: PropTypes.oneOf(["vertical", "horizontal"]),

    // layout is an array of object with the format:
    // {x: Number, y: Number, w: Number, h: Number, i: String}
    layout: function (props: Props) {
      var layout = props.layout;
      // I hope you're setting the data-grid property on the grid items
      if (layout === undefined) return;
      validateLayout(layout, "layout");
    },

    //
    // Grid Dimensions
    //

    // Margin between items [x, y] in px
    margin: PropTypes.arrayOf(PropTypes.number),
    // Padding inside the container [x, y] in px
    containerPadding: PropTypes.arrayOf(PropTypes.number),
    // Rows have a static height, but you can change this based on breakpoints if you like
    rowHeight: PropTypes.number,
    // Default Infinity, but you can specify a max here if you like.
    // Note that this isn't fully fleshed out and won't error if you specify a layout that
    // extends beyond the row capacity. It will, however, not allow users to drag/resize
    // an item past the barrier. They can push items beyond the barrier, though.
    // Intentionally not documented for this reason.
    maxRows: PropTypes.number,

    //
    // Flags
    //
    isDraggable: PropTypes.bool,
    isResizable: PropTypes.bool,
    // If true, grid items won't change position when being dragged over.
    preventCollision: PropTypes.bool,
    // Use CSS transforms instead of top/left
    useCSSTransforms: PropTypes.bool,

    //
    // Callbacks
    //

    // Callback so you can save the layout. Calls after each drag & resize stops.
    onLayoutChange: PropTypes.func,

    // Calls when drag starts. Callback is of the signature (layout, oldItem, newItem, placeholder, e, ?node).
    // All callbacks below have the same signature. 'start' and 'stop' callbacks omit the 'placeholder'.
    onDragStart: PropTypes.func,
    // Calls on each drag movement.
    onDrag: PropTypes.func,
    // Calls when drag is complete.
    onDragStop: PropTypes.func,
    //Calls when resize starts.
    onResizeStart: PropTypes.func,
    // Calls when resize movement happens.
    onResize: PropTypes.func,
    // Calls when resize is complete.
    onResizeStop: PropTypes.func,

    //
    // Other validations
    //

    // Children must not have duplicate keys.
    children: function (props: Props, propName: string) {
      var children = props[propName];

      // Check children keys for duplicates. Throw if found.
      var keys = {};
      React.Children.forEach(children, function (child) {
        if (keys[child.key]) {
          throw new Error(
            'Duplicate child key "' +
              child.key +
              '" found! This will cause problems in ReactGridLayout.'
          );
        }
        keys[child.key] = true;
      });
    },

    toolbox: PropTypes.element
  };

  static defaultProps = {
    autoSize: true,
    cols: 12,
    className: "",
    style: {},
    draggableHandle: "",
    draggableCancel: "",
    containerPadding: null,
    rowHeight: 150,
    maxRows: Infinity, // infinite vertical growth
    layout: [],
    toolboxItems: [],
    margin: [10, 10],
    isBounded: false,
    isDraggable: true,
    isResizable: true,
    isDroppable: false,
    useCSSTransforms: true,
    transformScale: 1,
    verticalCompact: true,
    compactType: "vertical",
    preventCollision: false,
    droppingItem: {
      i: "__dropping-elem__",
      h: 1,
      w: 1
    },
    resizeHandles: ["se"],
    onLayoutChange: noop,
    onDragStart: noop,
    onDrag: noop,
    onDragStop: noop,
    onResizeStart: noop,
    onResize: noop,
    onResizeStop: noop,
    onDrop: noop
  };

  state: State = {
    activeDrag: null,
    layout: synchronizeLayoutWithChildren(
      this.props.layout,
      this.props.children,
      this.props.cols,
      // Legacy support for verticalCompact: false
      this.compactType(),
      this.props.toolboxItems
    ),
    mounted: false,
    oldDragItem: null,
    oldLayout: null,
    oldResizeItem: null,
    droppingDOMNode: null,
    draggingOverToolbox: false
  };

  toolboxRef: ?HTMLDivElement = null;

  constructor(props: Props, context: any): void {
    super(props, context);
    autoBindHandlers(this, [
      "onDragStart",
      "onDrag",
      "onDragStop",
      "onResizeStart",
      "onResize",
      "onResizeStop"
    ]);
  }

  componentDidMount() {
    ("NON RESPONSIVE ONE LOADED");
    this.setState({ mounted: true });
    // Possibly call back with layout on mount. This should be done after correcting the layout width
    // to ensure we don't rerender with the wrong width.
    this.onLayoutMaybeChanged(this.state.layout, this.props.layout);
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    let newLayoutBase;
    // Legacy support for compactType
    // Allow parent to set layout directly.
    if (
      !isEqual(nextProps.layout, this.props.layout) ||
      nextProps.compactType !== this.props.compactType ||
      !isEqual(nextProps.toolboxItems, this.props.toolboxItems)
    ) {
      //console.log("will receive props, PROPS not EQUAL");
      newLayoutBase = nextProps.layout;
    } else if (!childrenEqual(this.props.children, nextProps.children)) {
      // If children change, also regenerate the layout. Use our state
      // as the base in case because it may be more up to date than
      // what is in props.
      //console.log("will receive props, CHILDREN not EQUAL");
      newLayoutBase = this.state.layout;
    }

    // console.log(
    //   "WILL RECEIVE PROPS, NEW LAYOUT",
    //   newLayoutBase,
    //   "OLD LAYOUT",
    //   this.state.layout
    // );
    if (newLayoutBase) {
      if (nextProps.compactType !== this.props.compactType) {
        newLayoutBase = compact(
          newLayoutBase,
          nextProps.compactType,
          nextProps.cols
        );
        newLayoutBase = correctBounds(newLayoutBase, {
          cols: nextProps.cols
        });
      }
      const oldLayout = this.state.layout;
      this.setState({ layout: newLayoutBase });
      this.onLayoutMaybeChanged(newLayoutBase, oldLayout);
    }

    // // We need to regenerate the layout.
    // if (newLayoutBase) {
    //   console.log(
    //     "NEW BASE LAYOUT CALLING SYNC WITH LAYOUT",
    //     newLayoutBase,
    //     "toolboxitems next",
    //     nextProps.toolboxItems,
    //     "prev toolbox items",
    //     this.props.toolboxItems
    //   );
    //   const newLayout = synchronizeLayoutWithChildren(
    //     newLayoutBase,
    //     nextProps.children,
    //     nextProps.cols,
    //     this.compactType(nextProps),
    //     nextProps.toolboxItems
    //   );
    //   console.log("NEW LAYOUT AFTER SYNC IN RECEIVE PROPS", newLayout);
    //   const oldLayout = this.state.layout;
    //   this.setState({ layout: newLayout });
    //   this.onLayoutMaybeChanged(newLayout, oldLayout);
    // }
  }

  /**
   * Calculates a pixel value for the container.
   * @return {String} Container height in pixels.
   */
  containerHeight() {
    if (!this.props.autoSize) return;
    const nbRow = bottom(this.state.layout);
    const containerPaddingY = this.props.containerPadding
      ? this.props.containerPadding[1]
      : this.props.margin[1];
    return (
      nbRow * this.props.rowHeight +
      (nbRow - 1) * this.props.margin[1] +
      containerPaddingY * 2 +
      "px"
    );
  }

  compactType(props: ?Object): CompactType {
    if (!props) props = this.props;
    return props.verticalCompact === false ? null : props.compactType;
  }

  /**
   * When dragging starts
   * @param {String} i Id of the child
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDragStart(i: string, x: number, y: number, { e, node }: GridDragEvent) {
    const { layout } = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    this.setState({
      oldDragItem: cloneLayoutItem(l),
      oldLayout: this.state.layout
    });

    return this.props.onDragStart(layout, l, l, null, e, node);
  }

  /**
   * Each drag movement create a new dragelement and move the element to the dragged location
   * @param {String} i Id of the child
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDrag(i: string, x: number, y: number, { e, node }: GridDragEvent) {
    const { oldDragItem } = this.state;
    let { layout } = this.state;
    const { cols } = this.props;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    // Create placeholder (display only)
    var placeholder = {
      w: l.w,
      h: l.h,
      x: l.x,
      y: l.y,
      placeholder: true,
      i: i
    };

    // Move the element to the dragged location.
    const isUserAction = true;
    layout = moveElement(
      layout,
      l,
      x,
      y,
      isUserAction,
      this.props.preventCollision,
      this.compactType(),
      cols
    );

    if (this.toolboxRef) {
      let draggingOverToolbox = false;
      if (nodesCollide(node, this.toolboxRef)) {
        placeholder = null;
        draggingOverToolbox = true;
      }
      this.setState({ draggingOverToolbox });
    }

    this.props.onDrag(layout, oldDragItem, l, placeholder, e, node);

    this.setState({
      layout: compact(layout, this.compactType(), cols),
      activeDrag: placeholder
    });
  }

  /**
   * When dragging stops, figure out which position the element is closest to and update its x and y.
   * @param  {String} i Index of the child.
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDragStop(i: string, x: number, y: number, { e, node }: GridDragEvent) {
    const { oldDragItem } = this.state;
    let { layout } = this.state;
    const { cols, preventCollision } = this.props;
    const l = getLayoutItem(layout, i);
    if (!l) return;

    // Move the element here
    const isUserAction = true;
    layout = moveElement(
      layout,
      l,
      x,
      y,
      isUserAction,
      preventCollision,
      this.compactType(),
      cols
    );

    if (this.toolboxRef) {
      if (nodesCollide(node, this.toolboxRef)) {
        layout = layout.filter(({ i }) => i !== l.i);
        if (this.props.onRemoveItem) {
          this.props.onRemoveItem(layout, oldDragItem, l, null, e, node);
        }
      }
    }

    this.props.onDragStop(layout, oldDragItem, l, null, e, node);

    // Set state
    const newLayout = compact(layout, this.compactType(), cols);
    const { oldLayout } = this.state;
    this.setState({
      activeDrag: null,
      layout: newLayout,
      oldDragItem: null,
      oldLayout: null,
      draggingOverToolbox: false
    });

    this.onLayoutMaybeChanged(newLayout, oldLayout);
  }

  onLayoutMaybeChanged(newLayout: Layout, oldLayout: ?Layout) {
    if (!oldLayout) oldLayout = this.state.layout;
    if (!isEqual(oldLayout, newLayout)) {
      this.props.onLayoutChange(newLayout);
    }
  }

  onResizeStart(i: string, w: number, h: number, { e, node }: GridResizeEvent) {
    const { layout } = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    this.setState({
      oldResizeItem: cloneLayoutItem(l),
      oldLayout: this.state.layout
    });

    this.props.onResizeStart(layout, l, l, null, e, node);
  }

  onResize(i: string, w: number, h: number, { e, node }: GridResizeEvent) {
    const { layout, oldResizeItem } = this.state;
    const { cols, preventCollision } = this.props;
    const l: ?LayoutItem = getLayoutItem(layout, i);
    if (!l) return;

    // Something like quad tree should be used
    // to find collisions faster
    let hasCollisions;
    if (preventCollision) {
      const collisions = getAllCollisions(layout, { ...l, w, h }).filter(
        layoutItem => layoutItem.i !== l.i
      );
      hasCollisions = collisions.length > 0;

      // If we're colliding, we need adjust the placeholder.
      if (hasCollisions) {
        // adjust w && h to maximum allowed space
        let leastX = Infinity,
          leastY = Infinity;
        collisions.forEach(layoutItem => {
          if (layoutItem.x > l.x) leastX = Math.min(leastX, layoutItem.x);
          if (layoutItem.y > l.y) leastY = Math.min(leastY, layoutItem.y);
        });

        if (Number.isFinite(leastX)) l.w = leastX - l.x;
        if (Number.isFinite(leastY)) l.h = leastY - l.y;
      }
    }

    if (!hasCollisions) {
      // Set new width and height.
      l.w = w;
      l.h = h;
    }

    // Create placeholder element (display only)
    var placeholder = {
      w: l.w,
      h: l.h,
      x: l.x,
      y: l.y,
      static: true,
      i: i
    };

    this.props.onResize(layout, oldResizeItem, l, placeholder, e, node);

    // Re-compact the layout and set the drag placeholder.
    this.setState({
      layout: compact(layout, this.compactType(), cols),
      activeDrag: placeholder
    });
  }

  onResizeStop(i: string, w: number, h: number, { e, node }: GridResizeEvent) {
    const { layout, oldResizeItem } = this.state;
    const { cols } = this.props;
    var l = getLayoutItem(layout, i);

    this.props.onResizeStop(layout, oldResizeItem, l, null, e, node);

    // Set state
    const newLayout = compact(layout, this.compactType(), cols);
    const { oldLayout } = this.state;
    this.setState({
      activeDrag: null,
      layout: newLayout,
      oldResizeItem: null,
      oldLayout: null
    });

    this.onLayoutMaybeChanged(newLayout, oldLayout);
  }

  /**
   * Create a placeholder object.
   * @return {Element} Placeholder div.
   */
  placeholder(): ?ReactElement<any> {
    const { activeDrag } = this.state;
    if (!activeDrag) return null;
    const {
      width,
      cols,
      margin,
      containerPadding,
      rowHeight,
      maxRows,
      useCSSTransforms
    } = this.props;

    // {...this.state.activeDrag} is pretty slow, actually
    return (
      <GridItem
        w={activeDrag.w}
        h={activeDrag.h}
        x={activeDrag.x}
        y={activeDrag.y}
        i={activeDrag.i}
        className="react-grid-placeholder"
        containerWidth={width}
        cols={cols}
        margin={margin}
        containerPadding={containerPadding || margin}
        maxRows={maxRows}
        rowHeight={rowHeight}
        isDraggable={false}
        isResizable={false}
        useCSSTransforms={useCSSTransforms}
      >
        <div />
      </GridItem>
    );
  }

  /**
   * Given a grid item, set its style attributes & surround in a <Draggable>.
   * @param  {Element} child React element.
   * @return {Element}       Element wrapped in draggable and properly placed.
   */
  processGridItem(
    child: ReactElement<any>,
    isDroppingItem?: boolean
  ): ?ReactElement<any> {
    if (!child || !child.key) return;
    const l = getLayoutItem(this.state.layout, String(child.key));
    if (!l) return null;
    const {
      width,
      cols,
      margin,
      containerPadding,
      rowHeight,
      maxRows,
      isDraggable,
      isResizable,
      isBounded,
      useCSSTransforms,
      transformScale,
      draggableCancel,
      draggableHandle,
      resizeHandles,
      resizeHandle
    } = this.props;
    const { mounted, droppingPosition } = this.state;

    // // Parse 'static'. Any properties defined directly on the grid item will take precedence.
    // const draggable = Boolean(
    //   !l.static && isDraggable && (l.isDraggable || l.isDraggable == null)
    // );
    // const resizable = Boolean(
    //   !l.static && isResizable && (l.isResizable || l.isResizable == null)
    // );

    // Determine user manipulations possible.
    // If an item is static, it can't be manipulated by default.
    // Any properties defined directly on the grid item will take precedence.
    const draggable =
      typeof l.isDraggable === "boolean"
        ? l.isDraggable
        : !l.static && isDraggable;
    const resizable =
      typeof l.isResizable === "boolean"
        ? l.isResizable
        : !l.static && isResizable;
    const resizeHandlesOptions = l.resizeHandles || resizeHandles;

    // isBounded set on child if set on parent, and child is not explicitly false
    const bounded = draggable && isBounded && l.isBounded !== false;

    return (
      <GridItem
        containerWidth={width}
        cols={cols}
        margin={margin}
        containerPadding={containerPadding || margin}
        maxRows={maxRows}
        rowHeight={rowHeight}
        cancel={draggableCancel}
        handle={draggableHandle}
        onDragStop={this.onDragStop}
        onDragStart={this.onDragStart}
        onDrag={this.onDrag}
        onResizeStart={this.onResizeStart}
        onResize={this.onResize}
        onResizeStop={this.onResizeStop}
        isDraggable={draggable}
        isResizable={resizable}
        isBounded={bounded}
        useCSSTransforms={useCSSTransforms && mounted}
        usePercentages={!mounted}
        transformScale={transformScale}
        w={l.w}
        h={l.h}
        x={l.x}
        y={l.y}
        i={l.i}
        minH={l.minH}
        minW={l.minW}
        maxH={l.maxH}
        maxW={l.maxW}
        static={l.static}
        droppingPosition={isDroppingItem ? droppingPosition : undefined}
        resizeHandles={resizeHandlesOptions}
        resizeHandle={resizeHandle}
      >
        {child}
      </GridItem>
    );
  }

  // Called while dragging an element. Part of browser native drag/drop API.
  // Native event target might be the layout itself, or an element within the layout.
  onDragOver = (e: DragOverEvent) => {
    // we should ignore events from layout's children in Firefox
    // to avoid unpredictable jumping of a dropping placeholder
    // FIXME remove this hack
    if (
      isFirefox &&
      !e.nativeEvent.target.classList.contains("react-grid-layout")
    ) {
      // without this Firefox will not allow drop if currently over droppingItem
      e.preventDefault();
      return false;
    }

    const {
      droppingItem,
      margin,
      cols,
      rowHeight,
      maxRows,
      width,
      containerPadding
    } = this.props;
    const { layout } = this.state;
    // This is relative to the DOM element that this event fired for.
    const { layerX, layerY } = e.nativeEvent;
    const droppingPosition = { left: layerX, top: layerY, e };

    if (!this.state.droppingDOMNode) {
      const positionParams: PositionParams = {
        cols,
        margin,
        maxRows,
        rowHeight,
        containerWidth: width,
        containerPadding: containerPadding || margin
      };

      const calculatedPosition = calcXY(
        positionParams,
        layerY,
        layerX,
        droppingItem.w,
        droppingItem.h
      );

      this.setState({
        droppingDOMNode: <div key={droppingItem.i} />,
        droppingPosition,
        layout: [
          ...layout,
          {
            ...droppingItem,
            x: calculatedPosition.x,
            y: calculatedPosition.y,
            static: false,
            isDraggable: true
          }
        ]
      });
    } else if (this.state.droppingPosition) {
      const { left, top } = this.state.droppingPosition;
      const shouldUpdatePosition = left != layerX || top != layerY;
      if (shouldUpdatePosition) {
        this.setState({ droppingPosition });
      }
    }

    e.stopPropagation();
    e.preventDefault();
  };

  removeDroppingPlaceholder = () => {
    const { droppingItem, cols } = this.props;
    const { layout } = this.state;

    const newLayout = compact(
      layout.filter(l => l.i !== droppingItem.i),
      this.compactType(this.props),
      cols
    );

    this.setState({
      layout: newLayout,
      droppingDOMNode: null,
      activeDrag: null,
      droppingPosition: undefined
    });
  };

  onDragLeave = () => {
    this.dragEnterCounter--;

    // onDragLeave can be triggered on each layout's child.
    // But we know that count of dragEnter and dragLeave events
    // will be balanced after leaving the layout's container
    // so we can increase and decrease count of dragEnter and
    // when it'll be equal to 0 we'll remove the placeholder
    if (this.dragEnterCounter === 0) {
      this.removeDroppingPlaceholder();
    }
  };

  onDragEnter = () => {
    this.dragEnterCounter++;
  };

  onDrop = (e: Event) => {
    const { droppingItem } = this.props;
    const { layout } = this.state;
    const item = layout.find(l => l.i === droppingItem.i);

    // reset dragEnter counter on drop
    this.dragEnterCounter = 0;

    this.removeDroppingPlaceholder();

    this.props.onDrop(layout, item, e);
  };

  render() {
    const { className, style, isDroppable, innerRef } = this.props;

    const mergedStyle = {
      height: this.containerHeight(),
      ...style
    };
    const mergedClassName = classNames("react-grid-layout", className);

    return (
      <div
        className={mergedClassName}
        style={mergedStyle}
        ref={innerRef}
        onDrop={isDroppable ? this.onDrop : noop}
        onDragLeave={isDroppable ? this.onDragLeave : noop}
        onDragEnter={isDroppable ? this.onDragEnter : noop}
        onDragOver={isDroppable ? this.onDragOver : noop}
      >
        {this.props.toolbox ? (
          <div
            className={classNames("react-grid-layout__toolbox", {
              "is-active": this.state.draggingOverToolbox
            })}
            ref={elem => (this.toolboxRef = elem)}
          >
            {this.props.toolbox}
          </div>
        ) : null}
        <div
          className="react-grid-layout__grid-items"
          style={{
            position: "relative",
            height: this.containerHeight()
          }}
        >
          {React.Children.map(this.props.children, child =>
            this.processGridItem(child)
          )}
          {isDroppable &&
            this.state.droppingDOMNode &&
            this.processGridItem(this.state.droppingDOMNode, true)}
          {this.placeholder()}
          {this.placeholder()}
        </div>
      </div>
    );
  }
}

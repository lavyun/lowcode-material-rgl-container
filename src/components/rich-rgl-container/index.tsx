import React, {
  ReactNode,
  useEffect,
  useState,
  useRef,
  useMemo,
  ComponentProps,
  Children,
  ReactNodeArray,
  useCallback
} from 'react';
import './index.scss';
import GridLayout, { Layout, WidthProvider } from 'react-grid-layout';
import { getSymbolValue } from '../../utils';
import { IPublicModelNode } from '@alilc/lowcode-types';
import {
  getRglConfig,
  getRglConfigById,
  debug,
  DEFAULT_DATA_GRID,
  getDesigner,
  pxToNumber,
  isCanCrossRgl,
  isContainerByNodeId,
} from './utils';
import cls from 'classnames';
import { ResizeHandle } from './ResizeHandle';
import { useGetHooks } from 'ahooks';
import _ from 'lodash';

type GridLayoutProps = ComponentProps<typeof ResponsiveReactGridLayout>;

type DroppingItem = GridLayoutProps['droppingItem'];

interface IEventCallback {
  event: MouseEvent;
  node?: IPublicModelNode;
  fromRglNode?: IPublicModelNode;
  rglNode?: IPublicModelNode;
  layoutConfig?: any;
}

export interface RichRglContainerProps {
  children: ReactNode;
  _leaf: any;
  layout: Layout[];
  onLayoutChange?: (layout: Layout[]) => void;
  getLayout?: () => Layout[];
  __designMode?: string;
}

const ResponsiveReactGridLayout = WidthProvider(GridLayout);

const RGL_PLACEHOLDER_KEY = '__rgb_placeholder__';
const COLS = 24;
const ROW_HEIGHT = 8;

const RglDesignContainer = (props: RichRglContainerProps) => {
  const { children, _leaf, layout = [], onLayoutChange, getLayout } = props;

  const [isDragging, setIsDragging, getIsDragging] = useGetHooks(false);
  const [isDraggable, setIsDraggable, getIsDraggable] = useGetHooks(true);
  const [draggingNodeId, setDraggingNodeId] = useState('');
  const [currentRglNode, setCurrentRglNode] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [droppingItem, setDroppingItem] = useState<DroppingItem>({
    i: RGL_PLACEHOLDER_KEY,
    w: DEFAULT_DATA_GRID.w,
    h: DEFAULT_DATA_GRID.h,
  });

  const rglRef = useRef({} as any);
  const addPlaceholderFlag = useRef(false);
  const eventCache = useRef({} as MouseEvent);
  const needUpdateSizeFlag = useRef<any>(null);
  const timer = useRef(null);
  const resizeObserver = useRef(null);

  if (_leaf) {
    _leaf.isRGLContainer = true;
    _leaf.isRGLContainerNode = true;
    _leaf.canCrossRgl = true;

    if (_leaf?.parent) {
      _leaf.parent.isRGLContainer = true;
      _leaf.parent.isRGLContainerNode = true;
      // _leaf.parent.canCrossRgl = true;
    }
  }

  const getRglStateNode = () =>
    rglRef.current?._reactInternalFiber?.child?.stateNode;

  const getLeafLayout = () => {
    if (getLayout) {
      return getLayout();
    }

    return _leaf ? _leaf.getPropValue('layout') : layout
  };

  const setLeafLayout = (layout: Layout[]) => {
    const newLayout = layout.filter((item) => item.i);
    if (onLayoutChange) {
      onLayoutChange(newLayout);
      return;
    }
    if (_leaf) {
      _leaf.setPropValue('layout', newLayout);
    }
  };

  const setLeafLayoutItem = (layoutItem: Layout) => {
    const layoutList = _.cloneDeep(getLeafLayout());
    layoutList.forEach(item => {
      if (item.i === layoutItem.i) {
        Object.assign(item, layoutItem);
      }
    });

    setLeafLayout(layoutList);
  };

  const emitter = useMemo(() => {
    const _document = getSymbolValue(_leaf, 'document');
    return _document?.designer?.dragon?.emitter;
  }, [_leaf]);

  const changeDroppingItem = (item: Partial<DroppingItem>) => {
    setDroppingItem((prev) => ({
      ...prev,
      ...item,
    }));
  };

  

  // 全部 field 集合
  const getFieldMap = () => {
    const map = {};
    const currentLayout = getLeafLayout() || [];
    currentLayout.forEach((item) => {
      map[item.i] = _.cloneDeep(item);
    });
    return map;
  };

  // 自适应高度处理方法
  const sizeAutoHandler = useCallback(_.debounce(() => {
    timer.current && clearTimeout(timer.current);
    if (getIsDragging()) {
      return;
    }
    timer.current = setTimeout(() => {
      if (rglRef.current?.elementRef) {
        const sizeAutoElements: HTMLDivElement[] =
          rglRef.current.elementRef.current.querySelectorAll(
            '[data-grid-item-size-auto]'
          );
        const fieldMap = getFieldMap();
        const fieldAutoSizeMap = {};
        sizeAutoElements.forEach((item) => {
          const fieldId = item.getAttribute('data-grid-item-id');
          if (fieldId && fieldMap[fieldId]) {
            const wrapElement: HTMLDivElement = item.querySelector(
              '.react-grid-item-content-wrap'
            );
            const scrollElement: HTMLDivElement = item.querySelector(
              '.react-grid-item-scroll'
            );
            if (wrapElement) {
              if ('true' !== wrapElement.getAttribute('data-observeStatus')) {
                wrapElement.setAttribute('data-observeStatus', 'true');
                resizeObserver.current &&
                  resizeObserver.current.observe(wrapElement);
              }
              // debug('wrapElement.offsetHeight', wrapElement.offsetHeight);
              // debug('item.offsetHeight', item.offsetHeight);
              // debug('scrollElement.offsetHeight', scrollElement.offsetHeight);
              // const offsetHeight = wrapElement.offsetHeight + item.offsetHeight - scrollElement.offsetHeight + ROW_HEIGHT - 2;
              const sizeAutos = item
                .getAttribute('data-grid-item-size-auto')
                ?.split(',');
              const fieldElement = _.get(
                wrapElement,
                'children[0]'
              ) as HTMLDivElement;

              if (sizeAutos.includes('width') && fieldElement) {
                const containerWidth =
                  rglRef.current.elementRef.current.offsetWidth;

                const cols = Math.ceil(
                  fieldElement.offsetWidth / (containerWidth / COLS)
                );
                _.set(fieldAutoSizeMap, [fieldId, 'cols'], cols);
              }

              if (sizeAutos.includes('height')) {
                let patchHeight = 0;
                if (fieldElement) {
                  const fieldStyle = getComputedStyle(fieldElement);
                  const marginTop = fieldStyle.getPropertyValue('margin-top');
                  const marginBottom =
                    fieldStyle.getPropertyValue('margin-bottom');
                  const rglConfig = getRglConfigById(fieldId);
                  patchHeight =
                    pxToNumber(marginTop) + pxToNumber(marginBottom) + (rglConfig.patchHeight || 0);

                }
                const rows = Math.ceil(
                  (wrapElement.offsetHeight + patchHeight) / ROW_HEIGHT
                );
                _.set(fieldAutoSizeMap, [fieldId, 'rows'], rows);
              }
            }
          }
        });

        if (Object.keys(fieldAutoSizeMap).length) {
          const needUpdateMap = {};
          const newLayout = getLeafLayout().map((item) => {
            var copied = { ...item };
            const fieldId = item.i;
            if (fieldAutoSizeMap[fieldId]) {
              const { cols, rows } = fieldAutoSizeMap[fieldId];
              if (_.isNumber(rows) && item.h !== rows) {
                copied.h = rows;
                _.set(needUpdateMap, [fieldId, 'rows'], rows);
              }

              if (_.isNumber(cols) && item.w !== cols) {
                copied.w = cols;
                _.set(needUpdateMap, [fieldId, 'cols'], cols);
              }
            }

            return copied;
          });

          if (!Object.keys(needUpdateMap).length) {
            needUpdateSizeFlag.current = null;
            debug('sizeAutoHandler end');
            return;
          }
          const mapJsonStr = JSON.stringify(needUpdateMap);
          if (needUpdateSizeFlag.current !== mapJsonStr) {
            debug('sizeAutoHandler start');
            needUpdateSizeFlag.current = mapJsonStr;
            setLeafLayout(newLayout);
          } else {
            debug('height auto error', needUpdateMap);
          }
        }
      }
    }, 100);
  }, 300), []);

  // 子节点宽高监听
  const createResizeObserver = () => {
    if (window.ResizeObserver) {
      return new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          sizeAutoHandler();
        });
      });
    }
  };

  const handleFieldAutoSize = (fieldId: string) => {
    if (getIsDragging()) {
      return;
    }
    if (!fieldId) {
      return;
    }

    setTimeout(() => {
      if (rglRef.current?.elementRef) {
        const fieldWrapElement = rglRef.current.elementRef.current.querySelector(`[data-grid-item-id=${fieldId}]`);
        if (!fieldWrapElement) {
          return;
        }
        const sizeAutoMeta = fieldWrapElement.getAttribute('data-grid-item-size-auto');
        if (!sizeAutoMeta) {
          return;
        }
        const wrapElement: HTMLDivElement = fieldWrapElement.querySelector(
          '.react-grid-item-content-wrap'
        );
  
        if (wrapElement) {
          const sizeAutos = sizeAutoMeta?.split(',');
          const fieldElement = _.get(
            wrapElement,
            'children[0]'
          ) as HTMLDivElement;
          
          const fieldMap = getFieldMap();
          const fieldLayoutItem = _.cloneDeep(fieldMap[fieldId]);
  
          if (sizeAutos.includes('width') && fieldElement) {
            const containerWidth =
              rglRef.current.elementRef.current.offsetWidth;
  
            const cols = Math.ceil(
              fieldElement.offsetWidth / (containerWidth / COLS)
            );
  
            fieldLayoutItem.w = cols;
          }
  
          if (sizeAutos.includes('height')) {
            let patchHeight = 0;
            if (fieldElement) {
              const fieldStyle = getComputedStyle(fieldElement);
              const marginTop = fieldStyle.getPropertyValue('margin-top');
              const marginBottom =
                fieldStyle.getPropertyValue('margin-bottom');
              patchHeight =
                pxToNumber(marginTop) + pxToNumber(marginBottom);
            }
            const rows = Math.ceil(
              (wrapElement.offsetHeight + patchHeight) / ROW_HEIGHT
            );
            fieldLayoutItem.h = rows;
          }
  
          setLeafLayoutItem(fieldLayoutItem);
        }
      }
    }, 100);
  };

  // rgl 容器宽度变化后，全局重新计算宽高
  const onRglContainerResize = () => {
    if (window.ResizeObserver) {
      const observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const layoutList = getLeafLayout();
          layoutList.forEach(item => {
            handleFieldAutoSize(item.i);
          });
        });
      });

      observer.observe(rglRef.current?.elementRef.current);

      return () => {
        observer.disconnect();
      }
    }
  };

  // 拖拽开始时展示背景，屏蔽节点 detecting 的表现
  const handleDragAndResizeStart = () => {
    setIsDragging(true);
    const designer = getDesigner();
    designer.detecting.enable = false;
  };

  // 清除上述副作用
  const handleDragAndResizeStop = () => {
    setIsDragging(false);
    const designer = getDesigner();
    designer.detecting.enable = true;
  };

  const dropHandler = (params: IEventCallback) => {
    debug('dropHandler', params);
    const { node, layoutConfig, rglNode, fromRglNode } = params;
    const rglStateNode = getRglStateNode();
    if (
      !fromRglNode ||
      (isCanCrossRgl(_leaf) &&
        isCanCrossRgl(rglNode) &&
        isCanCrossRgl(fromRglNode))
    ) {
      if (!fromRglNode && rglStateNode) {
        // @ts-ignore
        if (node?.id !== rglNode?.id && rglNode?.getParent()?.id !== node?.id) {
          setDraggingNodeId(node.id);
          changeDroppingItem({
            w: DEFAULT_DATA_GRID.w,
            h: DEFAULT_DATA_GRID.h,
          });

          const rglConfig = getRglConfig(node);
          const fieldId = node?.id;

          if (fromRglNode?.id === _leaf?.id) {
            rglStateNode.removeDroppingPlaceholder();
            const layouts = rglStateNode.state.layout.filter((item) => {
              return item.i !== fieldId;
            });
            setLeafLayout(layouts);
            return;
          }

          if (rglNode?.id && rglNode.id === _leaf?.id) {
            const layoutList: Layout[] = rglStateNode.state.layout || [];
            let placeholderItem = {};
            if (layoutConfig && typeof layoutConfig === 'object') {
              const layoutItem: Layout = {
                i: fieldId,
                x: layoutConfig.x || DEFAULT_DATA_GRID.x,
                y: layoutConfig.y || DEFAULT_DATA_GRID.y,
                w: rglConfig.w || DEFAULT_DATA_GRID.w,
                h: rglConfig.h || DEFAULT_DATA_GRID.h,
              };
              layoutList.push(layoutItem);
            } else {
              layoutList.forEach((item) => {
                if (item.i === RGL_PLACEHOLDER_KEY) {
                  placeholderItem = item;
                  item.i = fieldId;
                  delete item.isDraggable;
                }
              });
            }
            if (
              !layoutList.find((item) => item.i === node?.id)
            ) {
              const { w, h, resizeHandles } = getRglConfig(node);
              layoutList.push({
                ...DEFAULT_DATA_GRID,
                w,
                h,
                resizeHandles,
                i: fieldId,
              });
            }
            rglStateNode?.removeDroppingPlaceholder();
            rglStateNode?.clearDragStartPointNumber?.call(rglStateNode);
            // const height = rglConfig?.isNoPadding ? 0 : 48;
            // node.setPropValue('height', 16 * placeholderItem.h - 16 - height);
            // node.setPropValue('isHeightAuto', rglConfig.isHeightAuto);
            _leaf.document.insertNode(_leaf, node);
            setLeafLayout(layoutList);
          }
        }
      } else {
        rglStateNode?.removeDroppingPlaceholder();
      }
    }
  };

  const switchHandler = (params) => {
    debug('switchHandler', params, { _leaf });
    const { action, rglNode } = params;
    if (action === 'start') {
      setCurrentRglNode(rglNode);
    } else {
      setCurrentRglNode({});
    }
    const notStart = action !== 'start';
    !(rglNode?.id !== _leaf?.id) ||
      (getIsDraggable() !== notStart && setIsDraggable(notStart));
  };

  const sleepingHandler = (sleeping) => {
    // console.log('sleepingHandler', sleeping)
    const rglStateNode = getRglStateNode();
    if (rglStateNode) {
      rglStateNode.sleeping = Boolean(sleeping);
    }
  };

  const addPlaceholderHandler = (params: IEventCallback) => {
    debug('addPlaceholderHandler', params, _leaf);
    const { node, event, rglNode, fromRglNode } = params;
    const rglStateNode = getRglStateNode();
    if (
      !fromRglNode ||
      (isCanCrossRgl(_leaf) &&
        isCanCrossRgl(rglNode) &&
        isCanCrossRgl(fromRglNode))
    ) {
      const isCurrentContainer = rglNode.id === _leaf.id;
      if (fromRglNode?.id === _leaf.id || !isCurrentContainer) {
        rglStateNode?.removeDroppingPlaceholder();
        sleepingHandler(true);
        return;
      }

      isCurrentContainer && sleepingHandler(false);
      // @ts-ignore
      event.nativeEvent = event;

      const handler = () => {
        if (fromRglNode) {
          const fromLayout = fromRglNode.getPropValue('layout') || [];
          const fieldId = node?.id;
          const fieldLayout = fromLayout.find((item) => item.i === fieldId);
          if (fieldLayout) {
            changeDroppingItem({
              w: fieldLayout.w,
              h: fieldLayout.h,
            });
          }
        } else {
          const rglConfig = getRglConfig(node);
          if (rglConfig && 'object' == typeof rglConfig) {
            if (rglConfig.w) {
              changeDroppingItem({ w: rglConfig.w });
            }
            if (rglConfig.h) {
              changeDroppingItem({ h: rglConfig.h });
            }
          }
        }
        eventCache.current = event;
        rglStateNode?.onDragOver?.call(rglStateNode, event);
        if (rglNode.isEmptyNode) {
          const layout = rglStateNode?.state?.layout?.filter((item) =>
            Boolean(item.i)
          );
          rglStateNode.setState({
            layout,
          });
        }
      };

      if (rglStateNode?.state?.droppingDOMNode) {
        if (!addPlaceholderFlag.current) {
          addPlaceholderFlag.current = true;
          setTimeout(() => {
            addPlaceholderFlag.current = false;
          }, 30);
          handler();
        }
      } else {
        handler();
      }
    }
  };
  const removePlaceholderHandler = () => {
    debug('removePlaceholderHandler');
    sleepingHandler(false);
    const rglStateNode = getRglStateNode();
    rglStateNode?.removeDroppingPlaceholder();
  };

  const dragstartHandler = (...args) => {
    debug('dragstartHandler', args);
    handleDragAndResizeStart();
  };

  const dragendHandler = (...args) => {
    debug('dragendHandler', args);
    handleDragAndResizeStop();
  };

  const onChangeSelection = () => {
    return window.AliLowCodeEngine.project.currentDocument.onChangeSelection(
      (ids) => {
        if (Array.isArray(ids)) {
          setSelectedIds(ids);
        }
      }
    );
  };

  // grid layout 组件内子节点改变大小开始时触发
  const onGridLayoutItemResizeStart = (__, oldItem) => {
    setDraggingNodeId(oldItem.i);
    handleDragAndResizeStart();
  };

  // grid layout 组件内子节点改变大小结束时触发
  const onGridLayoutItemResizeStop = (__, oldItem) => {
    setDraggingNodeId('');
    handleDragAndResizeStop();
    // handleFieldAutoSize(oldItem.i);
  };

  // grid layout 组件内子节点开始拖动时触发
  const onGridLayoutItemDragStart = (layout, oldItem) => {
    setDraggingNodeId(oldItem.i);
  }


  useEffect(() => {
    sizeAutoHandler();
  }, [layout]);

  useEffect(() => {
    if (emitter) {
      emitter.on('rgl.drop', dropHandler);
      emitter.on('rgl.switch', switchHandler);
      emitter.on('rgl.sleeping', sleepingHandler);
      emitter.on('rgl.add.placeholder', addPlaceholderHandler);
      emitter.on('rgl.remove.placeholder', removePlaceholderHandler);
      emitter.on('dragstart', dragstartHandler);
      emitter.on('dragend', dragendHandler);
    }

    resizeObserver.current = createResizeObserver();
    const offChangeSelection = onChangeSelection();
    // const offRglContainerResize = onRglContainerResize();

    sizeAutoHandler();

    return () => {
      if (emitter) {
        emitter.off('rgl.drop', dropHandler);
        emitter.off('rgl.switch', switchHandler);
        emitter.off('rgl.sleeping', sleepingHandler);
        emitter.off('rgl.add.placeholder', addPlaceholderHandler);
        emitter.off('rgl.remove.placeholder', removePlaceholderHandler);
        emitter.off('dragstart', dragstartHandler);
        emitter.off('dragend', dragendHandler);
        resizeObserver.current && resizeObserver.current.disconnect();
        offChangeSelection();
        // offRglContainerResize && offRglContainerResize();
      }
    };
  }, []);

  const childList: ReactNodeArray = Array.isArray(children) ? children : [children];
  const gridChildren = childList.map((item: any) => {
    if (item?.props?.className === 'lc-container-placeholder') {
      return null;
    }

    const nodeId = item.key;
    const layoutItem = layout.find(item => item.i === nodeId);
    const rglConfig = getRglConfigById(nodeId);
    const sizeAutos = [
      rglConfig.isHeightAuto && 'height',
      rglConfig.isWidthAuto && 'width',
    ].filter(Boolean);
    const isContainerNode = isContainerByNodeId(nodeId);

    const others: any = {};
    const otherClassNames = {
      selected: selectedIds.includes(nodeId),
      disabled:
        isDragging && draggingNodeId !== nodeId && !isContainerNode,
      'can-drag-in':
        isDragging && draggingNodeId !== nodeId && isContainerNode && currentRglNode.id !== nodeId,
      'scroll-x': rglConfig.scrollX,
      'full-x': rglConfig.fullX,
      'no-scroll': rglConfig.noScroll,
    };

    if (sizeAutos.length) {
      others['data-grid-item-size-auto'] = sizeAutos.join(',');
    }

    if (item.props?._componentName) {
      otherClassNames['react-grid-item-' + item.props._componentName] = true;
    }

    if (layoutItem && layoutItem.h) {
      const childHeight = layoutItem.h * ROW_HEIGHT;
      others.style = {
        '--nodeHeight': childHeight + 'px'
      };
      _.set(item.props, 'rglHeight', childHeight)
    }

    const newChild = React.createElement(item.type, {
      ...item.props,
      ref: () => {},
    });

    return (
      <div
        data-grid-item-id={nodeId}
        key={nodeId}
        className={cls(
          'react-grid-item',
          'react-grid-item-wrap',
          otherClassNames
        )}
        ref={item.ref}
        {...others}
      >
        <div className="react-grid-item-scroll">
          <div className="react-grid-item-content-wrap">{newChild}</div>
        </div>
      </div>
    );
  }).filter(Boolean);

  return (
    <div className="vc-rootcontent-wrapper">
      <div
        className={cls('vc-rootcontent', {
          'grid-bg': isDragging,
          'grid-placeholder': gridChildren?.length === 0 && !isDragging,
          'in-rgl-design-mode': true
        })}
      >
        <ResponsiveReactGridLayout
          layout={layout}
          cols={COLS}
          containerPadding={[0, 0]}
          margin={[0, 0]}
          autoSize={false}
          isDroppable
          isDraggable={isDraggable}
          isResizable
          measureBeforeMount={false}
          // preventCollision
          compactType="vertical"
          // allowOverlap
          onDragStart={onGridLayoutItemDragStart}
          onResizeStart={onGridLayoutItemResizeStart}
          onResizeStop={onGridLayoutItemResizeStop}
          rowHeight={ROW_HEIGHT}
          ref={rglRef}
          resizeHandle={<ResizeHandle />}
          droppingItem={droppingItem}
          onLayoutChange={(layouts) => {
            const hasPlaceholder = layouts.find(
              (item) => item.i === RGL_PLACEHOLDER_KEY
            );
            if (!hasPlaceholder) {
              layouts.forEach((item) => {

                const rglConfig = getRglConfigById(item.i);
                // 复制的节点 or 异常的节点
                if (item.w === 1 && item.h === 1) {
                  item.w = rglConfig.w || DEFAULT_DATA_GRID.w;
                  item.h = rglConfig.h || DEFAULT_DATA_GRID.h;
                }
                // @ts-ignore
                item.resizeHandles = rglConfig.resizeHandles;
              });
              setLeafLayout(layouts);
            }
          }}
        >
          {gridChildren}
        </ResponsiveReactGridLayout>
      </div>
    </div>
  );
};

// 预览时的 rgl 容器，无需定义事件监听
const RglPreviewContainer = (props: RichRglContainerProps) => {
  const { children, _leaf, layout = [] } = props;

  const rglRef = useRef({} as any);

  if (_leaf) {
    _leaf.isRGLContainer = true;
    _leaf.isRGLContainerNode = true;
    _leaf.canCrossRgl = true;

    if (_leaf?.parent) {
      _leaf.parent.isRGLContainer = true;
      _leaf.parent.isRGLContainerNode = true;
      // _leaf.parent.canCrossRgl = true;
    }
  }

  const childList: ReactNodeArray = Array.isArray(children) ? children : [children];
  const gridChildren = childList.map((item: any) => {
    if (item?.props?.className === 'lc-container-placeholder') {
      return null;
    }

    const nodeId = item.key;
    const layoutItem = layout.find(item => item.i === nodeId);
    const rglConfig = getRglConfigById(nodeId);
    const sizeAutos = [
      rglConfig.isHeightAuto && 'height',
      rglConfig.isWidthAuto && 'width',
    ].filter(Boolean);

    const others: any = {};
    const otherClassNames = {
      'scroll-x': rglConfig.scrollX,
      'full-x': rglConfig.fullX,
      'no-scroll': rglConfig.noScroll,
    };

    if (sizeAutos.length) {
      others['data-grid-item-size-auto'] = sizeAutos.join(',');
    }

    if (item.props?._componentName) {
      otherClassNames['react-grid-item-' + item.props._componentName] = true;
    }

    if (layoutItem && layoutItem.h) {
      const childHeight = layoutItem.h * ROW_HEIGHT;
      others.style = {
        '--nodeHeight': childHeight + 'px'
      };
      _.set(item.props, 'rglHeight', childHeight)
    }

    const newChild = React.createElement(item.type, {
      ...item.props,
      ref: () => {},
    });

    return (
      <div
        data-grid-item-id={nodeId}
        key={nodeId}
        className={cls(
          'react-grid-item',
          'react-grid-item-wrap',
          otherClassNames
        )}
        ref={item.ref}
        {...others}
      >
        <div className="react-grid-item-scroll">
          <div className="react-grid-item-content-wrap">{newChild}</div>
        </div>
      </div>
    );
  }).filter(Boolean);

  return (
    <div className="vc-rootcontent-wrapper">
      <div className="vc-rootcontent">
        <ResponsiveReactGridLayout
          layout={layout}
          cols={COLS}
          containerPadding={[0, 0]}
          margin={[0, 0]}
          autoSize={false}
          isDroppable={false}
          isDraggable={false}
          isResizable={false}
          measureBeforeMount={false}
          // preventCollision
          compactType="vertical"
          // allowOverlap
          rowHeight={ROW_HEIGHT}
          ref={rglRef}
        >
          {gridChildren}
        </ResponsiveReactGridLayout>
      </div>
    </div>
  );
}

export const RichRglContainer = (props: RichRglContainerProps) => {
  return props.__designMode === 'design' ? (
    <RglDesignContainer {...props} />
  ) : (
    <RglPreviewContainer {...props} />
  )
}

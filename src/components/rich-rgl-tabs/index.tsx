import {
  createElement,
  useState,
  CSSProperties,
  ReactNode,
  useMemo,
  useEffect,
  useCallback
} from 'react';
import { Tabs } from '@douyinfe/semi-ui';
import { RichRglContainer } from '../rich-rgl-container';
import _ from 'lodash';
import { useGetState } from 'ahooks';
import './index.scss';

export interface RichRglTabPaneProps {
  // 对应 activeKey
  itemKey: string;
  // 标题
  tab: string;
  // 是否禁用
  disabled: boolean;
  // icon
  icon: ReactNode;
  // rgl layout
  layout: any;
}

export interface RichRglTabsProps {
  // 标签栏的样式
  type: 'line' | 'card' | 'button';
  // 尺寸
  size: 'large' | 'medium' | 'small';
  // 扩展标签栏的内容
  tabBarExtraContent: ReactNode;
  // tab 的位置，支持top(水平), left(垂直)
  tabPosition: 'top' | 'left';
  // 标签项列表
  items: Array<RichRglTabPaneProps>;
  // 自定义样式
  style: CSSProperties;
  // children
  children: ReactNode;
}

export const RichRglTabs = function ({
  type = 'line',
  size = 'large',
  tabBarExtraContent,
  tabPosition = 'top',
  items = [],
  style = {},
  children = [],
  _leaf,
  __designMode
}: RichRglTabsProps) {
  const [activeKey, setActiveKey, getActiveKey] = useGetState(items?.[0]?.itemKey);
  const [layout, setLayout] = useState([]);

  const getActiveIndex = () => {
    return items.findIndex((item) => item.itemKey === getActiveKey());
  };

  const activeIndex = useMemo(() => {
    return items.findIndex((item) => item.itemKey === activeKey);
  }, [activeKey]);

  const subChildren = useMemo(() => {
    children = Array.isArray(children) ? children : [children];
    return children.filter((child) => {
      return layout.find((item) => item.i === child.key);
    });
  }, [layout, children]);

  const getLayout = () => {
    if (_leaf) {
      return _leaf.getPropValue(`items.${getActiveIndex()}.layout`) || [];
    };
    return items[getActiveIndex()]?.layout || [];
  }

  useEffect(() => {
    setLayout(getLayout());
  }, [activeIndex]);

  const onLayoutChange = (_layout) => {
    if (_leaf) {
      _leaf.setPropValue(`items.${getActiveIndex()}.layout`, _layout);
      setLayout(getLayout());
    }
  }

  // 清除无用的子节点
  useEffect(() => {
    if (_leaf) {
      _leaf.mergeChildren(
        (node) => {
          for (let item of items) {
            if (_.find(item.layout, ({ i }) => i === node.id)) {
              return false;
            }
          }
          return true;
        },
        () => {
          return [];
        }
      );
    }
  }, []);

  return (
    <Tabs
      activeKey={activeKey}
      onChange={setActiveKey}
      type={type}
      size={size}
      tabBarExtraContent={tabBarExtraContent}
      tabPosition={tabPosition}
      style={style}
      tabList={items}
      className="rich-rgl-tabs"
    >
      <RichRglContainer
        _leaf={_leaf}
        layout={layout}
        getLayout={getLayout}
        onLayoutChange={onLayoutChange}
        __designMode={__designMode}
      >
        {subChildren}
      </RichRglContainer>
    </Tabs>
  );
};

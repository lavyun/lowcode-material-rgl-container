import { createElement, CSSProperties, ReactNode, useState, useEffect, useMemo } from 'react';
import { Steps, Space, Button } from '@douyinfe/semi-ui';
import { RichRglContainer } from '../rich-rgl-container';
import { useGetState } from 'ahooks';
import _ from 'lodash';
import './index.scss';

export interface RichRglSimpleStepsItemProps {
  // 标题
  title: string;
  // 步骤的详情描述
  description?: string;
  layout?: any;
}

export interface RichRglSimpleStepsProps {
  // 步骤条类型
  type?: 'basic' | 'nav';
  // 尺寸
  size?: 'default' | 'small';
  // 步骤项
  items?: Array<RichRglSimpleStepsItemProps>;
  // 样式
  style?: CSSProperties;
  children: ReactNode;
  rglHeight?: number;
}

export const RichRglSimpleSteps = function ({
  type,
  size,
  items = [],
  style = {},
  children,
  _leaf,
  __designMode,
  rglHeight
}: RichRglSimpleStepsProps) {
  const [currentStep, setCurrentStep, getCurrentStep] = useGetState(0);
  const [layout, setLayout] = useState([]);

  const subChildren = useMemo(() => {
    children = Array.isArray(children) ? children : [children];
    return children.filter((child) => {
      return layout.find((item) => item.i === child.key);
    });
  }, [layout, children]);

  const handleNext = () => {
    setCurrentStep((step) => step + 1);
  };

  const handlePrev = () => {
    setCurrentStep((step) => step - 1);
  };

  const getLayout = () => {
    if (_leaf) {
      return _leaf.getPropValue(`items.${getCurrentStep()}.layout`) || [];
    }
    return items[getCurrentStep()]?.layout || [];
  };

  
  const onLayoutChange = (_layout) => {
    if (_leaf) {
      _leaf.setPropValue(`items.${getCurrentStep()}.layout`, _layout);
      setLayout(getLayout());
    }
  };

  useEffect(() => {
    setLayout(getLayout());
  }, [currentStep]);


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
    <div className="rich-rgl-simple-steps">
      <Steps
        type={type}
        current={currentStep}
        size={size}
        style={style}
        onChange={(index) => setCurrentStep(index)}
      >
        {items.map((item, index) => (
          <Steps.Step title={item.title} description={item.description} />
        ))}
      </Steps>
      <div className="rich-rgl-simple-steps-content" style={{ height: rglHeight -  88 }}>
        <RichRglContainer
          _leaf={_leaf}
          layout={layout}
          getLayout={getLayout}
          onLayoutChange={onLayoutChange}
          __designMode={__designMode}
        >
          {subChildren}
        </RichRglContainer>
        {/* {items.map((item, index) => {
          if (currentStep === index) {
            return item.children;
          }
          return null;
        })} */}
      </div>
      <Space style={{ marginTop: 12 }}>
        {currentStep !== 0 && <Button onClick={handlePrev}>上一步</Button>}
        {currentStep !== items.length - 1 && (
          <Button theme="solid" onClick={handleNext}>
            下一步
          </Button>
        )}
      </Space>
    </div>
  );
};

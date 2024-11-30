import { IPublicModelPluginContext } from '@alilc/lowcode-types';

interface AliLowCodeEngine extends IPublicModelPluginContext {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: any;
  default?: AliLowCodeEngine;
}

declare global {
  interface Window {
    AliLowCodeEngine: AliLowCodeEngine;
  }
}

export interface RglConfig {
  w?: number;
  h?: number;
  minH?: number;
  minW?: number;
  patchHeight?: number; // 补偿的高度
  isHeightAuto?: boolean; // 高度自适应
  isWidthAuto?: boolean; // 宽度自适应
  isContainer?: boolean; // 是否是一个 容器
  scrollX?: boolean; // 横向滚动
  noScroll?: boolean; // 横竖都不滚动
  fullX?: boolean; // 横向 100%
  handles?: 'horizontal' | 'vertical' | 'four' | 'eight';
  resizeHandles?: string[];
}

export interface MaterialSettings {
  hiddenCallback?: ({ isRglPage }) => boolean; // 是否 hidden 的回调函数
  isContainer?: boolean; // 是否是一个 容器
  unableClearSelectionWhenDrag?: boolean; // 拖拽时是否不需要清除 selection
}
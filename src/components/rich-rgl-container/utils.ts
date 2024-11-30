import { IPublicModelNode } from '@alilc/lowcode-types';
import { Layout } from 'react-grid-layout';
import _ from 'lodash';
import { RglConfig } from '@/typings/global';
import { getSymbolValue } from '@/utils';

export const DEFAULT_DATA_GRID: Omit<Layout, 'i'> = {
  w: 6,
  h: 10,
  x: 0,
  y: 1e5,
  resizeHandles: ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']
};

export const getRglConfig = (node: IPublicModelNode): RglConfig => {
  const metaData = node?.componentMeta?.getMetadata();
  const rglConfig: RglConfig = metaData?.rglConfig || {};
  rglConfig.resizeHandles = rglConfig.resizeHandles || DEFAULT_DATA_GRID.resizeHandles;
  if (rglConfig.isHeightAuto) {
    _.remove(rglConfig.resizeHandles, (axis) => ['s', 'n', 'sw', 'nw', 'se', 'ne'].includes(axis))
  }
  if (rglConfig.isWidthAuto) {
    _.remove(rglConfig.resizeHandles, (axis) => ['w', 'e', 'sw', 'nw', 'se', 'ne'].includes(axis))
  }
  return rglConfig || {};
}

export const getRglConfigById = (nodeId: string): RglConfig => {
  if (!nodeId) {
    return {
      isHeightAuto: false
    };
  }
  const node = window.AliLowCodeEngine.project.currentDocument.getNodeById(nodeId);
  return getRglConfig(node);
}

export const getDesigner = () => {
  try {
    return getSymbolValue(
      window.AliLowCodeEngine.project.simulatorHost,
      'simulatorHost'
    ).designer;
  } catch (e) {
    console.error(e);
    return {};
  }
};

export const debug = (...args) => {
  let top = window.parent || window;
  try {
    const t = top.location.href;
  } catch (t) {
    top = window;
  }
  if (top.location.href.includes('debug_rgl')) {
    const styles = [ 
      'color: white',
      'background: red',
      'padding: 2px 6px',
    ].join(';');
    console.log('%cRglDebug', styles, ...args);
  }
}

export const pxToNumber = (px: string = '') => {
  if (px.endsWith('px')) {
    return Number(px.replace('px', ''));
  }
  return 0;
}

export const isCanCrossRgl = (node: IPublicModelNode): boolean => {
  // const shellNode = getSymbolValue(node, 'shellNodeSymbol');
  return node?.canCrossRgl !== false;
}

// node 是否是一个 rgl 容器或普通容器
export const isContainerByNodeId = (nodeId: string) => {
  if (!nodeId) {
    return false;
  }
  const node = window.AliLowCodeEngine.project.currentDocument.getNodeById(nodeId);
  const metaData = node?.componentMeta?.getMetadata();
  return node.isRGLContainer || node.isRGLContainerNode || metaData?.settings?.isContainer;
}
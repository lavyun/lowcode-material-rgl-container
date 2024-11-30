import { RglConfig, MaterialSettings } from '@/typings/global';

export const createRglConfig = (config: RglConfig) => {
  config.handles = config.handles || 'eight';
  const handlesMap = {
    horizontal: ['e', 'w'],
    vertical: ['s', 'n'],
    four: ['e', 'w', 's', 'n'],
    eight: ['e', 'w', 's', 'n', 'sw', 'nw', 'se', 'ne']
  }
  return {
    rglConfig: {
      ...config,
      resizeHandles: handlesMap[config.handles]
    }
  }
}

export const createSettings = (settings: MaterialSettings) => {
  return {
    settings: settings || {}
  };
}